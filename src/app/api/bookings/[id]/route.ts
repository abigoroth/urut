import type { NextRequest } from "next/server";
import { getBooking, updateBooking } from "@/lib/db";
import { bookingStatusSchema, validationError } from "@/lib/schemas";
import type { BookingStatus } from "@/lib/types";

/** Allowed status transitions. */
const NEXT: Record<BookingStatus, BookingStatus[]> = {
  pending: ["accepted", "declined", "cancelled"],
  accepted: ["completed", "cancelled"],
  declined: [],
  completed: [],
  cancelled: [],
};

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  const { id } = await ctx.params;
  const b = await getBooking(id);
  if (!b) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ booking: b });
}

/** PATCH /api/bookings/:id { status } */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  const { id } = await ctx.params;
  const parsed = bookingStatusSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const b = await getBooking(id);
  if (!b) return Response.json({ error: "Not found" }, { status: 404 });
  if (!NEXT[b.status].includes(parsed.data.status)) {
    return Response.json({ error: `Cannot change booking from ${b.status} to ${parsed.data.status}` }, { status: 409 });
  }
  return Response.json({ booking: await updateBooking(id, { status: parsed.data.status }) });
}
