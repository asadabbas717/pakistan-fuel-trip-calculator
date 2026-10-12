import React, { useCallback, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { confirmAction } from "../utils/confirmAction";
import colors from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import {
  deleteVehicle,
  getVehicles,
  saveVehicle,
} from "../storage/vehicleStorage";

export default function VehicleScreen() {
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
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
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      alert("Please enter vehicle name.");
      return;
    }

    if (!Number.isFinite(Number(average)) || Number(average) <= 0) {
      alert("Please enter valid average.");
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

      alert("Vehicle saved.");
    } catch (error) {
      alert(error.message);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      const updated = await deleteVehicle(id);
      setVehicles(updated);
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Saved Vehicles</Text>
      <Text style={styles.subheading}>
        Save your car/bike average to quickly calculate future trip costs.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Vehicle Name</Text>
        <TextInput
          style={styles.input}
          accessibilityLabel="Vehicle name"
          placeholder="Example: Honda Civic"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Average km/litre</Text>
        <TextInput
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
          onPress={handleSave}
        />
      </View>

      <Text style={styles.sectionTitle}>My Vehicles</Text>

      {vehicles.map((vehicle) => (
        <View key={vehicle.id} style={styles.vehicleCard}>
          <View>
            <Text style={styles.vehicleName}>{vehicle.name}</Text>
            <Text style={styles.vehicleAverage}>
              {vehicle.averageKmPerLiter} km/litre
            </Text>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel={"Delete " + vehicle.name}
            onPress={() =>
              confirmAction("Delete " + vehicle.name + "?", () =>
                handleDelete(vehicle.id),
              )
            }
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
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
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
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
  deleteButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  deleteText: {
    color: colors.danger,
    fontWeight: "800",
  },
});
