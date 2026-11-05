"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError, photoToDataUrl, useMyProviderId } from "@/lib/client";

type DocKey = "ic_front" | "selfie" | "certificate";

const DOCS: { key: DocKey; title: string; hint: string; required: boolean }[] = [
  { key: "ic_front", title: "MyKad (front)", hint: "Clear photo, all four corners visible, no glare.", required: true },
  { key: "selfie", title: "Selfie holding your MyKad", hint: "Your face and the card both clearly visible.", required: true },
  { key: "certificate", title: "Training certificate", hint: "Optional — earns the “Certified” badge.", required: false },
];

export default function VerifyPage() {
  const router = useRouter();
  const [myId, , ready] = useMyProviderId();
  const [legalName, setLegalName] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [docs, setDocs] = useState<Partial<Record<DocKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (ready && !myId)
    return (
      <div className="p-6">
        <p>Create your therapist profile first.</p>
        <Link href="/provider/join" className="btn-primary mt-4">
          Join as a therapist
        </Link>
      </div>
    );

  async function pick(key: DocKey, file: File | undefined) {
    if (!file) return;
    try {
      const url = await photoToDataUrl(file);
      setDocs((d) => ({ ...d, [key]: url }));
    } catch {
      setError("Could not read that photo. Try a JPG or PNG.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!docs.ic_front || !docs.selfie) return setError("Add a photo of your MyKad and a selfie holding it.");
    setBusy(true);
    try {
      await api(`/api/providers/${myId}/verification`, {
        method: "POST",
        body: { legalName, icNumber, certificateName: certificateName || undefined, documents: docs },
      });
      router.push("/provider");
    } catch (err) {
      const e2 = err as ApiError;
      setError(e2.issues?.map((i) => i.message).join(" · ") || e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 px-4 pt-6">
      <div>
        <Link href="/provider" className="text-sm font-semibold text-brand-600">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Get verified</h1>
        <p className="text-muted">Verified therapists get a badge and appear in “Verified only” searches. Most checks finish within 1 working day.</p>
      </div>

      <section className="card space-y-4 p-4">
        <h2 className="font-bold">Your identity</h2>
        <div>
          <label className="label">Full name as on MyKad</label>
          <input className="field" value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
        </div>
        <div>
          <label className="label">MyKad number</label>
          <input
            className="field"
            inputMode="numeric"
            placeholder="900101-14-5678"
            value={icNumber}
            onChange={(e) => setIcNumber(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-muted">🔒 We keep only the last 4 digits. Your documents are seen only by the Urut verification team.</p>
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-bold">Photos</h2>
        {DOCS.map((d) => (
          <label key={d.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-sand-200 bg-sand-50 p-3">
            {docs[d.key] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={docs[d.key]} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-white text-2xl" aria-hidden>
                📷
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                {d.title}
                {!d.required && <span className="font-normal text-muted"> (optional)</span>}
              </span>
              <span className="block text-sm text-muted">{docs[d.key] ? "✓ Added — tap to change" : d.hint}</span>
            </span>
            <input type="file" accept="image/*" capture={d.key === "selfie" ? "user" : "environment"} className="sr-only" onChange={(e) => pick(d.key, e.target.files?.[0])} />
          </label>
        ))}
        {docs.certificate && (
          <div>
            <label className="label">Certificate name</label>
            <input
              className="field"
              placeholder="e.g. SKM Level 2 – Traditional Malay Massage"
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              required
            />
          </div>
        )}
      </section>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="btn-primary w-full">
        {busy ? "Uploading…" : "Submit for verification"}
      </button>
    </form>
  );
}
