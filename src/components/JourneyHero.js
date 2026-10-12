import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Reveal from "./Reveal";
import { useThemedStyles } from "../theme/ThemeContext";

export default function JourneyHero({
  eyebrow = "LESS GUESSWORK. MORE ADVENTURE.",
  title = "Every journey\nstarts with a plan.",
  subtitle = "Find your route. Know your fuel. Enjoy the drive.",
}) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <Reveal style={styles.hero}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.orbit}
      />
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.route}>
        <View style={styles.dot} />
        <View style={styles.line} />
        <Text style={styles.arrow}>→</Text>
        <View style={styles.line} />
        <View style={styles.end} />
        <Text style={styles.routeText}>YOUR NEXT CHAPTER</Text>
      </View>
    </Reveal>
  );
}
const createStyles = (c) =>
  StyleSheet.create({
    hero: {
      backgroundColor: c.primaryLight,
      borderRadius: 30,
      padding: 26,
      marginBottom: 20,
      overflow: "hidden",
    },
    orbit: {
      position: "absolute",
      width: 190,
      height: 190,
      borderRadius: 95,
      borderWidth: 30,
      borderColor: c.secondary,
      opacity: 0.16,
      right: -75,
      top: -55,
    },
    eyebrow: {
      color: c.primary,
      fontWeight: "800",
      letterSpacing: 2,
      fontSize: 10,
    },
    title: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "900",
      color: c.text,
      marginTop: 18,
      letterSpacing: -1,
    },
    subtitle: {
      color: c.muted,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 12,
      maxWidth: 290,
    },
    route: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 24,
    },
    dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: c.primary },
    end: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 3,
      borderColor: c.primary,
    },
    line: { width: 22, height: 1, backgroundColor: c.primary },
    arrow: { color: c.primary },
    routeText: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1,
      color: c.primary,
      marginLeft: 6,
    },
  });
