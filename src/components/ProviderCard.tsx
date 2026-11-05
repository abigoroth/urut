import Link from "next/link";
import { formatRM } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import { serviceLabel } from "@/lib/services";
import type { ProviderMatch } from "@/lib/types";

export function Avatar({ name, gender, size = 56 }: { name: string; gender: "female" | "male"; size?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-2xl font-bold ${gender === "female" ? "bg-[#f6e3d8] text-clay" : "bg-brand-100 text-brand-700"}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function Stars({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return <span className="text-xs font-semibold text-brand-600">New</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-amber-500">★</span>
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="text-muted">({count})</span>
    </span>
  );
}

export function VerifiedTick({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="ml-1 inline-block -translate-y-px align-middle text-brand-500"
      aria-label="ID verified"
      role="img"
    >
      <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.5 8 11 4.6-1.5 8-6 8-11V5z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrustBadges({ p }: { p: Pick<ProviderMatch, "verification"> }) {
  return (
    <>
      {p.verification.idVerified && <Badge tone="brand">✓ ID verified</Badge>}
      {p.verification.certified && <Badge tone="brand">🎓 Certified</Badge>}
    </>
  );
}

export function ModeBadge({ p }: { p: ProviderMatch }) {
  if (p.mode === "premises") return <Badge>At their place</Badge>;
  if (p.canHomeVisit) return <Badge tone="brand">Home visit ✓</Badge>;
  return <Badge>{p.mode === "both" ? "Their place only (too far to visit)" : "Out of visit range"}</Badge>;
}

export function Badge({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "brand" | "warn" }) {
  const cls =
    tone === "brand" ? "bg-brand-50 text-brand-700" : tone === "warn" ? "bg-amber-50 text-amber-800" : "bg-sand-100 text-muted";
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

export function ProviderCard({ p, rank }: { p: ProviderMatch; rank?: number }) {
  return (
    <Link href={`/providers/${p.id}`} className="card block p-4 transition active:scale-[0.99]">
      <div className="flex gap-3.5">
        <Avatar name={p.name} gender={p.gender} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate leading-tight font-bold">
              {p.name}
              {p.verification.idVerified && <VerifiedTick />}
            </h3>
            {p.distanceKm !== null && (
              <span className={`shrink-0 text-sm font-bold ${rank === 0 ? "text-clay" : "text-brand-600"}`}>
                {formatDistance(p.distanceKm)}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {p.areaName}, {p.state} · {p.gender === "female" ? "Female" : "Male"} therapist
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Stars rating={p.rating} count={p.reviewCount} />
            <span className="text-muted">·</span>
            <span className="text-sm">
              from <b>{formatRM(p.fromPriceRM)}</b>
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <TrustBadges p={p} />
        <ModeBadge p={p} />
        {p.servesGender !== "all" && (
          <Badge tone="warn">{p.servesGender === "female_only" ? "Ladies only" : "Men only"}</Badge>
        )}
        {p.services.slice(0, 3).map((s) => (
          <Badge key={s.type}>{serviceLabel(s.type)}</Badge>
        ))}
      </div>
    </Link>
  );
}
