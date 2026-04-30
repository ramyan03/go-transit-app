import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

function Section({ title, children }: { title: string; children: string }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: 6 }}>{title}</Text>
      <Text style={{ color: t.textSecondary, fontSize: 14, lineHeight: 22 }}>{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ backgroundColor: "#00853F", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 }}
        >
          <ChevronLeft color="#A8D5B8" size={20} />
          <Text style={{ color: "#A8D5B8", fontSize: 13, fontWeight: "600" }}>More</Text>
        </TouchableOpacity>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>Privacy Policy</Text>
        <Text style={{ color: "#A8D5B8", fontSize: 12, marginTop: 2 }}>Effective April 30, 2026</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor: t.surface, borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <Text style={{ color: t.textSecondary, fontSize: 13, lineHeight: 20, fontStyle: "italic", marginBottom: 16 }}>
            GO Tracker is an unofficial, independently developed app for GO Transit commuters.
            It is not affiliated with, endorsed by, or operated by Metrolinx or GO Transit.
          </Text>

          <Section title="What data the app stores">
            {"The app stores the following data locally on your device using AsyncStorage. None of this information is sent to the app developer or any third party:\n\n• Your selected home station\n• Up to 5 saved stations\n• Up to 5 saved favourite journeys\n• Your appearance preference (light / dark / system)"}
          </Section>

          <Section title="Location">
            {"The Nearest Stations screen requests your device's GPS location to find nearby GO stations. Location data is used only on-device to calculate distances and is never transmitted outside your device."}
          </Section>

          <Section title="Transit data">
            {"Departure schedules, real-time alerts, and service information are fetched from a proxy server that calls the Metrolinx Open Data API. Requests contain only the station or route being queried — no personal information is included. Metrolinx Open Data is published under the Metrolinx Open Data Licence."}
          </Section>

          <Section title="Analytics and tracking">
            {"GO Tracker contains no analytics SDKs, crash reporters, advertising networks, or any form of user tracking."}
          </Section>

          <Section title="Children">
            {"GO Tracker does not knowingly collect any data from children under 13."}
          </Section>

          <Section title="Changes">
            {"This policy may be updated to reflect changes in the app. The effective date at the top of this page will be updated accordingly."}
          </Section>

          <Section title="Contact">
            {"Questions or concerns: ramyanchelva@gmail.com"}
          </Section>
        </View>

        <Text style={{ color: t.textMuted, fontSize: 11, textAlign: "center", lineHeight: 17, marginBottom: 8 }}>
          GO Tracker is unofficial and not affiliated with Metrolinx or GO Transit.{"\n"}
          Data provided under the Metrolinx Open Data Licence.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
