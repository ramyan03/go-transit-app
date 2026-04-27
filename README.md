# GO Tracker

Unofficial GO Transit departure app for GTHA commuters. Not affiliated with Metrolinx or GO Transit.

## What it does

| Screen | Description |
|--------|-------------|
| **Home** | Live departures from your home station with 30s refresh, direction filter (inbound/outbound), "in X min" countdown on each card |
| **Schedule** | Full-day timetable (My Station mode) or point-to-point Journey Planner — tap any result to see the full stop timeline |
| **Alerts** | GTFS-RT service alerts (active once Metrolinx API key is provisioned) |
| **Saved** | Up to 5 saved stations with next-departure at a glance — tap to drill into departure detail |
| **Nearest** | Geolocation-based nearest GO train stations with next departure, set-as-home and save buttons |
| **Compare** | Side-by-side departures from two stations with "Catch This" based on drive time (manual or auto from GPS via OSRM) |
| **Routes** | Full route list (train/bus filter) with interactive Leaflet stop map per direction |
| **Fleet** | GO Transit vehicle specs, photos, and Transit Trivia (MP40, MP54AC, BiLevel coaches, MCI/ADL buses) |
| **Departure detail** | Stop timeline for any trip, delay info, GO Service Guarantee claim link (activates when 15+ min late) |

## Stack

| Layer | Tech |
|-------|------|
| Mobile | Expo SDK 54, React Native, TypeScript |
| Navigation | Expo Router (file-based, tab + stack) |
| State | Zustand + AsyncStorage |
| Server state | TanStack Query (30s departures, 60s alerts) |
| Styling | NativeWind v4 + Tailwind |
| Maps | react-native-webview + Leaflet (OpenStreetMap) |
| Icons | lucide-react-native + react-native-svg |
| Proxy | Node.js + Express + TypeScript |
| GTFS-RT | gtfs-realtime-bindings (protobuf) |
| Cache | Upstash Redis (in-memory fallback for local dev) |
| Deployment | Railway |

## Running locally

### 1. Proxy server

```bash
cd go-tracker-proxy
npm install
cp .env.example .env   # fill in values (see table below)
npm run dev            # http://localhost:3000
```

Required env vars:

| Variable | Description |
|----------|-------------|
| `METROLINX_API_KEY` | Metrolinx Open Data API key |
| `GTFS_DATA_DIR` | Local path for GTFS static cache (e.g. `C:/data`) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (optional — falls back to in-memory) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (optional) |

The proxy auto-downloads GTFS static data from Metrolinx on first start and refreshes it every 6 hours.

### 2. Mobile app

```bash
cd go-tracker
npm install --legacy-peer-deps   # required — react@19.1.0 vs react-dom@19.2.5 peer conflict
npx expo start --web             # web preview at http://localhost:8081
npx expo start --tunnel          # on-device via Expo Go (requires Expo account)
```

> **Note:** `.npmrc` already sets `legacy-peer-deps=true` so `npx expo install <pkg>` picks it up automatically. Use the explicit flag for plain `npm install`.

Set `EXPO_PUBLIC_API_URL` in `.env.local` if your proxy isn't at `http://localhost:3000/v1`.

### Quick start (both at once)

```bash
# Terminal 1
cd go-tracker-proxy && npm run dev

# Terminal 2
cd go-tracker && npx expo start --web
```

## API key status

| Service | Status |
|---------|--------|
| GTFS static data | ✅ Working — auto-downloaded from Metrolinx |
| GTFS-RT trip updates | ⏳ Pending provisioning |
| GTFS-RT service alerts | ⏳ Pending provisioning |
| NextService (real-time departures + platform) | ⏳ Pending provisioning |
| GO Service Guarantee | ⏳ Pending provisioning |

**Registration submitted: 2026-04-19. Provisioning takes up to 10 business days (~2026-04-29).**

Until the key is fully provisioned, the app shows GTFS static schedule data everywhere. Once active:
- `realtime_departure` will populate on departure cards (delays, countdowns become live)
- Platform numbers will appear on departure cards and detail screens
- Service alerts will show real disruptions instead of "unavailable"
- GO Service Guarantee panel will show live eligibility and claim links

No code changes are needed when the key activates — the proxy already handles the merge and fallback logic.

