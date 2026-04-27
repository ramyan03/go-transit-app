import { View, Text } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export type DepartureStatus = "ON_TIME" | "DELAYED" | "CANCELLED" | "SCHEDULED";

export function StatusBadge({ status }: { status: DepartureStatus }) {
  const t = useTheme();

  const config: Record<DepartureStatus, { label: string; bg: string; text: string }> = {
    ON_TIME:   { label: "On Time",   bg: t.primaryBg,  text: t.primary },
    DELAYED:   { label: "Delayed",   bg: t.warningBg,  text: t.warning },
    CANCELLED: { label: "Cancelled", bg: t.dangerBg,   text: t.danger  },
    SCHEDULED: { label: "Scheduled", bg: t.surfaceAlt, text: t.textMuted },
  };

  const { label, bg, text } = config[status] ?? config.SCHEDULED;
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
      <Text style={{ color: text, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}
