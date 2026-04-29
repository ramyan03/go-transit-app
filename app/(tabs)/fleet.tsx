import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react-native";

import { useTheme } from "@/hooks/useTheme";

type VehicleCategory = "locomotive" | "coach" | "bus" | "historical";

interface VehicleSpec { label: string; value: string; }

interface Vehicle {
  id: string;
  name: string;
  manufacturer: string;
  builtAt?: string;
  category: VehicleCategory;
  emoji: string;
  photo?: ReturnType<typeof require>;
  inService: string;
  unitCount: string;
  numberSeries?: string;
  specs: VehicleSpec[];
  funFact: string;
  status: "active" | "retiring" | "ordered" | "retired";
}

// ── Transit Trivia ────────────────────────────────────────────────────────────

const TRIVIA: { id: number; category: string; emoji: string; color: string; fact: string; }[] = [
  { id: 1, category: "History", emoji: "📅", color: "#0099C7", fact: "GO Transit launched May 23, 1967 with just 6 daily trips on the Lakeshore corridor — 3 westbound, 3 eastbound — between Hamilton and Pickering. Total daily ridership: around 4,000 passengers." },
  { id: 2, category: "Engineering", emoji: "🔧", color: "#794500", fact: "GO's push-pull operation means the MP40 locomotive never turns around. The engineer walks the length of the platform and climbs into the cab car at the far end to drive the next trip." },
  { id: 3, category: "Capacity", emoji: "🚃", color: "#0070C0", fact: "A fully-loaded 12-coach GO consist seats roughly 1,940 passengers — about the same as four Boeing 747s packed back-to-back." },
  { id: 4, category: "Manufacturing", emoji: "🏭", color: "#69B143", fact: "GO's BiLevel coaches have been built at the Thunder Bay plant since 1977 — nearly 50 years of continuous production, now under Alstom after their acquisition of Bombardier's rail division." },
  { id: 5, category: "Bus clearance", emoji: "🚌", color: "#E07B00", fact: "The Enviro500 Super-Lo is 30 cm shorter than the original Enviro500. That seemingly small trim unlocks dozens more GO routes by clearing Highway 401 overpasses the taller buses can't." },
  { id: 6, category: "Shared tracks", emoji: "🗺️", color: "#8B5A9C", fact: "The Barrie (CN Newmarket Sub) and Kitchener (CP Galt Sub) GO lines share tracks with freight trains. Freight runs in off-peak windows; GO holds the corridor during rush hour." },
  { id: 7, category: "Fleet numbers", emoji: "🔢", color: "#F57F25", fact: "Fleet numbers are intentional: #600s = MP40 locos · #667–682 = MP54AC locos · #2000–2857 & #4000–4533 = BiLevel coaches · #8000s = ADL double-deckers · #2100–2439 = MCI highway coaches · #5000+ = new D45 CRT buses." },
  { id: 8, category: "Service Guarantee", emoji: "✅", color: "#00853F", fact: "GO's Service Guarantee gives you a free trip credit if your train is 15+ minutes late to its scheduled final stop. The guarantee covers the destination stop, not intermediate stops." },
  { id: 9, category: "Union Station", emoji: "🏛️", color: "#98002E", fact: "Union Station's 12 GO tracks are all stub-end — trains can't pass through. Every GO train terminates, empties, and loads in the opposite direction, making it the busiest rail station in Canada by train movements." },
  { id: 10, category: "Electrification", emoji: "🔌", color: "#4F46E5", fact: "GO Expansion is electrifying the Lakeshore corridors with 25 kV AC overhead catenary. When complete, trains will run every 15 minutes all day — a massive shift from today's peak-only headways." },
  { id: 11, category: "Cab car", emoji: "🚃", color: "#0070C0", fact: "The nose of every GO train on the outbound trip isn't the locomotive — it's the cab car. The engineer sits in a full control cab at the passenger end, while the locomotive pushes from behind." },
  { id: 12, category: "Double-deckers", emoji: "🚌", color: "#E07B00", fact: "GO's ADL Enviro500 double-deckers are assembled at ADL's Vaughan, Ontario facility — making them one of the few locally-manufactured vehicle types in the entire GO fleet." },
  { id: 13, category: "Rail lore", emoji: "🚂", color: "#794500", fact: "The MP40's diesel engine produces 4,000 horsepower — yet the locomotive's top certified speed of 177 km/h is almost never reached. GO's right-of-way limits are typically 100–130 km/h." },
  { id: 14, category: "First bilevels", emoji: "🚃", color: "#0070C0", fact: "GO Transit was one of the first commuter rail systems in North America to operate bi-level coaches, introducing them in 1978 to double capacity without lengthening platforms." },
  { id: 15, category: "D4500CT hybrids", emoji: "🚌", color: "#E07B00", fact: "Two of GO's D4500CT buses — #3000 and #3001 — are rare diesel-electric hybrid prototypes. Ordered in 2009 as a pilot, GO never expanded the hybrid program. They're the only hybrids in the entire GO bus fleet." },
];

