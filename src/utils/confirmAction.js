import { Alert, Platform } from "react-native";
export function confirmAction(message, action) {
  if (Platform.OS === "web") {
    if (globalThis.confirm(message)) action();
  } else
    Alert.alert("Confirm deletion", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: action },
    ]);
}
