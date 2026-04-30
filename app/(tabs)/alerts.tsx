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
import { TriangleAlert, CheckCircle, Clock } from "lucide-react-native";
import { useState } from "react";

import { api, type Alert, type AlertEffect } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";
import { useLayout } from "@/hooks/useLayout";

type TabId = "alerts" | "delays";

const DELAY_EFFECTS: AlertEffect[] = ["significant_delays", "detour"];

function isDelay(a: Alert): boolean {
  return DELAY_EFFECTS.includes(a.effect);
}

function AlertCard({ alert }: { alert: Alert }) {
  const t = useTheme();

  const cfg = {
    minor: {
      bg: t.warningBg, border: t.warning, text: t.warning,
      label: "Minor", badgeBg: t.warning,
    },
    major: {
      bg: t.dangerBg, border: t.danger, text: t.danger,
      label: "Major", badgeBg: t.danger,
    },
    cancelled: {
      bg: t.dangerBg, border: t.danger, text: t.danger,
      label: "Cancelled", badgeBg: t.danger,
    },
  }[alert.severity];

  const ts = new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const effectLabel: Partial<Record<AlertEffect, string>> = {
    significant_delays: "Significant Delays",
    detour:             "Detour",
    no_service:         "No Service",
    reduced_service:    "Reduced Service",
    modified_service:   "Modified Service",
    stop_moved:         "Stop Moved",
  };

  return (
    <View style={{
      backgroundColor: cfg.bg, borderWidth: 1.5, borderColor: cfg.border,
      borderRadius: 12, padding: 14, marginBottom: 10,
    }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
          <TriangleAlert color={cfg.text} size={15} />
          <Text style={{ color: cfg.text, fontWeight: "700", fontSize: 14, flex: 1 }}>
            {alert.header}
          </Text>
        </View>
        <View style={{ gap: 4, alignItems: "flex-end" }}>
          <View style={{ backgroundColor: cfg.badgeBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>{cfg.label}</Text>
          </View>
          {effectLabel[alert.effect] && (
            <View style={{ backgroundColor: "rgba(0,0,0,0.08)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
              <Text style={{ color: cfg.text, fontSize: 9, fontWeight: "700" }}>
                {effectLabel[alert.effect]}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={{ color: t.textPrimary, fontSize: 13, lineHeight: 19 }}>
        {alert.description}
      </Text>

      {alert.affected_routes.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {alert.affected_routes.map((r) => (
            <View key={r} style={{ backgroundColor: "rgba(0,0,0,0.06)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 }}>
              <Text style={{ color: t.textPrimary, fontSize: 11, fontWeight: "700" }}>{r}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 8 }}>{ts}</Text>
    </View>
  );
}

function EmptyState({ tab }: { tab: TabId }) {
  const t = useTheme();
  return (
    <View style={{
      backgroundColor: t.surface, borderRadius: 14, padding: 32, alignItems: "center", gap: 10,
      shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1,
    }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.primaryBg, alignItems: "center", justifyContent: "center" }}>
        {tab === "delays" ? <Clock color={t.primary} size={26} /> : <CheckCircle color={t.primary} size={28} />}
      </View>
      <Text style={{ color: t.textPrimary, fontSize: 17, fontWeight: "700", marginTop: 4 }}>
        {tab === "delays" ? "No delays" : "All clear"}
      </Text>
      <Text style={{ color: t.textSecondary, fontSize: 13 }}>
        {tab === "delays" ? "No significant delays or detours" : "No active service disruptions"}
      </Text>
    </View>
  );
}

export default function AlertsScreen() {
  const t = useTheme();
  const { hPad } = useLayout();
  const [activeTab, setActiveTab] = useState<TabId>("alerts");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["alerts"],
    queryFn: api.alerts,
    refetchInterval: 60_000,
  });

  const allAlerts = data?.alerts ?? [];
  const delays = allAlerts.filter(isDelay);
  const alerts = allAlerts.filter((a) => !isDelay(a));
  const displayed = activeTab === "delays" ? delays : alerts;

  const tabCount = (tab: TabId) => {
    const count = tab === "delays" ? delays.length : alerts.length;
    return count > 0 ? ` (${count})` : "";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 0 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Service Alerts</Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>
          {allAlerts.length > 0
            ? `${allAlerts.length} active disruption${allAlerts.length !== 1 ? "s" : ""}`
            : "Live updates every 60s"}
        </Text>

        {/* Tab toggle */}
        <View style={{ flexDirection: "row", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 10, padding: 3, marginTop: 14, marginBottom: 0 }}>
          {(["alerts", "delays"] as TabId[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 8,
                backgroundColor: activeTab === tab ? "#FFFFFF" : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ color: activeTab === tab ? "#00853F" : "#A8D5B8", fontWeight: "700", fontSize: 13 }}>
                {tab === "alerts" ? `Alerts${tabCount("alerts")}` : `Delays${tabCount("delays")}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: hPad, paddingVertical: 16 }}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor="#00853F" />
        }
      >
        {isLoading && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={t.primary} />
          </View>
        )}

        {isError && (
          <View style={{
            backgroundColor: t.surface, borderRadius: 14, padding: 28, alignItems: "center", gap: 10,
            shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1,
          }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.warningBg, alignItems: "center", justifyContent: "center" }}>
              <TriangleAlert color={t.warning} size={26} />
            </View>
            <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 4 }}>
              Alerts unavailable
            </Text>
            <Text style={{ color: t.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 19 }}>
              Real-time alerts require a Metrolinx API subscription. Check back once your API key is fully provisioned.
            </Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 4 }}>
              <Text style={{ color: t.primary, fontWeight: "600", fontSize: 14 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && displayed.length === 0 && (
          <EmptyState tab={activeTab} />
        )}

        {displayed.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
