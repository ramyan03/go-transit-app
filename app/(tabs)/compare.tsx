import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, MapPin, Search, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import * as Location from "expo-location";

import { api, type Stop, type Departure } from "@/lib/api";
import { formatTorontoTime } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";

const ROUTE_COLORS: Record<string, string> = {
  LW: "#98002E", LE: "#EE3124", ST: "#794500", BR: "#69B143",
  RH: "#0099C7", KI: "#F57F25", MI: "#F57F25", GT: "#F7941D", BO: "#8B5A9C",
};

const isTrainStation = (s: Stop) => /^[A-Z]{2,3}$/.test(s.stop_id);

// ── OSRM drive time ───────────────────────────────────────────────────────────

async function getOSRMDriveMinutes(fromLat: number, fromLon: number, toLat: number, toLon: number): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    return Math.ceil(data.routes[0].duration / 60);
  } catch {
    return null;
  }
}

// ── Station Picker ────────────────────────────────────────────────────────────

function StationPickerModal({ visible, current, onSelect, onClose }: {
  visible: boolean; current: Stop | null; onSelect: (s: Stop) => void; onClose: () => void;
}) {
  const t = useTheme();
  const [q, setQ] = useState("");

  useEffect(() => { if (visible) setQ(""); }, [visible]);

  const { data } = useQuery({
    queryKey: ["stops"],
    queryFn: () => api.stops(),
    staleTime: 10 * 60_000,
  });

  const stations = (data ?? [])
    .filter(isTrainStation)
    .filter((s) => !q || s.stop_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700" }}>Choose Station</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#FFFFFF" size={22} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginTop: 14 }}>
            <Search color="#9BB0A0" size={16} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search..."
              placeholderTextColor="#9BB0A0"
              style={{ flex: 1, color: "#1A2E1F", fontSize: 15 }}
              autoFocus
            />
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          {stations.map((s) => (
            <TouchableOpacity
              key={s.stop_id}
              onPress={() => { onSelect(s); onClose(); }}
              style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: current?.stop_id === s.stop_id ? t.primaryBg : t.surface,
                borderRadius: 10, padding: 14, marginBottom: 6, gap: 10,
              }}
            >
              <Text style={{ flex: 1, color: t.textPrimary, fontWeight: "600", fontSize: 15 }}>{s.stop_name}</Text>
              <Text style={{ color: t.textMuted, fontSize: 12 }}>{s.stop_id}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Departure mini-card ───────────────────────────────────────────────────────

function MiniDep({ dep, highlight }: { dep: Departure; highlight: boolean }) {
  const t = useTheme();
  const color = ROUTE_COLORS[dep.route_short_name] ?? "#9BB0A0";
  const time = formatTorontoTime(dep.realtime_departure ?? dep.scheduled_departure);

  return (
    <View style={{
      backgroundColor: highlight ? t.primaryBg : t.surfaceAlt,
      borderRadius: 8, marginBottom: 6, flexDirection: "row", alignItems: "center", overflow: "hidden",
    }}>
      <View style={{ width: 4, backgroundColor: color, alignSelf: "stretch" }} />
      <View style={{ flex: 1, padding: 10 }}>
        <Text style={{ color: t.textSecondary, fontSize: 10, fontWeight: "700" }}>{dep.route_short_name}</Text>
        <Text style={{ color: t.textPrimary, fontSize: 20, fontWeight: "700", fontVariant: ["tabular-nums"] }}>{time}</Text>
        <Text style={{ color: t.textMuted, fontSize: 11 }} numberOfLines={1}>{dep.headsign}</Text>
      </View>
      {highlight && (
        <View style={{ backgroundColor: t.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>CATCH THIS</Text>
        </View>
      )}
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CompareScreen() {
  const t = useTheme();
  const [stationA, setStationA] = useState<Stop | null>(null);
  const [stationB, setStationB] = useState<Stop | null>(null);
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);
  const [driveMinA, setDriveMinA] = useState("");
  const [driveMinB, setDriveMinB] = useState("");
  const [autoA, setAutoA] = useState(false);
  const [autoB, setAutoB] = useState(false);
  const [autoLoadingA, setAutoLoadingA] = useState(false);
  const [autoLoadingB, setAutoLoadingB] = useState(false);

  const ready = !!stationA && !!stationB && stationA.stop_id !== stationB.stop_id;
  const driveSecondsA = driveMinA ? Math.max(0, parseInt(driveMinA) || 0) * 60 : 0;
  const driveSecondsB = driveMinB ? Math.max(0, parseInt(driveMinB) || 0) * 60 : 0;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["compare", stationA?.stop_id, stationB?.stop_id, driveSecondsA, driveSecondsB],
    queryFn: () => api.compare([stationA!.stop_id, stationB!.stop_id], [driveSecondsA, driveSecondsB], 4),
    enabled: ready,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  async function handleAutoTime(
    station: Stop,
    setLoading: (v: boolean) => void,
    setDriveMin: (v: string) => void,
    setAuto: (v: boolean) => void,
  ) {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location needed", "Allow location access so GO Tracker can calculate your drive time to the station.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const minutes = await getOSRMDriveMinutes(loc.coords.latitude, loc.coords.longitude, station.stop_lat, station.stop_lon);
      if (minutes === null) {
        Alert.alert("Routing unavailable", "Couldn't calculate drive time. Enter it manually.");
        return;
      }
      setDriveMin(String(minutes));
      setAuto(true);
    } catch {
      Alert.alert("Location error", "Could not get your location. Enter drive time manually.");
    } finally {
      setLoading(false);
    }
  }

  const stationDefs = [
    {
      label: "STATION A", station: stationA, setStation: setStationA, setShow: setShowA,
      driveMin: driveMinA, setDriveMin: (v: string) => { setDriveMinA(v); setAutoA(false); },
      auto: autoA, setAuto: setAutoA, autoLoading: autoLoadingA, setAutoLoading: setAutoLoadingA,
    },
    {
      label: "STATION B", station: stationB, setStation: setStationB, setShow: setShowB,
      driveMin: driveMinB, setDriveMin: (v: string) => { setDriveMinB(v); setAutoB(false); },
      auto: autoB, setAuto: setAutoB, autoLoading: autoLoadingB, setAutoLoading: setAutoLoadingB,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Compare</Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>Next departures from two stations</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Station selectors */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {stationDefs.map(({ label, station, setShow, driveMin, setDriveMin, auto, setAuto, autoLoading, setAutoLoading }) => (
            <View key={label} style={{ flex: 1 }}>
              <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6 }}>
                {label}
              </Text>

              <TouchableOpacity
                onPress={() => setShow(true)}
                style={{
                  backgroundColor: t.surface, borderRadius: 10, borderWidth: 1.5,
                  borderColor: station ? t.primary : t.border,
                  padding: 12, flexDirection: "row", alignItems: "center", gap: 6,
                }}
              >
                <Text
                  style={{ flex: 1, color: station ? t.textPrimary : t.textMuted, fontSize: 13, fontWeight: station ? "600" : "400" }}
                  numberOfLines={2}
                >
                  {station?.stop_name ?? "Pick station"}
                </Text>
                <ChevronDown color={t.textMuted} size={16} />
              </TouchableOpacity>

              <View style={{ marginTop: 8 }}>
                <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: "600", letterSpacing: 0.5, marginBottom: 4 }}>
                  DRIVE TIME (MIN)
                </Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <View style={{
                    flex: 1, flexDirection: "row", alignItems: "center",
                    backgroundColor: t.surface, borderRadius: 8, borderWidth: 1.5,
                    borderColor: driveMin ? t.primary : t.border,
                    paddingHorizontal: 10, paddingVertical: 7,
                  }}>
                    <TextInput
                      value={driveMin}
                      onChangeText={setDriveMin}
                      placeholder="0"
                      placeholderTextColor={t.textMuted}
                      keyboardType="number-pad"
                      maxLength={3}
                      style={{ flex: 1, color: t.textPrimary, fontSize: 15, fontWeight: "600", fontVariant: ["tabular-nums"] }}
                    />
                    <Text style={{ color: t.textMuted, fontSize: 11 }}>min</Text>
                  </View>
                  {station && (
                    <TouchableOpacity
                      onPress={() => handleAutoTime(station, setAutoLoading, setDriveMin, setAuto)}
                      disabled={autoLoading}
                      style={{
                        backgroundColor: auto ? t.primaryBg : t.surface,
                        borderRadius: 8, borderWidth: 1.5,
                        borderColor: auto ? t.primary : t.border,
                        paddingHorizontal: 10, alignItems: "center", justifyContent: "center", minWidth: 44,
                      }}
                    >
                      {autoLoading
                        ? <ActivityIndicator size="small" color={t.primary} />
                        : <MapPin size={16} color={auto ? t.primary : t.textMuted} />
                      }
                    </TouchableOpacity>
                  )}
                </View>
                {auto && (
                  <Text style={{ color: t.primary, fontSize: 10, fontWeight: "600", marginTop: 4 }}>
                    📍 Live from your location
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {!ready && (
          <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 24, alignItems: "center", gap: 6 }}>
            <Text style={{ color: t.textPrimary, fontWeight: "700", fontSize: 15 }}>Select two stations</Text>
            <Text style={{ color: t.textSecondary, fontSize: 13, textAlign: "center" }}>
              Compare next departures side by side to decide which station to drive to.
              Tap 📍 to auto-fill drive time from your current location.
            </Text>
          </View>
        )}

        {ready && isLoading && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={t.primary} />
          </View>
        )}

        {ready && isError && (
          <View style={{ backgroundColor: t.dangerBg, borderWidth: 1, borderColor: t.danger, borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Text style={{ color: t.danger, fontWeight: "600" }}>Could not load departures</Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 8 }}>
              <Text style={{ color: t.primary, fontWeight: "600" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {data && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            {data.stations.map((st) => (
              <View key={st.stop_id} style={{ flex: 1 }}>
                <Text style={{ color: t.textPrimary, fontWeight: "700", fontSize: 14, marginBottom: 2 }} numberOfLines={1}>
                  {st.stop_name}
                </Text>
                {st.departures.length === 0 ? (
                  <View style={{ backgroundColor: t.surface, borderRadius: 8, padding: 12, alignItems: "center" }}>
                    <Text style={{ color: t.textMuted, fontSize: 12 }}>No departures</Text>
                  </View>
                ) : (
                  st.departures.map((dep) => (
                    <MiniDep key={dep.trip_id} dep={dep} highlight={dep.trip_id === st.next_viable?.trip_id} />
                  ))
                )}
              </View>
            ))}
          </View>
        )}

        {data && (
          <Text style={{ color: t.textMuted, fontSize: 11, textAlign: "center", marginTop: 16, lineHeight: 17 }}>
            "Catch This" = next train you can board given your drive time.{"\n"}
            Tap 📍 to recalculate drive time from your current location.{"\n"}
            Refreshes every 30 seconds.
          </Text>
        )}
      </ScrollView>

      <StationPickerModal visible={showA} current={stationA} onSelect={setStationA} onClose={() => setShowA(false)} />
      <StationPickerModal visible={showB} current={stationB} onSelect={setStationB} onClose={() => setShowB(false)} />
    </SafeAreaView>
  );
}
