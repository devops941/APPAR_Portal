import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Edge proxy for route protection (Next.js 16 successor to middleware).
 *
 * - Public routes (login, API auth endpoints) are always allowed.
 * - Protected portal routes require a valid session JWT cookie.
 * - Enforces role-based route access controls (RBAC):
 *     * STUDENT: Allowed on /student, /academic-records, /documents
 *     * FACULTY: Allowed on /academic-records, /students, /documents
 *     * INSTITUTION_ADMIN: Allowed on /dashboard, /institutions, /students, /academic-records, /documents
 *     * VERIFICATION_OFFICER: Allowed on /verifications, /institutions, /students, /academic-records, /documents
 *     * SUPER_ADMIN: Full system access across all administrative and compliance modules
 */

const PUBLIC_ROUTES = ["/", "/login", "/api/auth/login", "/api/auth/logout", "/api/health"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/images");
}

interface DecodedSession {
  userId: string;
  email: string;
  role: string;
  institutionId?: string;
  departmentId?: string;
}

async function verifyAndDecodeSession(token: string | undefined): Promise<DecodedSession | null> {
  if (!token) return null;
  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "fallback_secret"
  );
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as DecodedSession;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("apaar_session_token")?.value;
  const session = await verifyAndDecodeSession(token);

  if (!session) {
    // API routes return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Authentication required to access this resource",
          },
          requestId: `mw_${Date.now()}`,
        },
        { status: 401 }
      );
    }
    // Browser requests redirect to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // ── ROLE-BASED ACCESS CONTROL (RBAC) FOR BROWSER PAGES ──
  if (!pathname.startsWith("/api/")) {
    const role = session.role;

    // 1. STUDENT:
    // Blocked from administrative dashboard, institution directory, student directory, verification desk, audit logs, and departments
    if (role === "STUDENT") {
      if (
        pathname === "/dashboard" ||
        pathname.startsWith("/institutions") ||
        pathname.startsWith("/departments") ||
        pathname.startsWith("/students") ||
        pathname.startsWith("/verifications") ||
        pathname.startsWith("/audit-logs")
      ) {
        return NextResponse.redirect(new URL("/student", request.url));
      }
    }

    // 2. FACULTY:
    // Blocked from dashboard, institutions registry, departments administration, verification desk, audit logs, and sovereign student portal
    if (role === "FACULTY") {
      if (
        pathname === "/dashboard" ||
        pathname.startsWith("/institutions") ||
        pathname.startsWith("/departments") ||
        pathname.startsWith("/verifications") ||
        pathname.startsWith("/audit-logs") ||
        pathname === "/student"
      ) {
        return NextResponse.redirect(new URL("/academic-records", request.url));
      }
    }

    // 3. INSTITUTION_ADMIN (College Admin):
    // Blocked from regulatory scrutiny verification desk, national statutory audit logs, and student personal portal
    if (role === "INSTITUTION_ADMIN") {
      if (
        pathname.startsWith("/verifications") ||
        pathname.startsWith("/audit-logs") ||
        pathname === "/student"
      ) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // 4. VERIFICATION_OFFICER:
    // Strictly confined to Verification Desk (/verifications)
    // Blocked from institutions, students, academic records, documents, departments, audit logs, dashboard, and student personal portal
    if (role === "VERIFICATION_OFFICER") {
      if (
        pathname.startsWith("/institutions") ||
        pathname.startsWith("/students") ||
        pathname.startsWith("/academic-records") ||
        pathname.startsWith("/documents") ||
        pathname.startsWith("/departments") ||
        pathname.startsWith("/audit-logs") ||
        pathname === "/student" ||
        pathname === "/dashboard"
      ) {
        return NextResponse.redirect(new URL("/verifications", request.url));
      }
    }

    // 5. SUPER_ADMIN:
    // Redirect /student to /students directory
    if (role === "SUPER_ADMIN" && pathname === "/student") {
      return NextResponse.redirect(new URL("/students", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
