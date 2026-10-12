import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Screen from "../components/Screen";
import Reveal from "../components/Reveal";
import { palettes, useTheme, useThemedStyles } from "../theme/ThemeContext";

export default function AppearanceScreen() {
  const { mode, palette, update, error } = useTheme();
  const { styles } = useThemedStyles(createStyles);
  return (
    <Screen>
      <Text style={styles.eyebrow}>MAKE IT YOURS</Text>
      <Text style={styles.title}>
        {"A different mood.\nThe same adventure."}
      </Text>
      <Text style={styles.subtitle}>
        Your colours follow you across every screen.
      </Text>
      <Text style={styles.label}>Display mode</Text>
      <View style={styles.modes}>
        {["system", "light", "dark"].map((item) => (
          <TouchableOpacity
            key={item}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === item }}
            onPress={() => update({ mode: item })}
            style={[styles.mode, mode === item && styles.active]}
          >
            <Text style={[styles.modeText, mode === item && styles.activeText]}>
              {item === "system"
                ? "Automatic"
                : item === "light"
                  ? "Light"
                  : "Dark"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Colour story</Text>
      {Object.entries(palettes).map(([key, p], i) => (
        <Reveal key={key} delay={i * 60}>
          <TouchableOpacity
            accessibilityRole="radio"
            accessibilityState={{ checked: palette === key }}
            accessibilityLabel={p.name}
            onPress={() => update({ palette: key })}
            style={[styles.choice, palette === key && styles.selected]}
          >
            <View style={styles.swatches}>
              {[p.light, p.dark, p.accent].map((colour) => (
                <View
                  key={colour}
                  style={[styles.swatch, { backgroundColor: colour }]}
                />
              ))}
            </View>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.check}>
              {palette === key ? "Selected ✓" : "Try it →"}
            </Text>
          </TouchableOpacity>
        </Reveal>
      ))}
      {!!error && (
        <Text accessibilityRole="alert" style={styles.subtitle}>
          {error}
        </Text>
      )}
      <Text style={styles.subtitle}>
        Automatic follows your device. Motion respects your device’s Reduce
        Motion setting.
      </Text>
    </Screen>
  );
}
const createStyles = (c) =>
  StyleSheet.create({
    eyebrow: {
      color: c.primary,
      letterSpacing: 3,
      fontSize: 11,
      fontWeight: "800",
    },
    title: {
      fontSize: 32,
      fontWeight: "900",
      color: c.text,
      marginVertical: 12,
    },
    subtitle: { color: c.muted, lineHeight: 22, marginBottom: 20 },
    label: { color: c.text, fontWeight: "800", marginVertical: 14 },
    modes: { flexDirection: "row", gap: 8 },
    mode: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: c.card,
      alignItems: "center",
    },
    active: { backgroundColor: c.primary },
    modeText: { color: c.text, fontWeight: "700" },
    activeText: { color: c.onPrimary },
    choice: {
      padding: 22,
      backgroundColor: c.card,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: c.border,
      marginBottom: 12,
    },
    selected: { borderColor: c.primary },
    swatches: { flexDirection: "row", marginBottom: 16, gap: 8 },
    swatch: { width: 38, height: 38, borderRadius: 19 },
    name: { color: c.text, fontSize: 18, fontWeight: "800" },
    check: { color: c.primary, marginTop: 8, fontWeight: "700" },
  });
