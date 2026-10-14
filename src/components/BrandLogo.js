import React from "react";
import { Image, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function BrandLogo() {
  const { colors } = useTheme();
  return (
    <Image
      source={
        colors.dark
          ? require("../../assets/branding/safarwise/wordmark-dark.png")
          : require("../../assets/branding/safarwise/wordmark-light.png")
      }
      accessibilityLabel="SafarWise"
      accessible
      resizeMode="contain"
      style={[styles.logo, colors.dark && styles.dark]}
    />
  );
}

const styles = StyleSheet.create({
  logo: { width: 154, height: 44, borderRadius: 10 },
  dark: { backgroundColor: "#102E32" },
});
