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
import { MapPin, RefreshCw, X, Train } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";

import { api, type Alert } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { DepartureCard } from "@/components/ui/DepartureCard";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";
import { getTtcForStopId } from "@/lib/ttcConnections";
import { getNoticesForStop } from "@/lib/notices";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTodayStr(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/Toronto" })
    .replace(/-/g, "");
}

// ── Line status ribbon ────────────────────────────────────────────────────────

const TRAIN_LINES = ["LW", "LE", "ST", "BR", "RH", "KI", "MI", "GT", "BO"] as const;

const LINE_COLORS: Record<string, string> = {
  LW: "#98002E", LE: "#EE3124", ST: "#794500", BR: "#69B143",
  RH: "#0099C7", KI: "#F57F25", MI: "#F57F25", GT: "#F7941D", BO: "#8B5A9C",
};

type LineStatus = "good" | "minor" | "disrupted";

function deriveLineStatuses(alerts: Alert[]): Record<string, LineStatus> {
  const statuses: Record<string, LineStatus> = {};
  for (const line of TRAIN_LINES) statuses[line] = "good";

  for (const alert of alerts) {
    for (const route of alert.affected_routes) {
      const line = route.length <= 3 ? route.toUpperCase() : null;
      if (!line || !(line in statuses)) continue;
      const current = statuses[line];
      if (alert.severity === "cancelled" || alert.severity === "major") {
        statuses[line] = "disrupted";
      } else if (alert.severity === "minor" && current === "good") {
        statuses[line] = "minor";
      }
    }
  }
  return statuses;
}

function LineStatusRibbon({ alerts }: { alerts: Alert[] | undefined }) {
  const t = useTheme();
  if (alerts === undefined) return null;

  const statuses = deriveLineStatuses(alerts);
  const dotColor = (s: LineStatus) =>
    s === "disrupted" ? "#C41230" : s === "minor" ? "#E07B00" : "#69B143";

  return (
    <View style={{
      backgroundColor: t.surface,
      borderBottomWidth: 1, borderBottomColor: t.border,
      paddingHorizontal: 16, paddingVertical: 8,
      flexDirection: "row", alignItems: "center", gap: 6,
    }}>
      {TRAIN_LINES.map((line) => (
        <View key={line} style={{ flexDirection: "row", alignItems: "center", gap: 3, marginRight: 4 }}>
          <View style={{ width: 3, height: 14, borderRadius: 1.5, backgroundColor: LINE_COLORS[line] }} />
          <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700" }}>{line}</Text>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor(statuses[line]) }} />
        </View>
      ))}
    </View>
  );
}

// ── Last Train Warning ────────────────────────────────────────────────────────

function LastTrainBanner({
  lastDepIso,
  onDismiss,
}: {
  lastDepIso: string;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const depMs = new Date(lastDepIso).getTime();
  const nowMs = Date.now();
  const minsLeft = Math.round((depMs - nowMs) / 60_000);

  if (minsLeft <= 0 || minsLeft > 120) return null;

  const timeStr = new Date(lastDepIso).toLocaleTimeString([], {
    timeZone: "America/Toronto",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <View style={{
      backgroundColor: t.warningBg,
      borderWidth: 1.5, borderColor: t.warning,
      borderRadius: 10, padding: 12, marginBottom: 12,
      flexDirection: "row", alignItems: "center", gap: 10,
    }}>
      <Text style={{ fontSize: 18 }}>🚂</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.warning, fontWeight: "700", fontSize: 13 }}>
          Last train at {timeStr}
        </Text>
        <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: 1 }}>
          {minsLeft < 60
            ? `${minsLeft} min remaining tonight`
            : `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m remaining`}
        </Text>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <X color={t.warning} size={16} />
      </TouchableOpacity>
    </View>
  );
}

// ── Connections section ───────────────────────────────────────────────────────

