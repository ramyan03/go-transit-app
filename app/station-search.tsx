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
import { Search, MapPin, X } from "lucide-react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";

import { api, type Stop } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

export default function StationSearchScreen() {
  const [query, setQuery] = useState("");
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { setHomeStation, addSavedStation } = useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ["stops", query],
    queryFn: () => api.stops(query || undefined),
    enabled: true,
    staleTime: 5 * 60_000,
  });

  // Without a search query, show only GO Train stations (2-letter stop_id like UN, MK, OS).
  // Searching shows all results including bus stops.
  const isTrainStation = (s: Stop) => /^[A-Z]{2,3}$/.test(s.stop_id);
  const filtered = query
    ? data?.filter((s) => s.stop_name.toLowerCase().includes(query.toLowerCase()))
    : data?.filter(isTrainStation);

  function handleSelect(stop: Stop) {
    const station = { stop_id: stop.stop_id, stop_name: stop.stop_name };
    if (mode === "saved") {
      addSavedStation(station);
    } else {
      setHomeStation(station);
      addSavedStation(station);
    }
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F6F4" }}>
      {/* Green header */}
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>
            {mode === "saved" ? "Add Station" : "Choose Station"}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X color="#FFFFFF" size={18} />
          </TouchableOpacity>
        </View>

        {/* Search input inside header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 8,
            marginTop: 14,
          }}
        >
          <Search color="#9BB0A0" size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search GO stations..."
            placeholderTextColor="#9BB0A0"
            style={{ flex: 1, color: "#1A2E1F", fontSize: 15 }}
            autoFocus
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <X color="#9BB0A0" size={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading && (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator color="#00853F" />
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {filtered?.map((stop) => (
          <TouchableOpacity
            key={stop.stop_id}
            onPress={() => handleSelect(stop)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 14,
              marginBottom: 8,
              gap: 12,
              shadowColor: "#1A2E1F",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "#E8F5EE",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin color="#00853F" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#1A2E1F", fontWeight: "700", fontSize: 15 }}>
                {stop.stop_name}
              </Text>
              <Text style={{ color: "#9BB0A0", fontSize: 12, marginTop: 1 }}>
                {stop.stop_id}
              </Text>
            </View>
            {stop.wheelchair_boarding === 1 && (
              <Text style={{ color: "#9BB0A0", fontSize: 14 }}>♿</Text>
            )}
          </TouchableOpacity>
        ))}

        {!isLoading && filtered?.length === 0 && (
          <Text style={{ color: "#9BB0A0", textAlign: "center", marginTop: 24, fontSize: 14 }}>
            No stations found for "{query}"
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
