import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function MotionPressable({
  children,
  style,
  containerStyle,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}) {
  const { reduceMotion, colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduceMotion || disabled) {
      scale.stopAnimation();
      scale.setValue(1);
    }
    return () => scale.stopAnimation();
  }, [scale, reduceMotion, disabled]);
  function animate(toValue) {
    scale.stopAnimation();
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue,
      speed: 34,
      bounciness: 3,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }
  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={(event) => {
          animate(0.975);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animate(1);
          onPressOut?.(event);
        }}
        style={(state) => [
          typeof style === "function" ? style(state) : style,
          { opacity: disabled ? 0.45 : state.pressed ? 0.9 : 1 },
          state.hovered && !disabled && { borderColor: colors.primary },
          state.focused && {
            outlineColor: colors.primary,
            outlineWidth: 2,
            outlineOffset: 3,
          },
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
