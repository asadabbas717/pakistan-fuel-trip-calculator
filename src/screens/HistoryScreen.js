import React, { useCallback, useState } from "react";
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import colors from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import { clearTripHistory, getTripHistory } from "../storage/tripStorage";
import { formatKm, formatPKR } from "../utils/formatters";

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function loadHistory() {
    const trips = await getTripHistory();
    setHistory(trips);
  }

  async function handleClear() {
    await clearTripHistory();
    setHistory([]);
    alert("Trip history cleared.");
  }

  function openTrip(trip) {
    navigation.navigate("Result", {
      trip,
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Trip History</Text>
      <Text style={styles.subheading}>
        Your last 25 calculated trips are saved on this device.
      </Text>

      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No trip history found.</Text>
        </View>
      ) : (
        history.map((trip) => (
          <TouchableOpacity
            key={trip.id}
            style={styles.card}
            onPress={() => openTrip(trip)}
          >
            <Text style={styles.routeText} numberOfLines={1}>
              {trip.start.name}
            </Text>

            <Text style={styles.arrow}>↓</Text>

            <Text style={styles.routeText} numberOfLines={1}>
              {trip.destination.name}
            </Text>

            <View style={styles.row}>
              <Text style={styles.muted}>{formatKm(trip.result.distanceKm)}</Text>
              <Text style={styles.cost}>{formatPKR(trip.result.totalCost)}</Text>
            </View>

            <Text style={styles.date}>
              {new Date(trip.createdAt).toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))
      )}

      {history.length > 0 && (
        <PrimaryButton title="Clear History" onPress={handleClear} variant="outline" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  content: {
    padding: 18,
  },
  heading: {
    fontSize: 25,
    fontWeight: "900",
    color: colors.primary,
  },
  subheading: {
    color: colors.muted,
    marginTop: 6,
    marginBottom: 14,
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  routeText: {
    color: colors.text,
    fontWeight: "800",
  },
  arrow: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
    marginVertical: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  muted: {
    color: colors.muted,
    fontWeight: "700",
  },
  cost: {
    color: colors.success,
    fontWeight: "900",
    fontSize: 16,
  },
  date: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
});