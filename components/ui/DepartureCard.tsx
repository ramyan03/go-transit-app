import { View, Text, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { StatusBadge } from "./StatusBadge";
import { formatTorontoTime, type Departure } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";
import { getTtcForName, type TtcConnection } from "@/lib/ttcConnections";

const ROUTE_COLORS: Record<string, string> = {
  LW: "#98002E",
  LE: "#EE3124",
  ST: "#794500",
  BR: "#69B143",
  RH: "#0099C7",
  KI: "#F57F25",
  MI: "#F57F25",
  GT: "#F7941D",
  BO: "#8B5A9C",
};

function TtcBadge({ connection }: { connection: TtcConnection }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 6 }}>
      <Text style={{ color: "#555", fontSize: 10, fontWeight: "600" }}>TTC</Text>
      {connection.lines.map((l) => (
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
  );
}

export function DepartureCard({ departure, onPress }: { departure: Departure; onPress?: () => void }) {
  const t = useTheme();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const ttcConnection = getTtcForName(departure.headsign);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const lineColor =
    ROUTE_COLORS[departure.route_short_name] ?? "#9BB0A0";

  const scheduledStr  = formatTorontoTime(departure.scheduled_departure);
  const realtimeStr   = departure.realtime_departure
    ? formatTorontoTime(departure.realtime_departure)
    : null;
  const displayTime   = realtimeStr ?? scheduledStr;
  const delayMinutes  = departure.delay_seconds
    ? Math.round(departure.delay_seconds / 60)
    : 0;

  const depMs = new Date(departure.realtime_departure ?? departure.scheduled_departure).getTime();
  const minutesUntil = Math.round((depMs - nowMs) / 60_000);
  const countdownLabel =
    minutesUntil <= 0   ? "NOW"
    : minutesUntil === 1 ? "1 min"
    : `${minutesUntil} min`;
  const countdownColor = minutesUntil <= 2 ? t.danger : t.textMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        backgroundColor: t.surface,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: "row",
        overflow: "hidden",
        shadowColor: t.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View style={{ width: 5, backgroundColor: lineColor }} />
      <View style={{ flex: 1, padding: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
              {departure.route_short_name} · {departure.route_long_name.toUpperCase()}
            </Text>
            <Text
              style={{ color: t.textPrimary, fontSize: 14, marginTop: 2, fontWeight: "500" }}
              numberOfLines={1}
            >
              {departure.headsign}
            </Text>
          </View>
          <StatusBadge status={departure.status} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 10, gap: 8 }}>
          <Text
            style={{
              color: t.textPrimary,
              fontSize: 30,
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
              fontFamily: "monospace",
            }}
          >
            {displayTime}
          </Text>
          {delayMinutes > 0 && (
            <Text style={{ color: t.warning, fontSize: 13, fontWeight: "600" }}>
              +{delayMinutes} min
            </Text>
          )}
          {realtimeStr && scheduledStr !== realtimeStr && (
            <Text style={{ color: t.textMuted, fontSize: 12, textDecorationLine: "line-through" }}>
              {scheduledStr}
            </Text>
          )}
          {minutesUntil <= 30 && (
            <Text style={{ color: countdownColor, fontSize: 12, fontWeight: "600", marginLeft: "auto" }}>
              {countdownLabel}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", marginTop: 6, gap: 12, alignItems: "center" }}>
          {departure.platform && (
            <View style={{ backgroundColor: t.primaryBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 }}>
              <Text style={{ color: t.primary, fontSize: 11, fontWeight: "700" }}>
                Platform {departure.platform}
              </Text>
            </View>
          )}
          {departure.accessible && (
            <Text style={{ color: t.textMuted, fontSize: 13 }}>♿</Text>
          )}
        </View>
        {ttcConnection && <TtcBadge connection={ttcConnection} />}
      </View>
    </TouchableOpacity>
  );
}
