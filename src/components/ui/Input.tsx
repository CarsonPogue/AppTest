import React from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";
import { useTheme } from "../../stores/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  containerClassName = "",
  ...props
}: InputProps) {
  const { isDark } = useTheme();

  const textColor = isDark ? "#F7FAFC" : "#1A202C";
  const borderColor = error
    ? isDark
      ? "#F87171"
      : "#EF4444"
    : isDark
    ? "rgba(255, 255, 255, 0.15)"
    : "rgba(0, 0, 0, 0.1)";
  const backgroundColor = isDark
    ? "rgba(30, 41, 59, 0.5)"
    : "rgba(255, 255, 255, 0.7)";
  const placeholderColor = isDark ? "#A0AEC0" : "#718096";

  return (
    <View className={containerClassName}>
      {label && (
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: textColor }}
        >
          {label}
        </Text>
      )}
      <TextInput
        className="rounded-xl px-4 py-3 text-base"
        style={{
          color: textColor,
          borderWidth: 1,
          borderColor,
          backgroundColor,
          height: 48,
        }}
        placeholderTextColor={placeholderColor}
        {...props}
      />
      {error && (
        <Text className="text-sm mt-1" style={{ color: "#EF4444" }}>
          {error}
        </Text>
      )}
    </View>
  );
}
