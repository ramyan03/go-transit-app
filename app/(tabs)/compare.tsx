import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Search, X } from "lucide-react-native";
import { useState } from "react";

import { api, type Stop, type Departure } from "@/lib/api";
import { formatTorontoTime } from "@/lib/api";

const ROUTE_COLORS: Record<string, string> = {
  LW: "#98002E", LE: "#EE3124", ST: "#794500", BR: "#69B143",
  RH: "#0099C7", KI: "#F57F25", MI: "#F57F25", GT: "#F7941D", BO: "#8B5A9C",
};

const isTrainStation = (s: Stop) => /^[A-Z]{2,3}$/.test(s.stop_id);

// ── Station Picker ─────────────────────────────────────────────────────────────

function StationPickerModal({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: Stop | null;
  onSelect: (s: Stop) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");

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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F6F4" }}>
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
        <FlatList
          data={stations}
          keyExtractor={(s) => s.stop_id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item: s }) => (
            <TouchableOpacity
              onPress={() => { onSelect(s); onClose(); setQ(""); }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: current?.stop_id === s.stop_id ? "#E8F5EE" : "#FFFFFF",
                borderRadius: 10,
                padding: 14,
                marginBottom: 6,
                gap: 10,
              }}
            >
              <Text style={{ flex: 1, color: "#1A2E1F", fontWeight: "600", fontSize: 15 }}>
                {s.stop_name}
              </Text>
              <Text style={{ color: "#9BB0A0", fontSize: 12 }}>{s.stop_id}</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ── Departure mini-card ────────────────────────────────────────────────────────

function MiniDep({ dep, highlight }: { dep: Departure; highlight: boolean }) {
  const color = ROUTE_COLORS[dep.route_short_name] ?? "#9BB0A0";
  const time  = formatTorontoTime(dep.realtime_departure ?? dep.scheduled_departure);

  return (
    <View
      style={{
        backgroundColor: highlight ? "#E8F5EE" : "#F8FAF8",
        borderRadius: 8,
        marginBottom: 6,
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <View style={{ width: 4, backgroundColor: color, alignSelf: "stretch" }} />
      <View style={{ flex: 1, padding: 10 }}>
        <Text style={{ color: "#5A7A63", fontSize: 10, fontWeight: "700" }}>
          {dep.route_short_name}
        </Text>
        <Text style={{ color: "#1A2E1F", fontSize: 20, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
          {time}
        </Text>
        <Text style={{ color: "#9BB0A0", fontSize: 11 }} numberOfLines={1}>
          {dep.headsign}
        </Text>
      </View>
      {highlight && (
        <View style={{ backgroundColor: "#00853F", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>CATCH THIS</Text>
        </View>
      )}
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function CompareScreen() {
  const [stationA, setStationA] = useState<Stop | null>(null);
  const [stationB, setStationB] = useState<Stop | null>(null);
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);

  const ready = !!stationA && !!stationB && stationA.stop_id !== stationB.stop_id;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["compare", stationA?.stop_id, stationB?.stop_id],
    queryFn: () => api.compare([stationA!.stop_id, stationB!.stop_id], 4),
    enabled: ready,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F6F4" }}>
      {/* Header */}
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Compare</Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>Next departures from two stations</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Station selectors */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {[
            { label: "STATION A", station: stationA, setShow: setShowA },
            { label: "STATION B", station: stationB, setShow: setShowB },
          ].map(({ label, station, setShow }) => (
            <View key={label} style={{ flex: 1 }}>
              <Text style={{ color: "#5A7A63", fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6 }}>
                {label}
              </Text>
              <TouchableOpacity
                onPress={() => setShow(true)}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: station ? "#00853F" : "#D8E8DC",
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{ flex: 1, color: station ? "#1A2E1F" : "#9BB0A0", fontSize: 13, fontWeight: station ? "600" : "400" }}
                  numberOfLines={2}
                >
                  {station?.stop_name ?? "Pick station"}
                </Text>
                <ChevronDown color="#9BB0A0" size={16} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Prompt */}
        {!ready && (
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 24, alignItems: "center", gap: 6 }}>
            <Text style={{ color: "#1A2E1F", fontWeight: "700", fontSize: 15 }}>Select two stations</Text>
            <Text style={{ color: "#5A7A63", fontSize: 13, textAlign: "center" }}>
              Compare next departures side by side to decide which station to drive to.
            </Text>
          </View>
        )}

        {/* Loading */}
        {ready && isLoading && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color="#00853F" />
          </View>
        )}

        {/* Error */}
        {ready && isError && (
          <View style={{ backgroundColor: "#FDECEA", borderWidth: 1, borderColor: "#C41230", borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Text style={{ color: "#C41230", fontWeight: "600" }}>Could not load departures</Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 8 }}>
              <Text style={{ color: "#00853F", fontWeight: "600" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Side-by-side departures */}
        {data && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            {data.stations.map((st) => (
              <View key={st.stop_id} style={{ flex: 1 }}>
                <Text style={{ color: "#1A2E1F", fontWeight: "700", fontSize: 14, marginBottom: 2 }} numberOfLines={1}>
                  {st.stop_name}
                </Text>
                {st.departures.length === 0 ? (
                  <View style={{ backgroundColor: "#FFFFFF", borderRadius: 8, padding: 12, alignItems: "center" }}>
                    <Text style={{ color: "#9BB0A0", fontSize: 12 }}>No departures</Text>
                  </View>
                ) : (
                  st.departures.map((dep) => (
                    <MiniDep
                      key={dep.trip_id}
                      dep={dep}
                      highlight={dep.trip_id === st.next_viable?.trip_id}
                    />
                  ))
                )}
              </View>
            ))}
          </View>
        )}

        {data && (
          <Text style={{ color: "#9BB0A0", fontSize: 11, textAlign: "center", marginTop: 16, lineHeight: 17 }}>
            "Catch This" highlights the next train you can board right now.{"\n"}
            Refreshes every 30 seconds.
          </Text>
        )}
      </ScrollView>

      <StationPickerModal visible={showA} current={stationA} onSelect={setStationA} onClose={() => setShowA(false)} />
      <StationPickerModal visible={showB} current={stationB} onSelect={setStationB} onClose={() => setShowB(false)} />
    </SafeAreaView>
  );
}
