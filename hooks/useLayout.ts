import { useWindowDimensions } from "react-native";

const CONTENT_MAX_WIDTH = 720;

export function useLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const hPad = isTablet ? Math.max(32, (width - CONTENT_MAX_WIDTH) / 2) : 16;
  return { isTablet, hPad };
}
