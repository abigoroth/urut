"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, Badge, ModeBadge, Stars } from "@/components/ProviderCard";
import { addMyBooking, api, ApiError, formatRM, useCustomerProfile, useSavedLocation, whatsappLink } from "@/lib/client";
import { formatDistance } from "@/lib/geo";
import { serviceInfo, serviceLabel } from "@/lib/services";
import type { Booking, ProviderMatch, ServiceType } from "@/lib/types";

export function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loc, , locReady] = useSavedLocation();
  const [p, setP] = useState<ProviderMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingFor, setBookingFor] = useState<ServiceType | null>(null);

  useEffect(() => {
    if (!locReady) return;
    const q = loc ? `?lat=${loc.lat}&lng=${loc.lng}` : "";
    api<{ provider: ProviderMatch }>(`/api/providers/${id}${q}`)
      .then((r) => setP(r.provider))
      .catch((e) => setError(e.message));
  }, [id, loc, locReady]);

  if (error) return <p className="p-6 text-red-700">{error}</p>;
  if (!p) return <div className="m-4 card h-64 animate-pulse" />;

  const wa = whatsappLink(p.phone, `Hi ${p.name}, I found you on Urut. Are you available for a massage?`);

  return (
    <div>
      <div className="bg-brand-700 px-4 pt-4 pb-16 text-white">
        <button onClick={() => router.back()} className="text-sm font-semibold text-brand-100">
          ← Back
        </button>
      </div>
      <div className="-mt-12 space-y-4 px-4">
        <div className="card p-5">
          <div className="flex gap-4">
            <Avatar name={p.name} gender={p.gender} size={72} />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl leading-tight font-bold">{p.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {p.areaName}, {p.state}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Stars rating={p.rating} count={p.reviewCount} />
                {p.distanceKm !== null && (
                  <span className="text-sm font-bold text-brand-600">· {formatDistance(p.distanceKm)} away</span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed">{p.bio}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <ModeBadge p={p} />
            {p.verified && <Badge tone="brand">Verified</Badge>}
            {p.servesGender !== "all" && <Badge tone="warn">{p.servesGender === "female_only" ? "Ladies only" : "Men only"}</Badge>}
            <Badge>{p.gender === "female" ? "Female" : "Male"} therapist</Badge>
            <Badge>{p.yearsExperience} yrs experience</Badge>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-sand-100 pt-4 text-sm">
            <div>
              <dt className="text-muted">Languages</dt>
              <dd className="font-medium">{p.languages.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-muted">Home visits</dt>
              <dd className="font-medium">{p.mode === "premises" ? "No" : `Up to ${p.travelRadiusKm} km`}</dd>
            </div>
          </dl>
          {!p.available && (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Not taking bookings right now.</p>
          )}
        </div>

        <div className="card divide-y divide-sand-100">
          <h2 className="px-5 pt-4 pb-3 font-bold">Services & prices</h2>
          {p.services.map((s) => {
            const info = serviceInfo(s.type);
            return (
              <div key={s.type} className="flex items-center gap-3 px-5 py-3.5">
                <span className="text-2xl" aria-hidden>
                  {info?.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{serviceLabel(s.type)}</div>
                  <div className="text-sm text-muted">
                    {info?.name} · {s.durationMin} min
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatRM(s.priceRM)}</div>
                  <button
                    disabled={!p.available}
                    onClick={() => setBookingFor(s.type)}
                    className="mt-1 text-sm font-semibold text-brand-600 disabled:text-muted"
                  >
                    Book →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-[60px] z-20 mx-auto flex max-w-md gap-2 border-t border-sand-200 bg-white px-4 pt-3">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline flex-1">
          💬 WhatsApp
        </a>
        <button disabled={!p.available} onClick={() => setBookingFor(p.services[0].type)} className="btn-primary flex-[1.4]">
          Book a session
        </button>
      </div>
      <div className="h-20" />

      {bookingFor && <BookingSheet provider={p} initialService={bookingFor} onClose={() => setBookingFor(null)} />}
    </div>
  );
}

function todayPlus(days: number) {
  const d = new Date(Date.now() + days * 86400000);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

function BookingSheet({ provider: p, initialService, onClose }: { provider: ProviderMatch; initialService: ServiceType; onClose: () => void }) {
  const [loc] = useSavedLocation();
  const [profile, setProfile] = useCustomerProfile();
  const [form, setForm] = useState({
    serviceType: initialService,
    mode: (p.mode === "premises" || (p.mode === "both" && !p.canHomeVisit) ? "premises" : "home_visit") as "home_visit" | "premises",
    date: todayPlus(1),
    time: "10:00",
    address: "",
    notes: "",
    customerName: profile?.name ?? "",
    customerPhone: profile?.phone ?? "",
    customerGender: (profile?.gender ?? (p.servesGender === "male_only" ? "male" : "female")) as "female" | "male",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Booking | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const svc = p.services.find((s) => s.type === form.serviceType)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { booking } = await api<{ booking: Booking }>("/api/bookings", {
        method: "POST",
        body: { ...form, providerId: p.id, lat: loc?.lat, lng: loc?.lng },
      });
      addMyBooking(booking.id);
      setProfile({ name: form.customerName, phone: form.customerPhone, gender: form.customerGender });
      setDone(booking);
    } catch (err) {
      const e2 = err as ApiError;
      setError(e2.issues?.map((i) => `${i.path}: ${i.message}`).join(" · ") || e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-sand-50 px-5 pt-3 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-sand-200" />
        {done ? (
          <div className="py-6 text-center">
            <div className="text-5xl">✅</div>
            <h2 className="mt-3 text-xl font-bold">Request sent!</h2>
            <p className="mt-1 text-muted">
              {p.name} will confirm your {serviceLabel(done.serviceType)} on {done.date} at {done.time}.
            </p>
            <div className="mt-6 space-y-2">
              <a
                className="btn-primary w-full"
                target="_blank"
                rel="noopener noreferrer"
                href={whatsappLink(
                  p.phone,
                  `Hi ${p.name}, I just requested ${serviceLabel(done.serviceType)} on ${done.date} ${done.time} via Urut (ref ${done.id}).`,
                )}
              >
                💬 Message on WhatsApp
              </a>
              <Link href="/bookings" className="btn-ghost w-full">
                View my bookings
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Book {p.name}</h2>
              <button type="button" onClick={onClose} className="text-sm font-semibold text-muted">
                Close
              </button>
            </div>

            <div>
              <label className="label">Service</label>
              <select className="field" value={form.serviceType} onChange={(e) => set("serviceType", e.target.value as ServiceType)}>
                {p.services.map((s) => (
                  <option key={s.type} value={s.type}>
                    {serviceLabel(s.type)} — {s.durationMin} min · {formatRM(s.priceRM)}
                  </option>
                ))}
              </select>
            </div>

            {p.mode === "both" && (
              <div>
                <label className="label">Where</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["home_visit", "premises"] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      disabled={m === "home_visit" && !p.canHomeVisit}
                      onClick={() => set("mode", m)}
                      className={form.mode === m ? "chip-on justify-center py-2.5" : "chip-off justify-center py-2.5 disabled:opacity-40"}
                    >
                      {m === "home_visit" ? "🏠 Come to me" : "📍 I'll go there"}
                    </button>
                  ))}
                </div>
                {!p.canHomeVisit && <p className="mt-1 text-xs text-muted">You are outside their {p.travelRadiusKm} km home-visit range.</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input type="date" className="field" min={todayPlus(0)} value={form.date} onChange={(e) => set("date", e.target.value)} required />
              </div>
              <div>
                <label className="label">Time</label>
                <input type="time" className="field" step={1800} value={form.time} onChange={(e) => set("time", e.target.value)} required />
              </div>
            </div>

            {form.mode === "home_visit" && (
              <div>
                <label className="label">Your address</label>
                <textarea
                  className="field"
                  rows={2}
                  placeholder="No. rumah, jalan, taman, poskod"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="label">Your name</label>
              <input className="field" value={form.customerName} onChange={(e) => set("customerName", e.target.value)} required />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <label className="label">Phone (WhatsApp)</label>
                <input
                  className="field"
                  inputMode="tel"
                  placeholder="012-345 6789"
                  value={form.customerPhone}
                  onChange={(e) => set("customerPhone", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">I am</label>
                <select className="field" value={form.customerGender} onChange={(e) => set("customerGender", e.target.value as "female" | "male")}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                className="field"
                rows={2}
                placeholder="e.g. sakit belakang, prefer medium pressure"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>

            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button disabled={submitting} className="btn-primary w-full">
              {submitting ? "Sending…" : `Request booking · ${formatRM(svc.priceRM)}`}
            </button>
            <p className="text-center text-xs text-muted">Pay the therapist directly after your session.</p>
          </form>
        )}
      </div>
    </div>
  );
}
