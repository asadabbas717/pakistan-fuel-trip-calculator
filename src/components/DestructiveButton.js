import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
export default function DestructiveButton({
  title = "Delete",
  accessibilityLabel = title,
  disabled = false,
  onPress,
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.dangerSurface,
          borderColor: colors.dangerBorder,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.danger }]}>{title}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 16, fontWeight: "800" },
});
