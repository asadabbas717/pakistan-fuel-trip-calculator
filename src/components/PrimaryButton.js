import React from "react";
import { Text, View, StyleSheet, ActivityIndicator } from "react-native";
import MotionPressable from "./MotionPressable";
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
    <MotionPressable
      style={[styles.button, isOutline && styles.outlineButton]}
      containerStyle={styles.wrapper}
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: !!(loading || disabled),
        busy: !!loading,
      }}
    >
      {loading ? (
        <ActivityIndicator
          color={isOutline ? colors.primary : colors.onPrimary}
        />
      ) : (
        <>
          <Text style={[styles.text, isOutline && styles.outlineText]}>
            {title}
          </Text>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.arrowDisc,
              {
                backgroundColor: isOutline
                  ? colors.primaryLight
                  : colors.onPrimary,
              },
            ]}
          >
            <Text style={[styles.arrow, { color: colors.primary }]}>↗</Text>
          </View>
        </>
      )}
    </MotionPressable>
  );
}
const createStyles = (c) =>
  StyleSheet.create({
    wrapper: { marginVertical: 6 },
    button: {
      backgroundColor: c.primary,
      paddingVertical: 13,
      paddingHorizontal: 18,
      minHeight: 58,
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 18,
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      justifyContent: "space-between",
    },
    outlineButton: { backgroundColor: c.card, borderColor: c.border },
    text: {
      color: c.onPrimary,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "800",
      flexShrink: 1,
    },
    outlineText: { color: c.primary },
    arrowDisc: {
      height: 28,
      width: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    arrow: { fontSize: 18, fontWeight: "700" },
  });
