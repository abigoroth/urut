"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/client";
import type { Booking } from "@/lib/types";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Star rating + comment for a completed booking. */
export function RateBooking({ booking, therapistName, onDone }: { booking: Booking; therapistName: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/reviews", {
        method: "POST",
        body: { bookingId: booking.id, customerPhone: booking.customerPhone, rating, comment },
      });
      onDone();
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full rounded-xl bg-sand-50 p-3">
      <p className="text-sm font-semibold">How was your session with {therapistName.split(" ").slice(0, 2).join(" ")}?</p>
      <div className="mt-1 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            className={`text-3xl leading-none transition active:scale-90 ${i <= rating ? "text-amber-500" : "text-sand-200"}`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-muted">{LABELS[rating]}</span>
      </div>
      {rating > 0 && (
        <>
          <textarea
            className="field mt-2"
            rows={2}
            placeholder="What did you like? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
          <button onClick={submit} disabled={busy} className="btn-primary mt-2 w-full py-2.5 text-sm">
            {busy ? "Posting…" : "Post review"}
          </button>
        </>
      )}
    </div>
  );
}
