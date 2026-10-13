import React, { useRef, useSyncExternalStore } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import {
  dismissDialog,
  getDialogs,
  showMessage,
  subscribeDialogs,
} from "../utils/confirmAction";
import DestructiveButton from "./DestructiveButton";
export default function DialogHost() {
  const dialog = useSyncExternalStore(
    subscribeDialogs,
    getDialogs,
    getDialogs,
  )[0];
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cancelRef = useRef(null);
  function close() {
    if (dialog) dismissDialog(dialog);
  }
  function accept() {
    // Removing synchronously prevents repeated taps from executing twice.
    if (!dismissDialog(dialog) || !dialog.action) return;
    Promise.resolve()
      .then(dialog.action)
      .catch((error) =>
        showMessage(error.message || "Unable to complete this action."),
      );
  }
  return (
    <Modal
      visible={!!dialog}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={close}
      onShow={() => {
        Keyboard.dismiss();
        if (Platform.OS === "web") cancelRef.current?.focus();
        else {
          const node = findNodeHandle(cancelRef.current);
          if (node) AccessibilityInfo.setAccessibilityFocus(node);
        }
      }}
    >
      <View
        style={[
          styles.backdrop,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {dialog && (
          <View
            accessibilityViewIsModal
            importantForAccessibility="yes"
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <ScrollView style={styles.message}>
              <Text
                accessibilityRole="header"
                style={[styles.title, { color: colors.text }]}
              >
                {dialog.title}
              </Text>
              <Text style={[styles.body, { color: colors.muted }]}>
                {dialog.message}
              </Text>
            </ScrollView>
            <View style={styles.actions}>
              {!!dialog.action && (
                <Pressable
                  ref={cancelRef}
                  accessibilityRole="button"
                  onPress={close}
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </Pressable>
              )}
              {dialog.destructive ? (
                <DestructiveButton title={dialog.label} onPress={accept} />
              ) : (
                <Pressable
                  ref={dialog.action ? undefined : cancelRef}
                  accessibilityRole="button"
                  onPress={accept}
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[styles.buttonText, { color: colors.onPrimary }]}
                  >
                    {dialog.label}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "100%",
    padding: 24,
    borderRadius: 26,
    borderWidth: 1,
  },
  message: { flexShrink: 1 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 12 },
  body: { fontSize: 17, lineHeight: 26 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  button: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "800" },
});
