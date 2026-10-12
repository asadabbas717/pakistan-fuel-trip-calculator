import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useThemedStyles } from "../theme/ThemeContext";

export default function PrimaryButton({
  title,
  onPress,
  loading,
  disabled = false,
  variant = "primary",
}) {
  const { colors, styles } = useThemedStyles(createStyles);
  const isOutline = variant === "outline";

  return (
    <TouchableOpacity
      style={[styles.button, isOutline && styles.outlineButton]}
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: !!(loading || disabled),
        busy: !!loading,
      }}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={isOutline ? colors.primary : colors.onPrimary}
        />
      ) : (
        <Text style={[styles.text, isOutline && styles.outlineText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
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
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    text: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    outlineText: {
      color: colors.primary,
    },
  });
