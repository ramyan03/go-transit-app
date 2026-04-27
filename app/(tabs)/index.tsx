import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { MapPin, RefreshCw } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { DepartureCard } from "@/components/ui/DepartureCard";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";

export default function HomeScreen() {
  const t = useTheme();
  const { homeStation, hydrate } = useAppStore();
  const [dirFilter, setDirFilter] = useState<number | null>(null);

  useEffect(() => {
    hydrate();
  }, []);

  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } =
    useQuery({
      queryKey: ["departures", homeStation?.stop_id],
      queryFn: () => api.departures(homeStation!.stop_id, 8),
      enabled: !!homeStation,
      refetchInterval: 30_000,
    });

  const { data: alertsData } = useQuery({
    queryKey: ["alerts"],
    queryFn: api.alerts,
    refetchInterval: 60_000,
  });

  const relevantAlerts = alertsData?.alerts.filter((a) =>
    a.affected_routes.some((r) =>
      data?.departures.some((d) => d.route_short_name === r || d.route_id === r)
    )
  );

  // Build direction labels from actual data headsigns
  const directionLabels = useMemo(() => {
    const map = new Map<number, string>();
    data?.departures.forEach((d) => {
      if (d.direction_id !== null && !map.has(d.direction_id)) {
        const label = d.headsign.length > 16 ? d.headsign.slice(0, 16) + "…" : d.headsign;
        map.set(d.direction_id, label);
      }
    });
    return map;
  }, [data]);

  const hasMultipleDirections = directionLabels.size > 1;

  const filteredDepartures = useMemo(() => {
    if (dirFilter === null || !hasMultipleDirections) return data?.departures ?? [];
    return (data?.departures ?? []).filter((d) => d.direction_id === dirFilter);
  }, [data, dirFilter, hasMultipleDirections]);

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Green header */}
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#A8D5B8", fontSize: 11, fontWeight: "600", letterSpacing: 0.8 }}>
          DEPARTURES FROM
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <TouchableOpacity
            onPress={() => router.push("/station-search")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}
          >
            <MapPin color="#FFFFFF" size={18} />
            <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }} numberOfLines={1}>
              {homeStation?.stop_name ?? "Set home station"}
            </Text>
          </TouchableOpacity>
          {updatedTime && (
            <TouchableOpacity onPress={() => refetch()} style={{ padding: 4 }}>
              <RefreshCw color={isFetching ? "#A8D5B8" : "#FFFFFF"} size={18} />
            </TouchableOpacity>
          )}
        </View>
        {updatedTime && (
          <Text style={{ color: "#A8D5B8", fontSize: 11, marginTop: 4 }}>
            Updated {updatedTime}
          </Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor="#00853F"
          />
        }
      >
        {/* Alert banner */}
        {relevantAlerts && relevantAlerts.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/alerts")}
            style={{
              backgroundColor: relevantAlerts[0].severity === "minor" ? t.warningBg : t.dangerBg,
              borderWidth: 1,
              borderColor: relevantAlerts[0].severity === "minor" ? t.warning : t.danger,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: relevantAlerts[0].severity === "minor" ? t.warning : t.danger,
                fontWeight: "700",
                fontSize: 13,
              }}>
                {relevantAlerts[0].header}
              </Text>
              <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: 1 }}>
                Tap to view all alerts
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* No station set */}
        {!homeStation && (
          <TouchableOpacity
            onPress={() => router.push("/station-search")}
            style={{
              backgroundColor: t.surface,
              borderRadius: 14,
              padding: 28,
              alignItems: "center",
              gap: 10,
              shadowColor: t.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{
              width: 60, height: 60, borderRadius: 30,
              backgroundColor: t.primaryBg, alignItems: "center", justifyContent: "center",
            }}>
              <MapPin color={t.primary} size={28} />
            </View>
            <Text style={{ color: t.textPrimary, fontSize: 17, fontWeight: "700", marginTop: 4 }}>
              Set your home station
            </Text>
            <Text style={{ color: t.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 19 }}>
              See live departures from your GO station at a glance
            </Text>
            <View style={{
              marginTop: 8, backgroundColor: t.primary,
              paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
            }}>
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>Choose Station</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Loading */}
        {isLoading && homeStation && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={t.primary} />
          </View>
        )}

        {/* Error */}
        {isError && (
          <View style={{
            backgroundColor: t.dangerBg,
            borderWidth: 1, borderColor: t.danger,
            borderRadius: 12, padding: 16, alignItems: "center",
          }}>
            <Text style={{ color: t.danger, fontSize: 14, fontWeight: "600" }}>
              Could not load departures
            </Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 10 }}>
              <Text style={{ color: t.primary, fontSize: 14, fontWeight: "600" }}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Direction filter — only shown when data has both directions */}
        {hasMultipleDirections && data && (
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            <TouchableOpacity
              onPress={() => setDirFilter(null)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                backgroundColor: dirFilter === null ? t.primary : t.surface,
                borderWidth: 1.5,
                borderColor: dirFilter === null ? t.primary : t.border,
              }}
            >
              <Text style={{ color: dirFilter === null ? "#FFFFFF" : t.textSecondary, fontWeight: "700", fontSize: 12 }}>
                All
              </Text>
            </TouchableOpacity>
            {[...directionLabels.entries()].map(([id, label]) => (
              <TouchableOpacity
                key={id}
                onPress={() => setDirFilter(id)}
                style={{
                  flex: 1,
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                  backgroundColor: dirFilter === id ? t.primary : t.surface,
                  borderWidth: 1.5,
                  borderColor: dirFilter === id ? t.primary : t.border,
                }}
              >
                <Text
                  style={{ color: dirFilter === id ? "#FFFFFF" : t.textSecondary, fontWeight: "700", fontSize: 12 }}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Departures */}
        {filteredDepartures.map((d) => (
          <DepartureCard
            key={d.trip_id}
            departure={d}
            onPress={() =>
              router.push({
                pathname: "/departure-detail" as any,
                params: {
                  trip_id:             d.trip_id,
                  stop_id:             homeStation!.stop_id,
                  route_short_name:    d.route_short_name,
                  route_long_name:     d.route_long_name,
                  headsign:            d.headsign,
                  scheduled_departure: d.scheduled_departure,
                  realtime_departure:  d.realtime_departure ?? "",
                  delay_seconds:       String(d.delay_seconds ?? ""),
                  status:              d.status,
                  platform:            d.platform ?? "",
                  accessible:          d.accessible ? "1" : "0",
                },
              })
            }
          />
        ))}

        {data && filteredDepartures.length === 0 && (
          <View style={{
            backgroundColor: t.surface, borderRadius: 12, padding: 20, alignItems: "center",
          }}>
            <Text style={{ color: t.textSecondary, fontSize: 14 }}>No upcoming departures</Text>
          </View>
        )}

        <Text style={{ color: t.textMuted, fontSize: 11, textAlign: "center", marginTop: 24, lineHeight: 17 }}>
          GO Tracker is unofficial and not affiliated with Metrolinx or GO Transit.{"\n"}
          Data provided by Metrolinx under the Metrolinx Open Data License.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
