import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Bookmark, Home, MapPin, RefreshCw } from "lucide-react-native";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { router } from "expo-router";

import { api, type Stop, formatTorontoTime } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/hooks/useTheme";

const ROUTE_COLORS: Record<string, string> = {
  LW: "#98002E", LE: "#EE3124", ST: "#794500", BR: "#69B143",
  RH: "#0099C7", KI: "#F57F25", MI: "#F57F25", GT: "#F7941D", BO: "#8B5A9C",
};

const isTrainStation = (s: Stop) => /^[A-Z]{2,3}$/.test(s.stop_id);

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

type LocState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "denied" }
  | { status: "error" }
  | { status: "ok"; lat: number; lon: number; accuracy: number | null };

export default function NearestStationScreen() {
  const t = useTheme();
  const { homeStation, savedStations, setHomeStation, addSavedStation } = useAppStore();
  const [loc, setLoc] = useState<LocState>({ status: "idle" });

  const { data: stops } = useQuery({
    queryKey: ["stops"],
    queryFn: () => api.stops(),
    staleTime: 10 * 60_000,
  });

  const nearest: (Stop & { distanceKm: number })[] =
    loc.status === "ok" && (stops?.length ?? 0) > 0
      ? (stops ?? [])
          .filter(isTrainStation)
          .map((s) => ({ ...s, distanceKm: haversineKm(loc.lat, loc.lon, s.stop_lat, s.stop_lon) }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 5)
      : [];

  const depQueries = useQueries({
    queries: nearest.map((s) => ({
      queryKey: ["departures", s.stop_id, 1],
      queryFn: () => api.departures(s.stop_id, 1),
      staleTime: 30_000,
      refetchInterval: 30_000,
    })),
  });

  async function fetchLocation() {
    setLoc({ status: "loading" });
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { setLoc({ status: "denied" }); return; }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLoc({ status: "ok", lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
    } catch {
      setLoc({ status: "error" });
    }
  }

  useEffect(() => { fetchLocation(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Nearest Stations</Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>GO train stations closest to you right now</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loc.status === "loading" && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: t.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <ActivityIndicator color={t.primary} />
            <Text style={{ color: t.textSecondary, fontSize: 14 }}>Getting your location…</Text>
          </View>
        )}

        {loc.status === "denied" && (
          <View style={{ backgroundColor: t.warningBg, borderRadius: 12, borderWidth: 1, borderColor: t.warning, padding: 16, marginBottom: 16, gap: 6 }}>
            <Text style={{ color: t.warning, fontWeight: "700", fontSize: 14 }}>Location access denied</Text>
            <Text style={{ color: t.textPrimary, fontSize: 13, lineHeight: 19 }}>
              Allow location in your device settings so GO Tracker can find nearby stations.
            </Text>
          </View>
        )}

        {loc.status === "error" && (
          <View style={{ backgroundColor: t.dangerBg, borderRadius: 12, borderWidth: 1, borderColor: t.danger, padding: 16, marginBottom: 16, gap: 6 }}>
            <Text style={{ color: t.danger, fontWeight: "700", fontSize: 14 }}>Couldn't get location</Text>
            <TouchableOpacity onPress={fetchLocation}>
              <Text style={{ color: t.primary, fontWeight: "600", fontSize: 13 }}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loc.status === "ok" && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <MapPin size={13} color={t.primary} />
              <Text style={{ color: t.textSecondary, fontSize: 12 }}>
                {loc.accuracy != null ? `±${Math.round(loc.accuracy)} m accuracy` : "Location found"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={fetchLocation}
              style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: t.surface, borderRadius: 8, borderWidth: 1.5, borderColor: t.border, paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <RefreshCw size={12} color={t.textSecondary} />
              <Text style={{ color: t.textSecondary, fontSize: 12, fontWeight: "600" }}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {nearest.map((station, idx) => {
          const dep = depQueries[idx]?.data?.departures?.[0] ?? null;
          const depLoading = depQueries[idx]?.isLoading ?? false;
          const routeColor = dep ? (ROUTE_COLORS[dep.route_short_name] ?? t.textMuted) : t.border;
          const isHome = homeStation?.stop_id === station.stop_id;
          const isSaved = savedStations.some((s) => s.stop_id === station.stop_id);

          return (
            <View key={station.stop_id} style={{
              backgroundColor: t.surface, borderRadius: 12, marginBottom: 10, overflow: "hidden",
              shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2,
            }}>
              {/* Rank + name row */}
              <View style={{ flexDirection: "row", alignItems: "center", padding: 14, paddingBottom: 10, gap: 12 }}>
                <View style={{ alignItems: "center", minWidth: 46 }}>
                  <Text style={{ color: t.primary, fontSize: 20, fontWeight: "800" }}>{idx + 1}</Text>
                  <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: "600" }}>{formatDistance(station.distanceKm)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: "800" }}>{station.stop_name}</Text>
                    {isHome && (
                      <View style={{ backgroundColor: t.primaryBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: t.primary, fontSize: 10, fontWeight: "700" }}>HOME</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 1 }}>{station.stop_id}</Text>
                </View>
              </View>

              {/* Next departure row */}
              <View style={{ marginHorizontal: 14, marginBottom: 12, backgroundColor: t.surfaceAlt, borderRadius: 8, overflow: "hidden", flexDirection: "row", alignItems: "center", minHeight: 54 }}>
                <View style={{ width: 4, alignSelf: "stretch", backgroundColor: routeColor }} />
                <View style={{ flex: 1, padding: 10 }}>
                  {depLoading ? (
                    <ActivityIndicator size="small" color={t.textMuted} />
                  ) : dep ? (
                    <>
                      <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: "700" }}>NEXT DEPARTURE</Text>
                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 1 }}>
                        <Text style={{ color: t.textPrimary, fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                          {formatTorontoTime(dep.realtime_departure ?? dep.scheduled_departure)}
                        </Text>
                        <Text style={{ color: routeColor, fontSize: 12, fontWeight: "700" }}>{dep.route_short_name}</Text>
                      </View>
                      <Text style={{ color: t.textMuted, fontSize: 11 }} numberOfLines={1}>{dep.headsign}</Text>
                    </>
                  ) : (
                    <Text style={{ color: t.textMuted, fontSize: 13 }}>No upcoming departures</Text>
                  )}
                </View>
              </View>

              {/* Action buttons */}
              <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => { setHomeStation({ stop_id: station.stop_id, stop_name: station.stop_name }); router.push("/"); }}
                  style={{
                    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                    backgroundColor: isHome ? t.primaryBg : t.primary,
                    borderRadius: 8, paddingVertical: 9,
                  }}
                >
                  <Home size={14} color={isHome ? t.primary : "#FFFFFF"} />
                  <Text style={{ color: isHome ? t.primary : "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                    {isHome ? "Home Station" : "Set as Home"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => addSavedStation({ stop_id: station.stop_id, stop_name: station.stop_name })}
                  disabled={isSaved || savedStations.length >= 5}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
                    backgroundColor: isSaved ? t.primaryBg : t.surface,
                    borderRadius: 8, borderWidth: 1.5,
                    borderColor: isSaved ? t.primary : t.border,
                    paddingHorizontal: 14, paddingVertical: 9,
                    opacity: !isSaved && savedStations.length >= 5 ? 0.4 : 1,
                  }}
                >
                  <Bookmark size={14} color={isSaved ? t.primary : t.textMuted} fill={isSaved ? t.primary : "none"} />
                  <Text style={{ color: isSaved ? t.primary : t.textMuted, fontSize: 13, fontWeight: "700" }}>
                    {isSaved ? "Saved" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
