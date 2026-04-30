import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, MapPin, Train, ArrowRight } from "lucide-react-native";

import { api, type Stop, type Route } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/hooks/useTheme";

const ROUTE_COLORS: Record<string, string> = {
  LW: "#98002E", LE: "#EE3124", ST: "#794500", BR: "#69B143",
  RH: "#0099C7", KI: "#F57F25", MI: "#F57F25", GT: "#F7941D", BO: "#8B5A9C",
};

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function SearchScreen() {
  const t = useTheme();
  const { setHomeStation, setPendingFromStop } = useAppStore();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 280);
  const inputRef = useRef<TextInput>(null);

  // Route list — loaded once, filtered client-side
  const routesQuery = useQuery({
    queryKey: ["routes-train"],
    queryFn: () => api.routes("train"),
    staleTime: 6 * 60 * 60_000,
  });

  // Stations — searched via API
  const stopsQuery = useQuery({
    queryKey: ["stops-search", debouncedQuery],
    queryFn: () => api.stops(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60_000,
  });

  const filteredRoutes = useMemo(() => {
    if (!routesQuery.data || !debouncedQuery.trim()) return routesQuery.data ?? [];
    const q = debouncedQuery.toLowerCase();
    return routesQuery.data.filter(
      (r) =>
        r.route_short_name.toLowerCase().includes(q) ||
        r.route_long_name.toLowerCase().includes(q)
    );
  }, [routesQuery.data, debouncedQuery]);

  const stations = (stopsQuery.data ?? []).filter((s) =>
    /^[A-Z]{2,3}$/.test(s.stop_id)
  );

  const hasResults = stations.length > 0 || filteredRoutes.length > 0;
  const showEmpty = debouncedQuery.length >= 2 && !stopsQuery.isLoading && !hasResults;

  function handleSetHome(stop: Stop) {
    setHomeStation({ stop_id: stop.stop_id, stop_name: stop.stop_name });
    router.replace("/(tabs)/index" as any);
  }

  function handlePlanFrom(stop: Stop) {
    setPendingFromStop({ stop_id: stop.stop_id, stop_name: stop.stop_name });
    router.replace("/(tabs)/schedule" as any);
  }

  function handleRoute(route: Route) {
    router.push({
      pathname: "/route-detail" as any,
      params: {
        short_name: route.route_short_name,
        long_name: route.route_long_name,
        color: route.route_color,
        route_type: String(route.route_type),
      },
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Search header */}
      <View style={{
        backgroundColor: "#00853F",
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16,
        flexDirection: "row", alignItems: "center", gap: 10,
      }}>
        <View style={{
          flex: 1, flexDirection: "row", alignItems: "center",
          backgroundColor: "#FFFFFF", borderRadius: 12,
          paddingHorizontal: 12, paddingVertical: 10, gap: 8,
        }}>
          <Search color="#9BB0A0" size={16} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Stations, routes…"
            placeholderTextColor="#9BB0A0"
            style={{ flex: 1, color: "#1A2E1F", fontSize: 16 }}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <X color="#9BB0A0" size={16} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {/* Loading */}
        {stopsQuery.isLoading && (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <ActivityIndicator color={t.primary} />
          </View>
        )}

        {/* Empty state */}
        {showEmpty && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Text style={{ color: t.textMuted, fontSize: 14 }}>No results for "{debouncedQuery}"</Text>
          </View>
        )}

        {/* Default hint */}
        {debouncedQuery.length < 2 && !stopsQuery.isLoading && (
          <View style={{ paddingVertical: 40, alignItems: "center", gap: 8 }}>
            <Search color={t.textMuted} size={36} />
            <Text style={{ color: t.textMuted, fontSize: 14 }}>Type a station or route name</Text>
          </View>
        )}

        {/* Stations */}
        {stations.length > 0 && (
          <>
            <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8 }}>
              STATIONS
            </Text>
            <View style={{
              backgroundColor: t.surface, borderRadius: 14, overflow: "hidden",
              shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
              marginBottom: 20,
            }}>
              {stations.map((stop, i) => (
                <View
                  key={stop.stop_id}
                  style={{
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: t.border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: t.primaryBg, alignItems: "center", justifyContent: "center" }}>
                      <MapPin color={t.primary} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: "600" }}>{stop.stop_name}</Text>
                      <Text style={{ color: t.textMuted, fontSize: 12 }}>{stop.stop_id}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: t.border }}>
                    <TouchableOpacity
                      onPress={() => handleSetHome(stop)}
                      style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRightWidth: 0.5, borderRightColor: t.border }}
                    >
                      <Text style={{ color: t.primary, fontSize: 13, fontWeight: "700" }}>🏠 Set home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handlePlanFrom(stop)}
                      style={{ flex: 1, paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4 }}
                    >
                      <Text style={{ color: t.primary, fontSize: 13, fontWeight: "700" }}>Plan from here</Text>
                      <ArrowRight color={t.primary} size={13} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Routes */}
        {filteredRoutes.length > 0 && (
          <>
            <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8 }}>
              ROUTES
            </Text>
            <View style={{
              backgroundColor: t.surface, borderRadius: 14, overflow: "hidden",
              shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
            }}>
              {filteredRoutes.map((route, i) => {
                const color = ROUTE_COLORS[route.route_short_name] ?? `#${route.route_color}`;
                return (
                  <TouchableOpacity
                    key={route.route_id}
                    onPress={() => handleRoute(route)}
                    style={{
                      flexDirection: "row", alignItems: "center", padding: 14, gap: 12,
                      borderTopWidth: i > 0 ? 1 : 0, borderTopColor: t.border,
                    }}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 9, backgroundColor: color,
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Train color="#FFFFFF" size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: "600" }}>{route.route_short_name}</Text>
                      <Text style={{ color: t.textMuted, fontSize: 12 }}>{route.route_long_name}</Text>
                    </View>
                    <View style={{ backgroundColor: color, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>{route.route_short_name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
