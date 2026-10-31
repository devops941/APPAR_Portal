import "@testing-library/jest-dom/vitest";

(process.env as Record<string, string>).NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/apaar_student_test";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-super-secret-auth-key-16-chars-min";
