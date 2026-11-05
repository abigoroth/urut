import "server-only";
import type { NextRequest } from "next/server";

/**
 * Minimal admin gate for the MVP. Set ADMIN_KEY in the environment.
 * In development it falls back to "urut-admin"; in production with no
 * ADMIN_KEY set, admin routes are closed.
 */
export function isAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_KEY ?? (process.env.NODE_ENV === "production" ? undefined : "urut-admin");
  if (!expected) return false;
  const given = req.headers.get("x-admin-key") ?? req.nextUrl.searchParams.get("key");
  return given === expected;
}

export const forbidden = () => Response.json({ error: "Admin key required" }, { status: 401 });
