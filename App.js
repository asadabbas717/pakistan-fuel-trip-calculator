import React from "react";
import AppErrorBoundary from "./src/components/AppErrorBoundary";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AppErrorBoundary>
      <AppNavigator />
    </AppErrorBoundary>
  );
}
