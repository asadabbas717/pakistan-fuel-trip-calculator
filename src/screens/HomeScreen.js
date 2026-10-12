import React, { useCallback, useRef, useState } from "react";
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

import colors from "../theme/colors";
import FuelTypeSelector from "../components/FuelTypeSelector";
import LocationInput from "../components/LocationInput";
import PrimaryButton from "../components/PrimaryButton";

import { getFuelPrices } from "../services/fuelPriceService";
import { getRoute } from "../services/routingService";
import { calculateFuelCost } from "../services/calculatorService";
import { saveTrip } from "../storage/tripStorage";
import { getVehicles } from "../storage/vehicleStorage";

function sanitizeAverage(value) {
  return String(value).replace(/,/g, "").trim();
}

export default function HomeScreen({ navigation }) {
  const calculatingRef = useRef(false);
  const [fuelType, setFuelType] = useState("petrol");
  const [fuelPrices, setFuelPrices] = useState({});

  const [start, setStart] = useState(null);
  const [destination, setDestination] = useState(null);

  const [average, setAverage] = useState("12");
  const [isReturnTrip, setIsReturnTrip] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const [prices, savedVehicles] = await Promise.allSettled([
          getFuelPrices(),
          getVehicles(),
        ]);
        if (!active) return;
        setFuelPrices(prices.status === "fulfilled" ? prices.value : {});
        setVehicles(
          savedVehicles.status === "fulfilled" ? savedVehicles.value : [],
        );
        if (prices.status === "rejected" || savedVehicles.status === "rejected")
          alert(
            "Some saved settings could not be loaded. Existing data has been preserved.",
          );
      }
      load();
      return () => {
        active = false;
      };
    }, []),
  );

  async function useCurrentLocation() {
    try {
      setLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        alert("Location permission is required.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLocation = {
        id: "current-location",
        name: "Current Location",
        lat: location.coords.latitude,
        lon: location.coords.longitude,
      };

      setStart(currentLocation);
    } catch (error) {
      alert("Unable to get current location.");
    } finally {
      setLoadingLocation(false);
    }
  }

  function applyVehicleAverage(vehicle) {
    setAverage(String(vehicle.averageKmPerLiter));
  }

  function handleAverageChange(value) {
    setAverage(sanitizeAverage(value));
  }

  async function calculateTrip() {
    if (calculatingRef.current) return;
    calculatingRef.current = true;
    try {
      if (!start) {
        alert("Please select starting point.");
        return;
      }

      if (!destination) {
        alert("Please select destination.");
        return;
      }

      const averageNumber = Number(sanitizeAverage(average));

      if (!Number.isFinite(averageNumber) || averageNumber <= 0) {
        alert("Please enter valid vehicle average. Example: 12");
        return;
      }

      const selectedFuelPrice = Number(fuelPrices?.[fuelType]);

      if (!Number.isFinite(selectedFuelPrice) || selectedFuelPrice <= 0) {
        alert(
          "Fuel price is missing or invalid. Please open Fuel Prices screen and save valid prices.",
        );
        return;
      }

      setCalculating(true);

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

      const tripPayload = {
        start,
        destination,
        fuelType,
        fuelPrice: selectedFuelPrice,
        averageKmPerLiter: averageNumber,
        isReturnTrip,
        result,
        route: routeData.bestRoute,
      };

      try {
        await saveTrip(tripPayload);
      } catch (error) {
        alert(
          "Estimate calculated, but history was not saved: " + error.message,
        );
      }

      navigation.navigate("Result", {
        trip: tripPayload,
      });
    } catch (error) {
      alert(error.message || "Something went wrong.");
    } finally {
      calculatingRef.current = false;
      setCalculating(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Calculate your trip fuel cost</Text>

      <Text style={styles.subheading}>
        Search your route, choose fuel type, enter car average, and get
        estimated fuel cost.
      </Text>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => navigation.navigate("FuelPrices")}
        >
          <Text style={styles.quickButtonText}>Fuel Prices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => navigation.navigate("Vehicles")}
        >
          <Text style={styles.quickButtonText}>Vehicles</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => navigation.navigate("History")}
        >
          <Text style={styles.quickButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <FuelTypeSelector selectedFuel={fuelType} onChange={setFuelType} />

        <Text style={styles.priceText}>
          Configured {fuelType === "petrol" ? "Petrol" : "Diesel"} Price: Rs.{" "}
          {fuelPrices?.[fuelType] || "Not Available"} / litre
          {"\n"}
          {fuelPrices.lastUpdated}
        </Text>

        <LocationInput
          label="Starting Point"
          placeholder="Search starting point e.g. Karachi Saddar"
          value={start}
          onSelect={setStart}
        />

        <PrimaryButton
          title={
            start?.id === "current-location"
              ? "Current Location Selected"
              : "Use Current Location"
          }
          onPress={useCurrentLocation}
          loading={loadingLocation}
          variant="outline"
        />

        {start && (
          <Text style={styles.selectedText} numberOfLines={2}>
            Start: {start.name}
          </Text>
        )}

        <LocationInput
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

        <Text style={styles.label}>Vehicle Average km/litre</Text>

        <TextInput
          accessibilityLabel="Vehicle average in kilometres per litre"
          style={styles.input}
          keyboardType={Platform.OS === "android" ? "numeric" : "decimal-pad"}
          placeholder="Example: 12"
          placeholderTextColor="#9CA3AF"
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
      </View>

      <Text style={styles.note}>
        Note: This app uses free OpenStreetMap-based services. Distance is
        estimated and may vary from real-world traffic or road conditions.
      </Text>
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
    borderRadius: 20,
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
    backgroundColor: "#fff",
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
    backgroundColor: colors.primaryLight,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 20,
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
