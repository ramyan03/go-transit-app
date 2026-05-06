# GO Tracker

Unofficial GO Transit departure app for GTHA commuters. Not affiliated with Metrolinx or GO Transit.

## Screens

| Screen | Description |
|--------|-------------|
| **Home** | Live departures from your home station, 30s refresh, per-line status ribbon, last train warning, TTC connection indicators, GTFS connecting routes, station notices |
| **Schedule** | My Station full-day timetable or Journey Planner (point-to-point, with fare estimate and favourite journeys) |
| **Alerts** | GTFS-RT service alerts split into Alerts and Delays tabs |
| **Saved** | Up to 5 saved stations with next departure, connecting bus route chips, parking and seat ratings |
| **Nearest** | GPS-based nearest GO train stations with next departure and connecting routes |
| **Compare** | Side-by-side departures from two stations with drive time (manual or auto via GPS + OSRM) |
| **Routes** | Full route list (train/bus filter) with interactive dark Leaflet stop map per direction |
| **Fleet** | GO Transit vehicle specs and transit trivia (MP40, MP54AC, BiLevel coaches, MCI/ADL buses) |
| **Departure detail** | Stop timeline with per-stop notices, delay info, TTC connection indicators, GO Service Guarantee panel |

Hidden from tab bar, accessible via **More**: Nearest, Routes, Compare, Fleet.

Modal/stack screens: `search` (global station + route search), `station-search` (set home or add saved), `route-detail` (map + stops), `departure-detail` (stop timeline + guarantee), `privacy` (in-app privacy policy).

## Stack

| Layer | Tech |
|-------|------|
| Mobile | Expo SDK 54, React Native, TypeScript |
| Navigation | Expo Router (file-based, tab + stack) |
| State | Zustand + AsyncStorage |
| Server state | TanStack Query (30s departures, 60s alerts) |
| Styling | NativeWind v4 + Tailwind |
| Maps | react-native-webview + Leaflet (CartoDB dark matter) |
| Icons | lucide-react-native + react-native-svg |
| Widget | react-native-android-widget v0.20.1 |
| Proxy | Node.js + Express + TypeScript |
| GTFS-RT | gtfs-realtime-bindings (protobuf) |
| Cache | Upstash Redis (in-memory fallback for local dev) |
| Deployment | Railway |

## Running locally

### 1. Proxy server

```bash
cd go-tracker-proxy
npm install
cp .env.example .env   # fill in values
npm run dev            # http://localhost:3000
```

| Variable | Description |
|----------|-------------|
| `METROLINX_API_KEY` | Metrolinx Open Data API key |
| `GTFS_DATA_DIR` | Local path for GTFS static cache (e.g. `C:/data`) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (optional — falls back to in-memory) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (optional) |

The proxy auto-downloads GTFS static data from Metrolinx on first start and refreshes every 6 hours. The Metrolinx API key is only required for GTFS-RT endpoints — GTFS static and fare data work without it locally.

### 2. Mobile app

```bash
cd go-tracker
npm install --legacy-peer-deps   # required — react@19.1.0 vs react-dom@19.2.5 peer conflict
npx expo start --web             # web preview at http://localhost:8081
npx expo start --tunnel          # on-device via Expo Go (requires Expo account)
```

> `.npmrc` already sets `legacy-peer-deps=true` so `npx expo install <pkg>` picks it up automatically. Pass the flag explicitly for plain `npm install`.

Set `EXPO_PUBLIC_API_URL` in `.env.local` if your proxy isn't at `http://localhost:3000/v1`.

### Android widget

The home screen widget requires a native build:

```bash
npx expo prebuild --platform android
npx expo run:android
```

The widget shows station, route, time, leave-at time, and status. Data is pushed from the Home screen on each 30s departure poll, with a 30-minute Android fallback update.

## Proxy endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Status, `metrolinx_key` boolean, `upstash_redis` boolean |
| `GET /v1/departures?stop_id=UN&limit=5` | Next departures from a stop (GTFS + GTFS-RT merge) |
| `GET /v1/realtime/trips` | GTFS-RT trip updates (30s cache) |
| `GET /v1/realtime/alerts` | GTFS-RT service alerts (60s cache) |
| `GET /v1/schedule/station?stop_id=UN&date=20260425&limit=20` | Full-day timetable for a stop |
| `GET /v1/schedule/journey?from=MK&to=UN&date=20260425&time=07:00` | Journey planner |
| `GET /v1/schedule/trip?trip_id=X` | All stop times for a specific trip |
| `GET /v1/schedule/lastdeparture?stop_id=UN&date=20260425` | Last train of the day from a stop |
| `GET /v1/fares?from=UN&to=MK` | E-ticket fare between two stops |
| `GET /v1/fares/bulk?from=UN&stop_ids=MK,AP,BO` | E-ticket fares from one stop to many |
| `GET /v1/routes?type=train` | Route list (deduplicated by route_short_name) |
| `GET /v1/routes/:short_name/stops` | Ordered stops + coordinates for both directions |
| `GET /v1/stops?query=union` | Stop search |
| `GET /v1/stops/:id` | Single stop by stop_id or stop_code |
| `GET /v1/connections?stop_id=UN` | GTFS transfers from a stop (max 8) |
| `GET /v1/connections/routes?stop_id=MR` | Connecting bus routes at a stop |
| `GET /v1/compare?stop_ids=UN,MK&drive_seconds=0,900&limit=4` | Side-by-side departures |
| `GET /v1/guarantee?trip_id=X` | GO Service Guarantee eligibility |
| `GET /v1/gtfs/version` | Current GTFS dataset version |

