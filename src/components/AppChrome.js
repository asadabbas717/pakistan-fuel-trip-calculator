import React, { useEffect } from "react";
import { Platform, StatusBar, View } from "react-native";
import { NavigationBar } from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import { useTheme } from "../theme/ThemeContext";

export default function AppChrome({ children }) {
  const { colors } = useTheme();
  useEffect(() => {
    // Transparent system bars also expose the native window behind React views.
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        hidden={false}
        barStyle={colors.dark ? "light-content" : "dark-content"}
      />
      {Platform.OS === "android" && (
        <NavigationBar hidden={false} style={colors.dark ? "light" : "dark"} />
      )}
      {children}
    </View>
  );
}
