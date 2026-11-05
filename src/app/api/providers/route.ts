import type { NextRequest } from "next/server";
import { getArea } from "@/lib/areas";
import { createProvider, listProviders, newId } from "@/lib/db";
import { matchProviders, type MatchQuery } from "@/lib/match";
import { providerInputSchema, serviceTypeSchema, validationError } from "@/lib/schemas";

function num(v: string | null): number | undefined {
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * GET /api/providers?lat=&lng=&service=&therapistGender=&customerGender=&mode=&maxDistanceKm=&sort=
 * Returns providers sorted nearest-first by default.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const service = serviceTypeSchema.safeParse(sp.get("service"));
  const g = (v: string | null) => (v === "female" || v === "male" ? v : undefined);
  const mode = sp.get("mode");
  const sort = sp.get("sort");

  // Allow ?area= as a shortcut for the area's centre coordinates.
  let lat = num(sp.get("lat"));
  let lng = num(sp.get("lng"));
  const area = sp.get("area") ? getArea(sp.get("area")!) : undefined;
  if ((lat === undefined || lng === undefined) && area) {
    lat = area.lat;
    lng = area.lng;
  }

  const q: MatchQuery = {
    lat,
    lng,
    service: service.success ? service.data : undefined,
    therapistGender: g(sp.get("therapistGender")),
    customerGender: g(sp.get("customerGender")),
    mode: mode === "home_visit" || mode === "premises" ? mode : undefined,
    maxDistanceKm: num(sp.get("maxDistanceKm")),
    verifiedOnly: sp.get("verifiedOnly") === "1" || sp.get("verifiedOnly") === "true",
    sort: sort === "rating" || sort === "price" ? sort : "distance",
  };

  const providers = matchProviders(await listProviders(), q);
  return Response.json({ count: providers.length, providers });
}

/** POST /api/providers — register a new provider. */
export async function POST(req: Request) {
  const parsed = providerInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;
  const area = getArea(input.areaId)!;

  const provider = await createProvider({
    ...input,
    id: newId("p"),
    lat: input.lat ?? area.lat,
    lng: input.lng ?? area.lng,
    travelRadiusKm: input.mode === "premises" ? 0 : input.travelRadiusKm,
    rating: 0,
    reviewCount: 0,
    verification: { status: "unverified", idVerified: false, certified: false },
    available: true,
    createdAt: new Date().toISOString(),
  });
  return Response.json({ provider }, { status: 201 });
}
