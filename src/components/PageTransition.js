import React, { useContext, useEffect, useRef } from "react";
import { Animated, Easing, Platform } from "react-native";
import { NavigationContext } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";

// Native-stack owns native push/pop transitions; web screens animate on focus,
// including when an existing screen is revealed by Back, without remounting forms.
export default function PageTransition({ children }) {
  const navigation = useContext(NavigationContext);
  const { reduceMotion } = useTheme();
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (Platform.OS !== "web" || reduceMotion) {
      progress.setValue(1);
      return;
    }
    let animation;
    function enter() {
      animation?.stop();
      progress.setValue(0);
      animation = Animated.timing(progress, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });
      animation.start();
    }
    enter();
    const unsubscribe = navigation?.addListener("focus", enter);
    return () => {
      animation?.stop();
      unsubscribe?.();
    };
  }, [navigation, progress, reduceMotion]);
  if (Platform.OS !== "web") return children;
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 1],
        }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
