import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../theme/colors";
import { formatKm, formatLiters, formatPKR } from "../utils/formatters";

export default function CostSummaryCard({ result, fuelType, fuelPrice }) {
  if (!result) return null;

  return (
    <View style={styles.card}>
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
        <Text style={styles.value}>{fuelType === "petrol" ? "Petrol" : "Diesel"}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Fuel Price</Text>
        <Text style={styles.value}>{formatPKR(fuelPrice)} / L</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Estimated Cost</Text>
        <Text style={styles.totalValue}>{formatPKR(result.totalCost)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
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
    justifyContent: "space-between",
    marginVertical: 5,
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