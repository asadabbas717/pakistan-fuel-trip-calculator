import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import colors from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import {
  getFuelPrices,
  saveFuelPrices,
  resetFuelPrices,
  clearFuelPrices,
} from "../services/fuelPriceService";

function sanitizeInput(value) {
  return String(value)
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "");
}

function isValidNumber(value) {
  const numberValue = Number(value);
  return !Number.isNaN(numberValue) && numberValue > 0;
}

export default function FuelPriceScreen() {
  const [petrol, setPetrol] = useState("");
  const [diesel, setDiesel] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrices();
  }, []);

  async function loadPrices() {
    try {
      setLoading(true);

      const prices = await getFuelPrices();

      setPetrol(String(prices.petrol));
      setDiesel(String(prices.diesel));
      setLastUpdated(prices.lastUpdated || "Available locally");
    } catch (error) {
      alert("Unable to load fuel prices. Default prices will be used.");
    } finally {
      setLoading(false);
    }
  }

  function handlePetrolChange(value) {
    setPetrol(sanitizeInput(value));
  }

  function handleDieselChange(value) {
    setDiesel(sanitizeInput(value));
  }

  async function handleSave() {
    try {
      const petrolValue = sanitizeInput(petrol);
      const dieselValue = sanitizeInput(diesel);

      if (!isValidNumber(petrolValue)) {
        alert("Please enter a valid petrol price. Example: 381.78");
        return;
      }

      if (!isValidNumber(dieselValue)) {
        alert("Please enter a valid diesel price. Example: 388.54");
        return;
      }

      setSaving(true);

      const savedPrices = await saveFuelPrices({
        petrol: petrolValue,
        diesel: dieselValue,
        lastUpdated: new Date().toLocaleDateString("en-PK"),
      });

      setPetrol(String(savedPrices.petrol));
      setDiesel(String(savedPrices.diesel));
      setLastUpdated(savedPrices.lastUpdated);

      alert("Fuel prices updated successfully.");
    } catch (error) {
      alert(error.message || "Unable to save fuel prices.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    try {
      const defaultPrices = await resetFuelPrices();

      setPetrol(String(defaultPrices.petrol));
      setDiesel(String(defaultPrices.diesel));
      setLastUpdated(defaultPrices.lastUpdated);

      alert("Fuel prices reset successfully.");
    } catch (error) {
      alert("Unable to reset fuel prices.");
    }
  }

  async function handleClearAndReload() {
    try {
      await clearFuelPrices();
      await loadPrices();

      alert("Fuel price storage refreshed successfully.");
    } catch (error) {
      alert("Unable to refresh fuel price storage.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Pakistan Fuel Prices</Text>

        <Text style={styles.subheading}>
          Update the latest petrol and diesel prices manually from PSO or OGRA.
          These prices are saved locally on your device.
        </Text>

        <View style={styles.card}>
          {loading ? (
            <Text style={styles.loadingText}>Loading fuel prices...</Text>
          ) : (
            <>
              <Text style={styles.label}>Petrol Price / Litre</Text>

              <TextInput
                style={styles.input}
                value={petrol}
                onChangeText={handlePetrolChange}
                keyboardType={
                  Platform.OS === "android" ? "numeric" : "decimal-pad"
                }
                placeholder="Example: 381.78"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Diesel Price / Litre</Text>

              <TextInput
                style={styles.input}
                value={diesel}
                onChangeText={handleDieselChange}
                keyboardType={
                  Platform.OS === "android" ? "numeric" : "decimal-pad"
                }
                placeholder="Example: 388.54"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.updatedText}>
                Last Updated: {lastUpdated || "Not available"}
              </Text>

              <PrimaryButton
                title="Save Prices"
                onPress={handleSave}
                loading={saving}
              />

              <PrimaryButton
                title="Reset Default Prices"
                onPress={handleReset}
                variant="outline"
              />

              <PrimaryButton
                title="Refresh Price Storage"
                onPress={handleClearAndReload}
                variant="outline"
              />
            </>
          )}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Android Fix Applied</Text>

          <Text style={styles.noteText}>
            This screen now cleans the input before saving. You can enter values
            like 381.78, 381, or Rs. 381.78 and the app will save the correct
            number.
          </Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Important</Text>

          <Text style={styles.noteText}>
            Public free APIs for official Pakistan fuel prices are not always
            reliable. Manual price update is safer for a free portfolio app.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
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
    lineHeight: 21,
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: {
    color: colors.muted,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 20,
  },
  label: {
    color: colors.text,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    color: colors.text,
  },
  updatedText: {
    color: colors.muted,
    marginTop: 12,
    marginBottom: 8,
    fontWeight: "700",
  },
  noteCard: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 18,
    marginTop: 14,
  },
  noteTitle: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 6,
  },
  noteText: {
    color: colors.text,
    lineHeight: 21,
  },
});