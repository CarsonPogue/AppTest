import React from "react";
import { View, Pressable, PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  variant?: "base" | "elevated";
  interactive?: boolean;
  className?: string;
}

export function Card({
  children,
  variant = "base",
  interactive = false,
  className = "",
  onPressIn,
  onPressOut,
  ...props
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn: PressableProps["onPressIn"] = (e) => {
    if (interactive) {
      scale.value = withSpring(0.98);
    }
    onPressIn?.(e);
  };

  const handlePressOut: PressableProps["onPressOut"] = (e) => {
    if (interactive) {
      scale.value = withSpring(1);
    }
    onPressOut?.(e);
  };

  const baseClasses = "rounded-xl p-4";

  const variantClasses = {
    base: "bg-surface border border-border",
    elevated: "bg-surface-elevated shadow-md",
  };

  if (interactive && props.onPress) {
    return (
      <AnimatedPressable
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={animatedStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </View>
  );
}
