import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SavedStation {
  stop_id: string;
  stop_name: string;
}

interface AppState {
  homeStation: SavedStation | null;
  savedStations: SavedStation[];
  theme: "light" | "dark" | "system";
  gtfsVersion: string | null;

  setHomeStation: (station: SavedStation | null) => void;
  addSavedStation: (station: SavedStation) => void;
  removeSavedStation: (stop_id: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setGtfsVersion: (version: string) => void;
  hydrate: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  homeStation: null,
  savedStations: [],
  theme: "system",
  gtfsVersion: null,

  setHomeStation: async (station) => {
    set({ homeStation: station });
    await AsyncStorage.setItem(
      "home_station",
      station ? JSON.stringify(station) : ""
    );
  },

  addSavedStation: async (station) => {
    const current = get().savedStations;
    if (current.find((s) => s.stop_id === station.stop_id)) return;
    if (current.length >= 5) return;
    const next = [...current, station];
    set({ savedStations: next });
    await AsyncStorage.setItem("saved_stations", JSON.stringify(next));
  },

  removeSavedStation: async (stop_id) => {
    const next = get().savedStations.filter((s) => s.stop_id !== stop_id);
    set({ savedStations: next });
    await AsyncStorage.setItem("saved_stations", JSON.stringify(next));
  },

  setTheme: async (theme) => {
    set({ theme });
    await AsyncStorage.setItem("theme", theme);
  },

  setGtfsVersion: async (version) => {
    set({ gtfsVersion: version });
    await AsyncStorage.setItem("gtfs_version", version);
  },

  hydrate: async () => {
    const [homeRaw, savedRaw, theme, gtfsVersion] = await Promise.all([
      AsyncStorage.getItem("home_station"),
      AsyncStorage.getItem("saved_stations"),
      AsyncStorage.getItem("theme"),
      AsyncStorage.getItem("gtfs_version"),
    ]);

    set({
      homeStation: homeRaw ? JSON.parse(homeRaw) : null,
      savedStations: savedRaw ? JSON.parse(savedRaw) : [],
      theme: (theme as AppState["theme"]) ?? "system",
      gtfsVersion: gtfsVersion ?? null,
    });
  },
}));
