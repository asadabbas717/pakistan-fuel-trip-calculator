import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import ResultScreen from "../screens/ResultScreen";
import FuelPriceScreen from "../screens/FuelPriceScreen";
import HistoryScreen from "../screens/HistoryScreen";
import VehicleScreen from "../screens/VehicleScreen";
import colors from "../theme/colors";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "800",
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
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