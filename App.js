import React from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import DialogHost from "./src/components/DialogHost";
import AppChrome from "./src/components/AppChrome";
import AppErrorBoundary from "./src/components/AppErrorBoundary";
import AppNavigator from "./src/navigation/AppNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./src/theme/ThemeContext";

export default function App() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppChrome>
            <KeyboardProvider
              preload={false}
              statusBarTranslucent
              navigationBarTranslucent
              preserveEdgeToEdge
            >
              <AppNavigator />
              <DialogHost />
            </KeyboardProvider>
          </AppChrome>
        </ThemeProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
