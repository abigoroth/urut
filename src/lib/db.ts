import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { averageRating, seedData } from "./seed";
import type { Booking, Provider, Review, Verification, VerificationDocKind } from "./types";

/**
 * Minimal persistence for the MVP: a JSON file in `.data/`.
 * If the filesystem is read-only (e.g. serverless), data stays in memory.
 * Swap this module for a real database (Postgres/Supabase) later — the
 * rest of the app only talks to the functions exported here.
 */
interface DB {
  version: number;
  providers: Provider[];
  bookings: Booking[];
  reviews: Review[];
}

const SCHEMA_VERSION = 2;
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
/** Verification documents. Private: only served through the admin API. */
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

function fresh(): DB {
  return { version: SCHEMA_VERSION, ...seedData(), bookings: [] };
}

let db: DB | null = null;
let writeChain: Promise<void> = Promise.resolve();

async function load(): Promise<DB> {
  if (db) return db;
  try {
    db = JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as DB;
    if (db.version !== SCHEMA_VERSION) throw new Error("old schema");
  } catch {
    // First run, or demo data from an older version: start from seed data.
    db = fresh();
    await persist();
  }
  return db;
}

function persist(): Promise<void> {
  const snapshot = JSON.stringify(db, null, 2);
  writeChain = writeChain.then(async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DATA_FILE, snapshot);
    } catch {
      // Read-only filesystem: keep running in memory.
    }
  });
  return writeChain;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

// Providers

export async function listProviders(): Promise<Provider[]> {
  return (await load()).providers;
}

export async function getProvider(id: string): Promise<Provider | undefined> {
  return (await load()).providers.find((p) => p.id === id);
}

export async function createProvider(p: Provider): Promise<Provider> {
  const data = await load();
  data.providers.push(p);
  await persist();
  return p;
}

export async function updateProvider(id: string, patch: Partial<Provider>): Promise<Provider | undefined> {
  const data = await load();
  const p = data.providers.find((x) => x.id === id);
  if (!p) return undefined;
  Object.assign(p, patch, { id: p.id, createdAt: p.createdAt });
  await persist();
  return p;
}

// Bookings

export async function listBookings(filter: { providerId?: string; ids?: string[] }): Promise<Booking[]> {
  const { bookings } = await load();
  return bookings
    .filter((b) => (filter.providerId ? b.providerId === filter.providerId : true))
    .filter((b) => (filter.ids ? filter.ids.includes(b.id) : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  return (await load()).bookings.find((b) => b.id === id);
}

export async function createBooking(b: Booking): Promise<Booking> {
  const data = await load();
  data.bookings.push(b);
  await persist();
  return b;
}

export async function updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | undefined> {
  const data = await load();
  const b = data.bookings.find((x) => x.id === id);
  if (!b) return undefined;
  Object.assign(b, patch);
  await persist();
  return b;
}

// Verification

export async function setVerification(providerId: string, v: Verification): Promise<Provider | undefined> {
  const data = await load();
  const p = data.providers.find((x) => x.id === providerId);
  if (!p) return undefined;
  p.verification = v;
  await persist();
  return p;
}

export async function saveDocument(providerId: string, kind: VerificationDocKind, bytes: Buffer): Promise<void> {
  const dir = path.join(UPLOAD_DIR, providerId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${kind}.jpg`), bytes);
}

export async function readDocument(providerId: string, kind: VerificationDocKind): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(UPLOAD_DIR, providerId, `${kind}.jpg`));
  } catch {
    return null;
  }
}

// Reviews

export async function listReviews(providerId: string): Promise<Review[]> {
  return (await load()).reviews
    .filter((r) => r.providerId === providerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Adds a review, links it to its booking and refreshes the provider's average. */
export async function createReview(r: Review): Promise<Review> {
  const data = await load();
  data.reviews.push(r);
  const booking = data.bookings.find((b) => b.id === r.bookingId);
  if (booking) booking.reviewId = r.id;
  const p = data.providers.find((x) => x.id === r.providerId);
  if (p) {
    const mine = data.reviews.filter((x) => x.providerId === p.id);
    p.rating = averageRating(mine);
    p.reviewCount = mine.length;
  }
  await persist();
  return r;
}
