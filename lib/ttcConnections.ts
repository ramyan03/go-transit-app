export interface TtcLine {
  number: number;
  color: string;
  label: string;
}

export interface TtcConnection {
  goStopId: string;
  goStopName: string;
  namePatterns: string[]; // substrings matched against headsign / stop_name
  lines: TtcLine[];
  ttcStation: string;
}

const L1: TtcLine = { number: 1, color: "#FFD100", label: "1" };
const L2: TtcLine = { number: 2, color: "#00A1DE", label: "2" };

// GO train stations with direct TTC subway connections (verified 2026-04-29)
export const TTC_CONNECTIONS: TtcConnection[] = [
  {
    goStopId: "UN",
    goStopName: "Union Station GO",
    namePatterns: ["Union"],
    lines: [L1],
    ttcStation: "Union Station (Line 1 both branches)",
  },
  {
    goStopId: "BL",
    goStopName: "Bloor GO",
    namePatterns: ["Bloor"],
    lines: [L2],
    ttcStation: "Dundas West",
  },
  {
    goStopId: "KP",
    goStopName: "Kipling GO",
    namePatterns: ["Kipling"],
    lines: [L2],
    ttcStation: "Kipling",
  },
  {
    goStopId: "KE",
    goStopName: "Kennedy GO",
    namePatterns: ["Kennedy"],
    lines: [L2],
    ttcStation: "Kennedy",
  },
  {
    goStopId: "DW",
    goStopName: "Downsview Park GO",
    namePatterns: ["Downsview"],
    lines: [L1],
    ttcStation: "Sheppard-West",
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