All endpoints require `?key=<APP_KEY>` query param.

## Tab structure

5 visible tabs: **Home → Schedule → Alerts → Saved → More**

The **More** tab links to hidden screens: Nearest Stations, Routes, Compare, Fleet, and Privacy Policy.

## Design system

| Token | Light | Dark |
|-------|-------|------|
| Background | `#F4F6F4` | `#0D1710` |
| Surface | `#FFFFFF` | `#172419` |
| Primary (GO green) | `#00853F` | `#00853F` |
| Text primary | `#1A2E1F` | `#E8F5EE` |
| Text secondary | `#5A7A63` | `#7AAB85` |
| Text muted | `#9BB0A0` | `#4A6A54` |
| Border | `#D8E8DC` | `#253D2C` |
| Warning | `#E07B00` | `#E07B00` |
| Danger | `#C41230` | `#C41230` |

Theme toggle (Light / Dark / System) lives in the More tab, persisted to AsyncStorage.

## Route colours (GTFS values — do not change)

```
LW #98002E   LE #EE3124   ST #794500   BR #69B143
RH #0099C7   KI #F57F25   MI #F57F25   GT #F7941D   BO #8B5A9C
```

## GTFS quirks (GO Transit specific)

- No `calendar.txt` — service dates use `calendar_dates.txt` only; `service_id = YYYYMMDD`
- Train stop IDs are 2-letter codes: `UN`, `MK`, `OA`, etc.
- `route_id` has a date prefix (`01260426-LW`) but `route_short_name = LW` — always deduplicate by short name
- `stop_times.txt` is ~1.6M rows — parsed line-by-line from a Buffer (no string allocation) to keep memory under Railway's 512MB container limit
- `getTorontoMidnightMs()` tries both EDT (UTC-4) and EST (UTC-5) — do not simplify, this handles DST transitions correctly

## Key files

| File | Purpose |
|------|---------|
| `lib/api.ts` | Typed fetch client for all proxy endpoints |
| `lib/theme.ts` | Light/dark color tokens (`Theme` type) |
| `lib/ttcConnections.ts` | Static TTC Line 1/2 data per GO station |
| `lib/popularDestinations.ts` | 18 popular GTA destinations with nearest GO stop |
| `lib/stationMeta.ts` | Parking and seating ratings for all ~66 GO train stations |
| `lib/notices.ts` | Static operational notices per stop with optional expiry (`STATION_NOTICES`) |
| `hooks/useTheme.ts` | Returns active theme based on store + system preference |
| `hooks/useLayout.ts` | Responsive horizontal padding — scales to centre content on tablets (≥768px) |
| `store/useAppStore.ts` | Zustand: homeStation, savedStations (max 5), favouriteJourneys (max 5), theme, commuteBufferMinutes |
| `components/ui/DepartureCard.tsx` | Route-coloured left border, monospace time, delay, leave-at time, TTC badge |
| `components/ui/StatusBadge.tsx` | ON_TIME / DELAYED / CANCELLED / SCHEDULED pills |
| `widgets/GoTrackerWidget.android.tsx` | Android home screen widget |
| `tasks/widgetTask.android.ts` | Widget data push task |

## Station notices

Edit `STATION_NOTICES` in `lib/notices.ts`. Each entry takes a 2-letter GO `stopId`, a `message`, a `type` (`"info"` or `"warning"`), and an optional `validUntil` date (`YYYYMMDD`). Notices appear as a banner on Home when the home station matches, and inline in the departure-detail stop timeline.

## Fare display

E-ticket fares from `fare_attributes.txt` (~8,100 zone-pair prices). Shown on route-detail (coloured fare/parking/seats dots), journey planner (fare chip), compare, nearest, and saved screens. A "Presto ~$1–$1.50 less" note is shown everywhere fares appear.

## Notes

- Not affiliated with Metrolinx or GO Transit.
- Data provided under the [Metrolinx Open Data License](https://www.metrolinx.com/en/aboutus/opendata/default.aspx).
- GO Service Guarantee: trips delayed 15+ minutes at the final stop qualify for a free trip credit. Claim links surface automatically in departure detail.
- OSRM demo server (`router.project-osrm.org`) is used for drive-time estimation in Compare — fine for personal use.
