import React from "react";
import { StyleSheet, Text } from "react-native";
import Reveal from "./Reveal";
import { useThemedStyles } from "../theme/ThemeContext";
export default function SectionHeading({ eyebrow, title, subtitle }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <Reveal style={styles.section}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Reveal>
  );
}
const createStyles = (c) =>
  StyleSheet.create({
    section: { paddingTop: 8, paddingBottom: 24 },
    eyebrow: {
      color: c.primary,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 2.5,
      marginBottom: 12,
    },
    title: {
      color: c.text,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "900",
      letterSpacing: -1.2,
    },
    subtitle: {
      color: c.muted,
      fontSize: 14,
      lineHeight: 23,
      marginTop: 12,
      maxWidth: 460,
    },
  });
