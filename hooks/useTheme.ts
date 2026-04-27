import { useColorScheme } from "react-native";
import { useAppStore } from "@/store/useAppStore";
import { light, dark, type Theme } from "@/lib/theme";

export function useTheme(): Theme {
  const { theme } = useAppStore();
  const system = useColorScheme();
  if (theme === "dark") return dark;
  if (theme === "light") return light;
  return system === "dark" ? dark : light;
}
