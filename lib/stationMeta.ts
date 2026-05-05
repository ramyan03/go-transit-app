export type Rating = "high" | "medium" | "low" | "none";

export interface StationMeta {
  parking: Rating;
  seats: Rating;
}

// Hardcoded per-station ratings for all GO train stations.
// parking: availability of parking at this station
// seats:   likelihood of finding a seat on inbound morning peak service
const STATION_META: Record<string, StationMeta> = {
  UN:  { parking: "none",   seats: "high"   }, // Union — no parking; outbound trains originate here
  BL:  { parking: "none",   seats: "low"    }, // Bloor — no parking; train nearly full inbound
  EX:  { parking: "none",   seats: "medium" }, // Exhibition
  MI:  { parking: "low",    seats: "medium" }, // Mimico
  LO:  { parking: "low",    seats: "medium" }, // Long Branch
  PO:  { parking: "medium", seats: "medium" }, // Port Credit — paid lot
  CL:  { parking: "high",   seats: "high"   }, // Clarkson — large free lot
  OA:  { parking: "high",   seats: "high"   }, // Oakville — large lot
  BO:  { parking: "medium", seats: "high"   }, // Bronte
  AP:  { parking: "medium", seats: "high"   }, // Appleby
  BU:  { parking: "high",   seats: "high"   }, // Burlington — large lot
  AL:  { parking: "high",   seats: "high"   }, // Aldershot — large lot
  WR:  { parking: "low",    seats: "high"   }, // West Harbour (Hamilton)
  HA:  { parking: "medium", seats: "high"   }, // Hamilton GO Centre — downtown paid
  DA:  { parking: "none",   seats: "low"    }, // Danforth — no parking; train already full inbound
  EG:  { parking: "none",   seats: "low"    }, // Eglinton — no parking
  SC:  { parking: "medium", seats: "medium" }, // Scarborough
  GU:  { parking: "medium", seats: "medium" }, // Guildwood
  RO:  { parking: "high",   seats: "high"   }, // Rouge Hill — large lot
  PIN: { parking: "high",   seats: "high"   }, // Pickering — large lot
  AJ:  { parking: "high",   seats: "high"   }, // Ajax — large lot
  WH:  { parking: "high",   seats: "high"   }, // Whitby — large lot
  OS:  { parking: "high",   seats: "high"   }, // Oshawa — large lot
  AG:  { parking: "low",    seats: "low"    }, // Agincourt — limited lot; close to Union inbound
  KE:  { parking: "medium", seats: "medium" }, // Kennedy
  MK:  { parking: "medium", seats: "medium" }, // Milliken
  CE:  { parking: "medium", seats: "high"   }, // Centennial
  UI:  { parking: "low",    seats: "low"    }, // Unionville — very limited parking
  MR:  { parking: "high",   seats: "high"   }, // Markham — large modern lot
  MJ:  { parking: "high",   seats: "high"   }, // Mount Joy — large lot
  ST:  { parking: "medium", seats: "high"   }, // Stouffville
  LI:  { parking: "medium", seats: "high"   }, // Old Elm
  GO:  { parking: "high",   seats: "high"   }, // Gormley
  BM:  { parking: "medium", seats: "high"   }, // Bloomington
  KP:  { parking: "low",    seats: "low"    }, // Kipling — subway connector; minimal parking
  ET:  { parking: "medium", seats: "medium" }, // Etobicoke North
  MA:  { parking: "medium", seats: "medium" }, // Malton
  BE:  { parking: "medium", seats: "medium" }, // Bramalea
  BR:  { parking: "high",   seats: "high"   }, // Brampton Innovation District
  MO:  { parking: "medium", seats: "high"   }, // Mount Pleasant
  ME:  { parking: "high",   seats: "high"   }, // Meadowvale — large lot
  LS:  { parking: "high",   seats: "high"   }, // Lisgar — large lot
  ML:  { parking: "high",   seats: "high"   }, // Milton
  WE:  { parking: "low",    seats: "low"    }, // Weston — limited; close to Union inbound
  MD:  { parking: "low",    seats: "low"    }, // Mount Dennis — near Eglinton LRT; no real parking
  ER:  { parking: "medium", seats: "medium" }, // Erindale
  SR:  { parking: "medium", seats: "medium" }, // Streetsville
  CO:  { parking: "medium", seats: "medium" }, // Cooksville
  DI:  { parking: "medium", seats: "medium" }, // Dixie
  GE:  { parking: "high",   seats: "high"   }, // Georgetown — large lot
  AC:  { parking: "medium", seats: "high"   }, // Acton
  GL:  { parking: "medium", seats: "high"   }, // Guelph Central — downtown, limited
  KI:  { parking: "high",   seats: "high"   }, // Kitchener — large lot
  DW:  { parking: "medium", seats: "low"    }, // Downsview Park — close to Union
  OL:  { parking: "low",    seats: "medium" }, // Old Cummer — small lot
  OR:  { parking: "low",    seats: "medium" }, // Oriole — small lot
  LA:  { parking: "medium", seats: "medium" }, // Langstaff
  RU:  { parking: "high",   seats: "high"   }, // Rutherford — large lot
  MP:  { parking: "high",   seats: "high"   }, // Maple — large lot
  KC:  { parking: "medium", seats: "high"   }, // King City
  AU:  { parking: "high",   seats: "high"   }, // Aurora — large lot
  NE:  { parking: "high",   seats: "high"   }, // Newmarket — large lot
  EA:  { parking: "high",   seats: "high"   }, // East Gwillimbury — large lot
  BD:  { parking: "high",   seats: "high"   }, // Bradford — large lot
  BA:  { parking: "high",   seats: "high"   }, // Barrie South — large lot
  AD:  { parking: "medium", seats: "high"   }, // Allandale Waterfront — Barrie downtown
  NI:  { parking: "medium", seats: "high"   }, // Niagara Falls
  CF:  { parking: "medium", seats: "high"   }, // Confederation
  PA:  { parking: "high",   seats: "medium" }, // Pearson Airport T1
  RI:  { parking: "medium", seats: "medium" }, // Richmond Hill
};

export function getStationMeta(stopId: string): StationMeta {
  return STATION_META[stopId.toUpperCase()] ?? { parking: "medium", seats: "medium" };
}

export function ratingColor(r: Rating): string {
  if (r === "high")   return "#69B143"; // green
  if (r === "medium") return "#E07B00"; // amber
  return "#C41230";                      // red (low or none)
}

export function priceRating(fare: number | null | undefined, minFare: number, maxFare: number): Rating {
  if (fare === null || fare === undefined) return "medium";
  if (maxFare === minFare) return "high";
  const pct = (fare - minFare) / (maxFare - minFare);
  if (pct <= 0.33) return "high";
  if (pct <= 0.66) return "medium";
  return "low";
}
