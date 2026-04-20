import { View, Text } from "react-native";

type Status = "on_time" | "delayed" | "cancelled";

const config: Record<Status, { label: string; bg: string; text: string }> = {
  on_time:   { label: "On Time",   bg: "#E8F5EE", text: "#00853F" },
  delayed:   { label: "Delayed",   bg: "#FFF4E5", text: "#E07B00" },
  cancelled: { label: "Cancelled", bg: "#FDECEA", text: "#C41230" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, bg, text } = config[status];
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
