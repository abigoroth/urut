import { createReview, getBooking, newId } from "@/lib/db";
import { reviewInputSchema, validationError } from "@/lib/schemas";

/**
 * POST /api/reviews — only the customer of a completed booking can review,
 * once per booking. This is what makes every review a "verified booking".
 */
export async function POST(req: Request) {
  const parsed = reviewInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { bookingId, customerPhone, rating, comment } = parsed.data;

  const b = await getBooking(bookingId);
  if (!b || b.customerPhone !== customerPhone) return Response.json({ error: "Booking not found" }, { status: 404 });
  if (b.status !== "completed") return Response.json({ error: "You can review after your session is completed" }, { status: 409 });
  if (b.reviewId) return Response.json({ error: "You have already reviewed this booking" }, { status: 409 });

  const review = await createReview({
    id: newId("r"),
    providerId: b.providerId,
    bookingId,
    customerName: b.customerName.split(/\s+/)[0],
    serviceType: b.serviceType,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  });
  return Response.json({ review }, { status: 201 });
}
