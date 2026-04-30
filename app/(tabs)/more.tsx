import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GitCompare, MapPin, Route, Train, ChevronRight, Sun, Moon, Smartphone } from "lucide-react-native";
import { router } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import { useAppStore } from "@/store/useAppStore";
import { useLayout } from "@/hooks/useLayout";

interface MoreItem {
  icon: (color: string) => React.ReactNode;
  title: string;
  description: string;
  route: string;
}

const ITEMS: MoreItem[] = [
  {
    icon: (c) => <MapPin color={c} size={22} />,
    title: "Nearest Stations",
    description: "Find GO train stations closest to you",
    route: "/(tabs)/nearest",
  },
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
  {
    icon: (c) => <ChevronRight color={c} size={22} />,
    title: "Privacy Policy",
    description: "How GO Tracker handles your data",
    route: "/privacy",
  },
];

type ThemePref = "light" | "dark" | "system";

const THEME_OPTIONS: { key: ThemePref; label: string; icon: (c: string) => React.ReactNode }[] = [
  { key: "light",  label: "Light",  icon: (c) => <Sun color={c} size={16} /> },
  { key: "dark",   label: "Dark",   icon: (c) => <Moon color={c} size={16} /> },
  { key: "system", label: "System", icon: (c) => <Smartphone color={c} size={16} /> },
];

export default function MoreScreen() {
  const t = useTheme();
  const { hPad } = useLayout();
  const { theme, setTheme } = useAppStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#A8D5B8", fontSize: 11, fontWeight: "600", letterSpacing: 0.8 }}>
          GO TRACKER
        </Text>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginTop: 4 }}>More</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: hPad, paddingVertical: 16 }}>
        {/* Navigation items */}
        <View style={{
          backgroundColor: t.surface, borderRadius: 14, overflow: "hidden",
          shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
        }}>
          {ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 16,
                borderBottomWidth: index < ITEMS.length - 1 ? 1 : 0,
                borderBottomColor: t.border,
                gap: 14,
              }}
            >
              <View style={{
                width: 42, height: 42, borderRadius: 11,
                backgroundColor: t.primaryBg, alignItems: "center", justifyContent: "center",
              }}>
                {item.icon(t.primary)}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: "700" }}>{item.title}</Text>
                <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: 1 }}>{item.description}</Text>
              </View>
              <ChevronRight color={t.textMuted} size={18} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme toggle */}
        <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginTop: 28, marginBottom: 10 }}>
          APPEARANCE
        </Text>
        <View style={{
          backgroundColor: t.surface, borderRadius: 14,
          shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
          padding: 4, flexDirection: "row", gap: 4,
        }}>
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setTheme(opt.key)}
                style={{
                  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                  gap: 6, paddingVertical: 10, borderRadius: 10,
                  backgroundColor: active ? t.primary : "transparent",
                }}
              >
                {opt.icon(active ? "#FFFFFF" : t.textSecondary)}
                <Text style={{ color: active ? "#FFFFFF" : t.textSecondary, fontWeight: "700", fontSize: 13 }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ color: t.textMuted, fontSize: 11, textAlign: "center", marginTop: 32, lineHeight: 17 }}>
          GO Tracker is unofficial and not affiliated with Metrolinx or GO Transit.{"\n"}
          Data provided by Metrolinx under the Metrolinx Open Data License.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
