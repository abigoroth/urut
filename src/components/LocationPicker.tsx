"use client";

import { useMemo, useState } from "react";
import { AREAS, STATES } from "@/lib/areas";
import { getGpsPosition, useSavedLocation, type SavedLocation } from "@/lib/client";
import { isInMalaysia, nearestArea } from "@/lib/geo";

/** Button showing the current location; opens a sheet to use GPS or pick a Malaysian area. */
export function LocationPicker({ compact = false }: { compact?: boolean }) {
  const [loc, setLoc] = useSavedLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-3 text-left ${compact ? "rounded-xl bg-white px-3 py-2.5 shadow-sm" : "card px-4 py-3.5"}`}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
          <PinIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-muted">Your location</span>
          <span className="block truncate font-semibold">{loc ? loc.label : "Set your location"}</span>
        </span>
        <span className="text-sm font-semibold text-brand-600">{loc ? "Change" : "Set"}</span>
      </button>
      {open && <LocationSheet onClose={() => setOpen(false)} onPick={(l) => (setLoc(l), setOpen(false))} />}
    </>
  );
}

function LocationSheet({ onClose, onPick }: { onClose: () => void; onPick: (l: SavedLocation) => void }) {
  const [query, setQuery] = useState("");
  const [gpsState, setGpsState] = useState<"idle" | "loading" | string>("idle");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? AREAS.filter((a) => `${a.name} ${a.state}`.toLowerCase().includes(q)) : AREAS;
    return STATES.map((s) => ({ state: s, areas: list.filter((a) => a.state === s) })).filter((g) => g.areas.length);
  }, [query]);

  async function useGps() {
    setGpsState("loading");
    try {
      const { lat, lng } = await getGpsPosition();
      if (!isInMalaysia(lat, lng)) {
        setGpsState("You appear to be outside Malaysia. Please pick an area below.");
        return;
      }
      const area = nearestArea(lat, lng);
      onPick({ lat, lng, label: `Near ${area.name}, ${area.state}`, source: "gps", areaId: area.id });
    } catch (e) {
      setGpsState((e as Error).message + ". Please pick an area below.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl bg-sand-50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Choose your location"
      >
        <div className="px-5 pt-3 pb-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-sand-200" />
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Where are you?</h2>
            <button onClick={onClose} className="text-sm font-semibold text-muted">
              Close
            </button>
          </div>
          <button onClick={useGps} disabled={gpsState === "loading"} className="btn-primary w-full">
            <PinIcon /> {gpsState === "loading" ? "Finding you…" : "Use my current location"}
          </button>
          {gpsState !== "idle" && gpsState !== "loading" && <p className="mt-2 text-sm text-clay">{gpsState}</p>}
          <input
            className="field mt-3"
            placeholder="Search area, e.g. Shah Alam, Ipoh"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {grouped.map((g) => (
            <div key={g.state} className="mb-4">
              <h3 className="mb-1.5 text-xs font-bold tracking-wide text-muted uppercase">{g.state}</h3>
              <div className="card divide-y divide-sand-100">
                {g.areas.map((a) => (
                  <button
                    key={a.id}
                    onClick={() =>
                      onPick({ lat: a.lat, lng: a.lng, label: `${a.name}, ${a.state}`, source: "area", areaId: a.id })
                    }
                    className="block w-full px-4 py-3 text-left font-medium hover:bg-sand-50"
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {grouped.length === 0 && <p className="py-6 text-center text-muted">No areas match “{query}”.</p>}
        </div>
      </div>
    </div>
  );
}

export function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