// ── Fleet data ────────────────────────────────────────────────────────────────

const FLEET: Vehicle[] = [
  { id: "mp40", name: "MP40PH-3C", manufacturer: "MotivePower Industries", builtAt: "Boise, Idaho", category: "locomotive", emoji: "🚂", photo: require("@/assets/fleet/go-mp40ph-3c.jpg"), inService: "2008–present", unitCount: "56 units", numberSeries: "#600–626, 628–646, 648–656, 658–666", specs: [{ label: "Power", value: "4,000 bhp" }, { label: "Traction", value: "Diesel-electric" }, { label: "Top speed", value: "177 km/h" }, { label: "Train capacity", value: "Up to 12 coaches" }, { label: "Emissions", value: "EPA Tier 2" }, { label: "Built", value: "2008–2014" }], funFact: "The MP40 replaced the F59PHs and is now the backbone of GO's locomotive fleet. The cab is one end only — the other end uses a cab car so the locomotive never needs to turn around at Union Station.", status: "active" },
  { id: "mp54ac", name: "MP54AC (MP40PHT-T4AC)", manufacturer: "MotivePower Industries", builtAt: "Boise, Idaho", category: "locomotive", emoji: "🚂", photo: require("@/assets/fleet/go-mp54ac.jpg"), inService: "2015–present", unitCount: "17 units", numberSeries: "#647 (prototype), 667–682", specs: [{ label: "Traction", value: "AC diesel-electric" }, { label: "Engine", value: "Cummins diesel" }, { label: "Emissions", value: "EPA Tier 4" }, { label: "Motors", value: "AC traction (vs DC on MP40)" }, { label: "Based on", value: "MP40PH-3C platform" }, { label: "Built", value: "2015–2018" }], funFact: "GO internally calls these MP40PHT-T4AC. The upgrade to AC traction motors is more efficient and needs less maintenance than DC. #647 was the lone prototype; the production batch of 15 units followed as #667–681.", status: "active" },
  { id: "f59ph", name: "EMD F59PH", manufacturer: "Electro-Motive Diesel (GMD)", category: "locomotive", emoji: "🚂", photo: require("@/assets/fleet/go-emdf59ph.JPG"), inService: "1988–2014", unitCount: "37 units (retired)", numberSeries: "#520–568", specs: [{ label: "Power", value: "3,000 hp" }, { label: "Engine", value: "EMD 12-710G3A diesel" }, { label: "Top speed", value: "177 km/h" }, { label: "Weight", value: "120 tonnes" }, { label: "Length", value: "17.8 m" }, { label: "Built", value: "1988–1994" }], funFact: "The same F59PH family hauled Amtrak's Cascades and California trains. GO retired all 37 by 2014 and sold them to other agencies — some are still running today in other parts of North America.", status: "retired" },
  { id: "bilevel-ix", name: "BiLevel Coach IX", manufacturer: "Bombardier / Alstom", builtAt: "Thunder Bay, Ontario", category: "coach", emoji: "🚃", photo: require("@/assets/fleet/go-bilevelcoachix.jpg"), inService: "2015–present", unitCount: "227+ cars", numberSeries: "#4000–4225, 4500–4533, 300–380", specs: [{ label: "Capacity", value: "162 seats" }, { label: "Floors", value: "2 (bi-level)" }, { label: "Length", value: "26.2 m" }, { label: "Safety", value: "Crash energy management" }, { label: "Accessibility", value: "Partial (vestibule ends)" }, { label: "Alstom-built", value: "From January 2021" }], funFact: "Alstom took over Bombardier's Thunder Bay plant in January 2021 and continues building Gen IX to the same design. The crash energy management crumple zones in the vestibule ends are a key safety upgrade over earlier generations.", status: "active" },
  { id: "bilevel-viii", name: "BiLevel Coach VIII", manufacturer: "Bombardier Transportation", builtAt: "Thunder Bay, Ontario", category: "coach", emoji: "🚃", photo: require("@/assets/fleet/go-bilevelcoachviii.jpg"), inService: "2008–present", unitCount: "128 cars", numberSeries: "#2545–2560, 2700–2857, 251–257", specs: [{ label: "Capacity", value: "162 seats" }, { label: "Floors", value: "2 (bi-level)" }, { label: "Length", value: "26.2 m" }, { label: "Cab variant", value: "250-series cab cars" }, { label: "Built", value: "2008–2015" }, { label: "Sub-orders", value: "4 production batches" }], funFact: "Gen VIII was spread across four sub-orders as GO expanded peak-hour capacity through the 2010s. The 250-series cab cars ride at the non-locomotive end, letting the engineer drive without the loco needing to loop at terminals.", status: "active" },
  { id: "bilevel-cabcar", name: "BiLevel Cab Car", manufacturer: "Bombardier / Alstom", builtAt: "Thunder Bay, Ontario", category: "coach", emoji: "🚃", photo: require("@/assets/fleet/go-bilevelcabcar.jpg"), inService: "2008–present", unitCount: "~60+ cab cars", numberSeries: "#250–257 (Gen VIII) · #300–380 (Gen IX)", specs: [{ label: "Role", value: "Push-pull control" }, { label: "Cab end", value: "Full engineer cab" }, { label: "Capacity", value: "~156 seats (reduced)" }, { label: "Floors", value: "2 (bi-level)" }, { label: "Safety", value: "Crash energy management" }, { label: "Crumple zone", value: "Full-width at cab end" }], funFact: "The cab car is what makes GO's push-pull operation possible. When the train arrives at Union, the engineer walks the platform, climbs into the cab car, and drives the return trip without the train turning around.", status: "active" },
  { id: "d45-crt", name: "MCI D45 CRT LE", manufacturer: "Motor Coach Industries", builtAt: "Winnipeg, Manitoba", category: "bus", emoji: "🚌", photo: require("@/assets/fleet/go-mcid45le.jpg"), inService: "2025–present", unitCount: "80 units", numberSeries: "#5000–5079", specs: [{ label: "Length", value: "45 ft (13.7 m)" }, { label: "Engine", value: "Cummins X-series" }, { label: "Emissions", value: "EPA Tier 4 / GHG17" }, { label: "Low entry", value: "Yes (front door step-free)" }, { label: "WiFi", value: "Yes" }, { label: "USB charge", value: "Yes" }], funFact: "The D45 CRT LE is MCI's current-gen highway coach and GO's newest fleet. The low-entry floor at the front door reduces the step height significantly — actively replacing older D4500CT coaches on GO express routes.", status: "active" },
  { id: "d4500ct", name: "MCI D4500CT", manufacturer: "Motor Coach Industries", builtAt: "Winnipeg, Manitoba", category: "bus", emoji: "🚌", photo: require("@/assets/fleet/go-mcid4500ct.jpg"), inService: "2001–present (retiring)", unitCount: "340+ coaches", numberSeries: "#2100–2439, 3000–3003", specs: [{ label: "Length", value: "45 ft (13.84 m)" }, { label: "Capacity", value: "57 seats" }, { label: "Engine", value: "Caterpillar C13 / Cummins ISM" }, { label: "Luggage bays", value: "Yes (under-floor)" }, { label: "Hybrid units", value: "#3000–3001 (D4500CTH)" }, { label: "Emissions", value: "EPA 2004–2007" }], funFact: "The silver MCI is the most iconic GO bus. #3000 and #3001 are rare D4500CTH hybrids — diesel-electric prototypes ordered in 2009, the only hybrids ever purchased for the GO bus fleet.", status: "retiring" },
  { id: "enviro500-superlo", name: "Enviro500 Super-Lo", manufacturer: "Alexander Dennis (ADL)", builtAt: "Vaughan, Ontario", category: "bus", emoji: "🚌", photo: require("@/assets/fleet/go-enviro500superlo.jpg"), inService: "2016–present", unitCount: "268+ coaches", numberSeries: "#8300–8567", specs: [{ label: "Decks", value: "2 (double-decker)" }, { label: "Height", value: "3.9 m (12 ft 10 in)" }, { label: "Length", value: "45 ft (14 m)" }, { label: "Engine", value: "Cummins ISL/L" }, { label: "Assembled", value: "Vaughan, Ontario" }, { label: "Emissions", value: "EPA 2016" }], funFact: "30 cm shorter than the original Enviro500, opening up far more GO routes by clearing most Highway 401 overpasses. These were the first double-deckers assembled at ADL's Vaughan facility.", status: "active" },
  { id: "enviro500-original", name: "Enviro500 (Original)", manufacturer: "Alexander Dennis (ADL)", category: "bus", emoji: "🚌", photo: require("@/assets/fleet/go-enviro500original.jpg"), inService: "2004–present (route-restricted)", unitCount: "12 coaches", numberSeries: "#8001–8011", specs: [{ label: "Decks", value: "2 (double-decker)" }, { label: "Height", value: "4.38 m (14 ft 4 in)" }, { label: "Length", value: "12.8 m" }, { label: "Restricted", value: "Hwy 407/403 corridors only" }, { label: "Engine", value: "Cummins ISL" }, { label: "Ordered", value: "2004 (Canada's first)" }], funFact: "Canada's first double-decker transit buses — and the tallest in the GO fleet. At 4.38 m, the original Enviro500s can't clear all Highway 401 overpasses, so they're permanently restricted to certain corridors.", status: "active" },
  // ── Historical fleet ───────────────────────────────────────────────────────
  { id: "gmcnewlook", name: "GMC New Look (TDH-5301)", manufacturer: "General Motors of Canada", category: "historical", emoji: "🚌", photo: require("@/assets/fleet/go-gmcnewlook.jpg"), inService: "1970s–1980s", unitCount: "Retired", specs: [{ label: "Nickname", value: "Fishbowl" }, { label: "Engine", value: "Detroit Diesel 8V-71" }, { label: "Transmission", value: "Allison automatic" }, { label: "Layout", value: "Single-deck transit" }, { label: "Length", value: "40 ft (12.2 m)" }, { label: "Origin", value: "Canada" }], funFact: "Known as the 'Fishbowl' for its curved panoramic windshield, the GMC New Look was a staple of North American transit in the 1970s. GO used these on early express bus routes before the highway coach fleet took over.", status: "retired" },
  { id: "mci-d4500", name: "MCI D4500", manufacturer: "Motor Coach Industries", builtAt: "Winnipeg, Manitoba", category: "historical", emoji: "🚌", photo: require("@/assets/fleet/go-mcid4500.jpg"), inService: "1990s–2000s", unitCount: "Retired", specs: [{ label: "Length", value: "45 ft (13.7 m)" }, { label: "Engine", value: "Detroit Diesel Series 60" }, { label: "Transmission", value: "Allison B500" }, { label: "Capacity", value: "57 seats" }, { label: "Luggage bays", value: "Yes (under-floor)" }, { label: "Successor", value: "MCI D4500CT" }], funFact: "The D4500 was GO's workhorse highway coach through the 1990s and laid the template for the longer-running D4500CT that followed. Many were retired as the CT fleet expanded through the 2000s.", status: "retired" },
  { id: "mci-102a2", name: "MCI 102 A2", manufacturer: "Motor Coach Industries", builtAt: "Winnipeg, Manitoba", category: "historical", emoji: "🚌", photo: require("@/assets/fleet/go-mci102a2.jpg"), inService: "1980s–1990s", unitCount: "Retired", specs: [{ label: "Length", value: "40 ft (12.2 m)" }, { label: "Engine", value: "Detroit Diesel 8V-92TA" }, { label: "Transmission", value: "Allison HT-740" }, { label: "Capacity", value: "47 seats" }, { label: "Livery", value: "Original GO green & white" }, { label: "Predecessor", value: "GMC New Look" }], funFact: "The 102 A2 was one of the first intercity coaches GO Transit operated on express bus routes, wearing the original green and white livery before the silver MCI era. Compact by today's standards at 40 ft.", status: "retired" },
];

