const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.gotrackerapp.ca/v1";

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Departure {
  trip_id: string;
  route_id: string;
  route_name: string;
  headsign: string;
  scheduled: string;
  realtime: string | null;
  delay_minutes: number;
  platform: string | null;
  status: "on_time" | "delayed" | "cancelled";
  vehicle_type: "train" | "bus";
  accessible: boolean;
}

export interface DeparturesResponse {
  stop_id: string;
  stop_name: string;
  generated_at: string;
  departures: Departure[];
}

export interface Alert {
  id: string;
  severity: "minor" | "major" | "cancelled";
  affected_routes: string[];
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
}

export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  wheelchair_boarding: number;
}

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

  gtfsVersion: () =>
    apiFetch<{ version: string; published_date: string }>("/gtfs/version"),
};
