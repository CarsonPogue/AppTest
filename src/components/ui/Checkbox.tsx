import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
  color?: string;
}

export function Checkbox({
  checked,
  onToggle,
  size = 24,
  color = "#3B82F6",
}: CheckboxProps) {
  const scale = useSharedValue(checked ? 1 : 0);
  const checkboxScale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(checked ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [checked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  const handlePress = () => {
    checkboxScale.value = withSpring(0.9, {
      damping: 10,
      stiffness: 300,
    });

    setTimeout(() => {
      checkboxScale.value = withSpring(1);
    }, 100);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 4,
            borderWidth: 2,
            borderColor: checked ? color : "#D1D5DB",
            backgroundColor: checked ? color : "transparent",
            alignItems: "center",
            justifyContent: "center",
          },
          checkboxAnimatedStyle,
        ]}
      >
        <Animated.View style={animatedStyle}>
          <Ionicons name="checkmark" size={size * 0.7} color="white" />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
