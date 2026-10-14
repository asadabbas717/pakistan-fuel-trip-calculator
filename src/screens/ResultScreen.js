import { showMessage } from "../utils/confirmAction";
import React, { useRef, useState } from "react";
import { Text, StyleSheet, Linking, Platform } from "react-native";

import TripShareCard from "../components/TripShareCard";
import { exportTripPdf, shareTripText } from "../services/tripExportService";
import { shareTripImage } from "../services/tripImageService";
import { directionsUrl } from "../services/directionsService";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import Screen from "../components/Screen";
import { useThemedStyles } from "../theme/ThemeContext";
import CostSummaryCard from "../components/CostSummaryCard";
import MapViewWeb from "../components/MapViewWeb";
import PrimaryButton from "../components/PrimaryButton";
import { formatKm } from "../utils/formatters";

export default function ResultScreen({ route, navigation }) {
  const { styles } = useThemedStyles(createStyles);
  const { trip } = route.params;
  const manual = trip.route.source === "manual";

  const capture = useRef(null);
  const busyRef = useRef(false);
  const [sharing, setSharing] = useState(false);
  async function exportResult(action) {
    if (busyRef.current) return;
    busyRef.current = true;
    setSharing(true);
    try {
      await action();
    } catch (error) {
      showMessage(error.message || "Unable to export this trip.");
    } finally {
      busyRef.current = false;
      setSharing(false);
    }
  }
  async function openDirections() {
    try {
      await Linking.openURL(directionsUrl(trip));
    } catch (error) {
      showMessage(error.message || "Unable to open your navigation app.");
    }
  }
  return (
    <Screen style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeading
        eyebrow="READY FOR THE ROAD"
        title={"Your journey,\nby the numbers."}
        subtitle={
          manual
            ? "Your distance. Your estimate. All calculated offline."
            : "Your fuel budget and route, together in one place."
        }
      />
      <CostSummaryCard
        result={trip.result}
        fuelType={trip.fuelType}
        fuelPrice={trip.fuelPrice}
      />
      {!manual && (
        <MapViewWeb
          start={trip.start}
          destination={trip.destination}
          routeCoordinates={trip.route.coordinates}
        />
      )}

      <Reveal delay={80} style={styles.locationCard}>
        <Text style={styles.routeEyebrow}>THE ROUTE</Text>
        <Text style={styles.locationLabel}>○ FROM</Text>
        <Text style={styles.locationText}>{trip.start.name}</Text>

        <Text style={styles.locationLabel}>◉ TO</Text>
        <Text style={styles.locationText}>{trip.destination.name}</Text>
      </Reveal>

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

      <PrimaryButton
        title="Open directions"
        variant="outline"
        onPress={openDirections}
      />
      <Text style={styles.infoTitle}>A keepsake for your journey</Text>
      <Text style={styles.subheading}>
        Preview your share card. Exports are generated on your device.
      </Text>
      <TripShareCard trip={trip} captureRef={capture} />
      <PrimaryButton
        title={Platform.OS === "web" ? "Download image" : "Share image"}
        disabled={sharing}
        onPress={() => exportResult(() => shareTripImage(trip, capture))}
      />
      <PrimaryButton
        title={Platform.OS === "web" ? "Print / Save PDF" : "Share PDF"}
        variant="outline"
        disabled={sharing}
        onPress={() => exportResult(() => exportTripPdf(trip))}
      />
      <PrimaryButton
        title="Share text"
        variant="outline"
        disabled={sharing}
        onPress={() => exportResult(() => shareTripText(trip))}
      />

      <PrimaryButton
        title="Calculate Another Trip"
        onPress={() => navigation.popTo("Home")}
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
      padding: 22,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 8,
    },
    routeEyebrow: {
      color: colors.muted,
      fontSize: 10,
      letterSpacing: 2,
      fontWeight: "800",
      marginBottom: 18,
    },
    locationLabel: {
      fontSize: 10,
      letterSpacing: 1.5,
      color: colors.primary,
      fontWeight: "900",
      marginTop: 4,
    },
    locationText: {
      color: colors.text,
      marginBottom: 8,
      lineHeight: 23,
      fontSize: 16,
      fontWeight: "600",
      paddingLeft: 18,
      marginTop: 6,
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 26,
      padding: 22,
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
