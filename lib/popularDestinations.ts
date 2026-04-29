export interface PopularDestination {
  id: string;
  name: string;
  emoji: string;
  goStopId: string;
  goStopName: string;
  note?: string;
}

// Stop IDs based on GO Transit GTFS 2-letter codes.
// Journey planner will return "no trains found" gracefully if a stop ID is wrong.
export const POPULAR_DESTINATIONS: PopularDestination[] = [
  // Entertainment / Downtown
  { id: "scotiabank",    name: "Scotiabank Arena",     emoji: "🏒", goStopId: "UN",  goStopName: "Union Station" },
  { id: "rogers",        name: "Rogers Centre",         emoji: "⚾", goStopId: "UN",  goStopName: "Union Station" },
  { id: "ripleys",       name: "Ripley's Aquarium",    emoji: "🦈", goStopId: "UN",  goStopName: "Union Station" },
  { id: "ontario_place", name: "Ontario Place",         emoji: "🎡", goStopId: "EX",  goStopName: "Exhibition GO" },
  { id: "cne",           name: "CNE Grounds",           emoji: "🎪", goStopId: "EX",  goStopName: "Exhibition GO" },
  // Transit
  { id: "pearson",       name: "Pearson Airport",       emoji: "✈️", goStopId: "UN",  goStopName: "Union Station",         note: "UP Express from Union" },
  // Shopping
  { id: "yorkdale",      name: "Yorkdale Mall",          emoji: "🛍️", goStopId: "DP",  goStopName: "Downsview Park GO" },
  { id: "vaughan_mills", name: "Vaughan Mills",          emoji: "🛍️", goStopId: "RU",  goStopName: "Rutherford GO" },
  { id: "square_one",    name: "Square One",             emoji: "🛍️", goStopId: "PC",  goStopName: "Port Credit GO" },
  { id: "sherway",       name: "Sherway Gardens",        emoji: "🛍️", goStopId: "LB",  goStopName: "Long Branch GO" },
  { id: "uc_mall",       name: "Upper Canada Mall",      emoji: "🛍️", goStopId: "NE",  goStopName: "Newmarket GO" },
  { id: "oshawa_centre", name: "Oshawa Centre",          emoji: "🛍️", goStopId: "OS",  goStopName: "Oshawa GO" },
  { id: "burlington_mall", name: "Burlington Mall",      emoji: "🛍️", goStopId: "BU",  goStopName: "Burlington GO" },
  // Education
  { id: "uoft",          name: "University of Toronto",  emoji: "🎓", goStopId: "UN",  goStopName: "Union Station" },
  { id: "mcmaster",      name: "McMaster University",    emoji: "🎓", goStopId: "HA",  goStopName: "Hamilton GO" },
  // Other destinations
  { id: "niagara_falls", name: "Niagara Falls",          emoji: "💦", goStopId: "NF",  goStopName: "Niagara Falls GO",     note: "Weekend service only" },
  { id: "burlington",    name: "Burlington",              emoji: "🏙️", goStopId: "BU",  goStopName: "Burlington GO" },
  { id: "hamilton",      name: "Hamilton",                emoji: "🏙️", goStopId: "HA",  goStopName: "Hamilton GO" },
];
