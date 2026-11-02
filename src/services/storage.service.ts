import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/lib/env";

/**
 * Storage service supporting both Cloudinary and local filesystem.
 * Provider is selected via DOCUMENT_STORAGE_PROVIDER env variable.
 */

const ALLOWED_MIME = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024;

export { ALLOWED_MIME, MAX_FILE_SIZE };

/** Compute SHA-256 hex hash of a buffer. */
export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ── Cloudinary ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cloudinary: any = null;

async function getCloudinary() {
  if (!cloudinary) {
    const c = await import("cloudinary");
    cloudinary = c.v2;
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }
  return cloudinary;
}

// ── Local storage helpers ──
const UPLOAD_DIR = path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH || "./uploads");

async function ensureUploadDirExists() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Save a file to the configured storage provider.
 * Returns storage key and SHA-256 hash.
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string
): Promise<{ storageKey: string; sha256Hash: string; provider: "cloudinary" | "local"; url?: string }> {
  const sha256Hash = computeSha256(buffer);
  const ext = path.extname(originalName).toLowerCase();

  // Always ensure upload dir exists and write local cache copy
  await ensureUploadDirExists();

  if (env.DOCUMENT_STORAGE_PROVIDER === "cloudinary" && env.CLOUDINARY_CLOUD_NAME) {
    const cloud = await getCloudinary();

    const result: { public_id?: string; secure_url?: string; url?: string } = await new Promise((resolve, reject) => {
      const uploadStream = cloud.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: env.DOCUMENT_STORAGE_BUCKET || "apaar-documents",
          public_id: `${uuidv4()}`,
        },
        (error: Error | null, res: { public_id?: string; secure_url?: string; url?: string } | undefined) => {
          if (error) return reject(error);
          resolve(res || {});
        }
      );
      uploadStream.end(buffer);
    });

    const storageKey = result?.public_id ?? `${uuidv4()}`;
    const url = result?.secure_url || result?.url;

    // Cache locally with sanitized key
    try {
      const localCachedName = `${storageKey.replace(/\//g, "_")}${ext}`;
      await fs.writeFile(path.join(UPLOAD_DIR, localCachedName), buffer);
    } catch {
      // ignore caching errors
    }

    return {
      storageKey,
      sha256Hash,
      provider: "cloudinary",
      url,
    };
  }

  // Local storage fallback
  const storageKey = `${uuidv4()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storageKey);
  await fs.writeFile(filePath, buffer);

  return { storageKey, sha256Hash, provider: "local" };
}

/**
 * Retrieve a file buffer from storage.
 */
export async function getFileBuffer(
  storageKey: string,
  provider: "cloudinary" | "local"
): Promise<Buffer> {
  // 1. Try local cache first (instant, works offline, zero network 401s)
  try {
    const directPath = path.join(UPLOAD_DIR, storageKey);
    return await fs.readFile(directPath);
  } catch {
    try {
      const sanitized = storageKey.replace(/\//g, "_");
      const files = await fs.readdir(UPLOAD_DIR);
      const match = files.find((f) => f.includes(sanitized) || f.includes(path.basename(storageKey)));
      if (match) {
        return await fs.readFile(path.join(UPLOAD_DIR, match));
      }
    } catch {
      // ignore
    }
  }

  // 2. Fetch from Cloudinary
  if (provider === "cloudinary" && env.CLOUDINARY_CLOUD_NAME) {
    const cloud = await getCloudinary();
    // Try auto URL
    const autoUrl = cloud.url(storageKey, { resource_type: "auto", secure: true });
    let response = await fetch(autoUrl);

    // If Cloudinary restricts PDF download (status 401/404), fetch the high-res rasterized PNG
    if (!response.ok) {
      const pngUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${storageKey}.png`;
      response = await fetch(pngUrl);
    }

    // Try direct image URL
    if (!response.ok) {
      const directUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${storageKey}`;
      response = await fetch(directUrl);
    }

    if (response.ok) {
      const buf = Buffer.from(await response.arrayBuffer());
      // Save to local cache for future fast retrieval
      try {
        const localCachedName = `${storageKey.replace(/\//g, "_")}`;
        await fs.writeFile(path.join(UPLOAD_DIR, localCachedName), buf);
      } catch {
        // ignore
      }
      return buf;
    }

    throw new Error(`Failed to fetch file from Cloudinary (HTTP ${response.status})`);
  }

  throw new Error("Document file not found in storage");
}
