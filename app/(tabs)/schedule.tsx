import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ArrowRight, Search, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";

import { api, type Stop, type ScheduledDeparture, type Journey } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/hooks/useTheme";

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
  visible, current, onSelect, onClose,
}: {
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
              <Text style={{ color: t.textPrimary, fontWeight: "600", fontSize: 15, flex: 1 }}>
                {s.stop_name}
              </Text>
              <Text style={{ color: t.textMuted, fontSize: 12 }}>{s.stop_id}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── DateTabs ──────────────────────────────────────────────────────────────────

function DateTabs({ selected, onChange }: { selected: number; onChange: (n: number) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
      {[0, 1, 2].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          style={{
            paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
            backgroundColor: selected === n ? t.primary : t.surface,
            borderWidth: 1.5,
            borderColor: selected === n ? t.primary : t.border,
          }}
        >
          <Text style={{ color: selected === n ? "#FFFFFF" : t.textSecondary, fontWeight: "700", fontSize: 13 }}>
            {getDateLabel(n)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── DepartureRow (expandable) ─────────────────────────────────────────────────

function DepartureRow({ dep }: { dep: ScheduledDeparture }) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);
  const color = ROUTE_COLORS[dep.route_short_name] ?? "#9BB0A0";

  const depTime = dep.scheduled_departure
    ? new Date(dep.scheduled_departure).toLocaleTimeString("en-CA", {
        timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit", hour12: false,
      })
    : "—";

  return (
    <View style={{
      backgroundColor: t.surface, borderRadius: 12, marginBottom: 8, overflow: "hidden",
      shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
    }}>
      <TouchableOpacity
        onPress={() => setExpanded((e) => !e)}
        style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}
      >
        <View style={{ width: 5, height: "100%", position: "absolute", left: 0, top: 0, backgroundColor: color }} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
            {dep.route_short_name} · {dep.route_long_name.toUpperCase()}
          </Text>
          <Text style={{ color: t.textPrimary, fontSize: 14, fontWeight: "500", marginTop: 2 }} numberOfLines={1}>
            {dep.headsign}
          </Text>
        </View>
        <Text style={{ color: t.textPrimary, fontSize: 26, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
          {depTime}
        </Text>
        {expanded ? <ChevronUp color={t.textMuted} size={18} /> : <ChevronDown color={t.textMuted} size={18} />}
      </TouchableOpacity>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: t.border, paddingHorizontal: 14, paddingBottom: 12 }}>
          {dep.stop_times.map((st) => (
            <View key={st.stop_sequence} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 12 }}>
              <View style={{ width: 2, height: "100%", backgroundColor: color, position: "absolute", left: 3, top: 0 }} />
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
              <Text style={{ flex: 1, color: t.textPrimary, fontSize: 13 }}>{st.stop_name}</Text>
              <Text style={{ color: t.textSecondary, fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "600" }}>
                {st.departure_time}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Journey result card (tappable → departure-detail) ─────────────────────────

function JourneyCard({ journey, fromStopId }: { journey: Journey; fromStopId: string }) {
  const t = useTheme();
  const color = ROUTE_COLORS[journey.route_short_name] ?? "#9BB0A0";

  function handlePress() {
    router.push({
      pathname: "/departure-detail" as any,
      params: {
        trip_id:             journey.trip_id,
        stop_id:             fromStopId,
        route_short_name:    journey.route_short_name,
        route_long_name:     journey.route_long_name,
        headsign:            journey.headsign,
        scheduled_departure: journey.depart_iso,
        realtime_departure:  "",
        delay_seconds:       "",
        status:              "SCHEDULED",
        platform:            "",
        accessible:          "0",
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={{
        backgroundColor: t.surface, borderRadius: 12, marginBottom: 8, overflow: "hidden",
        shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
      }}
    >
      <View style={{ width: 5, backgroundColor: color, position: "absolute", left: 0, top: 0, bottom: 0 }} />
      <View style={{ padding: 14, marginLeft: 10 }}>
        <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
          {journey.route_short_name} · {journey.route_long_name.toUpperCase()}
        </Text>
        <Text style={{ color: t.textPrimary, fontSize: 13, marginTop: 1 }}>{journey.headsign}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 }}>
          <Text style={{ color: t.textPrimary, fontSize: 26, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
            {journey.depart_time}
          </Text>
          <ArrowRight color={t.textMuted} size={16} />
          <Text style={{ color: t.textPrimary, fontSize: 26, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
            {journey.arrive_time}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 13, marginLeft: 4 }}>
            {journey.duration_minutes} min
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

type Mode = "departures" | "journey";

export default function ScheduleScreen() {
  const t = useTheme();
  const { homeStation } = useAppStore();
  const [mode, setMode] = useState<Mode>("departures");
  const [dateOffset, setDateOffset] = useState(0);

  const [fromStop, setFromStop] = useState<Stop | null>(null);
  const [toStop,   setToStop]   = useState<Stop | null>(null);
  const [time, setTime]         = useState("07:00");
  const [showFrom, setShowFrom] = useState(false);
  const [showTo,   setShowTo]   = useState(false);
  const [searched, setSearched] = useState(false);

  const dateStr = getDateStr(dateOffset);

  const stationQuery = useQuery({
    queryKey: ["schedule-station", homeStation?.stop_id, dateStr],
    queryFn: () => api.schedule.station(homeStation!.stop_id, dateStr, 20),
    enabled: mode === "departures" && !!homeStation,
    staleTime: 5 * 60_000,
  });

  const journeyQuery = useQuery({
    queryKey: ["schedule-journey", fromStop?.stop_id, toStop?.stop_id, dateStr, time],
    queryFn: () => api.schedule.journey(fromStop!.stop_id, toStop!.stop_id, dateStr, time),
    enabled: mode === "journey" && !!fromStop && !!toStop && searched,
    staleTime: 5 * 60_000,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Schedule</Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>
          {mode === "departures" ? "From your home station" : "Find a train between stations"}
        </Text>

        <View style={{ flexDirection: "row", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 10, padding: 3, marginTop: 14 }}>
          {(["departures", "journey"] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => { setMode(m); setSearched(false); }}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 8,
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
              <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 24, alignItems: "center" }}>
                <Text style={{ color: t.textSecondary, fontSize: 14 }}>Set your home station on the Home tab first.</Text>
              </View>
            )}
            {homeStation && stationQuery.isLoading && (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator color={t.primary} />
              </View>
            )}
            {homeStation && stationQuery.isError && (
              <View style={{ backgroundColor: t.dangerBg, borderWidth: 1, borderColor: t.danger, borderRadius: 12, padding: 16, alignItems: "center" }}>
                <Text style={{ color: t.danger, fontSize: 14, fontWeight: "600" }}>Could not load schedule</Text>
                <TouchableOpacity onPress={() => stationQuery.refetch()} style={{ marginTop: 8 }}>
                  <Text style={{ color: t.primary, fontWeight: "600" }}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            {homeStation && stationQuery.data && (
              <>
                <Text style={{ color: t.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
                  {stationQuery.data.stop_name} — {stationQuery.data.departures.length} departures
                </Text>
                {stationQuery.data.departures.map((dep) => (
                  <DepartureRow key={dep.trip_id} dep={dep} />
                ))}
                {stationQuery.data.departures.length === 0 && (
                  <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 20, alignItems: "center" }}>
                    <Text style={{ color: t.textSecondary, fontSize: 14 }}>No departures found for this date.</Text>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* ── Journey mode ── */}
        {mode === "journey" && (
          <>
            <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6 }}>FROM</Text>
            <TouchableOpacity
              onPress={() => setShowFrom(true)}
              style={{
                backgroundColor: t.surface, borderRadius: 10, borderWidth: 1.5,
                borderColor: fromStop ? t.primary : t.border,
                padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 10,
              }}
            >
              <Text style={{ flex: 1, color: fromStop ? t.textPrimary : t.textMuted, fontSize: 15, fontWeight: fromStop ? "600" : "400" }}>
                {fromStop?.stop_name ?? "Select departure station"}
              </Text>
              <ChevronDown color={t.textMuted} size={18} />
            </TouchableOpacity>

            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <ArrowRight color={t.textMuted} size={20} />
            </View>

            <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6 }}>TO</Text>
            <TouchableOpacity
              onPress={() => setShowTo(true)}
              style={{
                backgroundColor: t.surface, borderRadius: 10, borderWidth: 1.5,
                borderColor: toStop ? t.primary : t.border,
                padding: 14, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 10,
              }}
            >
              <Text style={{ flex: 1, color: toStop ? t.textPrimary : t.textMuted, fontSize: 15, fontWeight: toStop ? "600" : "400" }}>
                {toStop?.stop_name ?? "Select arrival station"}
              </Text>
              <ChevronDown color={t.textMuted} size={18} />
            </TouchableOpacity>

            <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6 }}>DEPART AFTER</Text>
            <View style={{ backgroundColor: t.surface, borderRadius: 10, borderWidth: 1.5, borderColor: t.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 }}>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="07:00"
                placeholderTextColor={t.textMuted}
                keyboardType="numbers-and-punctuation"
                style={{ color: t.textPrimary, fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] }}
              />
            </View>

            <TouchableOpacity
              onPress={() => { if (fromStop && toStop) setSearched(true); }}
              style={{
                backgroundColor: fromStop && toStop ? t.primary : t.border,
                borderRadius: 10, paddingVertical: 14, alignItems: "center", marginBottom: 20,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Find Trains</Text>
            </TouchableOpacity>

            {journeyQuery.isLoading && (
              <View style={{ paddingVertical: 30, alignItems: "center" }}>
                <ActivityIndicator color={t.primary} />
              </View>
            )}

            {journeyQuery.data && (
              <>
                <Text style={{ color: t.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
                  {journeyQuery.data.from_stop_name} → {journeyQuery.data.to_stop_name} · tap a train for stop details
                </Text>
                {journeyQuery.data.journeys.map((j) => (
                  <JourneyCard key={j.trip_id} journey={j} fromStopId={fromStop!.stop_id} />
                ))}
                {journeyQuery.data.journeys.length === 0 && (
                  <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 20, alignItems: "center" }}>
                    <Text style={{ color: t.textSecondary, fontSize: 14 }}>No direct trains found.</Text>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <StationPickerModal visible={showFrom} current={fromStop} onSelect={setFromStop} onClose={() => setShowFrom(false)} />
      <StationPickerModal visible={showTo}   current={toStop}   onSelect={setToStop}   onClose={() => setShowTo(false)} />
    </SafeAreaView>
  );
}
