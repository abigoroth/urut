"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BookingItem } from "@/components/BookingItem";
import { api, useMyBookingIds, whatsappLink } from "@/lib/client";
import type { Booking, ProviderMatch } from "@/lib/types";

export default function MyBookingsPage() {
  const [ids, , ready] = useMyBookingIds();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [providers, setProviders] = useState<Record<string, ProviderMatch>>({});

  const key = ids.join(",");
  const load = useCallback(
    () =>
      fetchMyBookings(key).then(({ bookings, providers }) => {
        setBookings(bookings);
        setProviders(providers);
      }),
    [key],
  );

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function cancel(id: string) {
    await api(`/api/bookings/${id}`, { method: "PATCH", body: { status: "cancelled" } });
    load();
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-4 text-2xl font-bold">My bookings</h1>
      {!bookings && <div className="card h-32 animate-pulse" />}
      {bookings?.length === 0 && (
        <div className="card px-6 py-10 text-center">
          <div className="text-4xl">🗓</div>
          <p className="mt-2 font-semibold">No bookings yet</p>
          <p className="text-sm text-muted">Find a therapist near you and request a session.</p>
          <Link href="/search" className="btn-primary mt-4">
            Find a therapist
          </Link>
        </div>
      )}
      <div className="space-y-3">
        {bookings?.map((b) => {
          const p = providers[b.providerId];
          const price = p?.services.find((s) => s.type === b.serviceType)?.priceRM;
          return (
            <BookingItem key={b.id} b={b} title={p?.name ?? "…"} price={price}>
              {p && (
                <a
                  className="btn-ghost flex-1 py-2 text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={whatsappLink(p.phone, `Hi ${p.name}, about my Urut booking ${b.id} on ${b.date} ${b.time}.`)}
                >
                  💬 WhatsApp
                </a>
              )}
              {(b.status === "pending" || b.status === "accepted") && (
                <button onClick={() => cancel(b.id)} className="btn-outline flex-1 py-2 text-sm">
                  Cancel
                </button>
              )}
            </BookingItem>
          );
        })}
      </div>
    </div>
  );
}

async function fetchMyBookings(ids: string) {
  const { bookings } = ids
    ? await api<{ bookings: Booking[] }>(`/api/bookings?ids=${ids}`)
    : { bookings: [] as Booking[] };
  const uniq = [...new Set(bookings.map((b) => b.providerId))];
  const entries = await Promise.all(
    uniq.map((id) => api<{ provider: ProviderMatch }>(`/api/providers/${id}`).then((r) => [id, r.provider] as const)),
  );
  return { bookings, providers: Object.fromEntries(entries) as Record<string, ProviderMatch> };
}
