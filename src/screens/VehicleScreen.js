import React, { useCallback, useRef, useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { getPreferences, savePreferences } from "../storage/preferencesStorage";
import { confirmAction, showMessage } from "../utils/confirmAction";
import DestructiveButton from "../components/DestructiveButton";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import Screen from "../components/Screen";
import { useThemedStyles } from "../theme/ThemeContext";
import PrimaryButton from "../components/PrimaryButton";
import {
  deleteVehicle,
  getVehicles,
  saveVehicle,
} from "../storage/vehicleStorage";

export default function VehicleScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [defaultId, setDefaultId] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [name, setName] = useState("");
  const [average, setAverage] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, []),
  );

  async function loadVehicles() {
    try {
      const saved = await getVehicles();
      setVehicles(saved);
      setDefaultId((await getPreferences()).vehicleId || "");
    } catch (error) {
      showMessage(error.message);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      showMessage("Please enter vehicle name.");
      return;
    }

    if (!Number.isFinite(Number(average)) || Number(average) <= 0) {
      showMessage("Please enter valid average.");
      return;
    }

    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      const updated = await saveVehicle({
        name: name.trim(),
        averageKmPerLiter: Number(average),
      });

      setVehicles(updated);
      setName("");
      setAverage("");

      showMessage("Vehicle saved.");
    } catch (error) {
      showMessage(error.message);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (busy.current) return;
    busy.current = true;
    setDeleting(true);
    try {
      const updated = await deleteVehicle(id);
      setVehicles(updated);
    } catch (error) {
      showMessage(error.message);
    } finally {
      busy.current = false;
      setDeleting(false);
    }
  }

  return (
    <Screen style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeading
        eyebrow="YOUR GARAGE"
        title={"Every ride.\nReady to go."}
        subtitle="Save your car or bike’s average. Your next estimate is just a tap away."
      />

      <Reveal delay={80} style={styles.card}>
        <Text style={styles.formEyebrow}>ADD YOUR EVERYDAY RIDE</Text>
        <Text style={styles.label}>Vehicle Name</Text>
        <TextInput
          placeholderTextColor={colors.muted}
          style={styles.input}
          accessibilityLabel="Vehicle name"
          placeholder="Example: Honda Civic"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Average km/litre</Text>
        <TextInput
          placeholderTextColor={colors.muted}
          style={styles.input}
          accessibilityLabel="Vehicle average in kilometres per litre"
          placeholder="Example: 12"
          value={average}
          onChangeText={setAverage}
          keyboardType="numeric"
        />

        <PrimaryButton
          title="Save Vehicle"
          loading={saving}
          disabled={deleting}
          onPress={handleSave}
        />
      </Reveal>

      <Text style={styles.sectionTitle}>My Vehicles</Text>

      {vehicles.map((vehicle, index) => (
        <Reveal
          key={vehicle.id}
          delay={Math.min(index * 40, 160)}
          style={styles.vehicleCard}
        >
          <View style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
            <Text style={styles.vehicleIndex}>
              RIDE / {String(index + 1).padStart(2, "0")}
            </Text>
            <Text style={styles.vehicleName}>{vehicle.name}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={"Set " + vehicle.name + " as default"}
              style={{ paddingVertical: 12 }}
              onPress={async () => {
                try {
                  await savePreferences({ vehicleId: vehicle.id });
                  setDefaultId(vehicle.id);
                } catch (error) {
                  showMessage(error.message);
                }
              }}
            >
              <Text style={styles.vehicleAverage}>
                {defaultId === vehicle.id
                  ? "Default vehicle ✓"
                  : "Make default"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.vehicleAverage}>
              {vehicle.averageKmPerLiter} km/litre
            </Text>
          </View>

          <DestructiveButton
            disabled={saving || deleting}
            accessibilityLabel={"Delete " + vehicle.name}
            onPress={() =>
              confirmAction("Delete " + vehicle.name + "?", () =>
                handleDelete(vehicle.id),
              )
            }
          />
        </Reveal>
      ))}
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
      padding: 20,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      color: colors.text,
      fontWeight: "800",
      marginTop: 12,
      marginBottom: 8,
    },
    vehicleIndex: {
      color: colors.primary,
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: "800",
      marginBottom: 10,
    },
    formEyebrow: {
      color: colors.primary,
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: "800",
      marginBottom: 8,
    },
    input: {
      color: colors.text,
      backgroundColor: colors.input,
      minHeight: 56,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      fontSize: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
      marginTop: 18,
      marginBottom: 10,
    },
    vehicleCard: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    vehicleName: {
      color: colors.text,
      fontWeight: "900",
      fontSize: 16,
    },
    vehicleAverage: {
      color: colors.muted,
      marginTop: 4,
    },
  });
