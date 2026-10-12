import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AccessibilityInfo, useColorScheme } from "react-native";
import { getStoredItem, setStoredItem } from "../storage/appStorage";

export const palettes = {
  forest: {
    name: "Forest & mint",
    light: "#14634B",
    dark: "#7FE0BB",
    tint: "#E2F3EC",
    night: "#18372D",
    accent: "#D4AE56",
  },
  ocean: {
    name: "Ocean & lavender",
    light: "#4357B2",
    dark: "#B0BFFF",
    tint: "#EAEFFD",
    night: "#252F50",
    accent: "#A38ACF",
  },
  sunset: {
    name: "Terracotta & sand",
    light: "#974329",
    dark: "#FFB49A",
    tint: "#FBECE5",
    night: "#442C26",
    accent: "#D5AB69",
  },
};
export function themeColors(palette = "forest", dark = false) {
  const p = Object.hasOwn(palettes, palette)
    ? palettes[palette]
    : palettes.forest;
  return {
    primary: dark ? p.dark : p.light,
    primaryLight: dark ? p.night : p.tint,
    secondary: p.accent,
    background: dark ? "#111A20" : "#F5F6F2",
    card: dark ? "#1D282F" : "#FFFFFF",
    text: dark ? "#F0F4F5" : "#202C35",
    muted: dark ? "#B3C0C7" : "#5C6B74",
    border: dark ? "#38474F" : "#DCE4E3",
    danger: dark ? "#FFA8A8" : "#B42332",
    success: dark ? p.dark : p.light,
    onPrimary: dark ? "#15232A" : "#FFFFFF",
    dark,
  };
}
const fallback = { colors: themeColors(), mode: "system", palette: "forest" };
const Context = createContext(fallback);
const KEY = "FUEL_TRIP_PK_APPEARANCE";
export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [settings, setSettings] = useState({
    mode: "system",
    palette: "forest",
  });
  const [error, setError] = useState("");
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active && !receivedEvent) setReduceMotion(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        receivedEvent = true;
        setReduceMotion(value);
      },
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  const changed = useRef(false);
  const revision = useRef(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  useEffect(() => {
    let active = true;
    getStoredItem(KEY)
      .then((raw) => {
        if (!active || changed.current || !raw) return;
        const saved = JSON.parse(raw);
        if (
          ["system", "light", "dark"].includes(saved.mode) &&
          Object.hasOwn(palettes, saved.palette)
        )
          setSettings(saved);
      })
      .catch(() => {
        if (active)
          setError(
            "Appearance could not be loaded. Choose a theme to save it again.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  function update(next) {
    changed.current = true;
    const current = ++revision.current;
    const updated = { ...settingsRef.current, ...next };
    settingsRef.current = updated;
    setSettings(updated);
    setStoredItem(KEY, JSON.stringify(updated))
      .then(() => {
        if (current === revision.current) setError("");
      })
      .catch(() => {
        if (current === revision.current)
          setError("Theme applied for this session; saving failed.");
      });
  }
  const dark =
    settings.mode === "dark" ||
    (settings.mode === "system" && system === "dark");
  const colors = useMemo(
    () => themeColors(settings.palette, dark),
    [settings.palette, dark],
  );
  return (
    <Context.Provider
      value={{ ...settings, colors, update, error, reduceMotion }}
    >
      {children}
    </Context.Provider>
  );
}
export function useTheme() {
  return useContext(Context);
}
export function useThemedStyles(factory) {
  const { colors } = useTheme();
  const styles = useMemo(() => factory(colors), [factory, colors]);
  return { colors, styles };
}