## Proxy endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Status, `metrolinx_key` boolean, `upstash_redis` boolean |
| `GET /v1/departures?stop_id=UN&limit=5` | Next departures from a stop (GTFS + GTFS-RT merge) |
| `GET /v1/realtime/trips` | GTFS-RT trip updates (30s cache) |
| `GET /v1/realtime/alerts` | GTFS-RT service alerts (60s cache) |
| `GET /v1/schedule/station?stop_id=UN&date=20260425&limit=20` | Full day timetable |
| `GET /v1/schedule/journey?from=MK&to=UN&date=20260425&time=07:00` | Journey planner |
| `GET /v1/schedule/trip?trip_id=X` | All stop times for a specific trip |
| `GET /v1/routes?type=train` | Route list (deduplicated by route_short_name) |
| `GET /v1/routes/:short_name/stops` | Ordered stops + coordinates for both directions |
| `GET /v1/stops?query=union` | Stop search |
| `GET /v1/stops/:id` | Single stop by stop_id or stop_code |
| `GET /v1/compare?stop_ids=UN,MK&drive_seconds=0,900&limit=4` | Side-by-side departures |
| `GET /v1/guarantee?trip_id=X` | GO Service Guarantee eligibility |
| `GET /v1/fleet/consist` | Fleet consist data |
| `GET /v1/gtfs/version` | Current GTFS dataset version |

## Tab structure

5 visible tabs in the bottom bar: **Home → Schedule → Alerts → Saved → More**

Hidden screens (navigated from More): **Nearest Stations, Routes, Compare, Fleet**

Modal/stack screens: `station-search` (set home or add saved), `route-detail` (map + stops), `departure-detail` (stop timeline + guarantee)

## Design system

| Token | Light | Dark |
|-------|-------|------|
| Background | `#F4F6F4` | `#0D1710` |
| Surface | `#FFFFFF` | `#172419` |
| Primary (GO green) | `#00853F` | `#00853F` |
| Primary bg | `#E8F5EE` | `#1A3525` |
| Text primary | `#1A2E1F` | `#E8F5EE` |
| Text secondary | `#5A7A63` | `#7AAB85` |
| Text muted | `#9BB0A0` | `#4A6A54` |
| Border | `#D8E8DC` | `#253D2C` |
| Warning | `#E07B00` | `#E07B00` |
| Danger | `#C41230` | `#C41230` |

Theme toggle (Light / Dark / System) lives in the More tab. Theme preference is persisted to AsyncStorage.

## Route colours (GTFS values — do not change)

```
LW #98002E   LE #EE3124   ST #794500   BR #69B143
RH #0099C7   KI #F57F25   MI #F57F25   GT #F7941D   BO #8B5A9C
```

## GTFS quirks (GO Transit specific)

- No `calendar.txt` — service dates use `calendar_dates.txt` only; `service_id = YYYYMMDD`
- Train stop IDs are 2-letter codes: `UN`, `MK`, `OA`, etc.
- `route_id` has a date prefix (`01260426-LW`) but `route_short_name = LW` — always deduplicate by short name
- `stop_times.txt` is ~1.6M rows — parsed line-by-line with a custom CSV parser (no CSV library)
- `getTorontoMidnightMs()` tries both EDT (UTC-4) and EST (UTC-5) — do not simplify, it handles DST transitions

## Key files

| File | Purpose |
|------|---------|
| `lib/api.ts` | Typed fetch client for all proxy endpoints |
| `lib/theme.ts` | Light/dark color tokens (`Theme` type) |
| `hooks/useTheme.ts` | Returns active theme based on store + system preference |
| `store/useAppStore.ts` | Zustand: homeStation, savedStations (max 5), theme, gtfsVersion |
| `components/ui/DepartureCard.tsx` | Route-coloured left border, monospace time, delay, live countdown |
| `components/ui/StatusBadge.tsx` | ON_TIME / DELAYED / CANCELLED / SCHEDULED pills |

## Notes

- Not affiliated with Metrolinx or GO Transit.
- Data provided under the [Metrolinx Open Data License](https://www.metrolinx.com/en/aboutus/opendata/default.aspx).
- GO Service Guarantee: trips delayed 15+ minutes at the final stop qualify for a free trip credit. Claim links surface automatically in the departure detail screen.
