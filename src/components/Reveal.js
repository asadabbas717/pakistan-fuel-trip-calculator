import React, { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, Platform } from "react-native";

export default function Reveal({ children, style, delay = 0 }) {
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    let animation;
    const preference = AccessibilityInfo.isReduceMotionEnabled();
    preference
      .then((reduced) => {
        if (!active || receivedEvent || reduced) return;
        progress.setValue(0);
        animation = Animated.timing(progress, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          isInteraction: false,
          delay,
          useNativeDriver: Platform.OS !== "web",
        });
        animation.start();
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (reduced) => {
        receivedEvent = true;
        if (reduced) {
          animation?.stop();
          progress.setValue(1);
        }
      },
    );
    return () => {
      active = false;
      animation?.stop();
      subscription.remove();
    };
  }, [progress, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.85, 1],
          }),
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
