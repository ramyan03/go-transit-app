import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GitCompare, MapPin, Route, Train, ChevronRight, Sun, Moon, Smartphone, X, ArrowRight } from "lucide-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTheme } from "@/hooks/useTheme";
import { useAppStore } from "@/store/useAppStore";
import { api, type Journey, type DirectJourney, type TransferJourney } from "@/lib/api";
import { POPULAR_DESTINATIONS, type PopularDestination } from "@/lib/popularDestinations";

// ── Popular destinations ──────────────────────────────────────────────────────

const ROUTE_COLORS: Record<string, string> = {
  LW: "#98002E", LE: "#EE3124", ST: "#794500", BR: "#69B143",
  RH: "#0099C7", KI: "#F57F25", MI: "#F57F25", GT: "#F7941D", BO: "#8B5A9C",
};

function getTodayStr(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/Toronto" })
    .replace(/-/g, "");
}

function getNowTimeStr(): string {
  return new Date().toLocaleTimeString("en-CA", {
    timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function JourneyResultCard({ journey }: { journey: Journey }) {
  const t = useTheme();
  if (journey.type === "direct") {
    const j = journey as DirectJourney;
    const color = ROUTE_COLORS[j.route_short_name] ?? "#9BB0A0";
    return (
      <View style={{
        backgroundColor: t.surface, borderRadius: 10, marginBottom: 8, overflow: "hidden",
        borderLeftWidth: 4, borderLeftColor: color,
      }}>
        <View style={{ padding: 12 }}>
          <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700" }}>
            {j.route_short_name} · {j.route_long_name.toUpperCase()}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 6, gap: 8 }}>
            <Text style={{ color: t.textPrimary, fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
              {j.depart_time}
            </Text>
            <ArrowRight color={t.textMuted} size={13} />
            <Text style={{ color: t.textMuted, fontSize: 13 }}>{j.arrive_time}</Text>
            <Text style={{ color: t.textMuted, fontSize: 12, marginLeft: "auto" }}>{j.duration_minutes} min</Text>
          </View>
        </View>
      </View>
    );
  }
  const j = journey as TransferJourney;
  const color1 = ROUTE_COLORS[j.legs[0].route_short_name] ?? "#9BB0A0";
  return (
    <View style={{
      backgroundColor: t.surface, borderRadius: 10, marginBottom: 8, overflow: "hidden",
      borderLeftWidth: 4, borderLeftColor: color1,
    }}>
      <View style={{ padding: 12 }}>
        <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700" }}>
          {j.legs[0].route_short_name} → {j.legs[1].route_short_name} (transfer)
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 6, gap: 8 }}>
          <Text style={{ color: t.textPrimary, fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
            {j.depart_time}
          </Text>
          <ArrowRight color={t.textMuted} size={13} />
          <Text style={{ color: t.textMuted, fontSize: 13 }}>{j.arrive_time}</Text>
          <Text style={{ color: t.textMuted, fontSize: 12, marginLeft: "auto" }}>{j.total_duration_minutes} min</Text>
        </View>
        <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>Change at {j.transfer_stop_name}</Text>
      </View>
    </View>
  );
}

function DestinationModal({
  dest, homeStopId, visible, onClose,
}: {
  dest: PopularDestination | null; homeStopId: string | null; visible: boolean; onClose: () => void;
}) {
  const t = useTheme();
  const today = getTodayStr();
  const nowTime = getNowTimeStr();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dest-journey", homeStopId, dest?.goStopId, today, nowTime],
    queryFn: () => api.schedule.journey(homeStopId!, dest!.goStopId, today, nowTime, 5),
    enabled: visible && !!dest && !!homeStopId && homeStopId !== dest?.goStopId,
    staleTime: 2 * 60_000,
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700" }}>
                {dest?.emoji} {dest?.name}
              </Text>
              <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>
                Nearest GO: {dest?.goStopName}{dest?.note ? `  ·  ${dest.note}` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color="#FFFFFF" size={22} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {!homeStopId && (
            <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 20, alignItems: "center" }}>
              <Text style={{ color: t.textSecondary, fontSize: 14 }}>
                Set your home station on the Home tab to see journey times.
              </Text>
            </View>
          )}
          {homeStopId && isLoading && (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={t.primary} />
            </View>
          )}
          {homeStopId && isError && (
            <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 20, alignItems: "center" }}>
              <Text style={{ color: t.textSecondary, fontSize: 14 }}>Could not load trains.</Text>
            </View>
          )}
          {homeStopId && homeStopId === dest?.goStopId && (
            <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 20, alignItems: "center" }}>
              <Text style={{ color: t.textSecondary, fontSize: 14 }}>{dest?.goStopName} is your home station.</Text>
            </View>
          )}
          {data && data.journeys.length === 0 && (
            <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 20, alignItems: "center" }}>
              <Text style={{ color: t.textSecondary, fontSize: 14 }}>No trains found today.</Text>
            </View>
          )}
          {data && data.journeys.length > 0 && (
            <>
              <Text style={{ color: t.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
                Next trains from {data.from_stop_name} → {data.to_stop_name}
              </Text>
              {data.journeys.map((j) => (
                <JourneyResultCard
                  key={j.type === "direct" ? j.trip_id : `${j.legs[0].trip_id}+${j.legs[1].trip_id}`}
                  journey={j}
                />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── More screen items ─────────────────────────────────────────────────────────

interface MoreItem {
  icon: (color: string) => React.ReactNode;
  title: string;
  description: string;
  route: string;
}

const ITEMS: MoreItem[] = [
  {
    icon: (c) => <MapPin color={c} size={22} />,
    title: "Nearest Stations",
    description: "Find GO train stations closest to you",
    route: "/(tabs)/nearest",
  },
  {
    icon: (c) => <Route color={c} size={22} />,
    title: "Routes",
    description: "All GO Train and bus routes",
    route: "/(tabs)/routes",
  },
  {
    icon: (c) => <GitCompare color={c} size={22} />,
    title: "Compare Stations",
    description: "Side-by-side next departures from two stops",
    route: "/(tabs)/compare",
  },
  {
    icon: (c) => <Train color={c} size={22} />,
    title: "Fleet",
    description: "GO Transit locomotive and coach specs",
    route: "/(tabs)/fleet",
  },
];

type ThemePref = "light" | "dark" | "system";

const THEME_OPTIONS: { key: ThemePref; label: string; icon: (c: string) => React.ReactNode }[] = [
  { key: "light",  label: "Light",  icon: (c) => <Sun color={c} size={16} /> },
  { key: "dark",   label: "Dark",   icon: (c) => <Moon color={c} size={16} /> },
  { key: "system", label: "System", icon: (c) => <Smartphone color={c} size={16} /> },
];

export default function MoreScreen() {
  const t = useTheme();
  const { theme, setTheme, homeStation } = useAppStore();
  const [selectedDest, setSelectedDest] = useState<PopularDestination | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#A8D5B8", fontSize: 11, fontWeight: "600", letterSpacing: 0.8 }}>
          GO TRACKER
        </Text>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginTop: 4 }}>More</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Popular destinations */}
        <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 10 }}>
          POPULAR DESTINATIONS
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          style={{ marginBottom: 24 }}
        >
          {POPULAR_DESTINATIONS.map((dest) => (
            <TouchableOpacity
              key={dest.id}
              onPress={() => setSelectedDest(dest)}
              style={{
                backgroundColor: t.surface,
                borderRadius: 10, borderWidth: 1.5, borderColor: t.border,
                paddingHorizontal: 14, paddingVertical: 10,
                flexDirection: "row", alignItems: "center", gap: 6,
              }}
            >
              <Text style={{ fontSize: 16 }}>{dest.emoji}</Text>
              <View>
                <Text style={{ color: t.textPrimary, fontWeight: "700", fontSize: 12 }}>{dest.name}</Text>
                <Text style={{ color: t.textMuted, fontSize: 10, marginTop: 1 }}>{dest.goStopName}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <DestinationModal
          dest={selectedDest}
          homeStopId={homeStation?.stop_id ?? null}
          visible={!!selectedDest}
          onClose={() => setSelectedDest(null)}
        />

        {/* Navigation items */}
        <View style={{
          backgroundColor: t.surface, borderRadius: 14, overflow: "hidden",
          shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
        }}>
          {ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 16,
                borderBottomWidth: index < ITEMS.length - 1 ? 1 : 0,
                borderBottomColor: t.border,
                gap: 14,
              }}
            >
              <View style={{
                width: 42, height: 42, borderRadius: 11,
                backgroundColor: t.primaryBg, alignItems: "center", justifyContent: "center",
              }}>
                {item.icon(t.primary)}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: "700" }}>{item.title}</Text>
                <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: 1 }}>{item.description}</Text>
              </View>
              <ChevronRight color={t.textMuted} size={18} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme toggle */}
        <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginTop: 28, marginBottom: 10 }}>
          APPEARANCE
        </Text>
        <View style={{
          backgroundColor: t.surface, borderRadius: 14,
          shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
          padding: 4, flexDirection: "row", gap: 4,
        }}>
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setTheme(opt.key)}
                style={{
                  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                  gap: 6, paddingVertical: 10, borderRadius: 10,
                  backgroundColor: active ? t.primary : "transparent",
                }}
              >
                {opt.icon(active ? "#FFFFFF" : t.textSecondary)}
                <Text style={{ color: active ? "#FFFFFF" : t.textSecondary, fontWeight: "700", fontSize: 13 }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ color: t.textMuted, fontSize: 11, textAlign: "center", marginTop: 32, lineHeight: 17 }}>
          GO Tracker is unofficial and not affiliated with Metrolinx or GO Transit.{"\n"}
          Data provided by Metrolinx under the Metrolinx Open Data License.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
