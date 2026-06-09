import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import colors from "../theme/colors";

export default function PrimaryButton({ title, onPress, loading, variant = "primary" }) {
  const isOutline = variant === "outline";

  return (
    <TouchableOpacity
      style={[styles.button, isOutline && styles.outlineButton]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : "#fff"} />
      ) : (
        <Text style={[styles.text, isOutline && styles.outlineText]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
  },
  outlineButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  outlineText: {
    color: colors.primary,
  },
});