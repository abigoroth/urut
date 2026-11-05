import { getArea } from "./areas";
import { distanceKm } from "./geo";
import type { Gender, Provider, ProviderMatch, ServiceType } from "./types";

export interface MatchQuery {
  lat?: number;
  lng?: number;
  service?: ServiceType;
  /** Preferred therapist gender. */
  therapistGender?: Gender;
  /** Customer's own gender — hides providers who only serve the other gender. */
  customerGender?: Gender;
  mode?: "home_visit" | "premises";
  maxDistanceKm?: number;
  sort?: "distance" | "rating" | "price";
  /** Only identity-verified providers. */
  verifiedOnly?: boolean;
  includeUnavailable?: boolean;
}

export function toMatch(p: Provider, lat?: number, lng?: number, service?: ServiceType): ProviderMatch {
  const area = getArea(p.areaId);
  const hasLoc = lat !== undefined && lng !== undefined;
  const d = hasLoc ? +distanceKm(lat, lng, p.lat, p.lng).toFixed(2) : null;
  const relevant = service ? p.services.filter((s) => s.type === service) : p.services;
  return {
    ...p,
    verification: publicVerification(p),
    distanceKm: d,
    areaName: area?.name ?? p.areaId,
    state: area?.state ?? "",
    canHomeVisit: p.mode !== "premises" && (d === null || d <= p.travelRadiusKm),
    fromPriceRM: Math.min(...(relevant.length ? relevant : p.services).map((s) => s.priceRM)),
  };
}

/** What customers may see about a provider's checks: no name, IC digits or document list. */
export function publicVerification(p: Provider) {
  const v = p.verification;
  return {
    status: v.status,
    idVerified: v.idVerified,
    certified: v.certified,
    certificateName: v.certified ? v.certificateName : undefined,
    reviewedAt: v.reviewedAt,
    note: undefined,
  };
}

/**
 * Match customers to providers. Nearest first by default, because customers
 * prefer someone close by. Rating breaks ties between providers that are
 * roughly the same distance away (within 0.5 km).
 */
export function matchProviders(providers: Provider[], q: MatchQuery): ProviderMatch[] {
  const results = providers
    .filter((p) => q.includeUnavailable || p.available)
    .filter((p) => !q.service || p.services.some((s) => s.type === q.service))
    .filter((p) => !q.verifiedOnly || p.verification.idVerified)
    .filter((p) => !q.therapistGender || p.gender === q.therapistGender)
    .filter((p) => {
      if (!q.customerGender || p.servesGender === "all") return true;
      return p.servesGender === (q.customerGender === "female" ? "female_only" : "male_only");
    })
    .map((p) => toMatch(p, q.lat, q.lng, q.service))
    .filter((m) => {
      if (q.mode === "home_visit") return m.canHomeVisit;
      if (q.mode === "premises") return m.mode !== "home_visit";
      return true;
    })
    .filter((m) => q.maxDistanceKm === undefined || m.distanceKm === null || m.distanceKm <= q.maxDistanceKm);

  const sort = q.sort ?? "distance";
  results.sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating || (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
    if (sort === "price") return a.fromPriceRM - b.fromPriceRM || (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
    if (a.distanceKm === null || b.distanceKm === null) return b.rating - a.rating;
    const diff = a.distanceKm - b.distanceKm;
    return Math.abs(diff) < 0.5 ? b.rating - a.rating : diff;
  });
  return results;
}