function ConnectionsSection({ stopId }: { stopId: string }) {
  const t = useTheme();
  const { data } = useQuery({
    queryKey: ["connections", stopId],
    queryFn: () => api.connections(stopId),
    staleTime: 30 * 60_000,
    retry: false,
  });

  if (!data || data.connections.length === 0) return null;

  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8 }}>
        CONNECTIONS
      </Text>
      <View style={{
        backgroundColor: t.surface, borderRadius: 12,
        shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
        overflow: "hidden",
      }}>
        {data.connections.map((c, i) => {
          const mins = c.min_transfer_time != null ? Math.ceil(c.min_transfer_time / 60) : null;
          return (
            <View
              key={c.to_stop_id}
              style={{
                flexDirection: "row", alignItems: "center", padding: 12, gap: 10,
                borderTopWidth: i > 0 ? 1 : 0, borderTopColor: t.border,
              }}
            >
              <Train color={t.textMuted} size={14} />
              <Text style={{ flex: 1, color: t.textPrimary, fontSize: 13 }} numberOfLines={1}>
                {c.to_stop_name}
              </Text>
              {mins != null && (
                <Text style={{ color: t.textMuted, fontSize: 12 }}>{mins} min</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const t = useTheme();
  const { homeStation, hydrate } = useAppStore();
  const [dirFilter, setDirFilter] = useState<number | null>(null);
  const [lastTrainDismissed, setLastTrainDismissed] = useState(false);

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

  // Last train warning — lightweight endpoint, 1h stale
  const today = getTodayStr();
  const { data: lastDepData } = useQuery({
    queryKey: ["lastdeparture", homeStation?.stop_id, today],
    queryFn: () => api.lastDeparture(homeStation!.stop_id, today),
    enabled: !!homeStation,
    staleTime: 60 * 60_000,
    retry: false,
  });

  const showLastTrainBanner = useMemo(() => {
    if (lastTrainDismissed || !lastDepData?.last_departure_iso) return false;
    const minsLeft = Math.round(
      (new Date(lastDepData.last_departure_iso).getTime() - Date.now()) / 60_000
    );
    return minsLeft > 0 && minsLeft <= 120;
  }, [lastDepData, lastTrainDismissed]);

  const relevantAlerts = alertsData?.alerts.filter((a) =>
    a.affected_routes.some((r) =>
      data?.departures.some((d) => d.route_short_name === r || d.route_id === r)
    )
  );

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

  const LIMITED_WEEKEND_LINES = new Set(["KI", "MI", "BR"]);
  const isWeekend = [0, 6].includes(new Date().getDay());
  const showReducedService = useMemo(() => {
    if (!isWeekend || !data?.departures.length) return false;
    const routes = new Set(data.departures.map((d) => d.route_short_name));
    return [...routes].every((r) => LIMITED_WEEKEND_LINES.has(r));
  }, [data, isWeekend]);

  const homeNotices = useMemo(
    () => (homeStation ? getNoticesForStop(homeStation.stop_id) : []),
    [homeStation]
  );

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  // TTC connection badge for home station header
  const homeTtc = homeStation ? getTtcForStopId(homeStation.stop_id) : null;

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
        {/* TTC connection badge in header */}
        {homeTtc && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
            <Text style={{ color: "#A8D5B8", fontSize: 11 }}>TTC</Text>
            {homeTtc.lines.map((l) => (
              <View
                key={l.number}
                style={{
                  width: 18, height: 18, borderRadius: 9,
                  backgroundColor: l.color, alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ color: "#000", fontSize: 10, fontWeight: "800" }}>{l.label}</Text>
              </View>
            ))}
          </View>
        )}
        {updatedTime && (
          <Text style={{ color: "#A8D5B8", fontSize: 11, marginTop: 4 }}>
            Updated {updatedTime}
          </Text>
        )}
      </View>

      <LineStatusRibbon alerts={alertsData?.alerts} />

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
              marginBottom: 12,
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

        {/* Last train warning */}
        {showLastTrainBanner && lastDepData?.last_departure_iso && (
          <LastTrainBanner
            lastDepIso={lastDepData.last_departure_iso}
            onDismiss={() => setLastTrainDismissed(true)}
          />
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

        {/* Station notices */}
        {homeNotices.map((n, i) => (
          <View
            key={i}
            style={{
              backgroundColor: n.type === "warning" ? t.warningBg : t.surfaceAlt,
              borderWidth: 1.5,
              borderColor: n.type === "warning" ? t.warning : t.border,
              borderRadius: 10, padding: 12, marginBottom: 12,
              flexDirection: "row", alignItems: "center", gap: 10,
            }}
          >
            <Text style={{ fontSize: 16 }}>{n.type === "warning" ? "⚠️" : "ℹ️"}</Text>
            <Text style={{ flex: 1, color: n.type === "warning" ? t.warning : t.textSecondary, fontSize: 13 }}>
              {n.message}
            </Text>
          </View>
        ))}

        {/* Reduced weekend service */}
        {showReducedService && (
          <View style={{
            backgroundColor: t.surfaceAlt,
            borderWidth: 1.5, borderColor: t.border,
            borderRadius: 10, padding: 12, marginBottom: 12,
            flexDirection: "row", alignItems: "center", gap: 10,
          }}>
            <Text style={{ fontSize: 16 }}>📅</Text>
            <Text style={{ flex: 1, color: t.textSecondary, fontSize: 13 }}>
              Weekend service on this line is significantly reduced.
            </Text>
          </View>
        )}

        {/* Direction filter */}
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

        {data && filteredDepartures.length === 0 && !isLoading && (
          <View style={{
            backgroundColor: t.surface, borderRadius: 12, padding: 20, alignItems: "center",
          }}>
            <Text style={{ color: t.textSecondary, fontSize: 14 }}>No upcoming departures</Text>
          </View>
        )}

        {/* GTFS connections from home station */}
        {homeStation && <ConnectionsSection stopId={homeStation.stop_id} />}

        <Text style={{ color: t.textMuted, fontSize: 11, textAlign: "center", marginTop: 24, lineHeight: 17 }}>
          GO Tracker is unofficial and not affiliated with Metrolinx or GO Transit.{"\n"}
          Data provided by Metrolinx under the Metrolinx Open Data License.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
