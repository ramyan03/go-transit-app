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

type VehicleCategory = "locomotive" | "coach" | "bus";

interface VehicleSpec {
  label: string;
  value: string;
}

interface Vehicle {
  id: string;
  name: string;
  manufacturer: string;
  builtAt?: string;
  category: VehicleCategory;
  emoji: string;
  photo?: string;
  inService: string;
  unitCount: string;
  numberSeries?: string;
  specs: VehicleSpec[];
  funFact: string;
  status: "active" | "retiring" | "ordered" | "retired";
}

// All photo URLs use Wikimedia Commons 1200px thumbnails for high quality.
// Format: /thumb/[x]/[xy]/[encoded-filename]/1200px-[encoded-filename]
const FLEET: Vehicle[] = [
  // ── LOCOMOTIVES ───────────────────────────────────────────────
  {
    id: "mp40",
    name: "MP40PH-3C",
    manufacturer: "MotivePower Industries",
    builtAt: "Boise, Idaho",
    category: "locomotive",
    emoji: "🚂",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Brampton_ON_GOT-655_MPI-MP40PH-3C_2017-03-23_%282%29.jpg/1200px-Brampton_ON_GOT-655_MPI-MP40PH-3C_2017-03-23_%282%29.jpg",
    inService: "2008–present",
    unitCount: "56 units",
    numberSeries: "#600–626, 628–646, 648–656, 658–666",
    specs: [
      { label: "Power",          value: "4,000 bhp" },
      { label: "Traction",       value: "Diesel-electric" },
      { label: "Top speed",      value: "177 km/h" },
      { label: "Train capacity", value: "Up to 12 coaches" },
      { label: "Emissions",      value: "EPA Tier 2" },
      { label: "Built",          value: "2008–2014" },
    ],
    funFact:
      "The MP40 replaced the F59PHs and is now the backbone of GO's locomotive fleet. The cab is one end only — the other end uses a cab car so the locomotive never needs to turn around at Union Station.",
    status: "active",
  },
  {
    id: "mp54ac",
    name: "MP54AC (MP40PHT-T4AC)",
    manufacturer: "MotivePower Industries",
    builtAt: "Boise, Idaho",
    category: "locomotive",
    emoji: "🚂",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Malton_ON_GOT-668_MPI-MP54AC_2022-02-01_%282%29.jpg/1200px-Malton_ON_GOT-668_MPI-MP54AC_2022-02-01_%282%29.jpg",
    inService: "2015–present",
    unitCount: "17 units",
    numberSeries: "#647 (prototype), 667–682",
    specs: [
      { label: "Traction",  value: "AC diesel-electric" },
      { label: "Engine",    value: "Cummins diesel" },
      { label: "Emissions", value: "EPA Tier 4" },
      { label: "Motors",    value: "AC traction (vs DC on MP40)" },
      { label: "Based on",  value: "MP40PH-3C platform" },
      { label: "Built",     value: "2015–2018" },
    ],
    funFact:
      "GO internally calls these MP40PHT-T4AC. The upgrade to AC traction motors is more efficient and needs less maintenance than DC. #647 was the lone prototype; the production batch of 15 units followed as #667–681.",
    status: "active",
  },
  {
    id: "f59ph",
    name: "EMD F59PH",
    manufacturer: "Electro-Motive Diesel (GMD)",
    category: "locomotive",
    emoji: "🚂",
    inService: "1988–2014",
    unitCount: "37 units (retired)",
    numberSeries: "#520–568",
    specs: [
      { label: "Power",    value: "3,000 hp" },
      { label: "Engine",   value: "EMD 12-710G3A diesel" },
      { label: "Top speed",value: "177 km/h" },
      { label: "Weight",   value: "120 tonnes" },
      { label: "Length",   value: "17.8 m" },
      { label: "Built",    value: "1988–1994" },
    ],
    funFact:
      "The same F59PH family hauled Amtrak's Cascades and California trains. GO retired all 37 by 2014 and sold them to other agencies — some are still running today elsewhere in North America.",
    status: "retired",
  },

  // ── COACHES ───────────────────────────────────────────────────
  {
    id: "bilevel-ix",
    name: "BiLevel Coach IX",
    manufacturer: "Bombardier / Alstom",
    builtAt: "Thunder Bay, Ontario",
    category: "coach",
    emoji: "🚃",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/GO_Transit_bilevel_car_2843_at_Scarborough.JPG/1200px-GO_Transit_bilevel_car_2843_at_Scarborough.JPG",
    inService: "2015–present",
    unitCount: "227+ cars",
    numberSeries: "#4000–4225, 4500–4533, 300–380",
    specs: [
      { label: "Capacity",     value: "162 seats" },
      { label: "Floors",       value: "2 (bi-level)" },
      { label: "Length",       value: "26.2 m" },
      { label: "Safety",       value: "Crash energy management" },
      { label: "Accessibility",value: "Partial (vestibule ends)" },
      { label: "Alstom-built", value: "From January 2021" },
    ],
    funFact:
      "Alstom took over Bombardier's Thunder Bay plant in January 2021 and continues building Gen IX to the same design. The crash energy management crumple zones in the vestibule ends are a key safety upgrade over earlier generations.",
    status: "active",
  },
  {
    id: "bilevel-viii",
    name: "BiLevel Coach VIII",
    manufacturer: "Bombardier Transportation",
    builtAt: "Thunder Bay, Ontario",
    category: "coach",
    emoji: "🚃",
    inService: "2008–present",
    unitCount: "128 cars",
    numberSeries: "#2545–2560, 2700–2857, 251–257",
    specs: [
      { label: "Capacity",    value: "162 seats" },
      { label: "Floors",      value: "2 (bi-level)" },
      { label: "Length",      value: "26.2 m" },
      { label: "Cab variant", value: "250-series cab cars" },
      { label: "Built",       value: "2008–2015" },
      { label: "Sub-orders",  value: "4 production batches" },
    ],
    funFact:
      "Gen VIII was spread across four sub-orders as GO expanded peak-hour capacity through the 2010s. The 250-series cab cars ride at the non-locomotive end, letting the engineer drive without the loco needing to loop at terminals.",
    status: "active",
  },

  // ── BUSES ─────────────────────────────────────────────────────
  {
    id: "d45-crt",
    name: "MCI D45 CRT LE",
    manufacturer: "Motor Coach Industries",
    builtAt: "Winnipeg, Manitoba",
    category: "bus",
    emoji: "🚌",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/GO_Bus_5018_MCI_D45_CRT_at_Oshawa_GO%2C_March_18_2026.jpg/1200px-GO_Bus_5018_MCI_D45_CRT_at_Oshawa_GO%2C_March_18_2026.jpg",
    inService: "2025–present",
    unitCount: "80 units",
    numberSeries: "#5000–5079",
    specs: [
      { label: "Length",     value: "45 ft (13.7 m)" },
      { label: "Engine",     value: "Cummins X-series" },
      { label: "Emissions",  value: "EPA Tier 4 / GHG17" },
      { label: "Low entry",  value: "Yes (front door step-free)" },
      { label: "Wifi",       value: "Yes" },
      { label: "USB charge", value: "Yes" },
    ],
    funFact:
      "The D45 CRT LE ('Clean, Reliable Transportation, Low Entry') is MCI's current-gen highway coach and GO's newest fleet. The low-entry floor at the front door reduces the step height significantly. This is actively replacing older D4500CT coaches on GO express routes.",
    status: "active",
  },
  {
    id: "d4500ct",
    name: "MCI D4500CT",
    manufacturer: "Motor Coach Industries",
    builtAt: "Winnipeg, Manitoba",
    category: "bus",
    emoji: "🚌",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/GO_Transit_MCI_D4500CT_2267.jpg/1200px-GO_Transit_MCI_D4500CT_2267.jpg",
    inService: "2001–present (retiring)",
    unitCount: "340+ coaches",
    numberSeries: "#2100–2439, 3000–3003",
    specs: [
      { label: "Length",        value: "45 ft (13.84 m)" },
      { label: "Capacity",      value: "57 seats" },
      { label: "Engine",        value: "Caterpillar C13 / Cummins ISM" },
      { label: "Luggage bays",  value: "Yes (under-floor)" },
      { label: "Hybrid units",  value: "#3000–3001 (D4500CTH)" },
      { label: "Emissions",     value: "EPA 2004–2007" },
    ],
    funFact:
      "The silver MCI is the most iconic GO bus. #3000 and #3001 are rare D4500CTH hybrids — diesel-electric prototypes ordered in 2009. The under-floor luggage bays make them ideal for longer express routes including Pearson Airport connections.",
    status: "retiring",
  },
  {
    id: "enviro500-superlo",
    name: "Enviro500 Super-Lo",
    manufacturer: "Alexander Dennis (ADL)",
    builtAt: "Vaughan, Ontario",
    category: "bus",
    emoji: "🚌",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/GO_Transit_SuperLo_Enviro500_8308.jpg/1200px-GO_Transit_SuperLo_Enviro500_8308.jpg",
    inService: "2016–present",
    unitCount: "268+ coaches",
    numberSeries: "#8300–8567",
    specs: [
      { label: "Decks",    value: "2 (double-decker)" },
      { label: "Height",   value: "3.9 m (12 ft 10 in)" },
      { label: "Length",   value: "45 ft (14 m)" },
      { label: "Engine",   value: "Cummins ISL/L" },
      { label: "Assembled",value: "Vaughan, Ontario" },
      { label: "Emissions",value: "EPA 2016" },
    ],
    funFact:
      "30 cm shorter than the original Enviro500, which opened up far more GO routes by clearing most Highway 401 overpasses. These were the first double-deckers assembled at ADL's Vaughan facility — locally manufactured. The most common double-decker you'll board on GO.",
    status: "active",
  },
  {
    id: "enviro500-goany",
    name: "Enviro500 Go-Anywhere",
    manufacturer: "Alexander Dennis (ADL)",
    category: "bus",
    emoji: "🚌",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Go_Transit_8129.jpg/1200px-Go_Transit_8129.jpg",
    inService: "2012–present",
    unitCount: "105 coaches",
    numberSeries: "#8101–8205",
    specs: [
      { label: "Decks",  value: "2 (double-decker)" },
      { label: "Height", value: "4.1 m (13 ft 5 in)" },
      { label: "Length", value: "42 ft (12.8 m)" },
      { label: "Engine", value: "Cummins ISL" },
      { label: "Access", value: "Highway 401 clearance" },
      { label: "Emissions", value: "EPA 2010–2013" },
    ],
    funFact:
      "The 'Go-Anywhere' name refers to its wider route access vs. the original #8000-series (restricted to Hwy 407/403 only). At 4.1 m this variant clears Highway 401. The original taller Enviro500s (#8000–8011) can still only run on certain corridors.",
    status: "active",
  },
];

