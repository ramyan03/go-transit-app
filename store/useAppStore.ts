import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SavedStation {
  stop_id: string;
  stop_name: string;
}

export interface FavouriteJourney {
  id: string; // `${from.stop_id}-${to.stop_id}`
  from: SavedStation;
  to: SavedStation;
}

interface AppState {
  homeStation: SavedStation | null;
  savedStations: SavedStation[];
  favouriteJourneys: FavouriteJourney[];
  theme: "light" | "dark" | "system";
  gtfsVersion: string | null;
  // Session-only: set by global search to pre-fill Journey Planner FROM field
  pendingFromStop: SavedStation | null;

  setHomeStation: (station: SavedStation | null) => void;
  addSavedStation: (station: SavedStation) => void;
  removeSavedStation: (stop_id: string) => void;
  addFavouriteJourney: (from: SavedStation, to: SavedStation) => void;
  removeFavouriteJourney: (id: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setGtfsVersion: (version: string) => void;
  setPendingFromStop: (stop: SavedStation | null) => void;
  hydrate: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  homeStation: null,
  savedStations: [],
  favouriteJourneys: [],
  theme: "system",
  gtfsVersion: null,
  pendingFromStop: null,

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

  addFavouriteJourney: async (from, to) => {
    const id = `${from.stop_id}-${to.stop_id}`;
    const current = get().favouriteJourneys;
    if (current.find((j) => j.id === id)) return;
    if (current.length >= 5) return;
    const next = [...current, { id, from, to }];
    set({ favouriteJourneys: next });
    await AsyncStorage.setItem("favourite_journeys", JSON.stringify(next));
  },

  removeFavouriteJourney: async (id) => {
    const next = get().favouriteJourneys.filter((j) => j.id !== id);
    set({ favouriteJourneys: next });
    await AsyncStorage.setItem("favourite_journeys", JSON.stringify(next));
  },

  setTheme: async (theme) => {
    set({ theme });
    await AsyncStorage.setItem("theme", theme);
  },

  setGtfsVersion: async (version) => {
    set({ gtfsVersion: version });
    await AsyncStorage.setItem("gtfs_version", version);
  },

  setPendingFromStop: (stop) => set({ pendingFromStop: stop }),

  hydrate: async () => {
    const [homeRaw, savedRaw, favsRaw, theme, gtfsVersion] = await Promise.all([
      AsyncStorage.getItem("home_station"),
      AsyncStorage.getItem("saved_stations"),
      AsyncStorage.getItem("favourite_journeys"),
      AsyncStorage.getItem("theme"),
      AsyncStorage.getItem("gtfs_version"),
    ]);

    set({
      homeStation: homeRaw ? JSON.parse(homeRaw) : null,
      savedStations: savedRaw ? JSON.parse(savedRaw) : [],
      favouriteJourneys: favsRaw ? JSON.parse(favsRaw) : [],
      theme: (theme as AppState["theme"]) ?? "system",
      gtfsVersion: gtfsVersion ?? null,
    });
  },
}));
