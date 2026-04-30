export interface StationNotice {
  stopId: string;
  message: string;
  type: "info" | "warning";
  validUntil?: string; // YYYYMMDD — auto-expires after this date
}

// Add / remove notices here as operational conditions change.
// stopId must match the GO Transit 2-letter GTFS stop code.
export const STATION_NOTICES: StationNotice[] = [
  {
    stopId: "MK",
    message: "Platform construction: cars 1–6 (front of train) accessible only.",
    type: "info",
  },
];

export function getNoticesForStop(stopId: string): StationNotice[] {
  const today = new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/Toronto" })
    .replace(/-/g, "");
  return STATION_NOTICES.filter(
    (n) =>
      n.stopId === stopId.toUpperCase() &&
      (!n.validUntil || n.validUntil >= today)
  );
}