const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  locomotive: "Locomotives",
  coach: "Coaches",
  bus: "Buses",
};

const CATEGORY_COLORS: Record<VehicleCategory, string> = {
  locomotive: "#794500",
  coach: "#0070C0",
  bus: "#E07B00",
};

const STATUS_CONFIG = {
  active:   { label: "Active",   bg: "#E8F5EE", text: "#00853F" },
  retiring: { label: "Retiring", bg: "#FFF4E5", text: "#E07B00" },
  ordered:  { label: "On Order", bg: "#EEF2FF", text: "#4F46E5" },
  retired:  { label: "Retired",  bg: "#F1F5F9", text: "#64748B" },
};

type FilterType = "all" | VehicleCategory;

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const [expanded, setExpanded] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const catColor = CATEGORY_COLORS[vehicle.category];
  const status = STATUS_CONFIG[vehicle.status];

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        marginBottom: 10,
        overflow: "hidden",
        shadowColor: "#1A2E1F",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 5,
        elevation: 2,
      }}
    >
      {/* ── Compact highlight bar ─────────────────────────────── */}
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.75}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        {/* Category colour strip */}
        <View style={{ width: 5, alignSelf: "stretch", backgroundColor: catColor }} />

        {/* Emoji badge */}
        <View
          style={{
            width: 46,
            height: 46,
            margin: 12,
            borderRadius: 10,
            backgroundColor: catColor + "18",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 24 }}>{vehicle.emoji}</Text>
        </View>

        {/* Name + meta */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: "#1A2E1F", fontSize: 14, fontWeight: "800" }}
            numberOfLines={1}
          >
            {vehicle.name}
          </Text>
          <Text style={{ color: "#5A7A63", fontSize: 11, marginTop: 1 }} numberOfLines={1}>
            {vehicle.manufacturer}
            {vehicle.builtAt ? ` · ${vehicle.builtAt}` : ""}
          </Text>
          <Text style={{ color: "#9BB0A0", fontSize: 11, marginTop: 2 }}>
            {vehicle.unitCount}
            {vehicle.numberSeries ? `  ·  ${vehicle.numberSeries}` : ""}
          </Text>
        </View>

        {/* Status + chevron */}
        <View style={{ alignItems: "flex-end", paddingRight: 12, gap: 6 }}>
          <View
            style={{
              backgroundColor: status.bg,
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 5,
            }}
          >
            <Text style={{ color: status.text, fontSize: 10, fontWeight: "700" }}>
              {status.label}
            </Text>
          </View>
          {expanded ? (
            <ChevronUp color="#9BB0A0" size={16} />
          ) : (
            <ChevronDown color="#9BB0A0" size={16} />
          )}
        </View>
      </TouchableOpacity>

      {/* ── Expanded panel ────────────────────────────────────── */}
      {expanded && (
        <View>
          {/* Photo */}
          {vehicle.photo && !imgError ? (
            <View style={{ backgroundColor: "#E8F5EE" }}>
              {imgLoading && (
                <View
                  style={{
                    position: "absolute",
                    inset: 0,
                    height: 220,
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                  }}
                >
                  <ActivityIndicator color="#00853F" />
                </View>
              )}
              <Image
                source={{ uri: vehicle.photo }}
                style={{ width: "100%", height: 220 }}
                resizeMode="cover"
                onLoad={() => setImgLoading(false)}
                onError={() => { setImgError(true); setImgLoading(false); }}
              />
            </View>
          ) : (
            <View
              style={{
                height: 100,
                backgroundColor: catColor + "18",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 52 }}>{vehicle.emoji}</Text>
            </View>
          )}

          <View style={{ padding: 14 }}>
            {/* In service */}
            <Text style={{ color: "#9BB0A0", fontSize: 11, marginBottom: 14 }}>
              🕐 {vehicle.inService}
            </Text>

            {/* Specs grid */}
            <Text
              style={{
                color: "#5A7A63",
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 0.8,
                marginBottom: 8,
              }}
            >
              SPECIFICATIONS
            </Text>
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}
            >
              {vehicle.specs.map((s) => (
                <View
                  key={s.label}
                  style={{
                    backgroundColor: "#F4F6F4",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    flexBasis: "47%",
                    flexGrow: 1,
                  }}
                >
                  <Text style={{ color: "#9BB0A0", fontSize: 10, fontWeight: "600" }}>
                    {s.label.toUpperCase()}
                  </Text>
                  <Text
                    style={{ color: "#1A2E1F", fontSize: 13, fontWeight: "700", marginTop: 2 }}
                  >
                    {s.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Fun fact */}
            <View
              style={{
                backgroundColor: catColor + "12",
                borderLeftWidth: 3,
                borderLeftColor: catColor,
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: catColor,
                  fontSize: 10,
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                DID YOU KNOW
              </Text>
              <Text style={{ color: "#1A2E1F", fontSize: 13, lineHeight: 20 }}>
                {vehicle.funFact}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default function FleetScreen() {
  const [filter, setFilter] = useState<FilterType>("all");

  const filters: { key: FilterType; label: string; emoji: string }[] = [
    { key: "all",        label: "All",     emoji: "🚉" },
    { key: "locomotive", label: "Locos",   emoji: "🚂" },
    { key: "coach",      label: "Coaches", emoji: "🚃" },
    { key: "bus",        label: "Buses",   emoji: "🚌" },
  ];

  const filtered =
    filter === "all" ? FLEET : FLEET.filter((v) => v.category === filter);

  const grouped = filtered.reduce<Partial<Record<VehicleCategory, Vehicle[]>>>(
    (acc, v) => {
      if (!acc[v.category]) acc[v.category] = [];
      acc[v.category]!.push(v);
      return acc;
    },
    {}
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F6F4" }}>
      <View
        style={{
          backgroundColor: "#00853F",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>
          Fleet
        </Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>
          GO Transit vehicles — tap any row for specs & photos
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 18 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: filter === f.key ? "#00853F" : "#FFFFFF",
                borderWidth: 1.5,
                borderColor: filter === f.key ? "#00853F" : "#D8E8DC",
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
              <Text
                style={{
                  color: filter === f.key ? "#FFFFFF" : "#5A7A63",
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {(Object.entries(grouped) as [VehicleCategory, Vehicle[]][]).map(
          ([category, vehicles]) => (
            <View key={category}>
              {filter === "all" && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                    marginTop: 4,
                  }}
                >
                  <View
                    style={{
                      height: 3,
                      width: 16,
                      backgroundColor: CATEGORY_COLORS[category],
                      borderRadius: 2,
                    }}
                  />
                  <Text
                    style={{
                      color: CATEGORY_COLORS[category],
                      fontSize: 11,
                      fontWeight: "700",
                      letterSpacing: 0.8,
                    }}
                  >
                    {CATEGORY_LABELS[category].toUpperCase()}
                  </Text>
                </View>
              )}
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </View>
          )
        )}

        <Text
          style={{
            color: "#9BB0A0",
            fontSize: 11,
            textAlign: "center",
            marginTop: 8,
            marginBottom: 8,
            lineHeight: 17,
          }}
        >
          Photos: Wikimedia Commons (CC BY-SA).{"\n"}
          Specs from manufacturer data & Metrolinx procurement documents.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
