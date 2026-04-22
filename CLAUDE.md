# GO Tracker — Mobile App

Unofficial GO Transit app for GTHA commuters. Not affiliated with Metrolinx.

## Dev

```bash
npx expo start --web          # web at localhost:8081
npx expo start --tunnel       # device testing via Expo Go
```

**npm installs must use `--legacy-peer-deps`** (react@19.1.0 vs react-dom@19.2.5 conflict). `.npmrc` is already set — `npx expo install` picks it up automatically. Pass the flag explicitly if using plain `npm install`.

Proxy must be running at `localhost:3000` — see `go-tracker-proxy/`.

## Stack

- Expo SDK 54, React Native, TypeScript
- Expo Router (file-based, tab navigation)
- Zustand + AsyncStorage — global state (`useAppStore`)
- TanStack Query — server state; 30s polling departures, 60s alerts
- NativeWind v4 + Tailwind — styling
- react-native-webview — Leaflet maps on route detail screen
- lucide-react-native + react-native-svg — icons

## Tab structure

5 tabs: **Home, Schedule, Alerts, Saved, More**

Routes/Compare/Fleet are hidden from the tab bar (`href: null` in `_layout.tsx`) and navigated to from the More screen.

| Tab | File | Purpose |
|-----|------|---------|
| Home | `app/(tabs)/index.tsx` | Live departures from home station, 30s poll |
| Schedule | `app/(tabs)/schedule.tsx` | My Station mode + Journey Planner mode |
| Alerts | `app/(tabs)/alerts.tsx` | GTFS-RT service alerts (requires API key) |
| Saved | `app/(tabs)/saved.tsx` | Up to 5 saved stations, next departure per station |
| More | `app/(tabs)/more.tsx` | Links to Routes, Compare, Fleet |
| Routes | `app/(tabs)/routes.tsx` | Train/bus filter, tap → route-detail |
| Compare | `app/(tabs)/compare.tsx` | Side-by-side next departures, CATCH THIS badge |
| Fleet | `app/(tabs)/fleet.tsx` | Locomotive and coach specs |

Modal screens: `app/station-search.tsx` (pass `?mode=saved` to add without changing home), `app/route-detail.tsx` (Leaflet map + stop list).

## Design system

| Token | Value |
|-------|-------|
| Background | `#F4F6F4` |
| Surface | `#FFFFFF` |
| Primary (GO green) | `#00853F` |
| Text primary | `#1A2E1F` |
| Text secondary | `#5A7A63` |
| Text muted | `#9BB0A0` |
| Warning | `#E07B00` |
| Danger | `#C41230` |
| Header bg | `#00853F`, subtitle `#A8D5B8` |

## Route colours (correct GTFS values — do not change)

```
LW=#98002E  LE=#EE3124  ST=#794500  BR=#69B143
RH=#0099C7  KI=#F57F25  MI=#F57F25  GT=#F7941D  BO=#8B5A9C
```

## Key files

- `lib/api.ts` — typed fetch client for all proxy endpoints
- `store/useAppStore.ts` — Zustand: homeStation, savedStations (max 5), theme, gtfsVersion
- `components/ui/DepartureCard.tsx` — route-coloured left border, monospace time, delay in minutes
- `components/ui/StatusBadge.tsx` — ON_TIME/DELAYED/CANCELLED/SCHEDULED pills

## State of API key

Metrolinx API key is set but GTFS-RT and NextService are not yet provisioned (registration submitted 2026-04-19, up to 10 days). Departures currently return GTFS static only (`realtime_departure: null`). Alerts screen shows a "unavailable" state gracefully. This will self-resolve when the subscription activates.
