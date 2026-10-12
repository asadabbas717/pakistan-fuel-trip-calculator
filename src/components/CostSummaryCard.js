import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Reveal from "./Reveal";
import { useThemedStyles } from "../theme/ThemeContext";
import { formatKm, formatLiters, formatPKR } from "../utils/formatters";

export default function CostSummaryCard({ result, fuelType, fuelPrice }) {
  const { styles } = useThemedStyles(createStyles);
  if (!result) return null;

  return (
    <Reveal delay={120} style={styles.card}>
      <Text style={styles.budgetLabel}>YOUR FUEL BUDGET</Text>
      <Text style={styles.budget}>{formatPKR(result.totalCost)}</Text>
      <Text style={styles.budgetHint}>
        Estimated fuel cost · excludes tolls
      </Text>
      <Text style={styles.title}>Trip Cost Summary</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>{formatKm(result.distanceKm)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Fuel Needed</Text>
        <Text style={styles.value}>{formatLiters(result.fuelNeeded)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Fuel Type</Text>
        <Text style={styles.value}>
          {fuelType === "petrol" ? "Petrol" : "Diesel"}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Fuel Price</Text>
        <Text style={styles.value}>{formatPKR(fuelPrice)} / L</Text>
      </View>

      <View style={styles.divider} />
    </Reveal>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    budgetLabel: {
      color: colors.primary,
      fontSize: 10,
      letterSpacing: 2,
      fontWeight: "800",
    },
    budget: {
      color: colors.primary,
      fontSize: 34,
      fontWeight: "900",
      marginVertical: 12,
      letterSpacing: -1,
    },
    budgetHint: { color: colors.muted, fontSize: 12, marginBottom: 24 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 26,
      padding: 18,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 14,
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "space-between",
      marginVertical: 7,
    },
    label: {
      color: colors.muted,
      fontSize: 14,
    },
    value: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
      maxWidth: "55%",
      textAlign: "right",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    totalLabel: {
      fontSize: 17,
      color: colors.text,
      fontWeight: "800",
    },
    totalValue: {
      fontSize: 20,
      color: colors.success,
      fontWeight: "900",
    },
  });
