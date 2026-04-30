import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Train, Bus } from "lucide-react-native";
import WebView from "react-native-webview";

import { api, RouteStop } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";

function buildLeafletHTML(stops: RouteStop[], color: string, label: string): string {
  const validStops = stops.filter((s) => s.stop_lat !== 0 && s.stop_lon !== 0);
  const stopsJson = JSON.stringify(
    validStops.map((s) => ({
      lat: s.stop_lat, lon: s.stop_lon,
      name: s.stop_name,
      time: s.departure_time.substring(0, 5),
    }))
  );
  const lineColor = color ? `#${color}` : "#00853F";
  const centerLat = validStops.reduce((sum, s) => sum + s.stop_lat, 0) / (validStops.length || 1);
  const centerLon = validStops.reduce((sum, s) => sum + s.stop_lon, 0) / (validStops.length || 1);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0f172a; }
    .stop-label {
      background: #1e293b; border: 2px solid ${lineColor}; border-radius: 6px;
      padding: 2px 6px; font-size: 11px; font-weight: 700; color: #e2e8f0;
      white-space: nowrap; box-shadow: 0 1px 6px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  const stops = ${stopsJson};
  const map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLon}], 10);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19 }).addTo(map);
  const latlngs = stops.map(s => [s.lat, s.lon]);
  L.polyline(latlngs, { color: '${lineColor}', weight: 4, opacity: 0.85 }).addTo(map);
  stops.forEach((stop, i) => {
    const isTerminus = i === 0 || i === stops.length - 1;
    const marker = L.circleMarker([stop.lat, stop.lon], {
      radius: isTerminus ? 8 : 6,
      fillColor: isTerminus ? '${lineColor}' : '#FFFFFF',
      color: '${lineColor}', weight: 2.5, opacity: 1, fillOpacity: 1,
    }).addTo(map);
    marker.bindPopup('<b>' + stop.name + '</b><br>First departure: ' + stop.time, { maxWidth: 180 });
    if (isTerminus) {
      L.marker([stop.lat, stop.lon], {
        icon: L.divIcon({ className: '', html: '<div class="stop-label">' + stop.name.replace(/ GO$/, '') + '</div>', iconAnchor: [0, -10] }),
      }).addTo(map);
    }
  });
  if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [20, 20] });
</script>
</body>
</html>`;
}

export default function RouteDetailScreen() {
  const t = useTheme();
  const { short_name, long_name, color, route_type } = useLocalSearchParams<{
    short_name: string; long_name: string; color: string; route_type: string;
  }>();

  const [activeDir, setActiveDir] = useState<"0" | "1">("0");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["route-stops", short_name],
    queryFn: () => api.routeStops(short_name),
    staleTime: 60 * 60_000,
  });

  const lineColor = color ? `#${color}` : "#00853F";
  const isTrain = route_type === "2";
  const direction = data?.directions[activeDir];
  const mapHtml = direction ? buildLeafletHTML(direction.stops, color ?? "", short_name) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: lineColor, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}
        >
          <ArrowLeft color="rgba(255,255,255,0.8)" size={18} />
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" }}>Routes</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            {isTrain ? <Train color="#FFFFFF" size={20} /> : <Bus color="#FFFFFF" size={20} />}
          </View>
          <View>
            <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>{short_name}</Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{long_name}</Text>
          </View>
        </View>

        {data?.directions && (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
            {(["0", "1"] as const).map((dir) => {
              const d = data.directions[dir];
              if (!d) return null;
              return (
                <TouchableOpacity
                  key={dir}
                  onPress={() => setActiveDir(dir)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                    backgroundColor: activeDir === dir ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                    borderWidth: 1,
                    borderColor: activeDir === dir ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>
                    → {d.headsign.replace(/^[A-Z]{2} - /, "")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {isLoading && (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator color={lineColor} />
        </View>
      )}

      {isError && (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: t.danger, fontSize: 14 }}>Could not load route stops</Text>
        </View>
      )}

      {mapHtml && direction && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ height: 280, marginBottom: 16 }}>
            <WebView source={{ html: mapHtml }} style={{ flex: 1 }} scrollEnabled={false} originWhitelist={["*"]} javaScriptEnabled />
          </View>

          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: "600", letterSpacing: 0.6, marginBottom: 8 }}>
              {direction.stops.length} STOPS
            </Text>
            <View style={{
              backgroundColor: t.surface, borderRadius: 14, overflow: "hidden",
              shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
            }}>
              {direction.stops.map((stop, index) => {
                const isTerminus = index === 0 || index === direction.stops.length - 1;
                const time = stop.departure_time.substring(0, 5);
                return (
                  <View
                    key={stop.stop_id + stop.stop_sequence}
                    style={{
                      flexDirection: "row", alignItems: "center",
                      paddingHorizontal: 16, paddingVertical: 11,
                      borderBottomWidth: index < direction.stops.length - 1 ? 1 : 0,
                      borderBottomColor: t.bg,
                      gap: 12,
                    }}
                  >
                    <View style={{ width: 20, alignItems: "center" }}>
                      <View style={{
                        width: isTerminus ? 14 : 10, height: isTerminus ? 14 : 10,
                        borderRadius: isTerminus ? 7 : 5,
                        backgroundColor: isTerminus ? lineColor : t.surface,
                        borderWidth: 2, borderColor: lineColor,
                      }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.textPrimary, fontSize: isTerminus ? 14 : 13, fontWeight: isTerminus ? "700" : "500" }}>
                        {stop.stop_name}
                      </Text>
                    </View>
                    <Text style={{ color: t.textMuted, fontSize: 12, fontVariant: ["tabular-nums"] }}>{time}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
