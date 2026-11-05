"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/** Customer's chosen location, persisted on the device. */
export interface SavedLocation {
  lat: number;
  lng: number;
  label: string;
  source: "gps" | "area";
  areaId?: string;
}

const KEYS = {
  location: "urut.location",
  bookings: "urut.myBookings",
  provider: "urut.myProviderId",
  customer: "urut.customer",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(`storage:${key}`));
  } catch {
    // storage unavailable — ignore
  }
}

const emptySubscribe = () => () => {};

/** A localStorage-backed value that stays in sync across components and tabs. */
function useStored<T>(key: string, fallback: T): [T, (v: T) => void, boolean] {
  const subscribe = useCallback(
    (cb: () => void) => {
      window.addEventListener(`storage:${key}`, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(`storage:${key}`, cb);
        window.removeEventListener("storage", cb);
      };
    },
    [key],
  );
  // `undefined` on the server / during hydration, string|null once on the client.
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => undefined,
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => (raw ? (read(key, fallback) as T) : fallback), [raw, key]);
  const set = useCallback((v: T) => write(key, v), [key]);
  return [value, set, raw !== undefined];
}

/** True once running in the browser (after hydration). */
export function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export const useSavedLocation = () => useStored<SavedLocation | null>(KEYS.location, null);
export const useMyProviderId = () => useStored<string | null>(KEYS.provider, null);
export const useMyBookingIds = () => useStored<string[]>(KEYS.bookings, []);
export const useCustomerProfile = () =>
  useStored<{ name: string; phone: string; gender: "female" | "male" } | null>(KEYS.customer, null);

export function addMyBooking(id: string) {
  write(KEYS.bookings, [id, ...read<string[]>(KEYS.bookings, [])]);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public issues?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

export async function api<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? `Request failed (${res.status})`, data.issues);
  return data as T;
}

/** Ask the browser for the current GPS position. */
export function getGpsPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported on this device"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(new Error(err.code === err.PERMISSION_DENIED ? "Location permission denied" : "Could not get your location")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export { formatRM } from "./format";

/** Shrink a photo to a JPEG data URL (max 1600px) so uploads stay small on mobile data. */
export async function photoToDataUrl(file: File, maxSide = 1600, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
