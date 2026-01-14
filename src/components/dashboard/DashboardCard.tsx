import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../stores/theme";
import { Card } from "../ui/Card";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

interface DashboardCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  route: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyAction?: string;
  onEmptyActionPress?: () => void;
  children: React.ReactNode;
  delay?: number;
}

export function DashboardCard({
  title,
  icon,
  iconColor,
  route,
  isEmpty,
  emptyMessage,
  emptyAction,
  onEmptyActionPress,
  children,
  delay = 0,
}: DashboardCardProps) {
  const { isDark } = useTheme();
  const router = useRouter();

  const textColor = isDark ? "#F7FAFC" : "#1A202C";
  const secondaryTextColor = isDark ? "#A0AEC0" : "#718096";

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push(route as any);
  };

  return (
    <Animated.View entering={FadeIn.delay(delay * 100)}>
      <Card variant="glass" className="mb-4" interactive onPress={handlePress}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: iconColor + "20" }}
            >
              <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <Text className="text-lg font-semibold" style={{ color: textColor }}>
              {title}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
        </View>

        {/* Content or Empty State */}
        {isEmpty ? (
          <View className="py-4">
            <Text
              className="text-sm text-center mb-3"
              style={{ color: secondaryTextColor }}
            >
              {emptyMessage}
            </Text>
            {emptyAction && onEmptyActionPress && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.selectionAsync();
                  onEmptyActionPress();
                }}
                className="py-2 px-4 rounded-lg self-center"
                style={{ backgroundColor: iconColor + "20" }}
              >
                <Text className="text-sm font-semibold" style={{ color: iconColor }}>
                  {emptyAction}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          children
        )}
      </Card>
    </Animated.View>
  );
}
