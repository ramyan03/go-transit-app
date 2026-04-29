export interface TtcLine {
  number: number;
  color: string;
  label: string; // "1", "2", "4", "5"
}

export interface TtcConnection {
  goStopId: string;
  namePatterns: string[]; // substrings to match against headsign/stop_name
  lines: TtcLine[];
  note?: string;
}

const L1: TtcLine = { number: 1, color: "#FFD100", label: "1" };
const L2: TtcLine = { number: 2, color: "#00A1DE", label: "2" };
const L5: TtcLine = { number: 5, color: "#009B77", label: "5" };

export const TTC_CONNECTIONS: TtcConnection[] = [
  {
    goStopId: "UN",
    namePatterns: ["Union"],
    lines: [L1, L2],
  },
  {
    goStopId: "DA",
    namePatterns: ["Danforth"],
    lines: [L2],
    note: "Bloor–Danforth nearby",
  },
  {
    goStopId: "KE",
    namePatterns: ["Kennedy"],
    lines: [L2],
    note: "Kennedy Station",
  },
  {
    goStopId: "WE",
    namePatterns: ["Weston"],
    lines: [L5],
    note: "Eglinton Crosstown West (future)",
  },
];

export function getTtcForName(name: string): TtcConnection | null {
  const upper = name.toUpperCase();
  return (
    TTC_CONNECTIONS.find((c) =>
      c.namePatterns.some((p) => upper.includes(p.toUpperCase()))
    ) ?? null
  );
}

export function getTtcForStopId(stopId: string): TtcConnection | null {
  return TTC_CONNECTIONS.find((c) => c.goStopId === stopId.toUpperCase()) ?? null;
}
