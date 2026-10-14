import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function RouteArtwork() {
  const { colors: c, reduceMotion } = useTheme();
  const progress = useRef(new Animated.Value(1)).current;
  const [width, setWidth] = useState(280);
  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 1900,
      delay: 250,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduceMotion]);
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.art}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <View
          key={i}
          style={[
            styles.grid,
            { left: `${i * 16}%`, backgroundColor: c.heroText },
          ]}
        />
      ))}
      <View style={[styles.halo, { backgroundColor: c.heroAccent }]} />
      <View style={[styles.roadStart, { borderColor: c.heroAccent }]} />
      <View style={[styles.roadTurn, { borderColor: c.heroAccent }]} />
      <View style={[styles.roadEnd, { borderColor: c.heroAccent }]} />
      <View style={[styles.start, { backgroundColor: c.heroText }]} />
      <View style={[styles.finish, { borderColor: c.heroAccent }]} />
      <Animated.View
        style={[
          styles.traveler,
          {
            backgroundColor: c.heroAccent,
            borderColor: c.hero,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 0.38, 0.56, 1],
                  outputRange: [
                    4,
                    width * 0.42 - 8,
                    width * 0.42 - 8,
                    width - 28,
                  ],
                }),
              },
              {
                translateY: progress.interpolate({
                  inputRange: [0, 0.38, 0.56, 1],
                  outputRange: [78, 78, 36, 36],
                }),
              },
            ],
          },
        ]}
      />
      <Text style={[styles.caption, { color: c.heroMuted }]}>
        A LITTLE PLANNING. A LOT MORE FREEDOM.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  art: { height: 130, marginTop: 18, overflow: "hidden" },
  grid: { position: "absolute", top: 0, bottom: 0, width: 1, opacity: 0.07 },
  halo: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    right: -8,
    top: -16,
    opacity: 0.08,
  },
  roadStart: {
    position: "absolute",
    left: 12,
    top: 84,
    width: "40%",
    borderTopWidth: 2,
  },
  roadTurn: {
    position: "absolute",
    left: "42%",
    top: 42,
    height: 44,
    borderLeftWidth: 2,
  },
  roadEnd: {
    position: "absolute",
    left: "42%",
    right: 16,
    top: 42,
    borderTopWidth: 2,
  },
  start: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    left: 8,
    top: 81,
  },
  finish: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    right: 9,
    top: 36,
  },
  traveler: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    left: 0,
    top: 0,
  },
  caption: {
    position: "absolute",
    left: 0,
    bottom: 0,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});
