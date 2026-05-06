import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { ColorProp } from "react-native-android-widget";

export interface WidgetNextDep {
  routeShortName: string;
  headsign: string;
  displayTime: string;
  leaveAtTime: string | null;
  status: "ON_TIME" | "DELAYED" | "CANCELLED" | "SCHEDULED";
  delayMinutes: number;
}

export interface WidgetData {
  stationName: string;
  next: WidgetNextDep | null;
  updatedAt: string;
}

const ROUTE_COLORS: Record<string, ColorProp> = {
  LW: "#98002E", LE: "#EE3124", ST: "#794500", BR: "#69B143",
  RH: "#0099C7", KI: "#F57F25", MI: "#F57F25", GT: "#F7941D", BO: "#8B5A9C",
};

export function GoTrackerWidget({ data }: { data: WidgetData | null }) {
  const dep = data?.next ?? null;
  const routeColor: ColorProp = dep ? (ROUTE_COLORS[dep.routeShortName] ?? "#9BB0A0") : "#9BB0A0";

  const statusText = dep
    ? dep.status === "DELAYED"   ? `+${dep.delayMinutes} min`
    : dep.status === "CANCELLED" ? "Cancelled"
    : dep.status === "ON_TIME"   ? "On Time"
    : "Scheduled"
    : "";

  const statusColor: ColorProp = dep
    ? dep.status === "DELAYED"   ? "#E07B00"
    : dep.status === "CANCELLED" ? "#C41230"
    : dep.status === "ON_TIME"   ? "#00853F"
    : "#9BB0A0"
    : "#9BB0A0";

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 14,
        width: "match_parent",
        height: "match_parent",
      }}
    >
      {/* Header: logo + station */}
      <FlexWidget style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <TextWidget
          text="GO Tracker"
          style={{ color: "#00853F", fontSize: 11, fontWeight: "800" }}
        />
        {data && (
          <FlexWidget style={{ flex: 1, marginLeft: 4 }}>
            <TextWidget
              text={`· ${data.stationName}`}
              style={{ color: "#5A7A63", fontSize: 11 }}
              maxLines={1}
            />
          </FlexWidget>
        )}
      </FlexWidget>

      {dep ? (
        <>
          {/* Route badge + headsign */}
          <FlexWidget style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <FlexWidget
              style={{
                backgroundColor: routeColor,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginRight: 8,
              }}
            >
              <TextWidget
                text={dep.routeShortName}
                style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}
              />
            </FlexWidget>
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget
                text={dep.headsign}
                style={{ color: "#1A2E1F", fontSize: 12 }}
                maxLines={1}
              />
            </FlexWidget>
          </FlexWidget>

          {/* Large departure time + status */}
          <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
            <TextWidget
              text={dep.displayTime}
              style={{ color: "#1A2E1F", fontSize: 34, fontWeight: "800" }}
            />
            <TextWidget
              text={`  ${statusText}`}
              style={{ color: statusColor, fontSize: 13, fontWeight: "700" }}
            />
          </FlexWidget>

          {/* Leave at */}
          {dep.leaveAtTime && (
            <TextWidget
              text={`Leave at ${dep.leaveAtTime}`}
              style={{ color: "#00853F", fontSize: 13, fontWeight: "600", marginTop: 2 }}
            />
          )}
        </>
      ) : (
        <TextWidget
          text="Open GO Tracker to load departures"
          style={{ color: "#9BB0A0", fontSize: 13 }}
        />
      )}

      {/* Spacer */}
      <FlexWidget style={{ flex: 1 }} />

      {/* Footer */}
      <TextWidget
        text={data ? `Updated ${data.updatedAt}` : "Tap to open"}
        style={{ color: "#9BB0A0", fontSize: 11 }}
        maxLines={1}
      />
    </FlexWidget>
  );
}
