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
import { TriangleAlert, CheckCircle } from "lucide-react-native";

import { api, type Alert } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";

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
        <View style={{ backgroundColor: cfg.badgeBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>{cfg.label}</Text>
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

export default function AlertsScreen() {
  const t = useTheme();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["alerts"],
    queryFn: api.alerts,
    refetchInterval: 60_000,
  });

  const activeAlerts = data?.alerts ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Service Alerts</Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>
          {activeAlerts.length > 0
            ? `${activeAlerts.length} active disruption${activeAlerts.length > 1 ? "s" : ""}`
            : "Live updates every 60s"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
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
              Real-time alerts require a Metrolinx API subscription. Check back once your API key is fully provisioned (up to 10 days).
            </Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 4 }}>
              <Text style={{ color: t.primary, fontWeight: "600", fontSize: 14 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && activeAlerts.length === 0 && (
          <View style={{
            backgroundColor: t.surface, borderRadius: 14, padding: 32, alignItems: "center", gap: 10,
            shadowColor: t.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1,
          }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.primaryBg, alignItems: "center", justifyContent: "center" }}>
              <CheckCircle color={t.primary} size={28} />
            </View>
            <Text style={{ color: t.textPrimary, fontSize: 17, fontWeight: "700", marginTop: 4 }}>All clear</Text>
            <Text style={{ color: t.textSecondary, fontSize: 13 }}>No active service disruptions</Text>
          </View>
        )}

        {activeAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
