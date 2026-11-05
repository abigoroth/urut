"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LocationPicker } from "@/components/LocationPicker";
import { ProviderCard } from "@/components/ProviderCard";
import { api, useSavedLocation } from "@/lib/client";
import { SERVICE_TYPES } from "@/lib/services";
import type { ProviderMatch } from "@/lib/types";

const DISTANCES = [5, 10, 25, 50];

export function SearchView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [loc, , locReady] = useSavedLocation();
  const [results, setResults] = useState<ProviderMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const service = params.get("service") ?? "";
  const therapistGender = params.get("therapistGender") ?? "";
  const customerGender = params.get("customerGender") ?? "";
  const mode = params.get("mode") ?? "";
  const maxDistanceKm = params.get("maxDistanceKm") ?? "";
  const sort = params.get("sort") ?? "distance";

  function setParam(key: string, value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    router.replace(`${pathname}?${sp}`, { scroll: false });
  }

  useEffect(() => {
    if (!locReady) return;
    const sp = new URLSearchParams(params.toString());
    if (loc) {
      sp.set("lat", String(loc.lat));
      sp.set("lng", String(loc.lng));
    }
    let cancelled = false;
    api<{ providers: ProviderMatch[] }>(`/api/providers?${sp}`)
      .then((r) => !cancelled && (setResults(r.providers), setError(null)))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [params, loc, locReady]);

  const activeFilters = [therapistGender, customerGender, mode, maxDistanceKm].filter(Boolean).length;

  return (
    <div>
      <div className="sticky top-0 z-20 space-y-3 border-b border-sand-200 bg-sand-50/95 px-4 pt-4 pb-3 backdrop-blur">
        <LocationPicker compact />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <button onClick={() => setShowFilters((v) => !v)} className={activeFilters ? "chip-on" : "chip-off"}>
            ⚙︎ Filters{activeFilters ? ` (${activeFilters})` : ""}
          </button>
          <button onClick={() => setParam("service", "")} className={!service ? "chip-on" : "chip-off"}>
            All
          </button>
          {SERVICE_TYPES.map((s) => (
            <button
              key={s.id}
              onClick={() => setParam("service", service === s.id ? "" : s.id)}
              className={service === s.id ? "chip-on" : "chip-off"}
            >
              {s.emoji} {s.malay}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="card space-y-3 p-4">
            <FilterRow label="Therapist">
              <Seg value={therapistGender} onChange={(v) => setParam("therapistGender", v)} options={[["", "Any"], ["female", "Female"], ["male", "Male"]]} />
            </FilterRow>
            <FilterRow label="I am">
              <Seg value={customerGender} onChange={(v) => setParam("customerGender", v)} options={[["", "—"], ["female", "Female"], ["male", "Male"]]} />
            </FilterRow>
            <FilterRow label="Where">
              <Seg value={mode} onChange={(v) => setParam("mode", v)} options={[["", "Any"], ["home_visit", "Come to me"], ["premises", "I'll go"]]} />
            </FilterRow>
            <FilterRow label="Within">
              <Seg
                value={maxDistanceKm}
                onChange={(v) => setParam("maxDistanceKm", v)}
                options={[["", "Any"], ...DISTANCES.map((d) => [String(d), `${d} km`] as [string, string])]}
              />
            </FilterRow>
          </div>
        )}
      </div>

      <div className="px-4 pt-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted">
            {results ? `${results.length} therapist${results.length === 1 ? "" : "s"}` : "Searching…"}
            {loc && results ? " · nearest first" : ""}
          </p>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value === "distance" ? "" : e.target.value)}
            className="rounded-lg border border-sand-200 bg-white px-2 py-1 text-sm font-medium"
            aria-label="Sort by"
          >
            <option value="distance">Nearest</option>
            <option value="rating">Top rated</option>
            <option value="price">Lowest price</option>
          </select>
        </div>

        {locReady && !loc && (
          <div className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Set your location to see who is nearest to you.
          </div>
        )}
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="space-y-3">
          {results?.map((p, i) => <ProviderCard key={p.id} p={p} rank={loc && sort === "distance" ? i : undefined} />)}
          {!results && !error && [0, 1, 2].map((i) => <div key={i} className="card h-32 animate-pulse" />)}
          {results?.length === 0 && (
            <div className="card px-6 py-10 text-center">
              <div className="text-3xl">🔍</div>
              <p className="mt-2 font-semibold">No therapists match</p>
              <p className="text-sm text-muted">Try a wider distance or fewer filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-sm font-semibold">{label}</span>
      {children}
    </div>
  );
}

function Seg({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="no-scrollbar flex flex-1 gap-1 overflow-x-auto rounded-xl bg-sand-100 p-1">
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold whitespace-nowrap ${value === v ? "bg-white text-brand-700 shadow-sm" : "text-muted"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
