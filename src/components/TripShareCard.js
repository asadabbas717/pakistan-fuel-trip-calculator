import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { tripDetails } from "../services/tripExportService";
import { formatPKR } from "../utils/formatters";

export default function TripShareCard({ trip, captureRef }) {
  return (
    <View ref={captureRef} collapsable={false} style={styles.card}>
      <View style={styles.hero}>
        <Text style={styles.brand}>FUELTRIP PK · JOURNEY ESTIMATE</Text>
        <Text style={styles.title}>Ready for the road.</Text>
        <Text style={styles.caption}>Estimated fuel budget</Text>
        <Text style={styles.cost}>{formatPKR(trip.result.totalCost)}</Text>
      </View>
      {tripDetails(trip).map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
      <Text style={styles.note}>
        Fuel estimate only · excludes tolls and parking.{"\n"}Plan thoughtfully.
        Enjoy the journey.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    marginVertical: 16,
  },
  hero: {
    backgroundColor: "#e2f3ec",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  brand: {
    color: "#14634b",
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1,
  },
  title: {
    color: "#202c35",
    fontSize: 26,
    fontWeight: "900",
    marginVertical: 12,
  },
  caption: { color: "#5c6b74", fontSize: 12 },
  cost: { color: "#14634b", fontSize: 30, fontWeight: "900", marginTop: 8 },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#dce4e3",
  },
  label: { color: "#5c6b74", fontSize: 12, flex: 1 },
  value: {
    color: "#202c35",
    fontWeight: "700",
    fontSize: 13,
    flex: 2,
    textAlign: "right",
  },
  note: { color: "#5c6b74", fontSize: 11, lineHeight: 18, marginTop: 20 },
});
