"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { serviceLabel } from "@/lib/services";
import type { Review } from "@/lib/types";

interface ReviewsResponse {
  rating: number;
  count: number;
  breakdown: { stars: number; count: number }[];
  reviews: Review[];
}

export function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? "text-amber-500" : "text-sand-200"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function Reviews({ providerId }: { providerId: string }) {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    api<ReviewsResponse>(`/api/providers/${providerId}/reviews`).then(setData, () => setData(null));
  }, [providerId]);

  if (!data) return <div className="card h-40 animate-pulse" />;

  const list = showAll ? data.reviews : data.reviews.slice(0, 3);
  return (
    <section className="card p-5">
      <h2 className="font-bold">Reviews</h2>
      {data.count === 0 ? (
        <p className="mt-2 text-sm text-muted">No reviews yet. Reviews come only from customers who completed a booking.</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-5">
            <div className="text-center">
              <div className="text-4xl leading-none font-bold">{data.rating.toFixed(1)}</div>
              <StarRow value={data.rating} />
              <div className="text-xs text-muted">{data.count} reviews</div>
            </div>
            <div className="flex-1 space-y-1">
              {data.breakdown.map((b) => (
                <div key={b.stars} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted">{b.stars}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand-100">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${(b.count / data.count) * 100}%` }} />
                  </div>
                  <span className="w-5 text-right text-muted">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
            Every review is from a customer whose booking was completed through Urut.
          </p>
          <ul className="mt-2 divide-y divide-sand-100">
            {list.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{r.customerName}</span>
                  <span className="text-xs text-muted">
                    {new Date(r.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <StarRow value={r.rating} />
                  <span className="text-xs font-medium text-brand-600">✓ Verified booking · {serviceLabel(r.serviceType)}</span>
                </div>
                {r.comment && <p className="mt-1 text-[15px]">{r.comment}</p>}
              </li>
            ))}
          </ul>
          {data.reviews.length > 3 && (
            <button onClick={() => setShowAll((v) => !v)} className="mt-1 text-sm font-semibold text-brand-600">
              {showAll ? "Show fewer" : `Show all ${data.count} reviews`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
