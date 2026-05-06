import React from "react";
import {
  registerWidgetTaskHandler,
  requestWidgetUpdate,
} from "react-native-android-widget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoTrackerWidget, type WidgetData } from "../widgets/GoTrackerWidget.android";
import { formatTorontoTime, type Departure } from "../lib/api";

const WIDGET_NAME = "GoTrackerWidget";
const STORAGE_KEY = "widget_data";

async function widgetTaskHandler(props: {
  widgetAction: string;
  renderWidget: (element: React.ReactElement) => void;
}) {
  const { widgetAction, renderWidget } = props;

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const data: WidgetData | null = raw ? JSON.parse(raw) : null;
      renderWidget(React.createElement(GoTrackerWidget, { data }));
      break;
    }
    default:
      break;
  }
}

export function registerWidgetHandler() {
  registerWidgetTaskHandler(widgetTaskHandler);
}

export async function updateWidgetData(
  stationName: string,
  departures: Departure[],
  bufferMinutes: number,
) {
  const dep = departures[0] ?? null;

  const next: WidgetData["next"] = dep
    ? (() => {
        const depMs = new Date(dep.realtime_departure ?? dep.scheduled_departure).getTime();
        const displayTime = formatTorontoTime(dep.realtime_departure ?? dep.scheduled_departure);
        const leaveAtTime =
          bufferMinutes > 0
            ? formatTorontoTime(new Date(depMs - bufferMinutes * 60_000).toISOString())
            : null;
        return {
          routeShortName: dep.route_short_name,
          headsign: dep.headsign,
          displayTime,
          leaveAtTime,
          status: dep.status,
          delayMinutes: dep.delay_seconds ? Math.round(dep.delay_seconds / 60) : 0,
        };
      })()
    : null;

  const updatedAt = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const widgetData: WidgetData = { stationName, next, updatedAt };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(widgetData));

  await requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: async (_info) => React.createElement(GoTrackerWidget, { data: widgetData }),
  });
}
