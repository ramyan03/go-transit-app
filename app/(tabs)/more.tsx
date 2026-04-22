import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Route, GitCompare, Train, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";

interface MoreItem {
  icon: (color: string) => React.ReactNode;
  title: string;
  description: string;
  route: string;
}

const ITEMS: MoreItem[] = [
  {
    icon: (c) => <Route color={c} size={22} />,
    title: "Routes",
    description: "All GO Train and bus routes",
    route: "/(tabs)/routes",
  },
  {
    icon: (c) => <GitCompare color={c} size={22} />,
    title: "Compare Stations",
    description: "Side-by-side next departures from two stops",
    route: "/(tabs)/compare",
  },
  {
    icon: (c) => <Train color={c} size={22} />,
    title: "Fleet",
    description: "GO Transit locomotive and coach specs",
    route: "/(tabs)/fleet",
  },
];

export default function MoreScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F6F4" }}>
      <View
        style={{
          backgroundColor: "#00853F",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
        }}
      >
        <Text style={{ color: "#A8D5B8", fontSize: 11, fontWeight: "600", letterSpacing: 0.8 }}>
          GO TRACKER
        </Text>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginTop: 4 }}>
          More
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            overflow: "hidden",
            shadowColor: "#1A2E1F",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderBottomWidth: index < ITEMS.length - 1 ? 1 : 0,
                borderBottomColor: "#F0F5F1",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  backgroundColor: "#E8F5EE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.icon("#00853F")}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#1A2E1F", fontSize: 15, fontWeight: "700" }}>
                  {item.title}
                </Text>
                <Text style={{ color: "#5A7A63", fontSize: 12, marginTop: 1 }}>
                  {item.description}
                </Text>
              </View>
              <ChevronRight color="#9BB0A0" size={18} />
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={{
            color: "#9BB0A0",
            fontSize: 11,
            textAlign: "center",
            marginTop: 32,
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
