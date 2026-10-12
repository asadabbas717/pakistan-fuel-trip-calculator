import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useThemedStyles } from "../theme/ThemeContext";

export default function FuelTypeSelector({ selectedFuel, onChange }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fuel Type</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.option, selectedFuel === "petrol" && styles.active]}
          accessibilityRole="radio"
          accessibilityState={{ checked: selectedFuel === "petrol" }}
          onPress={() => onChange("petrol")}
        >
          <Text
            style={[
              styles.optionText,
              selectedFuel === "petrol" && styles.activeText,
            ]}
          >
            Petrol
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, selectedFuel === "diesel" && styles.active]}
          accessibilityRole="radio"
          accessibilityState={{ checked: selectedFuel === "diesel" }}
          onPress={() => onChange("diesel")}
        >
          <Text
            style={[
              styles.optionText,
              selectedFuel === "diesel" && styles.activeText,
            ]}
          >
            Diesel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
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
      backgroundColor: colors.card,
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
      color: colors.onPrimary,
    },
  });
