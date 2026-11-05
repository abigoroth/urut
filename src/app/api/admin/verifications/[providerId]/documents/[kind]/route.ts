import type { NextRequest } from "next/server";
import { forbidden, isAdmin } from "@/lib/admin";
import { readDocument } from "@/lib/db";

const KINDS = ["ic_front", "selfie", "certificate"] as const;

/** GET a private verification document (admin only). */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/admin/verifications/[providerId]/documents/[kind]">) {
  if (!isAdmin(req)) return forbidden();
  const { providerId, kind } = await ctx.params;
  if (!KINDS.includes(kind as (typeof KINDS)[number])) return Response.json({ error: "Not found" }, { status: 404 });
  const bytes = await readDocument(providerId, kind as (typeof KINDS)[number]);
  if (!bytes) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store" },
  });
}
