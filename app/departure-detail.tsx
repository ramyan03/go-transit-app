import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ExternalLink, AlertTriangle, CheckCircle, Clock } from "lucide-react-native";

import { api, formatTorontoTime, type GuaranteeResult } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTheme } from "@/hooks/useTheme";
import { getTtcForStopId } from "@/lib/ttcConnections";
import { getNoticesForStop } from "@/lib/notices";

const ROUTE_COLORS: Record<string, string> = {
  LW: "#98002E", LE: "#EE3124", ST: "#794500", BR: "#69B143",
  RH: "#0099C7", KI: "#F57F25", MI: "#F57F25", GT: "#F7941D", BO: "#8B5A9C",
};

export default function DepartureDetailScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{
    trip_id: string; stop_id: string; route_short_name: string;
    route_long_name: string; headsign: string; scheduled_departure: string;
    realtime_departure: string; delay_seconds: string; status: string;
    platform: string; accessible: string;
  }>();

  const {
    trip_id, stop_id, route_short_name, route_long_name, headsign,
    scheduled_departure, realtime_departure, delay_seconds, status, platform, accessible,
  } = params;

  const lineColor = ROUTE_COLORS[route_short_name] ?? "#9BB0A0";
  const realtimeIso = realtime_departure || null;
  const displayTime = formatTorontoTime(realtimeIso ?? scheduled_departure);
  const scheduledTime = formatTorontoTime(scheduled_departure);
  const delayMinutes = delay_seconds ? Math.round(Number(delay_seconds) / 60) : 0;

  const stopTimesQuery = useQuery({
    queryKey: ["trip-stop-times", trip_id],
    queryFn: () => api.schedule.trip(trip_id),
    staleTime: 5 * 60_000,
  });

  const guaranteeQuery = useQuery({
    queryKey: ["guarantee", trip_id],
    queryFn: () => api.guarantee(trip_id),
    staleTime: 30_000,
    retry: false,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 }}
        >
          <ChevronLeft color="#A8D5B8" size={20} />
          <Text style={{ color: "#A8D5B8", fontSize: 13, fontWeight: "600" }}>Back</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: lineColor }} />
          <Text style={{ color: "#A8D5B8", fontSize: 11, fontWeight: "700", letterSpacing: 0.8 }}>
            {route_short_name} · {route_long_name.toUpperCase()}
          </Text>
        </View>
        <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 2 }} numberOfLines={1}>
          {headsign}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Time card */}
        <View style={{
          backgroundColor: t.surface, borderRadius: 14, padding: 20, marginBottom: 14,
          borderLeftWidth: 5, borderLeftColor: lineColor,
          shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
        }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: t.textPrimary, fontSize: 48, fontWeight: "700", fontVariant: ["tabular-nums"], lineHeight: 54 }}>
                {displayTime}
              </Text>
              {delayMinutes > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <Text style={{ color: t.warning, fontSize: 14, fontWeight: "700" }}>+{delayMinutes} min</Text>
                  {realtimeIso && scheduledTime !== displayTime && (
                    <Text style={{ color: t.textMuted, fontSize: 13, textDecorationLine: "line-through" }}>
                      {scheduledTime}
                    </Text>
                  )}
                </View>
              )}
            </View>
            <StatusBadge status={status as "ON_TIME" | "DELAYED" | "CANCELLED" | "SCHEDULED"} />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            {platform ? (
              <View style={{ backgroundColor: t.primaryBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                <Text style={{ color: t.primary, fontSize: 12, fontWeight: "700" }}>Platform {platform}</Text>
              </View>
            ) : null}
            {accessible === "1" && (
              <View style={{ backgroundColor: t.surfaceAlt, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                <Text style={{ color: t.textSecondary, fontSize: 12, fontWeight: "600" }}>♿ Accessible</Text>
              </View>
            )}
            <View style={{ backgroundColor: t.surfaceAlt, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
              <Text style={{ color: t.textSecondary, fontSize: 12 }}>From {stop_id}</Text>
            </View>
          </View>
        </View>

        <GuaranteePanel isLoading={guaranteeQuery.isLoading} isError={guaranteeQuery.isError} data={guaranteeQuery.data} />

        {/* Stop times */}
        <View style={{ marginTop: 4 }}>
          <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 10 }}>
            STOPS
          </Text>

          {stopTimesQuery.isLoading && (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color={t.primary} />
            </View>
          )}

          {stopTimesQuery.isError && (
            <View style={{ backgroundColor: t.dangerBg, borderRadius: 10, padding: 14 }}>
              <Text style={{ color: t.danger, fontSize: 13 }}>Could not load stop times</Text>
            </View>
          )}

          {stopTimesQuery.data && (
            <View style={{
              backgroundColor: t.surface, borderRadius: 12, overflow: "hidden",
              shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
            }}>
              {stopTimesQuery.data.stop_times.map((st, i) => {
                const isOrigin = st.stop_id === stop_id || st.stop_id === stop_id.toUpperCase();
                const isLast = i === stopTimesQuery.data!.stop_times.length - 1;
                const ttc = getTtcForStopId(st.stop_id);
                const notices = getNoticesForStop(st.stop_id);
                return (
                  <View
                    key={st.stop_id + st.stop_sequence}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 10,
                      backgroundColor: isOrigin ? t.primaryBg : t.surface,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: t.bg,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 24, alignItems: "center", marginRight: 12 }}>
                        {!isLast && (
                          <View style={{ position: "absolute", top: 14, width: 2, height: 34, backgroundColor: lineColor + "40" }} />
                        )}
                        <View style={{
                          width: isOrigin ? 12 : 8, height: isOrigin ? 12 : 8,
                          borderRadius: isOrigin ? 6 : 4,
                          backgroundColor: isOrigin ? lineColor : lineColor + "60",
                          borderWidth: isOrigin ? 2 : 0,
                          borderColor: t.surface,
                        }} />
                      </View>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Text style={{
                          color: isOrigin ? t.textPrimary : t.textSecondary,
                          fontSize: isOrigin ? 14 : 13, fontWeight: isOrigin ? "700" : "400",
                        }}>
                          {st.stop_name}{isOrigin ? " ← you" : ""}
                        </Text>
                        {ttc && ttc.lines.map((l) => (
                          <View
                            key={l.number}
                            style={{
                              width: 16, height: 16, borderRadius: 8,
                              backgroundColor: l.color, alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <Text style={{ color: "#000", fontSize: 9, fontWeight: "800" }}>{l.label}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={{
                        color: isOrigin ? t.textPrimary : t.textSecondary,
                        fontSize: 13, fontWeight: isOrigin ? "700" : "400", fontVariant: ["tabular-nums"],
                      }}>
                        {st.departure_time}
                      </Text>
                    </View>
                    {notices.map((n, ni) => (
                      <View key={ni} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, marginLeft: 36 }}>
                        <Text style={{ fontSize: 11 }}>{n.type === "warning" ? "⚠️" : "ℹ️"}</Text>
                        <Text style={{ color: t.textMuted, fontSize: 11, flex: 1 }}>{n.message}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <Text style={{ color: t.textMuted, fontSize: 11, textAlign: "center", marginTop: 20, marginBottom: 8, lineHeight: 17 }}>
          Schedule data from Metrolinx GTFS.{"\n"}
          Real-time delays shown when available.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Guarantee Panel ──────────────────────────────────────────────────────────

function GuaranteePanel({ isLoading, isError, data }: {
  isLoading: boolean; isError: boolean; data: GuaranteeResult | undefined;
}) {
  const t = useTheme();

  if (isLoading) {
    return (
      <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 16, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <ActivityIndicator color={t.primary} size="small" />
        <Text style={{ color: t.textSecondary, fontSize: 13 }}>Checking service guarantee…</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: t.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Clock color={t.textMuted} size={16} />
          <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: "700" }}>GO Service Guarantee</Text>
        </View>
        <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 18 }}>
          Real-time data not yet available. Once active, delays of 15+ min automatically show a claim link here.
        </Text>
      </View>
    );
  }

  if (data.eligible) {
    return (
      <View style={{
        backgroundColor: data.cancelled ? t.dangerBg : t.warningBg,
        borderRadius: 12, padding: 16, marginBottom: 14,
        borderLeftWidth: 4, borderLeftColor: data.cancelled ? t.danger : t.warning,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <AlertTriangle color={data.cancelled ? t.danger : t.warning} size={16} />
          <Text style={{ color: data.cancelled ? t.danger : t.warning, fontSize: 13, fontWeight: "700" }}>
            GO Service Guarantee
          </Text>
        </View>
        <Text style={{ color: t.textPrimary, fontSize: 14, fontWeight: "600", marginBottom: 4 }}>{data.reason}</Text>
        {data.claim_url && (
          <TouchableOpacity
            onPress={() => Linking.openURL(data.claim_url!)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8,
              backgroundColor: t.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: t.primary, fontSize: 13, fontWeight: "700" }}>File a claim</Text>
            <ExternalLink color={t.primary} size={14} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (data.delay_seconds !== null) {
    return (
      <View style={{ backgroundColor: t.surface, borderRadius: 12, padding: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: "#69B143" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <CheckCircle color="#69B143" size={16} />
          <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: "700" }}>GO Service Guarantee</Text>
        </View>
        <Text style={{ color: t.textPrimary, fontSize: 13 }}>{data.reason}</Text>
      </View>
    );
  }

  return null;
}
