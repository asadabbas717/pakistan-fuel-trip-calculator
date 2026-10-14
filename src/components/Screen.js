import React from "react";
import PageTransition from "./PageTransition";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";

export function screenPadding(insets) {
  return {
    paddingBottom: Math.max(insets.bottom, 16) + 24,
    paddingLeft: Math.max(insets.left, 20),
    paddingRight: Math.max(insets.right, 20),
  };
}
export default function Screen({
  children,
  style,
  contentContainerStyle,
  ...props
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const ScrollComponent =
    Platform.OS === "web" ? ScrollView : KeyboardAwareScrollView;
  return (
    <PageTransition>
      <ScrollComponent
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        {...(Platform.OS !== "web" ? { bottomOffset: 24 } : {})}
        automaticallyAdjustKeyboardInsets={false}
        {...props}
        style={[styles.screen, { backgroundColor: colors.background }, style]}
        contentContainerStyle={[
          styles.content,
          contentContainerStyle,
          screenPadding(insets),
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {children}
      </ScrollComponent>
    </PageTransition>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingTop: 20,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    flexGrow: 1,
  },
});
