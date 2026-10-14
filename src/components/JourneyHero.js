import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Reveal from "./Reveal";
import RouteArtwork from "./RouteArtwork";
import { useThemedStyles } from "../theme/ThemeContext";
export default function JourneyHero({
  eyebrow = "THE ROAD IS CALLING",
  title = "Go places.\nSpend smarter.",
  subtitle = "Your route, your fuel, your next adventure. All in one place.",
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
      <View style={styles.topline}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PK ↗</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <RouteArtwork />
    </Reveal>
  );
}
const createStyles = (c) =>
  StyleSheet.create({
    hero: {
      backgroundColor: c.hero,
      borderRadius: 30,
      padding: 24,
      marginBottom: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.heroBorder,
    },
    orbit: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 38,
      borderColor: c.heroAccent,
      opacity: 0.045,
      right: -70,
      top: -80,
    },
    topline: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    eyebrow: {
      color: c.heroAccent,
      fontSize: 10,
      letterSpacing: 2,
      fontWeight: "800",
      flexShrink: 1,
    },
    badge: {
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 30,
      backgroundColor: c.heroBorder,
    },
    badgeText: {
      color: c.heroAccent,
      fontWeight: "800",
      fontSize: 10,
      letterSpacing: 1,
    },
    title: {
      fontSize: 39,
      lineHeight: 44,
      fontWeight: "900",
      color: c.heroText,
      marginTop: 22,
      letterSpacing: -1.5,
    },
    subtitle: {
      color: c.heroMuted,
      fontSize: 14,
      lineHeight: 23,
      marginTop: 14,
      maxWidth: 390,
    },
  });
