import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/stores/theme";

export default function ScheduleScreen() {
  const { isDark } = useTheme();
  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-4">
        <Text className={`text-3xl font-bold mb-4 ${textColor}`}>
          Schedule
        </Text>
        <Text className={`text-base ${secondaryTextColor} text-center`}>
          Calendar, tasks, and booking links will appear here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
