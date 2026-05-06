import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import WebView from "react-native-webview";

import { api, VehiclePosition } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";
import { formatTorontoTime } from "@/lib/api";

const VEHICLE_MAP_HTML = `<!DOCTYPE html>
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
    .leaflet-popup-content { font-family: sans-serif; font-size: 12px; line-height: 1.6; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var COLORS = {
    LW:"#98002E",LE:"#EE3124",ST:"#794500",BR:"#69B143",
    RH:"#0099C7",KI:"#F57F25",MI:"#F57F25",GT:"#F7941D",BO:"#8B5A9C"
  };
  var DEFAULT_COLOR = "#00853F";

  var map = L.map('map', { zoomControl: true }).setView([43.73, -79.50], 10);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO', maxZoom: 19
  }).addTo(map);

  var vehicleMarkers = {};

  function makeIcon(route, color, bearing) {
    var arrow = bearing != null
      ? '<div style="position:absolute;top:-9px;left:50%;margin-left:-4px;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:8px solid ' + color + ';transform:rotate(' + bearing + 'deg);transform-origin:4px 17px"></div>'
      : '';
    return L.divIcon({
      html: '<div style="position:relative;width:30px;height:30px">' + arrow + '<div style="position:absolute;top:0;left:0;width:30px;height:30px;border-radius:50%;background:' + color + ';border:2px solid rgba(255,255,255,0.85);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;font-family:sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.6)">' + route + '</div></div>',
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -18],
    });
  }

  function statusLabel(s) {
    if (s === 'stopped_at') return 'Stopped';
    if (s === 'incoming_at') return 'Arriving';
    return 'En route';
  }

  window.updateVehicles = function(vehicles) {
    var seen = {};
    for (var i = 0; i < vehicles.length; i++) {
      var v = vehicles[i];
      seen[v.vehicle_id] = true;
      var color = COLORS[v.route_short_name] || DEFAULT_COLOR;
      var icon = makeIcon(v.route_short_name, color, v.bearing);
      var popup = '<b>' + v.route_short_name + '</b> &middot; ' + statusLabel(v.current_status)
        + (v.stop_id ? '<br>Next stop: ' + v.stop_id : '')
        + (v.vehicle_label ? '<br>Vehicle: ' + v.vehicle_label : '');
      if (vehicleMarkers[v.vehicle_id]) {
        vehicleMarkers[v.vehicle_id].setLatLng([v.latitude, v.longitude]);
        vehicleMarkers[v.vehicle_id].setIcon(icon);
        vehicleMarkers[v.vehicle_id].setPopupContent(popup);
      } else {
        var m = L.marker([v.latitude, v.longitude], { icon: icon }).addTo(map);
        m.bindPopup(popup, { maxWidth: 180 });
        vehicleMarkers[v.vehicle_id] = m;
      }
    }
    for (var id in vehicleMarkers) {
      if (!seen[id]) {
        map.removeLayer(vehicleMarkers[id]);
        delete vehicleMarkers[id];
      }
    }
  };
</script>
</body>
</html>`;

export default function VehiclesScreen() {
  const t = useTheme();
  const webViewRef = useRef<WebView>(null);
  const mapReady = useRef(false);
  const pendingVehicles = useRef<VehiclePosition[] | null>(null);

  const { data, isError, isFetching } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api.vehiclePositions(),
    refetchInterval: 30_000,
    staleTime: 0,
  });

  useEffect(() => {
    if (!data?.vehicles) return;
    if (mapReady.current) {
      webViewRef.current?.injectJavaScript(
        `window.updateVehicles(${JSON.stringify(data.vehicles)}); true;`
      );
    } else {
      pendingVehicles.current = data.vehicles;
    }
  }, [data]);

  const handleMapLoad = () => {
    mapReady.current = true;
    if (pendingVehicles.current) {
      webViewRef.current?.injectJavaScript(
        `window.updateVehicles(${JSON.stringify(pendingVehicles.current)}); true;`
      );
      pendingVehicles.current = null;
    }
  };

  const count = data?.vehicles?.length ?? 0;
  const updatedAt = data?.generated_at ? formatTorontoTime(data.generated_at) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft color="#FFFFFF" size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#A8D5B8", fontSize: 11, fontWeight: "600", letterSpacing: 0.8 }}>GO TRACKER</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 2 }}>Live Map</Text>
        </View>
        {isFetching && <ActivityIndicator color="#A8D5B8" size="small" />}
      </View>

      {/* Info bar */}
      <View style={{ backgroundColor: t.surface, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: t.border }}>
        <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: "700" }}>
          {count > 0 ? `${count} trains active` : "No active trains"}
        </Text>
        {updatedAt && (
          <Text style={{ color: t.textMuted, fontSize: 12 }}>Updated {updatedAt}</Text>
        )}
      </View>

      {/* Map */}
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ html: VEHICLE_MAP_HTML }}
          style={{ flex: 1 }}
          onLoadEnd={handleMapLoad}
          scrollEnabled={false}
          originWhitelist={["*"]}
          javaScriptEnabled
        />
        {isError && (
          <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15,23,42,0.85)" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Unable to load vehicle positions</Text>
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>Check your connection and try again</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
