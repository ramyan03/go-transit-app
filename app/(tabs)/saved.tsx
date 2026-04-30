import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, MapPin, Plus, Trash2, Home } from "lucide-react-native";
import { router } from "expo-router";

import { api, type Departure } from "@/lib/api";
import { useAppStore, SavedStation } from "@/store/useAppStore";
import { formatTorontoTime } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";
import { useLayout } from "@/hooks/useLayout";

const ROUTE_COLORS: Record<string, string> = {
  LW: "#98002E", LE: "#EE3124", ST: "#794500", BR: "#69B143",
  RH: "#0099C7", KI: "#F57F25", MI: "#F57F25", GT: "#F7941D", BO: "#8B5A9C",
};

function pushToDepartureDetail(dep: Departure, stop_id: string) {
  router.push({
    pathname: "/departure-detail" as any,
    params: {
      trip_id:             dep.trip_id,
      stop_id,
      route_short_name:    dep.route_short_name,
      route_long_name:     dep.route_long_name,
      headsign:            dep.headsign,
      scheduled_departure: dep.scheduled_departure,
      realtime_departure:  dep.realtime_departure ?? "",
      delay_seconds:       String(dep.delay_seconds ?? ""),
      status:              dep.status,
      platform:            dep.platform ?? "",
      accessible:          dep.accessible ? "1" : "0",
    },
  });
}

function NextDeparture({ stop_id }: { stop_id: string }) {
  const t = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: ["departures", stop_id],
    queryFn: () => api.departures(stop_id, 1),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const next = data?.departures[0];

  if (isLoading) {
    return <ActivityIndicator color={t.primary} size="small" style={{ alignSelf: "flex-start", marginTop: 8 }} />;
  }

  if (!next) {
    return <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 6 }}>No departures</Text>;
  }

  const time = formatTorontoTime(next.realtime_departure ?? next.scheduled_departure);
  const color = ROUTE_COLORS[next.route_short_name] ?? t.textSecondary;
  const isDelayed = next.delay_seconds != null && next.delay_seconds > 60;

  return (
    <TouchableOpacity
      onPress={() => pushToDepartureDetail(next, stop_id)}
      activeOpacity={0.7}
      style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}
    >
      <View style={{ backgroundColor: color, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>{next.route_short_name}</Text>
      </View>
      <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
        {time}
      </Text>
      {isDelayed && (
        <Text style={{ color: t.warning, fontSize: 12, fontWeight: "600" }}>
          +{Math.round(next.delay_seconds! / 60)}m
        </Text>
      )}
      <Text style={{ color: t.textMuted, fontSize: 12 }} numberOfLines={1}>
        {next.headsign}
      </Text>
    </TouchableOpacity>
  );
}

function StationCard({ station }: { station: SavedStation }) {
  const t = useTheme();
  const { homeStation, setHomeStation, removeSavedStation } = useAppStore();
  const isHome = homeStation?.stop_id === station.stop_id;

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: isHome ? 1.5 : 0,
        borderColor: isHome ? t.primary : "transparent",
        shadowColor: t.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <MapPin color={isHome ? t.primary : t.textMuted} size={14} />
            <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: "700" }}>
              {station.stop_name}
            </Text>
            {isHome && (
              <View style={{ backgroundColor: t.primaryBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                <Text style={{ color: t.primary, fontSize: 10, fontWeight: "700" }}>HOME</Text>
              </View>
            )}
          </View>
          <NextDeparture stop_id={station.stop_id} />
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginLeft: 12 }}>
          {!isHome && (
            <TouchableOpacity
              onPress={() => { setHomeStation(station); router.push("/"); }}
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: t.primaryBg, alignItems: "center", justifyContent: "center",
              }}
            >
              <Home color={t.primary} size={16} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => removeSavedStation(station.stop_id)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: t.dangerBg, alignItems: "center", justifyContent: "center",
            }}
          >
            <Trash2 color={t.danger} size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function SavedScreen() {
  const { hPad } = useLayout();
  const t = useTheme();
  const { savedStations } = useAppStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#A8D5B8", fontSize: 11, fontWeight: "600", letterSpacing: 0.8 }}>
          YOUR STATIONS
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Saved</Text>
          {savedStations.length < 5 && (
            <TouchableOpacity
              onPress={() => router.push("/station-search?mode=saved")}
              style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
              }}
            >
              <Plus color="#FFFFFF" size={15} />
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
        {savedStations.length > 0 && (
          <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 4 }}>
            {savedStations.length}/5 stations · next departures update every 30s
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: hPad, paddingVertical: 16 }}>
        {savedStations.length === 0 && (
          <View style={{
            backgroundColor: t.surface, borderRadius: 14, padding: 32,
            alignItems: "center", gap: 12,
            shadowColor: t.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06, shadowRadius: 6, elevation: 1,
          }}>
            <View style={{
              width: 60, height: 60, borderRadius: 30,
              backgroundColor: t.primaryBg, alignItems: "center", justifyContent: "center",
            }}>
              <Bookmark color={t.primary} size={28} />
            </View>
            <Text style={{ color: t.textPrimary, fontSize: 17, fontWeight: "700", marginTop: 4 }}>
              No saved stations
            </Text>
            <Text style={{ color: t.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 19 }}>
              Save up to 5 stations to quickly check next departures without changing your home station.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/station-search?mode=saved")}
              style={{ marginTop: 8, backgroundColor: t.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>Add a station</Text>
            </TouchableOpacity>
          </View>
        )}

        {savedStations.map((station) => (
          <StationCard key={station.stop_id} station={station} />
        ))}

        {savedStations.length === 5 && (
          <Text style={{ color: t.textMuted, fontSize: 12, textAlign: "center", marginTop: 4 }}>
            Maximum 5 stations reached
          </Text>
        )}

        <Text style={{ color: t.textMuted, fontSize: 11, textAlign: "center", marginTop: 24, lineHeight: 17 }}>
          Tap a departure to see full details and stop times.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
