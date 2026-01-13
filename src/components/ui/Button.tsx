import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn: PressableProps["onPressIn"] = (e) => {
    scale.value = withSpring(0.95);
    onPressIn?.(e);
  };

  const handlePressOut: PressableProps["onPressOut"] = (e) => {
    scale.value = withSpring(1);
    onPressOut?.(e);
  };

  const baseClasses = "rounded-lg items-center justify-center flex-row";

  const variantClasses = {
    primary: "bg-primary",
    secondary: "border border-primary bg-transparent",
    ghost: "bg-transparent",
  };

  const sizeClasses = {
    sm: "h-8 px-3",
    md: "h-10 px-4",
    lg: "h-12 px-6",
  };

  const textBaseClasses = "font-medium";

  const textVariantClasses = {
    primary: "text-white",
    secondary: "text-primary",
    ghost: "text-primary",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <AnimatedPressable
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled || loading ? "opacity-50" : ""
      } ${className}`}
      style={animatedStyle}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : "#3B82F6"}
        />
      ) : (
        <Text
          className={`${textBaseClasses} ${textVariantClasses[variant]} ${textSizeClasses[size]}`}
        >
          {children}
        </Text>
      )}
    </AnimatedPressable>
  );
}
