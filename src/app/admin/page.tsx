"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/client";
import { serviceLabel } from "@/lib/services";
import type { ServiceType, Verification } from "@/lib/types";

interface Item {
  id: string;
  name: string;
  gender: string;
  phone: string;
  area?: string;
  services: ServiceType[];
  verification: Verification;
}

const STATUSES = ["pending", "verified", "rejected"] as const;

/** Urut team: review therapist ID and certificate submissions. */
export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("pending");
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      fetch(`/api/admin/verifications?status=${status}`, { headers: { "x-admin-key": authed }, cache: "no-store" })
        .then(async (r) => {
          if (r.status === 401) throw new Error("Wrong admin key");
          return (await r.json()) as { items: Item[] };
        })
        .then(
          (d) => (setItems(d.items), setError(null)),
          (e: Error) => (setError(e.message), setAuthed("")),
        ),
    [status, authed],
  );

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  if (!authed)
    return (
      <form onSubmit={(e) => (e.preventDefault(), setAuthed(key))} className="space-y-3 px-4 pt-10">
        <h1 className="text-2xl font-bold">Urut admin</h1>
        <p className="text-muted">Therapist verification review.</p>
        <input className="field" type="password" placeholder="Admin key" value={key} onChange={(e) => setKey(e.target.value)} />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full">Sign in</button>
      </form>
    );

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold">Verifications</h1>
      <div className="mt-3 flex gap-1 rounded-xl bg-sand-100 p-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize ${status === s ? "bg-white text-brand-700 shadow-sm" : "text-muted"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-3">
        {items?.length === 0 && <p className="card px-4 py-8 text-center text-sm text-muted">Nothing {status}.</p>}
        {items?.map((it) => <ReviewCard key={it.id} item={it} adminKey={authed} onChange={load} />)}
      </div>
    </div>
  );
}

function ReviewCard({ item, adminKey, onChange }: { item: Item; adminKey: string; onChange: () => void }) {
  const v = item.verification;
  const hasCert = !!v.documents?.includes("certificate");
  const [idOk, setIdOk] = useState(true);
  const [certOk, setCertOk] = useState(hasCert);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approve" | "reject") {
    setError(null);
    try {
      const res = await fetch(`/api/admin/verifications/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ decision, idVerified: idOk, certified: certOk, note: note || undefined }),
      });
      if (!res.ok) throw new ApiError((await res.json()).error ?? "Failed");
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold">{item.name}</h3>
          <p className="text-sm text-muted">
            {item.area} · {item.gender} · {item.services.map(serviceLabel).join(", ")}
          </p>
        </div>
        <a href={`/providers/${item.id}`} className="text-sm font-semibold text-brand-600">
          Profile
        </a>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted">Name on MyKad</dt>
          <dd className="font-medium">{v.legalName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">MyKad</dt>
          <dd className="font-medium">{v.icLast4 ? `••••••-••-${v.icLast4}` : "—"}</dd>
        </div>
        {v.certificateName && (
          <div className="col-span-2">
            <dt className="text-muted">Certificate</dt>
            <dd className="font-medium">{v.certificateName}</dd>
          </div>
        )}
      </dl>
      {!!v.documents?.length && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {v.documents.map((d) => (
            <a key={d} href={`/api/admin/verifications/${item.id}/documents/${d}?key=${encodeURIComponent(adminKey)}`} target="_blank" rel="noreferrer">
              <DocThumb src={`/api/admin/verifications/${item.id}/documents/${d}?key=${encodeURIComponent(adminKey)}`} alt={d} />
              <span className="mt-0.5 block text-center text-xs text-muted">{d.replace("_", " ")}</span>
            </a>
          ))}
        </div>
      )}
      {v.status === "pending" && (
        <div className="mt-3 space-y-2 border-t border-sand-100 pt-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-brand-600" checked={idOk} onChange={(e) => setIdOk(e.target.checked)} />
            MyKad matches selfie and name
          </label>
          {hasCert && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-brand-600" checked={certOk} onChange={(e) => setCertOk(e.target.checked)} />
              Certificate is genuine and matches name
            </label>
          )}
          <input className="field py-2 text-sm" placeholder="Note to therapist (required if rejecting)" value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => decide("approve")} className="btn-primary flex-1 py-2 text-sm">
              Approve
            </button>
            <button onClick={() => decide("reject")} className="btn-outline flex-1 py-2 text-sm">
              Reject
            </button>
          </div>
        </div>
      )}
      {v.status === "rejected" && v.note && <p className="mt-2 text-sm text-red-700">Rejected: {v.note}</p>}
    </div>
  );
}


function DocThumb({ src, alt }: { src: string; alt: string }) {
  const [missing, setMissing] = useState(false);
  if (missing)
    return <div className="grid aspect-[4/3] w-full place-items-center rounded-lg bg-sand-100 text-xs text-muted">File missing</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} onError={() => setMissing(true)} className="aspect-[4/3] w-full rounded-lg bg-sand-100 object-cover" />;
}
