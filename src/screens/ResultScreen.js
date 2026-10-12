import React from "react";
import { Text, StyleSheet, Share } from "react-native";

import JourneyHero from "../components/JourneyHero";
import Reveal from "../components/Reveal";
import Screen from "../components/Screen";
import { useThemedStyles } from "../theme/ThemeContext";
import CostSummaryCard from "../components/CostSummaryCard";
import MapViewWeb from "../components/MapViewWeb";
import PrimaryButton from "../components/PrimaryButton";
import { formatKm, formatLiters, formatPKR } from "../utils/formatters";

export default function ResultScreen({ route, navigation }) {
  const { styles } = useThemedStyles(createStyles);
  const { trip } = route.params;
  const manual = trip.route.source === "manual";

  async function shareResult() {
    const message = `
FuelTrip PK Result

From: ${trip.start.name}
To: ${trip.destination.name}

Distance: ${formatKm(trip.result.distanceKm)}
Distance source: ${manual ? "Entered manually" : "Online routing estimate"}
Fuel Type: ${trip.fuelType === "petrol" ? "Petrol" : "Diesel"}
Fuel Needed: ${formatLiters(trip.result.fuelNeeded)}
Fuel Price: ${formatPKR(trip.fuelPrice)} / litre
Estimated Cost: ${formatPKR(trip.result.totalCost)}

Calculated using FuelTrip PK.
`;

    try {
      await Share.share({ message });
    } catch {
      alert("Unable to share this result.");
    }
  }

  return (
    <Screen style={styles.container} contentContainerStyle={styles.content}>
      <JourneyHero
        eyebrow="YOUR JOURNEY, AT A GLANCE"
        title="Ready for the road."
        subtitle={
          manual
            ? "Your distance. Your estimate. All calculated offline."
            : "Your fuel budget and route, together in one place."
        }
      />
      {!manual && (
        <MapViewWeb
          start={trip.start}
          destination={trip.destination}
          routeCoordinates={trip.route.coordinates}
        />
      )}

      <Reveal delay={80} style={styles.locationCard}>
        <Text style={styles.locationLabel}>From</Text>
        <Text style={styles.locationText}>{trip.start.name}</Text>

        <Text style={styles.locationLabel}>To</Text>
        <Text style={styles.locationText}>{trip.destination.name}</Text>
      </Reveal>

      <CostSummaryCard
        result={trip.result}
        fuelType={trip.fuelType}
        fuelPrice={trip.fuelPrice}
      />

      <Reveal delay={160} style={styles.infoCard}>
        <Text style={styles.infoTitle}>Route Info</Text>

        <Text style={styles.infoText}>
          One-way distance: {formatKm(trip.route.distanceKm)}
        </Text>

        {!manual && (
          <Text style={styles.infoText}>
            Estimated travel time: {trip.route.durationMinutes} minutes
          </Text>
        )}

        <Text style={styles.infoText}>
          Vehicle average: {trip.averageKmPerLiter} km/litre
        </Text>

        <Text style={styles.infoText}>
          Trip type: {trip.isReturnTrip ? "Return trip" : "One-way trip"}
        </Text>
      </Reveal>

      <PrimaryButton title="Share Result" onPress={shareResult} />

      <PrimaryButton
        title="Calculate Another Trip"
        onPress={() => navigation.navigate("Home")}
        variant="outline"
      />
    </Screen>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
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
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 26,
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
      backgroundColor: colors.card,
      borderRadius: 26,
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
