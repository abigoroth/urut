import { AREAS } from "@/lib/areas";
import { nearestArea } from "@/lib/geo";
import type { NextRequest } from "next/server";

/** GET /api/areas — all areas. GET /api/areas?lat=&lng= — nearest area to a point. */
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (req.nextUrl.searchParams.has("lat") && Number.isFinite(lat) && Number.isFinite(lng)) {
    return Response.json({ nearest: nearestArea(lat, lng) });
  }
  return Response.json({ areas: AREAS });
}
