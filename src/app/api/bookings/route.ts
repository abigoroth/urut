import type { NextRequest } from "next/server";
import { createBooking, getProvider, listBookings, newId } from "@/lib/db";
import { distanceKm } from "@/lib/geo";
import { bookingInputSchema, validationError } from "@/lib/schemas";

/** GET /api/bookings?providerId=  or  ?ids=a,b,c */
export async function GET(req: NextRequest) {
  const providerId = req.nextUrl.searchParams.get("providerId") ?? undefined;
  const idsParam = req.nextUrl.searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : undefined;
  if (!providerId && !ids) return Response.json({ error: "providerId or ids is required" }, { status: 400 });
  return Response.json({ bookings: await listBookings({ providerId, ids }) });
}

/** POST /api/bookings — customer requests a session. */
export async function POST(req: Request) {
  const parsed = bookingInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { lat, lng, ...input } = parsed.data;

  const provider = await getProvider(input.providerId);
  if (!provider) return Response.json({ error: "Provider not found" }, { status: 404 });
  if (!provider.available) return Response.json({ error: "Provider is not taking bookings right now" }, { status: 409 });
  if (!provider.services.some((s) => s.type === input.serviceType)) {
    return Response.json({ error: "Provider does not offer this service" }, { status: 400 });
  }
  if (input.mode === "home_visit" && provider.mode === "premises") {
    return Response.json({ error: "Provider does not do home visits" }, { status: 400 });
  }
  if (input.mode === "premises" && provider.mode === "home_visit") {
    return Response.json({ error: "Provider only does home visits" }, { status: 400 });
  }
  if (input.mode === "home_visit" && !input.address) {
    return Response.json({ error: "Address is required for home visits" }, { status: 400 });
  }
  if (provider.servesGender !== "all") {
    const want = provider.servesGender === "female_only" ? "female" : "male";
    if (input.customerGender !== want) {
      return Response.json({ error: `This provider serves ${want} customers only` }, { status: 400 });
    }
  }

  const d = lat !== undefined && lng !== undefined ? +distanceKm(lat, lng, provider.lat, provider.lng).toFixed(2) : null;
  const booking = await createBooking({
    ...input,
    id: newId("b"),
    distanceKm: d,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  return Response.json({ booking }, { status: 201 });
}
