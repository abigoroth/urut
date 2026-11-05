"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocationPicker } from "@/components/LocationPicker";
import { useSavedLocation } from "@/lib/client";
import { SERVICE_TYPES } from "@/lib/services";
import type { ServiceType } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [loc] = useSavedLocation();
  const [service, setService] = useState<ServiceType | null>(null);

  function search() {
    const sp = new URLSearchParams();
    if (service) sp.set("service", service);
    router.push(`/search${sp.size ? `?${sp}` : ""}`);
  }

  return (
    <div>
      <header className="relative overflow-hidden bg-brand-700 px-5 pt-10 pb-20 text-white">
        <div className="absolute -top-16 -right-16 size-56 rounded-full bg-brand-500/40" aria-hidden />
        <div className="absolute top-24 -left-10 size-32 rounded-full bg-clay/30" aria-hidden />
        <div className="relative">
          <p className="text-sm font-semibold tracking-wide text-brand-100">URUT · Malaysia</p>
          <h1 className="mt-2 font-display text-[32px] leading-[1.1] font-bold">
            Find a massage therapist <span className="text-[#f2c9ae] italic">near you</span>
          </h1>
          <p className="mt-3 max-w-xs text-brand-100">
            Urut tradisional, bersalin, refleksologi and more — nearest therapists first, from KL to Kota Kinabalu.
          </p>
        </div>
      </header>

      <section className="relative z-10 -mt-12 space-y-4 px-4">
        <LocationPicker />

        <div className="card p-4">
          <h2 className="mb-3 font-bold">What do you need?</h2>
          <div className="grid grid-cols-2 gap-2">
            {SERVICE_TYPES.map((s) => {
              const on = service === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setService(on ? null : s.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${on ? "border-brand-600 bg-brand-50" : "border-sand-200 bg-white"}`}
                >
                  <span className="text-xl" aria-hidden>
                    {s.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm leading-tight font-semibold">{s.malay}</span>
                    <span className="block truncate text-xs text-muted">{s.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <button onClick={search} className="btn-primary mt-4 w-full">
            {loc ? "Show therapists near me" : "Browse therapists"}
          </button>
        </div>

        <div className="card flex items-center gap-4 bg-sand-100 p-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl" aria-hidden>
            🙌
          </div>
          <div className="flex-1">
            <h3 className="font-bold">Are you a massage therapist?</h3>
            <p className="text-sm text-muted">Get customers in your area. Free to join.</p>
          </div>
          <Link href="/provider" className="btn-ghost px-3 py-2 text-sm">
            Join
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 pb-4 text-center">
          {[
            ["📍", "Nearest first"],
            ["💬", "Chat on WhatsApp"],
            ["🧕", "Ladies-only options"],
          ].map(([icon, text]) => (
            <div key={text} className="rounded-xl bg-white/60 px-2 py-3">
              <div className="text-xl" aria-hidden>
                {icon}
              </div>
              <div className="mt-1 text-xs font-medium text-muted">{text}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
