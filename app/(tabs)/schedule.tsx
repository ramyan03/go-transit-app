import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ArrowRight, Search, X } from "lucide-react-native";
import { useState } from "react";

import { api, type Stop, type ScheduledDeparture } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROUTE_COLORS: Record<string, string> = {
  LW: "#98002E", LE: "#EE3124", ST: "#794500", BR: "#69B143",
  RH: "#0099C7", KI: "#F57F25", MI: "#F57F25", GT: "#F7941D", BO: "#8B5A9C",
};

function getDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Toronto" }).replace(/-/g, "");
}

function getDateLabel(offsetDays: number): string {
  if (offsetDays === 0) return "Today";
  if (offsetDays === 1) return "Tomorrow";
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const isTrainStation = (s: Stop) => /^[A-Z]{2,3}$/.test(s.stop_id);

// ── StationPicker modal ────────────────────────────────────────────────────────

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
              <Text style={{ color: "#1A2E1F", fontWeight: "600", fontSize: 15, flex: 1 }}>
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

// ── DateTabs ──────────────────────────────────────────────────────────────────

function DateTabs({ selected, onChange }: { selected: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
      {[0, 1, 2].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: selected === n ? "#00853F" : "#FFFFFF",
            borderWidth: 1.5,
            borderColor: selected === n ? "#00853F" : "#D8E8DC",
          }}
        >
          <Text style={{ color: selected === n ? "#FFFFFF" : "#5A7A63", fontWeight: "700", fontSize: 13 }}>
            {getDateLabel(n)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── DepartureRow (expandable) ─────────────────────────────────────────────────

function DepartureRow({ dep }: { dep: ScheduledDeparture }) {
  const [expanded, setExpanded] = useState(false);
  const color = ROUTE_COLORS[dep.route_short_name] ?? "#9BB0A0";

  const depTime = dep.scheduled_departure
    ? new Date(dep.scheduled_departure).toLocaleTimeString("en-CA", {
        timeZone: "America/Toronto",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

  return (
    <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 8, overflow: "hidden", shadowColor: "#1A2E1F", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }}>
      <TouchableOpacity
        onPress={() => setExpanded((e) => !e)}
        style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}
      >
        <View style={{ width: 5, height: "100%", position: "absolute", left: 0, top: 0, backgroundColor: color }} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: "#5A7A63", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
            {dep.route_short_name} · {dep.route_long_name.toUpperCase()}
          </Text>
          <Text style={{ color: "#1A2E1F", fontSize: 14, fontWeight: "500", marginTop: 2 }} numberOfLines={1}>
            {dep.headsign}
          </Text>
        </View>
        <Text style={{ color: "#1A2E1F", fontSize: 26, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
          {depTime}
        </Text>
        {expanded ? <ChevronUp color="#9BB0A0" size={18} /> : <ChevronDown color="#9BB0A0" size={18} />}
      </TouchableOpacity>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: "#E8F5EE", paddingHorizontal: 14, paddingBottom: 12 }}>
          {dep.stop_times.map((st) => (
            <View key={st.stop_sequence} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 12 }}>
              <View style={{ width: 2, height: "100%", backgroundColor: color, position: "absolute", left: 3, top: 0 }} />
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginLeft: 0 }} />
              <Text style={{ flex: 1, color: "#1A2E1F", fontSize: 13 }}>{st.stop_name}</Text>
              <Text style={{ color: "#5A7A63", fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "600" }}>
                {st.departure_time}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

type Mode = "departures" | "journey";

export default function ScheduleScreen() {
  const { homeStation } = useAppStore();
  const [mode, setMode] = useState<Mode>("departures");
  const [dateOffset, setDateOffset] = useState(0);

  // Journey planner state
  const [fromStop, setFromStop] = useState<Stop | null>(null);
  const [toStop,   setToStop]   = useState<Stop | null>(null);
  const [time, setTime]         = useState("07:00");
  const [showFrom, setShowFrom] = useState(false);
  const [showTo,   setShowTo]   = useState(false);
  const [searched, setSearched] = useState(false);

  const dateStr = getDateStr(dateOffset);

  // Station schedule query
  const stationQuery = useQuery({
    queryKey: ["schedule-station", homeStation?.stop_id, dateStr],
    queryFn: () => api.schedule.station(homeStation!.stop_id, dateStr, 20),
    enabled: mode === "departures" && !!homeStation,
    staleTime: 5 * 60_000,
  });

  // Journey query
  const journeyQuery = useQuery({
    queryKey: ["schedule-journey", fromStop?.stop_id, toStop?.stop_id, dateStr, time],
    queryFn: () => api.schedule.journey(fromStop!.stop_id, toStop!.stop_id, dateStr, time),
    enabled: mode === "journey" && !!fromStop && !!toStop && searched,
    staleTime: 5 * 60_000,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F6F4" }}>
      {/* Header */}
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Schedule</Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>
          {mode === "departures" ? "From your home station" : "Find a train between stations"}
        </Text>

        {/* Mode toggle */}
        <View style={{ flexDirection: "row", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 10, padding: 3, marginTop: 14 }}>
          {(["departures", "journey"] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => { setMode(m); setSearched(false); }}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: mode === m ? "#FFFFFF" : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ color: mode === m ? "#00853F" : "#A8D5B8", fontWeight: "700", fontSize: 13 }}>
                {m === "departures" ? "My Station" : "Journey Planner"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <DateTabs selected={dateOffset} onChange={(n) => { setDateOffset(n); setSearched(false); }} />

        {/* ── Departures mode ── */}
        {mode === "departures" && (
          <>
            {!homeStation && (
              <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 24, alignItems: "center" }}>
                <Text style={{ color: "#5A7A63", fontSize: 14 }}>Set your home station on the Home tab first.</Text>
              </View>
            )}

            {homeStation && stationQuery.isLoading && (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator color="#00853F" />
              </View>
            )}

            {homeStation && stationQuery.isError && (
              <View style={{ backgroundColor: "#FDECEA", borderWidth: 1, borderColor: "#C41230", borderRadius: 12, padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#C41230", fontSize: 14, fontWeight: "600" }}>Could not load schedule</Text>
                <TouchableOpacity onPress={() => stationQuery.refetch()} style={{ marginTop: 8 }}>
                  <Text style={{ color: "#00853F", fontWeight: "600" }}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {homeStation && stationQuery.data && (
              <>
                <Text style={{ color: "#5A7A63", fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
                  {stationQuery.data.stop_name} — {stationQuery.data.departures.length} departures
                </Text>
                {stationQuery.data.departures.map((dep) => (
                  <DepartureRow key={dep.trip_id} dep={dep} />
                ))}
                {stationQuery.data.departures.length === 0 && (
                  <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20, alignItems: "center" }}>
                    <Text style={{ color: "#5A7A63", fontSize: 14 }}>No departures found for this date.</Text>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* ── Journey mode ── */}
        {mode === "journey" && (
          <>
            {/* From */}
            <Text style={{ color: "#5A7A63", fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6 }}>FROM</Text>
            <TouchableOpacity
              onPress={() => setShowFrom(true)}
              style={{ backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1.5, borderColor: fromStop ? "#00853F" : "#D8E8DC", padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text style={{ flex: 1, color: fromStop ? "#1A2E1F" : "#9BB0A0", fontSize: 15, fontWeight: fromStop ? "600" : "400" }}>
                {fromStop?.stop_name ?? "Select departure station"}
              </Text>
              <ChevronDown color="#9BB0A0" size={18} />
            </TouchableOpacity>

            {/* Arrow */}
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <ArrowRight color="#9BB0A0" size={20} />
            </View>

            {/* To */}
            <Text style={{ color: "#5A7A63", fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6 }}>TO</Text>
            <TouchableOpacity
              onPress={() => setShowTo(true)}
              style={{ backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1.5, borderColor: toStop ? "#00853F" : "#D8E8DC", padding: 14, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text style={{ flex: 1, color: toStop ? "#1A2E1F" : "#9BB0A0", fontSize: 15, fontWeight: toStop ? "600" : "400" }}>
                {toStop?.stop_name ?? "Select arrival station"}
              </Text>
              <ChevronDown color="#9BB0A0" size={18} />
            </TouchableOpacity>

            {/* Depart at */}
            <Text style={{ color: "#5A7A63", fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6 }}>DEPART AFTER</Text>
            <View style={{ backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1.5, borderColor: "#D8E8DC", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 }}>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="07:00"
                placeholderTextColor="#9BB0A0"
                keyboardType="numbers-and-punctuation"
                style={{ color: "#1A2E1F", fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] }}
              />
            </View>

            {/* Search button */}
            <TouchableOpacity
              onPress={() => { if (fromStop && toStop) setSearched(true); }}
              style={{
                backgroundColor: fromStop && toStop ? "#00853F" : "#D8E8DC",
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Find Trains</Text>
            </TouchableOpacity>

            {/* Results */}
            {journeyQuery.isLoading && (
              <View style={{ paddingVertical: 30, alignItems: "center" }}>
                <ActivityIndicator color="#00853F" />
              </View>
            )}

            {journeyQuery.data && (
              <>
                <Text style={{ color: "#5A7A63", fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
                  {journeyQuery.data.from_stop_name} → {journeyQuery.data.to_stop_name}
                </Text>
                {journeyQuery.data.journeys.map((j) => {
                  const color = ROUTE_COLORS[j.route_short_name] ?? "#9BB0A0";
                  return (
                    <View
                      key={j.trip_id}
                      style={{ backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 8, overflow: "hidden", shadowColor: "#1A2E1F", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }}
                    >
                      <View style={{ width: 5, backgroundColor: color, position: "absolute", left: 0, top: 0, bottom: 0 }} />
                      <View style={{ padding: 14, marginLeft: 10 }}>
                        <Text style={{ color: "#5A7A63", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
                          {j.route_short_name} · {j.route_long_name.toUpperCase()}
                        </Text>
                        <Text style={{ color: "#1A2E1F", fontSize: 13, marginTop: 1 }}>{j.headsign}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 }}>
                          <Text style={{ color: "#1A2E1F", fontSize: 26, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                            {j.depart_time}
                          </Text>
                          <ArrowRight color="#9BB0A0" size={16} />
                          <Text style={{ color: "#1A2E1F", fontSize: 26, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                            {j.arrive_time}
                          </Text>
                          <Text style={{ color: "#9BB0A0", fontSize: 13, marginLeft: 4 }}>
                            {j.duration_minutes} min
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
                {journeyQuery.data.journeys.length === 0 && (
                  <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20, alignItems: "center" }}>
                    <Text style={{ color: "#5A7A63", fontSize: 14 }}>No direct trains found.</Text>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Pickers */}
      <StationPickerModal visible={showFrom} current={fromStop} onSelect={setFromStop} onClose={() => setShowFrom(false)} />
      <StationPickerModal visible={showTo}   current={toStop}   onSelect={setToStop}   onClose={() => setShowTo(false)} />
    </SafeAreaView>
  );
}
