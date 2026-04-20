import { View, Text } from "react-native";
import { StatusBadge } from "./StatusBadge";
import type { Departure } from "@/lib/api";

const ROUTE_COLORS: Record<string, string> = {
  LW: "#009BC9",
  LE: "#EE3124",
  ST: "#794500",
  BR: "#69B143",
  RH: "#00853F",
  KI: "#F5A623",
  MI: "#0070C0",
  BO: "#8B5A9C",
  GT: "#F7941D",
};

export function DepartureCard({ departure }: { departure: Departure }) {
  const lineColor = ROUTE_COLORS[departure.route_id] ?? "#9BB0A0";

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
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#5A7A63", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
              {departure.route_name.toUpperCase()}
            </Text>
            <Text style={{ color: "#1A2E1F", fontSize: 14, marginTop: 2, fontWeight: "500" }} numberOfLines={1}>
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
            {departure.realtime ?? departure.scheduled}
          </Text>
          {departure.delay_minutes > 0 && (
            <Text style={{ color: "#E07B00", fontSize: 13, fontWeight: "600" }}>
              +{departure.delay_minutes} min
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
