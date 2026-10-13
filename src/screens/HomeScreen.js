import { showMessage } from "../utils/confirmAction";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";

import JourneyHero from "../components/JourneyHero";
import Reveal from "../components/Reveal";
import Screen from "../components/Screen";
import { useThemedStyles } from "../theme/ThemeContext";
import FuelTypeSelector from "../components/FuelTypeSelector";
import LocationInput from "../components/LocationInput";
import PrimaryButton from "../components/PrimaryButton";

import { getFuelPrices, refreshFuelPrices } from "../services/fuelPriceService";
import { resolveCurrentLocation } from "../services/currentLocationService";
import { getRoute } from "../services/routingService";
import { createManualTrip } from "../services/manualTripService";
import { calculateFuelCost } from "../services/calculatorService";
import { getPreferences, savePreferences } from "../storage/preferencesStorage";
import { saveTrip, getTripHistory } from "../storage/tripStorage";
import { getVehicles } from "../storage/vehicleStorage";

function sanitizeAverage(value) {
  return String(value).replace(/,/g, "").trim();
}

export default function HomeScreen({ navigation, route }) {
  const { colors, styles } = useThemedStyles(createStyles);
  const gpsGeneration = useRef(0);
  useEffect(
    () => () => {
      gpsGeneration.current += 1;
    },
    [],
  );
  const initialized = useRef(false);
  const [recentPlaces, setRecentPlaces] = useState([]);
  const [locationRevision, setLocationRevision] = useState(0);
  const calculatingRef = useRef(false);
  const [fuelType, setFuelType] = useState("petrol");
  const [fuelPrices, setFuelPrices] = useState({});

  const [start, setStart] = useState(null);
  const [destination, setDestination] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualDistance, setManualDistance] = useState("");
  const [startName, setStartName] = useState("");
  const [destinationName, setDestinationName] = useState("");

  const [average, setAverage] = useState("12");
  const [isReturnTrip, setIsReturnTrip] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const [prices, savedVehicles, preferences, recent] =
          await Promise.allSettled([
            getFuelPrices(),
            getVehicles(),
            getPreferences(),
            getTripHistory(),
          ]);
        if (!active) return;
        setFuelPrices(prices.status === "fulfilled" ? prices.value : {});
        setVehicles(
          savedVehicles.status === "fulfilled" ? savedVehicles.value : [],
        );
        if (recent.status === "fulfilled") {
          const places = new Map();
          for (const trip of recent.value)
            if (trip.route.source !== "manual")
              places.set(trip.destination.name, trip.destination);
          setRecentPlaces([...places.values()].slice(0, 4));
        }
        if (!initialized.current && preferences.status === "fulfilled") {
          initialized.current = true;
          if (!route?.params?.repeatTrip) {
            if (preferences.value.fuelType)
              setFuelType(preferences.value.fuelType);
            const vehicle =
              savedVehicles.status === "fulfilled" &&
              savedVehicles.value.find(
                (v) => v.id === preferences.value.vehicleId,
              );
            if (vehicle) setAverage(String(vehicle.averageKmPerLiter));
          }
        }
        if (prices.status === "fulfilled" && prices.value.mode === "auto")
          refreshFuelPrices()
            .then((updated) => {
              if (active) setFuelPrices(updated);
            })
            .catch(() => {});
        if (prices.status === "rejected" || savedVehicles.status === "rejected")
          showMessage(
            "Some saved settings could not be loaded. Existing data has been preserved.",
          );
      }
      load();
      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    const trip = route?.params?.repeatTrip;
    if (!trip) return;
    const manual = trip.route.source === "manual";
    setManualMode(manual);
    setAverage(String(trip.averageKmPerLiter));
    setFuelType(trip.fuelType);
    setIsReturnTrip(trip.isReturnTrip);
    if (manual) {
      setManualDistance(String(trip.route.distanceKm));
      setStartName(trip.start.name);
      setDestinationName(trip.destination.name);
    } else {
      setStart(trip.start);
      setDestination(trip.destination);
    }
  }, [route?.params?.repeatToken, route?.params?.repeatTrip]);
  function selectFuel(type) {
    setFuelType(type);
    savePreferences({ fuelType: type }).catch(() =>
      showMessage("Fuel choice applied; saving your preference failed."),
    );
  }
  function selectStart(place) {
    gpsGeneration.current += 1;
    setLoadingLocation(false);
    setStart(place);
  }
  function swapPlaces() {
    if (manualMode) {
      setStartName(destinationName);
      setDestinationName(startName);
    } else {
      setLocationRevision((previous) => previous + 1);
      selectStart(destination);
      setDestination(start);
    }
  }
  async function useCurrentLocation() {
    const request = ++gpsGeneration.current;
    try {
      setLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (request !== gpsGeneration.current) return;
      if (status !== "granted") {
        showMessage("Location permission is required.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLocation = await resolveCurrentLocation(location);

      if (request === gpsGeneration.current) setStart(currentLocation);
    } catch (error) {
      if (request === gpsGeneration.current)
        showMessage("Unable to get current location.");
    } finally {
      if (request === gpsGeneration.current) setLoadingLocation(false);
    }
  }

  function applyVehicleAverage(vehicle) {
    setAverage(String(vehicle.averageKmPerLiter));
    savePreferences({ vehicleId: vehicle.id }).catch(() =>
      showMessage("Vehicle selected; saving your preference failed."),
    );
  }

  function handleAverageChange(value) {
    setAverage(sanitizeAverage(value));
  }

  async function calculateTrip() {
    if (calculatingRef.current) return;
    calculatingRef.current = true;
    try {
      if (!manualMode && !start) {
        showMessage("Please select starting point.");
        return;
      }

      if (!manualMode && !destination) {
        showMessage("Please select destination.");
        return;
      }

      const averageNumber = Number(sanitizeAverage(average));

      if (!Number.isFinite(averageNumber) || averageNumber <= 0) {
        showMessage("Please enter valid vehicle average. Example: 12");
        return;
      }

      const selectedFuelPrice = Number(fuelPrices?.[fuelType]);

      if (!Number.isFinite(selectedFuelPrice) || selectedFuelPrice <= 0) {
        showMessage(
          "Fuel price is missing or invalid. Please open Fuel Prices screen and save valid prices.",
        );
        return;
      }

      setCalculating(true);

      let tripPayload;
      if (manualMode) {
        tripPayload = createManualTrip({
          distanceKm: manualDistance,
          startName,
          destinationName,
          fuelType,
          fuelPrice: selectedFuelPrice,
          averageKmPerLiter: averageNumber,
          isReturnTrip,
        });
      } else {
        const routeData = await getRoute({
          start,
          destination,
        });

        const result = calculateFuelCost({
          distanceKm: routeData.bestRoute.distanceKm,
          averageKmPerLiter: averageNumber,
          fuelPricePerLiter: selectedFuelPrice,
          isReturnTrip,
        });

        tripPayload = {
          start,
          destination,
          fuelType,
          fuelPrice: selectedFuelPrice,
          averageKmPerLiter: averageNumber,
          isReturnTrip,
          result,
          route: routeData.bestRoute,
        };
      }

      tripPayload.priceLabel =
        fuelPrices.mode === "manual"
          ? "Manual pump-price override"
          : fuelPrices.lastUpdated;
      try {
        await saveTrip(tripPayload);
      } catch (error) {
        showMessage(
          "Estimate calculated, but history was not saved: " + error.message,
        );
      }

      navigation.navigate("Result", {
        trip: tripPayload,
      });
    } catch (error) {
      showMessage(error.message || "Something went wrong.");
    } finally {
      calculatingRef.current = false;
      setCalculating(false);
    }
  }

  return (
    <Screen style={styles.container} contentContainerStyle={styles.content}>
      <JourneyHero />
      <View style={styles.quickActions}>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.quickButton}
          onPress={() => navigation.navigate("FuelPrices")}
        >
          <Text style={styles.quickButtonText}>Fuel Prices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.quickButton}
          onPress={() => navigation.navigate("Vehicles")}
        >
          <Text style={styles.quickButtonText}>Vehicles</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.quickButton}
          onPress={() => navigation.navigate("History")}
        >
          <Text style={styles.quickButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      <Reveal delay={100} style={styles.card}>
        <Text style={styles.step}>01 / BUILD YOUR JOURNEY</Text>
        <FuelTypeSelector selectedFuel={fuelType} onChange={selectFuel} />

        <Text style={styles.priceText}>
          Configured {fuelType === "petrol" ? "Petrol" : "Diesel"} Price: Rs.{" "}
          {fuelPrices?.[fuelType] || "Not Available"} / litre
          {"\n"}
          {fuelPrices.lastUpdated}
        </Text>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Enter distance manually</Text>
            <Text style={styles.hint}>
              Works offline, without an API or location permission
            </Text>
          </View>
          <Switch
            accessibilityLabel="Enter distance manually"
            disabled={calculating}
            value={manualMode}
            onValueChange={setManualMode}
          />
        </View>

        {manualMode ? (
          <>
            <Text style={styles.label}>One-way distance (km)</Text>
            <TextInput
              placeholderTextColor={colors.muted}
              accessibilityLabel="One-way distance in kilometres"
              style={styles.input}
              keyboardType="decimal-pad"
              value={manualDistance}
              onChangeText={setManualDistance}
              placeholder="Example: 150"
            />
            <Text style={styles.label}>From (optional)</Text>
            <TextInput
              placeholderTextColor={colors.muted}
              accessibilityLabel="Manual starting point"
              style={styles.input}
              value={startName}
              onChangeText={setStartName}
              maxLength={200}
              placeholder="Example: Karachi"
            />
            <Text style={styles.label}>To (optional)</Text>
            <TextInput
              placeholderTextColor={colors.muted}
              accessibilityLabel="Manual destination"
              style={styles.input}
              value={destinationName}
              onChangeText={setDestinationName}
              maxLength={200}
              placeholder="Example: Hyderabad"
            />
          </>
        ) : (
          <>
            <LocationInput
              key={"start-" + locationRevision}
              label="Starting Point"
              placeholder="Search starting point e.g. Karachi Saddar"
              value={start}
              onSelect={selectStart}
            />

            <PrimaryButton
              title={
                start?.id === "current-location"
                  ? "Refresh GPS location"
                  : "Use Current Location"
              }
              onPress={useCurrentLocation}
              loading={loadingLocation}
              variant="outline"
            />

            {start && (
              <Text style={styles.selectedText} numberOfLines={2}>
                Start: {start.name}
                {start.accuracyMeters != null
                  ? ` · GPS accuracy ±${start.accuracyMeters} m`
                  : ""}
              </Text>
            )}

            <LocationInput
              key={"destination-" + locationRevision}
              label="Destination"
              placeholder="Search destination e.g. Hyderabad"
              value={destination}
              onSelect={setDestination}
            />

            {destination && (
              <Text style={styles.selectedText} numberOfLines={2}>
                Destination: {destination.name}
              </Text>
            )}
          </>
        )}

        <PrimaryButton
          title="Swap starting point and destination"
          variant="outline"
          disabled={calculating}
          onPress={swapPlaces}
        />
        {!manualMode && recentPlaces.length > 0 && (
          <View style={styles.vehicleBox}>
            <Text style={styles.vehicleTitle}>Recent destinations</Text>
            {recentPlaces.map((place) => (
              <TouchableOpacity
                key={place.name}
                accessibilityRole="button"
                accessibilityLabel={"Use recent destination " + place.name}
                onPress={() => setDestination(place)}
                style={[styles.vehicleChip, { marginBottom: 8 }]}
              >
                <Text numberOfLines={2} style={styles.vehicleChipText}>
                  {place.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={styles.label}>Vehicle Average km/litre</Text>

        <TextInput
          placeholderTextColor={colors.muted}
          accessibilityLabel="Vehicle average in kilometres per litre"
          style={styles.input}
          keyboardType={Platform.OS === "android" ? "numeric" : "decimal-pad"}
          placeholder="Example: 12"
          value={average}
          onChangeText={handleAverageChange}
        />

        {vehicles.length > 0 && (
          <View style={styles.vehicleBox}>
            <Text style={styles.vehicleTitle}>Quick Vehicle Average</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  accessibilityRole="button"
                  accessibilityLabel={
                    "Use " +
                    vehicle.name +
                    " average, " +
                    vehicle.averageKmPerLiter +
                    " kilometres per litre"
                  }
                  style={styles.vehicleChip}
                  onPress={() => applyVehicleAverage(vehicle)}
                >
                  <Text style={styles.vehicleChipText}>
                    {vehicle.name} - {vehicle.averageKmPerLiter} km/l
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Return Trip</Text>
            <Text style={styles.hint}>Enable if you want two-way cost</Text>
          </View>

          <Switch
            accessibilityLabel="Return trip"
            value={isReturnTrip}
            onValueChange={setIsReturnTrip}
            trackColor={{ false: "#D1D5DB", true: "#A5D6A7" }}
            thumbColor={isReturnTrip ? colors.primary : "#F3F4F6"}
          />
        </View>

        <PrimaryButton
          title="Calculate Fuel Cost"
          onPress={calculateTrip}
          loading={calculating}
        />
      </Reveal>

      <Text style={styles.note}>
        Online search uses free OpenStreetMap-based services with usage limits.
        If search or routing is unavailable, enter a distance manually.
        Estimates exclude tolls and traffic; a return trip doubles the one-way
        distance. Map and place data © OpenStreetMap contributors.
      </Text>
    </Screen>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    step: {
      fontSize: 10,
      letterSpacing: 2,
      color: colors.muted,
      fontWeight: "800",
      marginBottom: 20,
    },
    container: {
      backgroundColor: colors.background,
    },
    content: {
      padding: 18,
    },
    heading: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.primary,
      marginTop: 10,
    },
    subheading: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 6,
      marginBottom: 14,
    },
    quickActions: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    quickButton: {
      minHeight: 48,
      justifyContent: "center",
      flex: 1,
      backgroundColor: colors.primaryLight,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: "center",
    },
    quickButtonText: {
      color: colors.primary,
      fontWeight: "800",
      fontSize: 12,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 26,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    priceText: {
      backgroundColor: colors.primaryLight,
      color: colors.primary,
      padding: 12,
      borderRadius: 12,
      fontWeight: "800",
      marginVertical: 8,
    },
    label: {
      fontSize: 15,
      color: colors.text,
      fontWeight: "700",
      marginTop: 10,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 52,
      fontSize: 16,
      color: colors.text,
    },
    selectedText: {
      color: colors.success,
      fontSize: 13,
      marginTop: 6,
      fontWeight: "700",
    },
    vehicleBox: {
      marginVertical: 12,
    },
    vehicleTitle: {
      color: colors.text,
      fontWeight: "800",
      marginBottom: 8,
    },
    vehicleChip: {
      minHeight: 44,
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 26,
      marginRight: 8,
    },
    vehicleChipText: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 12,
    },
    switchRow: {
      marginVertical: 12,
      paddingVertical: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    hint: {
      color: colors.muted,
      fontSize: 12,
    },
    note: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 14,
      lineHeight: 18,
      textAlign: "center",
    },
  });
