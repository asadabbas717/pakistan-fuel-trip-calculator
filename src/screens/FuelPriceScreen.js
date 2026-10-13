import React, { useEffect, useRef, useState } from "react";
import { Text, TextInput, StyleSheet, View, Platform } from "react-native";

import { confirmAction, showMessage } from "../utils/confirmAction";
import Screen from "../components/Screen";
import { useThemedStyles } from "../theme/ThemeContext";
import PrimaryButton from "../components/PrimaryButton";
import {
  getFuelPrices,
  refreshFuelPrices,
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
  const { colors, styles } = useThemedStyles(createStyles);
  const busy = useRef(false);
  const [petrol, setPetrol] = useState("");
  const [diesel, setDiesel] = useState("");
  const [priceMode, setPriceMode] = useState("auto");
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

      setPriceMode(prices.mode);
      setPetrol(String(prices.petrol));
      setDiesel(String(prices.diesel));
      setLastUpdated(prices.lastUpdated || "Available locally");
    } catch (error) {
      showMessage(
        "Unable to load fuel prices. Existing data has been preserved.",
      );
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
        showMessage("Please enter a valid petrol price. Example: 381.78");
        return;
      }

      if (!isValidNumber(dieselValue)) {
        showMessage("Please enter a valid diesel price. Example: 388.54");
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
      setPriceMode("manual");

      showMessage("Fuel prices updated successfully.");
    } catch (error) {
      showMessage(error.message || "Unable to save fuel prices.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  async function useOfficialPrices() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      const prices = await refreshFuelPrices({ force: true, enable: true });
      setPetrol(String(prices.petrol));
      setDiesel(String(prices.diesel));
      setPriceMode(prices.mode);
      setLastUpdated(prices.lastUpdated);
    } catch (error) {
      showMessage(error.message + " Your saved prices were kept.");
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
      setPriceMode("manual");

      showMessage("Fuel prices reset successfully.");
    } catch (error) {
      showMessage("Unable to reset fuel prices.");
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

      showMessage(
        "Manual override removed. Automatic prices will be checked when you return to the calculator.",
      );
    } catch (error) {
      showMessage("Unable to refresh fuel price storage.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <Screen style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Pakistan Fuel Prices</Text>

      <Text style={styles.subheading}>
        Use verified PSO publications or enter your actual pump prices. These
        prices are saved locally on your device.
      </Text>

      <View style={styles.card}>
        {loading ? (
          <Text style={styles.loadingText}>Loading fuel prices...</Text>
        ) : (
          <>
            <Text style={styles.label}>Petrol Price / Litre</Text>

            <TextInput
              placeholderTextColor={colors.muted}
              style={styles.input}
              accessibilityLabel="Petrol price per litre"
              editable={!saving}
              value={petrol}
              onChangeText={handlePetrolChange}
              keyboardType={
                Platform.OS === "android" ? "numeric" : "decimal-pad"
              }
              placeholder="Example: 381.78"
            />

            <Text style={styles.label}>Diesel Price / Litre</Text>

            <TextInput
              placeholderTextColor={colors.muted}
              style={styles.input}
              accessibilityLabel="Diesel price per litre"
              editable={!saving}
              value={diesel}
              onChangeText={handleDieselChange}
              keyboardType={
                Platform.OS === "android" ? "numeric" : "decimal-pad"
              }
              placeholder="Example: 388.54"
            />

            <Text style={styles.noteText}>
              {priceMode === "manual"
                ? "Manual override · automatic updates paused"
                : "Automatic PSO benchmark · your pump price may differ"}
            </Text>
            <PrimaryButton
              title="Use latest PSO prices"
              variant="outline"
              disabled={saving}
              onPress={useOfficialPrices}
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
              title="Remove manual override"
              onPress={() =>
                confirmAction(
                  "Remove your saved manual override and return to automatic prices?",
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
          Automatic prices come from dated PSO publications. Updates retain the
          last verified values when unavailable. Save a manual override if your
          pump charges a different price.
        </Text>
      </View>
    </Screen>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
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
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 26,
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
      backgroundColor: colors.card,
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
      borderRadius: 26,
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
