import { View, Text } from "react-native";
import { StatusBadge } from "./StatusBadge";
import { formatTorontoTime, type Departure } from "@/lib/api";

// Keyed by route_short_name (LW, LE, ST…) — matches GTFS route_short_name field.
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

export function DepartureCard({ departure }: { departure: Departure }) {
  // Prefer GTFS route color from the known map; fall back to hex from proxy.
  const lineColor =
    ROUTE_COLORS[departure.route_short_name] ??
    (departure.route_short_name ? `#9BB0A0` : "#9BB0A0");

  const scheduledStr  = formatTorontoTime(departure.scheduled_departure);
  const realtimeStr   = departure.realtime_departure
    ? formatTorontoTime(departure.realtime_departure)
    : null;
  const displayTime   = realtimeStr ?? scheduledStr;
  const delayMinutes  = departure.delay_seconds
    ? Math.round(departure.delay_seconds / 60)
    : 0;

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: "row",
        overflow: "hidden",
        shadowColor: "#1A2E1F",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View style={{ width: 5, backgroundColor: lineColor }} />
      <View style={{ flex: 1, padding: 14 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ color: "#5A7A63", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
              {departure.route_short_name} · {departure.route_long_name.toUpperCase()}
            </Text>
            <Text
              style={{ color: "#1A2E1F", fontSize: 14, marginTop: 2, fontWeight: "500" }}
              numberOfLines={1}
            >
              {departure.headsign}
            </Text>
          </View>
          <StatusBadge status={departure.status} />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            marginTop: 10,
            gap: 8,
          }}
        >
          <Text
            style={{
              color: "#1A2E1F",
              fontSize: 30,
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
              fontFamily: "monospace",
            }}
          >
            {displayTime}
          </Text>
          {delayMinutes > 0 && (
            <Text style={{ color: "#E07B00", fontSize: 13, fontWeight: "600" }}>
              +{delayMinutes} min
            </Text>
          )}
          {realtimeStr && scheduledStr !== realtimeStr && (
            <Text style={{ color: "#9BB0A0", fontSize: 12, textDecorationLine: "line-through" }}>
              {scheduledStr}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", marginTop: 6, gap: 12, alignItems: "center" }}>
          {departure.platform && (
            <View
              style={{
                backgroundColor: "#E8F5EE",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: "#00853F", fontSize: 11, fontWeight: "700" }}>
                Platform {departure.platform}
              </Text>
            </View>
          )}
          {departure.accessible && (
            <Text style={{ color: "#9BB0A0", fontSize: 13 }}>♿</Text>
          )}
        </View>
      </View>
    </View>
  );
}
