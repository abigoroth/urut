"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BookingItem } from "@/components/BookingItem";
import { Avatar } from "@/components/ProviderCard";
import { api, useMyProviderId, whatsappLink } from "@/lib/client";
import type { Booking, BookingStatus, ProviderMatch } from "@/lib/types";

export default function ProviderHome() {
  const [myId, setMyId, ready] = useMyProviderId();
  if (!ready) return null;
  return myId ? <Dashboard id={myId} onSignOut={() => setMyId(null)} /> : <Intro onDemo={() => setMyId("p001")} />;
}

function Intro({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="px-4 pt-8">
      <div className="text-5xl">🙌</div>
      <h1 className="mt-4 font-display text-3xl leading-tight font-bold">Get more customers near you</h1>
      <p className="mt-2 text-muted">
        List your massage services for free. Customers nearby see you first, and contact you directly on WhatsApp.
      </p>
      <ul className="mt-6 space-y-3">
        {[
          ["📍", "Matched by distance", "Customers in your area see you at the top."],
          ["🏠", "Home visit or your place", "Set how far you travel — we only send customers within range."],
          ["🧕", "Your rules", "Accept ladies only, men only, or everyone."],
          ["💸", "No commission", "Customers pay you directly."],
        ].map(([i, t, d]) => (
          <li key={t} className="card flex gap-3 p-4">
            <span className="text-2xl">{i}</span>
            <div>
              <p className="font-semibold">{t}</p>
              <p className="text-sm text-muted">{d}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link href="/provider/join" className="btn-primary mt-6 w-full">
        Create my profile
      </Link>
      <button onClick={onDemo} className="mt-3 w-full text-center text-sm font-semibold text-muted">
        Try the dashboard with a demo profile
      </button>
    </div>
  );
}

const TABS: { id: string; label: string; match: BookingStatus[] }[] = [
  { id: "new", label: "New", match: ["pending"] },
  { id: "upcoming", label: "Upcoming", match: ["accepted"] },
  { id: "past", label: "Past", match: ["completed", "declined", "cancelled"] },
];

function Dashboard({ id, onSignOut }: { id: string; onSignOut: () => void }) {
  const [p, setP] = useState<ProviderMatch | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState("new");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.all([
        api<{ provider: ProviderMatch }>(`/api/providers/${id}`),
        api<{ bookings: Booking[] }>(`/api/bookings?providerId=${id}`),
      ]).then(
        ([pr, br]) => {
          setP(pr.provider);
          setBookings(br.bookings);
        },
        (e: Error) => setError(e.message),
      ),
    [id],
  );

  useEffect(() => {
    load();
    // Poll so new booking requests show up without a refresh.
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(bid: string, status: BookingStatus) {
    await api(`/api/bookings/${bid}`, { method: "PATCH", body: { status } });
    load();
  }

  async function toggleAvailable() {
    if (!p) return;
    const { provider } = await api<{ provider: ProviderMatch }>(`/api/providers/${id}`, {
      method: "PATCH",
      body: { available: !p.available },
    });
    setP({ ...p, available: provider.available });
  }

  if (error)
    return (
      <div className="p-6">
        <p className="text-red-700">{error}</p>
        <button onClick={onSignOut} className="btn-outline mt-4">
          Reset
        </button>
      </div>
    );
  if (!p) return <div className="m-4 card h-40 animate-pulse" />;

  const current = TABS.find((t) => t.id === tab)!;
  const list = bookings.filter((b) => current.match.includes(b.status));
  const priceOf = (b: Booking) => p.services.find((s) => s.type === b.serviceType)?.priceRM;

  return (
    <div className="px-4 pt-6">
      <div className="card flex items-center gap-3 p-4">
        <Avatar name={p.name} gender={p.gender} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold">{p.name}</h1>
          <p className="text-sm text-muted">
            {p.areaName}, {p.state}
          </p>
        </div>
        <Link href={`/providers/${p.id}`} className="text-sm font-semibold text-brand-600">
          View
        </Link>
      </div>

      <button onClick={toggleAvailable} className="card mt-3 flex w-full items-center justify-between p-4 text-left">
        <div>
          <p className="font-semibold">{p.available ? "Accepting bookings" : "Not accepting bookings"}</p>
          <p className="text-sm text-muted">{p.available ? "Customers can find and book you." : "You are hidden from search."}</p>
        </div>
        <span className={`relative h-7 w-12 rounded-full transition ${p.available ? "bg-brand-600" : "bg-sand-200"}`}>
          <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${p.available ? "left-6" : "left-1"}`} />
        </span>
      </button>

      <div className="mt-5 flex gap-1 rounded-xl bg-sand-100 p-1">
        {TABS.map((t) => {
          const n = bookings.filter((b) => t.match.includes(b.status)).length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold ${tab === t.id ? "bg-white text-brand-700 shadow-sm" : "text-muted"}`}
            >
              {t.label}
              {n > 0 && <span className="ml-1 text-xs">({n})</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-3">
        {list.length === 0 && <p className="card px-4 py-8 text-center text-sm text-muted">Nothing here yet.</p>}
        {list.map((b) => (
          <BookingItem key={b.id} b={b} title={b.customerName} price={priceOf(b)}>
            {b.status === "pending" && (
              <>
                <button onClick={() => setStatus(b.id, "accepted")} className="btn-primary flex-1 py-2 text-sm">
                  Accept
                </button>
                <button onClick={() => setStatus(b.id, "declined")} className="btn-outline flex-1 py-2 text-sm">
                  Decline
                </button>
              </>
            )}
            {b.status === "accepted" && (
              <button onClick={() => setStatus(b.id, "completed")} className="btn-ghost flex-1 py-2 text-sm">
                Mark done
              </button>
            )}
            {(b.status === "pending" || b.status === "accepted") && (
              <a
                className="btn-outline px-3 py-2 text-sm"
                target="_blank"
                rel="noopener noreferrer"
                href={whatsappLink(b.customerPhone, `Hi ${b.customerName}, this is ${p.name} from Urut about your booking on ${b.date} ${b.time}.`)}
                aria-label="WhatsApp customer"
              >
                💬
              </a>
            )}
          </BookingItem>
        ))}
      </div>

      <button onClick={onSignOut} className="mt-8 w-full text-center text-sm font-semibold text-muted">
        Sign out of this profile
      </button>
    </div>
  );
}
