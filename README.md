# Urut

Match people looking for a massage with massage therapists near them, anywhere in Malaysia.
Mobile-first web app today; the JSON API is designed so a native mobile app can reuse it later.

## What it does

**Customers**
- Set location by GPS or by picking one of 44 Malaysian areas (KL, Selangor, Penang, Johor, Sabah, Sarawak…)
- See therapists **nearest first** (haversine distance; rating breaks near-ties within 0.5 km)
- Filter by service (Urut Tradisional, Urut Bersalin, Refleksologi, Thai, Aromaterapi, Urut Sukan, Tui Na, Bekam),
  therapist gender, your gender (hides ladies-only / men-only providers that won't serve you),
  home visit vs. going to their place, and max distance
- Home visits only show as available when you're inside the therapist's travel radius
- Request a booking, then follow up on WhatsApp; track bookings under **Bookings**

**Therapists**
- Register: services and RM prices, base area (or exact GPS), home visit / own premises / both,
  travel radius, which customers they accept, languages
- Dashboard: accept/decline requests, mark sessions done, toggle "accepting bookings", WhatsApp the customer

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
```

Data is stored in `.data/db.json` (git-ignored) and seeded with 34 demo providers across Malaysia on first run.
Delete the file to reset. On the therapist tab, "Try the dashboard with a demo profile" signs you in as a seeded provider.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/areas` | All areas. `?lat=&lng=` returns the nearest area |
| GET | `/api/providers` | `lat`, `lng` (or `area`), `service`, `therapistGender`, `customerGender`, `mode`, `maxDistanceKm`, `sort=distance\|rating\|price` |
| POST | `/api/providers` | Register a provider |
| GET / PATCH | `/api/providers/:id` | Detail (`?lat=&lng=` adds distance) / update, e.g. `{ "available": false }` |
| GET | `/api/bookings` | `?providerId=` or `?ids=a,b` |
| POST | `/api/bookings` | Create a booking request (checks service, mode, radius and gender rules) |
| PATCH | `/api/bookings/:id` | `{ "status": "accepted" \| "declined" \| "completed" \| "cancelled" }` |

## Code map

- `src/lib/areas.ts` – Malaysian areas and coordinates
- `src/lib/match.ts` – filtering and nearest-first ranking
- `src/lib/db.ts` – storage (JSON file); the only module to replace when moving to a real database
- `src/lib/schemas.ts` – request validation (zod), including Malaysian phone normalisation to `60…`
- `src/app/api/*` – API routes · `src/app/*` – pages

## Not done yet (next steps)

- **Accounts / login** – identity is kept in the browser's localStorage for now, so anyone with a provider ID can open its dashboard
- **Real database** – e.g. Postgres/Supabase with PostGIS for distance queries at scale; serverless hosts have read-only disks, so the JSON file won't persist there
- Reviews and ratings from real customers, provider photos, verification (IC / certificate)
- Map view, push / WhatsApp notifications for new bookings
- Mobile app (React Native / Expo) on top of the same API
