const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/v1";

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Time helpers ──────────────────────────────────────────────────────────────

/** Format an ISO 8601 UTC string to "HH:MM" in Toronto time. */
export function formatTorontoTime(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Departure {
  trip_id: string;
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  headsign: string;
  direction_id: number | null;
  stop_sequence: number | null;
  scheduled_departure: string;   // ISO 8601 UTC
  realtime_departure: string | null; // ISO 8601 UTC — null until API key active
  delay_seconds: number | null;
  status: "ON_TIME" | "DELAYED" | "CANCELLED" | "SCHEDULED";
  vehicle_id: string | null;
  accessible?: boolean;
  platform?: string | null;
}

export interface DeparturesResponse {
  stop_id: string;
  stop_name: string;
  generated_at: string;
  source: "gtfs" | "nextservice";
  departures: Departure[];
}

export interface Alert {
  id: string;
  severity: "minor" | "major" | "cancelled";
  affected_routes: string[];
  affected_stops: string[];
  header: string;
  description: string;
  timestamp: string;
}

export interface AlertsResponse {
  generated_at: string;
  alerts: Alert[];
}

export interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  route_color: string;
  route_text_color: string;
}

export interface Stop {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  wheelchair_boarding: number;
}

export interface GtfsVersion {
  version: string;
  published_date: string;
  etag: string | null;
}

export interface StopTime {
  stop_id: string;
  stop_name: string;
  stop_sequence: number;
  departure_time: string; // "HH:MM"
  departure_iso: string;  // ISO 8601 UTC
}

export interface ScheduledDeparture {
  trip_id: string;
  route_short_name: string;
  route_long_name: string;
  headsign: string;
  direction_id: number;
  scheduled_departure: string; // ISO 8601 UTC
  stop_times: StopTime[];
}

export interface StationScheduleResponse {
  stop_id: string;
  stop_name: string;
  date: string; // YYYYMMDD
  departures: ScheduledDeparture[];
}

export interface Journey {
  trip_id: string;
  route_short_name: string;
  route_long_name: string;
  headsign: string;
  depart_time: string; // "HH:MM"
  depart_iso: string;
  arrive_time: string; // "HH:MM"
  arrive_iso: string;
  duration_minutes: number;
}

export interface JourneyResponse {
  from_stop_id: string;
  from_stop_name: string;
  to_stop_id: string;
  to_stop_name: string;
  date: string;
  journeys: Journey[];
}

export interface CompareStation {
  stop_id: string;
  stop_name: string;
  drive_seconds: number | null;
  departures: Departure[];
  next_viable: Departure | null;
}

export interface CompareResponse {
  generated_at: string;
  stations: CompareStation[];
}

export interface RouteStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  stop_sequence: number;
  departure_time: string;
}

export interface RouteDirection {
  headsign: string;
  stops: RouteStop[];
}

export interface RouteStopsResponse {
  route_short_name: string;
  route_long_name: string;
  route_color: string;
  route_type: number;
  directions: Record<string, RouteDirection>;
}

// ── API client ────────────────────────────────────────────────────────────────

export const api = {
  departures: (stop_id: string, limit = 5) =>
    apiFetch<DeparturesResponse>("/departures", {
      stop_id,
      limit: String(limit),
    }),

  alerts: () => apiFetch<AlertsResponse>("/realtime/alerts"),

  routes: (type?: "train" | "bus") =>
    apiFetch<Route[]>("/routes", type ? { type } : undefined),

  stops: (query?: string) =>
    apiFetch<Stop[]>("/stops", query ? { query } : undefined),

  gtfsVersion: () => apiFetch<GtfsVersion>("/gtfs/version"),

  schedule: {
    station: (stop_id: string, date: string, limit = 20) =>
      apiFetch<StationScheduleResponse>("/schedule/station", { stop_id, date, limit: String(limit) }),

    journey: (from: string, to: string, date: string, time: string, limit = 10) =>
      apiFetch<JourneyResponse>("/schedule/journey", { from, to, date, time, limit: String(limit) }),
  },

  compare: (stop_ids: string[], limit = 3) =>
    apiFetch<CompareResponse>("/compare", {
      stop_ids: stop_ids.join(","),
      limit: String(limit),
    }),

  routeStops: (short_name: string) =>
    apiFetch<RouteStopsResponse>(`/routes/${encodeURIComponent(short_name)}/stops`),
};
