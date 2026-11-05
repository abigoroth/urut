import type { NextRequest } from "next/server";
import { getProvider, updateProvider } from "@/lib/db";
import { toMatch } from "@/lib/match";
import { providerPatchSchema, validationError } from "@/lib/schemas";

/** GET /api/providers/:id?lat=&lng= — provider detail, with distance if a location is given. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/providers/[id]">) {
  const { id } = await ctx.params;
  const p = await getProvider(id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  const hasLoc = req.nextUrl.searchParams.has("lat") && Number.isFinite(lat) && Number.isFinite(lng);
  return Response.json({ provider: toMatch(p, hasLoc ? lat : undefined, hasLoc ? lng : undefined) });
}

/** PATCH /api/providers/:id — update profile or toggle availability. */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/providers/[id]">) {
  const { id } = await ctx.params;
  const parsed = providerPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const p = await updateProvider(id, parsed.data);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ provider: p });
}
