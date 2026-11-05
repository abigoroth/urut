import { AREAS } from "./areas";
import type { Area } from "./types";

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points in kilometres (haversine). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Closest known area to a coordinate — used to label a GPS location. */
export function nearestArea(lat: number, lng: number): Area {
  let best = AREAS[0];
  let bestD = Infinity;
  for (const a of AREAS) {
    const d = distanceKm(lat, lng, a.lat, a.lng);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

/** Rough bounding box of Malaysia, for validating coordinates. */
export function isInMalaysia(lat: number, lng: number): boolean {
  return lat > 0.8 && lat < 7.5 && lng > 99.5 && lng < 119.5;
}

export function formatDistance(km: number | null): string {
  if (km === null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
