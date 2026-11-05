"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AREAS, STATES } from "@/lib/areas";
import { api, ApiError, getGpsPosition, useMyProviderId } from "@/lib/client";
import { isInMalaysia, nearestArea } from "@/lib/geo";
import { LANGUAGES, SERVICE_TYPES } from "@/lib/services";
import type { Provider, ServiceType } from "@/lib/types";

type Svc = { durationMin: number; priceRM: number };

export default function JoinPage() {
  const router = useRouter();
  const [, setMyId] = useMyProviderId();
  const [form, setForm] = useState({
    name: "",
    gender: "female" as "female" | "male",
    phone: "",
    bio: "",
    areaId: "",
    mode: "both" as "home_visit" | "premises" | "both",
    travelRadiusKm: 15,
    servesGender: "all" as "all" | "female_only" | "male_only",
    yearsExperience: 1,
    languages: ["Bahasa Melayu"],
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [services, setServices] = useState<Partial<Record<ServiceType, Svc>>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function toggleService(t: ServiceType) {
    setServices((s) => {
      const next = { ...s };
      if (next[t]) delete next[t];
      else next[t] = { durationMin: 60, priceRM: 80 };
      return next;
    });
  }

  async function useGps() {
    try {
      const pos = await getGpsPosition();
      if (!isInMalaysia(pos.lat, pos.lng)) return setError("Your location appears to be outside Malaysia.");
      setCoords(pos);
      set("areaId", nearestArea(pos.lat, pos.lng).id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { provider } = await api<{ provider: Provider }>("/api/providers", {
        method: "POST",
        body: {
          ...form,
          ...(coords ?? {}),
          services: Object.entries(services).map(([type, v]) => ({ type, ...v })),
        },
      });
      setMyId(provider.id);
      router.push("/provider");
    } catch (err) {
      const e2 = err as ApiError;
      setError(e2.issues?.map((i) => `${i.path || "form"}: ${i.message}`).join(" · ") || e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 px-4 pt-6">
      <div>
        <h1 className="text-2xl font-bold">Join as a therapist</h1>
        <p className="text-muted">Customers near your area will find you first.</p>
      </div>

      <Section title="About you">
        <div>
          <label className="label">Name / business name</label>
          <input className="field" placeholder="e.g. Kak Ros Urut Tradisional" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">I am</label>
            <select className="field" value={form.gender} onChange={(e) => set("gender", e.target.value as "female" | "male")}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          <div>
            <label className="label">Years experience</label>
            <input type="number" min={0} max={60} className="field" value={form.yearsExperience} onChange={(e) => set("yearsExperience", Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">WhatsApp number</label>
          <input className="field" inputMode="tel" placeholder="012-345 6789" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
        </div>
        <div>
          <label className="label">Short intro</label>
          <textarea className="field" rows={3} placeholder="Your specialty, experience, what customers can expect" value={form.bio} onChange={(e) => set("bio", e.target.value)} />
        </div>
        <div>
          <label className="label">Languages</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => {
              const on = form.languages.includes(l);
              return (
                <button
                  type="button"
                  key={l}
                  onClick={() => set("languages", on ? form.languages.filter((x) => x !== l) : [...form.languages, l])}
                  className={on ? "chip-on" : "chip-off"}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="Where you work">
        <div>
          <label className="label">Base area</label>
          <select className="field" value={form.areaId} onChange={(e) => (set("areaId", e.target.value), setCoords(null))} required>
            <option value="">Choose area…</option>
            {STATES.map((s) => (
              <optgroup key={s} label={s}>
                {AREAS.filter((a) => a.state === s).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button type="button" onClick={useGps} className="mt-2 text-sm font-semibold text-brand-600">
            📍 {coords ? "Using your exact location ✓" : "Use my current location (more accurate)"}
          </button>
        </div>
        <div>
          <label className="label">How do you serve customers?</label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["home_visit", "🏠 Home visit"],
                ["premises", "📍 My place"],
                ["both", "Both"],
              ] as const
            ).map(([v, l]) => (
              <button type="button" key={v} onClick={() => set("mode", v)} className={form.mode === v ? "chip-on justify-center" : "chip-off justify-center"}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {form.mode !== "premises" && (
          <div>
            <label className="label">Travel up to: {form.travelRadiusKm} km</label>
            <input
              type="range"
              min={3}
              max={50}
              value={form.travelRadiusKm}
              onChange={(e) => set("travelRadiusKm", Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
        )}
        <div>
          <label className="label">I accept</label>
          <select className="field" value={form.servesGender} onChange={(e) => set("servesGender", e.target.value as typeof form.servesGender)}>
            <option value="all">All customers</option>
            <option value="female_only">Female customers only</option>
            <option value="male_only">Male customers only</option>
          </select>
        </div>
      </Section>

      <Section title="Services & prices">
        <div className="space-y-2">
          {SERVICE_TYPES.map((s) => {
            const v = services[s.id];
            return (
              <div key={s.id} className={`rounded-xl border p-3 ${v ? "border-brand-500 bg-brand-50/50" : "border-sand-200 bg-white"}`}>
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={!!v} onChange={() => toggleService(s.id)} className="size-5 accent-brand-600" />
                  <span className="text-lg" aria-hidden>
                    {s.emoji}
                  </span>
                  <span className="font-semibold">{s.malay}</span>
                  <span className="text-sm text-muted">{s.name}</span>
                </label>
                {v && (
                  <div className="mt-2 grid grid-cols-2 gap-2 pl-8">
                    <label className="text-xs text-muted">
                      Minutes
                      <input
                        type="number"
                        min={15}
                        step={15}
                        className="field mt-1 py-2"
                        value={v.durationMin}
                        onChange={(e) => setServices((x) => ({ ...x, [s.id]: { ...v, durationMin: Number(e.target.value) } }))}
                      />
                    </label>
                    <label className="text-xs text-muted">
                      Price (RM)
                      <input
                        type="number"
                        min={10}
                        step={5}
                        className="field mt-1 py-2"
                        value={v.priceRM}
                        onChange={(e) => setServices((x) => ({ ...x, [s.id]: { ...v, priceRM: Number(e.target.value) } }))}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={submitting} className="btn-primary w-full">
        {submitting ? "Creating profile…" : "Create my profile"}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-4">
      <h2 className="font-bold">{title}</h2>
      {children}
    </section>
  );
}
