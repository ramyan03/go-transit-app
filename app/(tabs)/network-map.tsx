import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import WebView from "react-native-webview";

import { api } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";

const ROUTE_COLORS: Record<string, string> = {
  LW: "#98002E", LE: "#EE3124", ST: "#794500", BR: "#69B143",
  RH: "#0099C7", KI: "#F57F25", MI: "#F57F25", GT: "#F7941D", BO: "#8B5A9C",
};

type MapRoute = {
  short_name: string;
  color: string;
  stops: { lat: number; lon: number; name: string }[];
};

function buildNetworkMapHtml(routes: MapRoute[]): string {
  const routesJson = JSON.stringify(routes);
  const legendHtml = routes
    .map((r) => `<div class="li"><div class="dot" style="background:${r.color}"></div><span>${r.short_name}</span></div>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0f172a; }
    .leaflet-popup-content-wrapper { background: #1e293b; color: #e2e8f0; border: none; border-radius: 8px; }
    .leaflet-popup-tip { background: #1e293b; }
    .leaflet-popup-content { font-family: sans-serif; font-size: 13px; font-weight: 700; }
    #legend {
      position: absolute; bottom: 28px; left: 10px; z-index: 1000;
      background: rgba(15,23,42,0.92); border-radius: 10px; padding: 8px 10px;
      display: flex; flex-direction: column; gap: 5px; pointer-events: none;
    }
    .li { display: flex; align-items: center; gap: 7px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .li span { color: #e2e8f0; font-size: 11px; font-weight: 700; font-family: sans-serif; }
  </style>
</head>
<body>
<div id="map"></div>
<div id="legend">${legendHtml}</div>
<script>
  var routes = ${routesJson};
  var map = L.map('map', { zoomControl: true }).setView([43.83, -79.40], 9);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19
  }).addTo(map);

  var allLatLngs = [];
  routes.forEach(function(route) {
    var latlngs = route.stops.map(function(s) { return [s.lat, s.lon]; });
    allLatLngs = allLatLngs.concat(latlngs);
    L.polyline(latlngs, { color: route.color, weight: 4, opacity: 0.9 }).addTo(map);
  });

  // Deduplicate stations by rounded lat/lon
  var seen = {};
  routes.forEach(function(route) {
    route.stops.forEach(function(s, i) {
      var key = s.lat.toFixed(4) + ',' + s.lon.toFixed(4);
      var isTerminus = i === 0 || i === route.stops.length - 1;
      if (!seen[key]) {
        seen[key] = { name: s.name, lat: s.lat, lon: s.lon, terminus: isTerminus, color: route.color };
      } else if (isTerminus) {
        seen[key].terminus = true;
      }
    });
  });

  Object.values(seen).forEach(function(stop) {
    var m = L.circleMarker([stop.lat, stop.lon], {
      radius: stop.terminus ? 7 : 4,
      fillColor: stop.terminus ? stop.color : '#e2e8f0',
      color: '#0f172a', weight: 1.5, opacity: 1, fillOpacity: 1,
    }).addTo(map);
    m.bindPopup('<b>' + stop.name + '</b>', { maxWidth: 180 });
  });

  if (allLatLngs.length > 1) map.fitBounds(allLatLngs, { padding: [40, 40] });
</script>
</body>
</html>`;
}

export default function NetworkMapScreen() {
  const t = useTheme();

  const { data: mapHtml, isLoading, isError } = useQuery({
    queryKey: ["network-map"],
    queryFn: async () => {
      const routes = await api.routes("train");
      const results = await Promise.allSettled(
        routes.map(async (r) => {
          const d = await api.routeStops(r.route_short_name);
          const dir0 = d.directions["0"];
          if (!dir0 || dir0.stops.length === 0) return null;
          return {
            short_name: r.route_short_name,
            color: ROUTE_COLORS[r.route_short_name] ?? "#00853F",
            stops: dir0.stops
              .filter((s) => s.stop_lat !== 0 && s.stop_lon !== 0)
              .map((s) => ({ lat: s.stop_lat, lon: s.stop_lon, name: s.stop_name })),
          } satisfies MapRoute;
        })
      );
      const valid = results
        .filter((r): r is PromiseFulfilledResult<MapRoute | null> => r.status === "fulfilled")
        .map((r) => r.value)
        .filter((v): v is MapRoute => v !== null);
      return buildNetworkMapHtml(valid);
    },
    staleTime: 6 * 60 * 60_000,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }} edges={["top"]}>
      <View style={{
        backgroundColor: "#00853F", paddingHorizontal: 16,
        paddingTop: 12, paddingBottom: 16,
        flexDirection: "row", alignItems: "center", gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft color="#FFFFFF" size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#A8D5B8", fontSize: 11, fontWeight: "600", letterSpacing: 0.8 }}>
            GO TRACKER
          </Text>
          <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 2 }}>
            Network Map
          </Text>
        </View>
      </View>

      {isLoading && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
          <ActivityIndicator color="#00853F" size="large" />
          <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 12 }}>
            Loading route data…
          </Text>
        </View>
      )}

      {isError && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: "#C41230", fontSize: 15, fontWeight: "700" }}>
            Couldn't load network map
          </Text>
          <Text style={{ color: "#5A7A63", fontSize: 13, marginTop: 6 }}>
            Check your connection and try again
          </Text>
        </View>
      )}

      {mapHtml && (
        <WebView
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
          scrollEnabled={false}
          originWhitelist={["*"]}
          javaScriptEnabled
        />
      )}
    </SafeAreaView>
  );
}
