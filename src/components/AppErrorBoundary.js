import React from "react";
import { View, Text, Button } from "react-native";
export default class AppErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    console.warn("FuelTrip PK: a screen failed to render.");
  }
  render() {
    if (this.state.failed)
      return (
        <View style={{ padding: 24 }}>
          <Text accessibilityRole="alert">
            Unable to display this screen. Your saved data has not been reset.
          </Text>
          <Button
            title="Try again"
            onPress={() => this.setState({ failed: false })}
          />
        </View>
      );
    return this.props.children;
  }
}
