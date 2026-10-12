import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { StatusBar, Text, TouchableOpacity } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import ResultScreen from "../screens/ResultScreen";
import FuelPriceScreen from "../screens/FuelPriceScreen";
import HistoryScreen from "../screens/HistoryScreen";
import VehicleScreen from "../screens/VehicleScreen";
import { useTheme } from "../theme/ThemeContext";
import AppearanceScreen from "../screens/AppearanceScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { colors, reduceMotion } = useTheme();
  const base = colors.dark ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer
      theme={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.background,
          text: colors.text,
          border: colors.border,
        },
      }}
    >
      <StatusBar barStyle={colors.dark ? "light-content" : "dark-content"} />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={({ navigation }) => ({
          animation: reduceMotion ? "none" : "slide_from_right",
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Change appearance"
              onPress={() => navigation.navigate("Appearance")}
              style={{ padding: 12 }}
            >
              <Text style={{ color: colors.primary, fontWeight: "800" }}>
                ◐ Theme
              </Text>
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "800",
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        })}
      >
        <Stack.Screen
          name="Appearance"
          component={AppearanceScreen}
          options={{ title: "Appearance", headerRight: () => null }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "FuelTrip PK" }}
        />

        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: "Trip Result" }}
        />

        <Stack.Screen
          name="FuelPrices"
          component={FuelPriceScreen}
          options={{ title: "Fuel Prices" }}
        />

        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: "Trip History" }}
        />

        <Stack.Screen
          name="Vehicles"
          component={VehicleScreen}
          options={{ title: "Saved Vehicles" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
