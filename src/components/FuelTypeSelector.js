import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import colors from "../theme/colors";

export default function FuelTypeSelector({ selectedFuel, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fuel Type</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.option, selectedFuel === "petrol" && styles.active]}
          onPress={() => onChange("petrol")}
        >
          <Text style={[styles.optionText, selectedFuel === "petrol" && styles.activeText]}>
            Petrol
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, selectedFuel === "diesel" && styles.active]}
          onPress={() => onChange("diesel")}
        >
          <Text style={[styles.optionText, selectedFuel === "diesel" && styles.activeText]}>
            Diesel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "700",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontWeight: "700",
  },
  activeText: {
    color: "#fff",
  },
});