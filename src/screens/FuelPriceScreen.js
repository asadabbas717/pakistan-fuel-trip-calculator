import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { confirmAction } from "../utils/confirmAction";
import colors from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import {
  getFuelPrices,
  saveFuelPrices,
  resetFuelPrices,
  clearFuelPrices,
} from "../services/fuelPriceService";

function sanitizeInput(value) {
  return String(value).replace(/,/g, "").trim();
}

function isValidNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0;
}

export default function FuelPriceScreen() {
  const busy = useRef(false);
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
      alert("Unable to load fuel prices. Existing data has been preserved.");
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
    if (busy.current) return;
    busy.current = true;
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
      busy.current = false;
      setSaving(false);
    }
  }

  async function handleReset() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      const defaultPrices = await resetFuelPrices();

      setPetrol(String(defaultPrices.petrol));
      setDiesel(String(defaultPrices.diesel));
      setLastUpdated(defaultPrices.lastUpdated);

      alert("Fuel prices reset successfully.");
    } catch (error) {
      alert("Unable to reset fuel prices.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  async function handleClearAndReload() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      await clearFuelPrices();
      const prices = await getFuelPrices();
      setPetrol(String(prices.petrol));
      setDiesel(String(prices.diesel));
      setLastUpdated(prices.lastUpdated);

      alert("Fuel price storage refreshed successfully.");
    } catch (error) {
      alert("Unable to refresh fuel price storage.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
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
                accessibilityLabel="Petrol price per litre"
                editable={!saving}
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
                accessibilityLabel="Diesel price per litre"
                editable={!saving}
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
                disabled={saving}
                title="Reset Example Prices"
                onPress={() =>
                  confirmAction(
                    "Replace saved fuel prices with example values?",
                    handleReset,
                  )
                }
                variant="outline"
              />

              <PrimaryButton
                disabled={saving}
                title="Refresh Price Storage"
                onPress={() =>
                  confirmAction(
                    "Clear saved fuel prices and reload example values?",
                    handleClearAndReload,
                  )
                }
                variant="outline"
              />
            </>
          )}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Entering prices</Text>

          <Text style={styles.noteText}>
            Enter a positive price per litre, such as 381.78. Bundled prices are
            examples and must be checked against your current pump price.
          </Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Important</Text>

          <Text style={styles.noteText}>
            Prices are entered manually. This app does not retrieve current fuel
            prices or verify their accuracy.
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
