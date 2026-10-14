import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MotionPressable from "../components/MotionPressable";
import Screen from "../components/Screen";
import Reveal from "../components/Reveal";
import { palettes, useTheme, useThemedStyles } from "../theme/ThemeContext";

export default function AppearanceScreen() {
  const { mode, palette, update, error } = useTheme();
  const { styles } = useThemedStyles(createStyles);
  return (
    <Screen>
      <Text style={styles.eyebrow}>MAKE IT YOURS</Text>
      <Text style={styles.title}>{"Find your\ntravel mood."}</Text>
      <Text style={styles.subtitle}>
        Your colours follow you across every screen.
      </Text>
      <Text style={styles.label}>Display mode</Text>
      <View style={styles.modes}>
        {["system", "light", "dark"].map((item) => (
          <MotionPressable
            key={item}
            containerStyle={{ flex: 1 }}
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
          </MotionPressable>
        ))}
      </View>
      <Text style={styles.label}>Colour story</Text>
      {Object.entries(palettes).map(([key, p], i) => (
        <Reveal key={key} delay={i * 60}>
          <MotionPressable
            accessibilityRole="radio"
            accessibilityState={{ checked: palette === key }}
            accessibilityLabel={p.name}
            onPress={() => update({ palette: key })}
            style={[styles.choice, palette === key && styles.selected]}
          >
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.preview, { backgroundColor: p.tint }]}
            >
              <View style={[styles.previewHero, { backgroundColor: p.light }]}>
                <View
                  style={[
                    styles.previewLine,
                    { backgroundColor: p.dark, width: "45%" },
                  ]}
                />
                <View
                  style={[
                    styles.previewLine,
                    { backgroundColor: "#FFFFFF", width: "70%", height: 10 },
                  ]}
                />
                <View
                  style={[
                    styles.previewLine,
                    { backgroundColor: p.accent, width: "25%" },
                  ]}
                />
              </View>
              <View style={styles.previewTiles}>
                {[0, 1, 2].map((n) => (
                  <View
                    key={n}
                    style={[
                      styles.previewTile,
                      { backgroundColor: p.light, opacity: 0.15 + n * 0.08 },
                    ]}
                  />
                ))}
              </View>
            </View>
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
          </MotionPressable>
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
    preview: { padding: 12, borderRadius: 16, marginBottom: 20 },
    previewHero: { padding: 18, borderRadius: 12, gap: 8 },
    previewLine: { height: 5, borderRadius: 4 },
    previewTiles: { flexDirection: "row", gap: 8, marginTop: 8 },
    previewTile: { flex: 1, height: 20, borderRadius: 6 },
    swatches: { flexDirection: "row", marginBottom: 16, gap: 8 },
    swatch: { width: 22, height: 22, borderRadius: 11 },
    name: { color: c.text, fontSize: 18, fontWeight: "800" },
    check: { color: c.primary, marginTop: 8, fontWeight: "700" },
  });
