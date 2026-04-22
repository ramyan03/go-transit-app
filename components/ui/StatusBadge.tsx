import { View, Text } from "react-native";

export type DepartureStatus = "ON_TIME" | "DELAYED" | "CANCELLED" | "SCHEDULED";

const config: Record<DepartureStatus, { label: string; bg: string; text: string }> = {
  ON_TIME:   { label: "On Time",   bg: "#E8F5EE", text: "#00853F" },
  DELAYED:   { label: "Delayed",   bg: "#FFF4E5", text: "#E07B00" },
  CANCELLED: { label: "Cancelled", bg: "#FDECEA", text: "#C41230" },
  SCHEDULED: { label: "Scheduled", bg: "#F1F5F9", text: "#64748B" },
};

export function StatusBadge({ status }: { status: DepartureStatus }) {
  const { label, bg, text } = config[status] ?? config.SCHEDULED;
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
      }}
    >
      <Text style={{ color: text, fontSize: 11, fontWeight: "700" }}>
        {label}
      </Text>
    </View>
  );
}
