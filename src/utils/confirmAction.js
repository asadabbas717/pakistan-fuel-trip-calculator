import { Alert, Platform } from "react-native";
export function confirmAction(
  message,
  action,
  { title = "Confirm deletion", label = "Delete", destructive = true } = {},
) {
  if (Platform.OS === "web") {
    if (globalThis.confirm(message)) action();
  } else
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: label,
        style: destructive ? "destructive" : "default",
        onPress: action,
      },
    ]);
}