const CATEGORY_LABELS: Record<VehicleCategory, string> = { locomotive: "Locomotives", coach: "Coaches", bus: "Buses", historical: "Historical Fleet" };
const CATEGORY_COLORS: Record<VehicleCategory, string> = { locomotive: "#794500", coach: "#0070C0", bus: "#E07B00", historical: "#6B7280" };

type FilterType = "all" | VehicleCategory;

// ── Trivia card ───────────────────────────────────────────────────────────────

function TriviaCard({ item }: { item: (typeof TRIVIA)[0] }) {
  const t = useTheme();
  return (
    <View style={{
      width: 230, backgroundColor: t.surface, borderRadius: 12, padding: 14,
      borderLeftWidth: 4, borderLeftColor: item.color,
      shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Text style={{ fontSize: 15 }}>{item.emoji}</Text>
        <Text style={{ color: item.color, fontSize: 10, fontWeight: "700", letterSpacing: 0.7 }}>
          {item.category.toUpperCase()}
        </Text>
      </View>
      <Text style={{ color: t.textPrimary, fontSize: 12.5, lineHeight: 19 }}>{item.fact}</Text>
    </View>
  );
}

// ── Vehicle card ──────────────────────────────────────────────────────────────

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const catColor = CATEGORY_COLORS[vehicle.category];

  const statusConfig = {
    active:   { label: "Active",   bg: t.primaryBg,  text: t.primary },
    retiring: { label: "Retiring", bg: t.warningBg,  text: t.warning },
    ordered:  { label: "On Order", bg: t.surfaceAlt,  text: "#4F46E5" },
    retired:  { label: "Retired",  bg: t.surfaceAlt, text: t.textMuted },
  };
  const status = statusConfig[vehicle.status];

  return (
    <View style={{
      backgroundColor: t.surface, borderRadius: 12, marginBottom: 10, overflow: "hidden",
      shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2,
    }}>
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.75}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <View style={{ width: 5, alignSelf: "stretch", backgroundColor: catColor }} />
        <View style={{
          width: 46, height: 46, margin: 12, borderRadius: 10,
          backgroundColor: catColor + "22", alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: 24 }}>{vehicle.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.textPrimary, fontSize: 14, fontWeight: "800" }} numberOfLines={1}>{vehicle.name}</Text>
          <Text style={{ color: t.textSecondary, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
            {vehicle.manufacturer}{vehicle.builtAt ? ` · ${vehicle.builtAt}` : ""}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>
            {vehicle.unitCount}{vehicle.numberSeries ? `  ·  ${vehicle.numberSeries}` : ""}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", paddingRight: 12, gap: 6 }}>
          <View style={{ backgroundColor: status.bg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 }}>
            <Text style={{ color: status.text, fontSize: 10, fontWeight: "700" }}>{status.label}</Text>
          </View>
          {expanded ? <ChevronUp color={t.textMuted} size={16} /> : <ChevronDown color={t.textMuted} size={16} />}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View>
          {vehicle.photo && !imgError ? (
            <View style={{ backgroundColor: t.primaryBg }}>
              {imgLoading && (
                <View style={{ position: "absolute", inset: 0, height: 220, alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                  <ActivityIndicator color={t.primary} />
                </View>
              )}
              <Image
                source={vehicle.photo}
                style={{ width: "100%", height: 220 }}
                resizeMode="cover"
                onLoad={() => setImgLoading(false)}
                onError={() => { setImgError(true); setImgLoading(false); }}
              />
            </View>
          ) : (
            <View style={{ height: 100, backgroundColor: catColor + "22", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 52 }}>{vehicle.emoji}</Text>
            </View>
          )}

          <View style={{ padding: 14 }}>
            <Text style={{ color: t.textMuted, fontSize: 11, marginBottom: 14 }}>🕐 {vehicle.inService}</Text>
            <Text style={{ color: t.textSecondary, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8 }}>
              SPECIFICATIONS
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {vehicle.specs.map((s) => (
                <View key={s.label} style={{ backgroundColor: t.surfaceAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, flexBasis: "47%", flexGrow: 1 }}>
                  <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: "600" }}>{s.label.toUpperCase()}</Text>
                  <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: "700", marginTop: 2 }}>{s.value}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: catColor + "18", borderLeftWidth: 3, borderLeftColor: catColor, borderRadius: 8, padding: 12 }}>
              <Text style={{ color: catColor, fontSize: 10, fontWeight: "700", marginBottom: 4 }}>DID YOU KNOW</Text>
              <Text style={{ color: t.textPrimary, fontSize: 13, lineHeight: 20 }}>{vehicle.funFact}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FleetScreen() {
  const t = useTheme();
  const [filter, setFilter] = useState<FilterType>("all");

  const filters: { key: FilterType; label: string; emoji: string }[] = [
    { key: "all",        label: "All",      emoji: "🚉" },
    { key: "locomotive", label: "Locos",    emoji: "🚂" },
    { key: "coach",      label: "Coaches",  emoji: "🚃" },
    { key: "bus",        label: "Buses",    emoji: "🚌" },
    { key: "historical", label: "History",  emoji: "🏛️" },
  ];

  const filtered = filter === "all" ? FLEET : FLEET.filter((v) => v.category === filter);
  const grouped = filtered.reduce<Partial<Record<VehicleCategory, Vehicle[]>>>((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category]!.push(v);
    return acc;
  }, {});

  const activeCount = FLEET.filter((v) => v.status !== "retired" && v.category !== "historical").length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Fleet</Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>
          {activeCount} vehicle types · tap any row for specs & photos
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }} contentContainerStyle={{ gap: 8 }}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
                backgroundColor: filter === f.key ? t.primary : t.surface,
                borderWidth: 1.5, borderColor: filter === f.key ? t.primary : t.border,
                flexDirection: "row", alignItems: "center", gap: 5,
              }}
            >
              <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
              <Text style={{ color: filter === f.key ? "#FFFFFF" : t.textSecondary, fontWeight: "700", fontSize: 13 }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ marginBottom: 22 }}>
          <Text style={{ color: t.textSecondary, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 10 }}>
            TRANSIT TRIVIA
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {TRIVIA.map((item) => <TriviaCard key={item.id} item={item} />)}
          </ScrollView>
        </View>

        {(Object.entries(grouped) as [VehicleCategory, Vehicle[]][]).map(([category, vehicles]) => (
          <View key={category}>
            {filter === "all" && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 4 }}>
                <View style={{ height: 3, width: 16, backgroundColor: CATEGORY_COLORS[category], borderRadius: 2 }} />
                <Text style={{ color: CATEGORY_COLORS[category], fontSize: 11, fontWeight: "700", letterSpacing: 0.8 }}>
                  {CATEGORY_LABELS[category].toUpperCase()}
                </Text>
              </View>
            )}
            {vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </View>
        ))}

        <Text style={{ color: t.textMuted, fontSize: 11, textAlign: "center", marginTop: 8, marginBottom: 8, lineHeight: 17 }}>
          Photos: Wikimedia Commons (CC BY-SA).{"\n"}
          Specs from manufacturer data & Metrolinx procurement documents.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
