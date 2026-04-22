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
import { MapPin, RefreshCw } from "lucide-react-native";
import { useEffect } from "react";

import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { DepartureCard } from "@/components/ui/DepartureCard";
import { router } from "expo-router";

export default function HomeScreen() {
  const { homeStation, hydrate } = useAppStore();

  useEffect(() => {
    hydrate();
  }, []);

  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } =
    useQuery({
      queryKey: ["departures", homeStation?.stop_id],
      queryFn: () => api.departures(homeStation!.stop_id, 3),
      enabled: !!homeStation,
      refetchInterval: 30_000,
    });

  const { data: alertsData } = useQuery({
    queryKey: ["alerts"],
    queryFn: api.alerts,
    refetchInterval: 60_000,
  });

  const relevantAlerts = alertsData?.alerts.filter((a) =>
    a.affected_routes.some((r) =>
      data?.departures.some((d) => d.route_short_name === r || d.route_id === r)
    )
  );

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F6F4" }}>
      {/* Green header bar */}
      <View
        style={{
          backgroundColor: "#00853F",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
        }}
      >
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
        {updatedTime && (
          <Text style={{ color: "#A8D5B8", fontSize: 11, marginTop: 4 }}>
            Updated {updatedTime}
          </Text>
        )}
      </View>

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
              backgroundColor: relevantAlerts[0].severity === "minor" ? "#FFF4E5" : "#FDECEA",
              borderWidth: 1,
              borderColor: relevantAlerts[0].severity === "minor" ? "#E07B00" : "#C41230",
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: relevantAlerts[0].severity === "minor" ? "#E07B00" : "#C41230",
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {relevantAlerts[0].header}
              </Text>
              <Text style={{ color: "#5A7A63", fontSize: 12, marginTop: 1 }}>
                Tap to view all alerts
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* No station set */}
        {!homeStation && (
          <TouchableOpacity
            onPress={() => router.push("/station-search")}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              padding: 28,
              alignItems: "center",
              gap: 10,
              shadowColor: "#00853F",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#E8F5EE",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin color="#00853F" size={28} />
            </View>
            <Text style={{ color: "#1A2E1F", fontSize: 17, fontWeight: "700", marginTop: 4 }}>
              Set your home station
            </Text>
            <Text style={{ color: "#5A7A63", fontSize: 13, textAlign: "center", lineHeight: 19 }}>
              See live departures from your GO station at a glance
            </Text>
            <View
              style={{
                marginTop: 8,
                backgroundColor: "#00853F",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                Choose Station
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Loading */}
        {isLoading && homeStation && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color="#00853F" />
          </View>
        )}

        {/* Error */}
        {isError && (
          <View
            style={{
              backgroundColor: "#FDECEA",
              borderWidth: 1,
              borderColor: "#C41230",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#C41230", fontSize: 14, fontWeight: "600" }}>
              Could not load departures
            </Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 10 }}>
              <Text style={{ color: "#00853F", fontSize: 14, fontWeight: "600" }}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Departures */}
        {data?.departures.map((d) => (
          <DepartureCard key={d.trip_id} departure={d} />
        ))}

        {data?.departures.length === 0 && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#5A7A63", fontSize: 14 }}>No upcoming departures</Text>
          </View>
        )}

        <Text
          style={{
            color: "#9BB0A0",
            fontSize: 11,
            textAlign: "center",
            marginTop: 24,
            lineHeight: 17,
          }}
        >
          GO Tracker is unofficial and not affiliated with Metrolinx or GO Transit.{"\n"}
          Data provided by Metrolinx under the Metrolinx Open Data License.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
