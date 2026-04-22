import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Train, Bus } from "lucide-react-native";
import { useState } from "react";

import { router } from "expo-router";
import { api, type Route } from "@/lib/api";

function RouteRow({ route }: { route: Route }) {
  const color = route.route_color ? `#${route.route_color}` : "#9BB0A0";
  const isTrain = route.route_type === 2;

  function handlePress() {
    router.push({
      pathname: "/route-detail",
      params: {
        short_name: route.route_short_name,
        long_name: route.route_long_name,
        color: route.route_color,
        route_type: String(route.route_type),
      },
    });
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        gap: 14,
        shadowColor: "#1A2E1F",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isTrain ? <Train color="#fff" size={20} /> : <Bus color="#fff" size={20} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#1A2E1F", fontWeight: "700", fontSize: 15 }}>
          {route.route_long_name}
        </Text>
        <Text style={{ color: "#5A7A63", fontSize: 12, marginTop: 2 }}>
          {isTrain ? "GO Train" : "GO Bus"} · {route.route_short_name}
        </Text>
      </View>
      <Text style={{ color: "#9BB0A0", fontSize: 20 }}>›</Text>
    </TouchableOpacity>
  );
}

type Filter = "all" | "train" | "bus";

export default function RoutesScreen() {
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["routes"],
    queryFn: () => api.routes(),
    staleTime: 5 * 60_000,
  });

  const filtered = data?.filter((r) => {
    if (filter === "train") return r.route_type === 2;
    if (filter === "bus") return r.route_type === 3;
    return true;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F6F4" }}>
      {/* Green header */}
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Routes</Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>All GO Transit lines</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Filter chips */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {(["all", "train", "bus"] as Filter[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: filter === f ? "#00853F" : "#FFFFFF",
                borderWidth: 1.5,
                borderColor: filter === f ? "#00853F" : "#D8E8DC",
              }}
            >
              <Text
                style={{
                  color: filter === f ? "#FFFFFF" : "#5A7A63",
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {f === "all" ? "All" : f === "train" ? "🚆 Train" : "🚌 Bus"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color="#00853F" />
          </View>
        )}

        {isError && (
          <View
            style={{
              backgroundColor: "#FDECEA",
              borderWidth: 1,
              borderColor: "#C41230",
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#C41230", fontSize: 14, fontWeight: "600" }}>Could not load routes</Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 8 }}>
              <Text style={{ color: "#00853F", fontWeight: "600" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {filtered?.map((r) => (
          <RouteRow key={r.route_id} route={r} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
