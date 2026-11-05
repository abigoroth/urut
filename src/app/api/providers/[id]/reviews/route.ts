import type { NextRequest } from "next/server";
import { getProvider, listReviews } from "@/lib/db";

/** GET — reviews (newest first) plus a 1–5 star breakdown. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/providers/[id]/reviews">) {
  const { id } = await ctx.params;
  const p = await getProvider(id);
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  const reviews = await listReviews(id);
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => r.rating === stars).length }));
  return Response.json({ rating: p.rating, count: reviews.length, breakdown, reviews });
}
