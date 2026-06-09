import React from "react";
import { ScrollView, Text, StyleSheet, Share, View } from "react-native";

import colors from "../theme/colors";
import CostSummaryCard from "../components/CostSummaryCard";
import MapViewWeb from "../components/MapViewWeb";
import PrimaryButton from "../components/PrimaryButton";
import { formatKm, formatLiters, formatPKR } from "../utils/formatters";

export default function ResultScreen({ route, navigation }) {
  const { trip } = route.params;

  async function shareResult() {
    const message = `
FuelTrip PK Result

From: ${trip.start.name}
To: ${trip.destination.name}

Distance: ${formatKm(trip.result.distanceKm)}
Fuel Type: ${trip.fuelType === "petrol" ? "Petrol" : "Diesel"}
Fuel Needed: ${formatLiters(trip.result.fuelNeeded)}
Fuel Price: ${formatPKR(trip.fuelPrice)} / litre
Estimated Cost: ${formatPKR(trip.result.totalCost)}

Calculated using FuelTrip PK.
`;

    await Share.share({ message });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Best Estimated Route</Text>
      <Text style={styles.subheading}>
        This route is selected based on the shortest available route from free routing data.
      </Text>

      <MapViewWeb
        start={trip.start}
        destination={trip.destination}
        routeCoordinates={trip.route.coordinates}
      />

      <View style={styles.locationCard}>
        <Text style={styles.locationLabel}>From</Text>
        <Text style={styles.locationText}>{trip.start.name}</Text>

        <Text style={styles.locationLabel}>To</Text>
        <Text style={styles.locationText}>{trip.destination.name}</Text>
      </View>

      <CostSummaryCard
        result={trip.result}
        fuelType={trip.fuelType}
        fuelPrice={trip.fuelPrice}
      />

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Route Info</Text>

        <Text style={styles.infoText}>
          Original route distance: {formatKm(trip.route.distanceKm)}
        </Text>

        <Text style={styles.infoText}>
          Estimated travel time: {trip.route.durationMinutes} minutes
        </Text>

        <Text style={styles.infoText}>
          Vehicle average: {trip.averageKmPerLiter} km/litre
        </Text>

        <Text style={styles.infoText}>
          Trip type: {trip.isReturnTrip ? "Return trip" : "One-way trip"}
        </Text>
      </View>

      <PrimaryButton title="Share Result" onPress={shareResult} />

      <PrimaryButton
        title="Calculate Another Trip"
        onPress={() => navigation.navigate("Home")}
        variant="outline"
      />
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
    fontSize: 24,
    fontWeight: "900",
    color: colors.primary,
  },
  subheading: {
    color: colors.muted,
    marginTop: 5,
    marginBottom: 10,
    lineHeight: 20,
  },
  locationCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 8,
  },
  locationLabel: {
    color: colors.primary,
    fontWeight: "900",
    marginTop: 4,
  },
  locationText: {
    color: colors.text,
    marginBottom: 8,
    lineHeight: 19,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 10,
  },
  infoTitle: {
    fontSize: 17,
    color: colors.text,
    fontWeight: "900",
    marginBottom: 8,
  },
  infoText: {
    color: colors.muted,
    marginVertical: 3,
  },
});