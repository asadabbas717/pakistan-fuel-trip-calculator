import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MotionPressable from "./MotionPressable";
import { useThemedStyles } from "../theme/ThemeContext";

export default function FuelTypeSelector({ selectedFuel, onChange }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fuel Type</Text>

      <View style={styles.row}>
        <MotionPressable
          containerStyle={{ flex: 1 }}
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
            {selectedFuel === "petrol" ? "Petrol  ✓" : "Petrol"}
          </Text>
        </MotionPressable>

        <MotionPressable
          containerStyle={{ flex: 1 }}
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
            {selectedFuel === "diesel" ? "Diesel  ✓" : "Diesel"}
          </Text>
        </MotionPressable>
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
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingVertical: 17,
      minHeight: 58,
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
