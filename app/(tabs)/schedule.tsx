import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";

const LINES = [
  { id: "LW", name: "Lakeshore West", color: "#009BC9" },
  { id: "LE", name: "Lakeshore East", color: "#EE3124" },
  { id: "ST", name: "Stouffville",    color: "#794500" },
  { id: "BR", name: "Barrie",         color: "#69B143" },
  { id: "RH", name: "Richmond Hill",  color: "#00853F" },
  { id: "KI", name: "Kitchener",      color: "#F5A623" },
  { id: "MI", name: "Milton",         color: "#0070C0" },
];

function formatDate(d: Date) {
  return d.toLocaleDateString("en-CA");
}

function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export default function ScheduleScreen() {
  const [selectedLine, setSelectedLine] = useState(LINES[0]);
  const [direction, setDirection] = useState<"inbound" | "outbound">("inbound");
  const [date, setDate] = useState(new Date());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F6F4" }}>
      {/* Green header */}
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Schedule</Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>Browse timetables offline</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Line picker */}
        <Text style={{ color: "#5A7A63", fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8 }}>
          LINE
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {LINES.map((line) => {
            const active = selectedLine.id === line.id;
            return (
              <TouchableOpacity
                key={line.id}
                onPress={() => setSelectedLine(line)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: active ? line.color : "#FFFFFF",
                  borderWidth: 1.5,
                  borderColor: active ? line.color : "#D8E8DC",
                  shadowColor: active ? line.color : "transparent",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: active ? 2 : 0,
                }}
              >
                <Text
                  style={{
                    color: active ? "#FFFFFF" : "#5A7A63",
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {line.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Direction toggle */}
        <Text style={{ color: "#5A7A63", fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8 }}>
          DIRECTION
        </Text>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#E8F5EE",
            borderRadius: 10,
            padding: 4,
            marginBottom: 20,
          }}
        >
          {(["inbound", "outbound"] as const).map((dir) => (
            <TouchableOpacity
              key={dir}
              onPress={() => setDirection(dir)}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 8,
                backgroundColor: direction === dir ? "#00853F" : "transparent",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: direction === dir ? "#FFFFFF" : "#5A7A63",
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                {dir === "inbound" ? "→ Union" : "← Outbound"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date picker */}
        <Text style={{ color: "#5A7A63", fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8 }}>
          DATE
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#D8E8DC",
            padding: 12,
            marginBottom: 24,
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={() => setDate((d) => addDays(d, -1))}>
            <ChevronLeft color="#00853F" size={22} />
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <CalendarDays color="#00853F" size={16} />
            <Text style={{ color: "#1A2E1F", fontWeight: "700", fontSize: 14 }}>
              {date.toDateString() === new Date().toDateString()
                ? `Today — ${formatDate(date)}`
                : formatDate(date)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setDate((d) => addDays(d, 1))}>
            <ChevronRight color="#00853F" size={22} />
          </TouchableOpacity>
        </View>

        {/* Placeholder timetable */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#D8E8DC",
            padding: 24,
            alignItems: "center",
            gap: 6,
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: selectedLine.color,
              marginBottom: 4,
            }}
          />
          <Text style={{ color: "#1A2E1F", fontWeight: "700", fontSize: 15 }}>
            {selectedLine.name}
          </Text>
          <Text style={{ color: "#5A7A63", fontSize: 13 }}>
            {direction === "inbound" ? "→ Union Station" : "← Outbound"} · {formatDate(date)}
          </Text>
          <Text style={{ color: "#9BB0A0", fontSize: 12, marginTop: 8, textAlign: "center", lineHeight: 18 }}>
            Timetable loads from on-device SQLite after GTFS data is downloaded.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
