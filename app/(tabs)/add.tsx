import React, { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { Card } from "../../src/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

type QuickAddOption = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
};

const quickAddOptions: QuickAddOption[] = [
  {
    id: "habit",
    title: "New Habit",
    icon: "checkmark-circle",
    route: "/habits/new",
    color: "#10B981",
  },
  {
    id: "person",
    title: "New Person",
    icon: "person-add",
    route: "/people/new",
    color: "#3B82F6",
  },
  {
    id: "event",
    title: "New Event",
    icon: "calendar",
    route: "/schedule/new-event",
    color: "#8B5CF6",
  },
  {
    id: "task",
    title: "New Task",
    icon: "checkbox",
    route: "/schedule/new-task",
    color: "#F59E0B",
  },
  {
    id: "subscription",
    title: "New Subscription",
    icon: "card",
    route: "/home/subscriptions/new",
    color: "#EC4899",
  },
  {
    id: "maintenance",
    title: "Log Maintenance",
    icon: "build",
    route: "/home/maintenance/new",
    color: "#EF4444",
  },
];

export default function AddScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  React.useEffect(() => {
    // Open modal when screen is focused
    setVisible(true);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      router.back();
    }, 200);
  };

  const handleOptionPress = (route: string) => {
    Haptics.selectionAsync();
    handleClose();
    // For now, just go back - we'll implement these routes next
    // setTimeout(() => router.push(route), 300);
  };

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 bg-black/50"
        onPress={handleClose}
        style={{ backdropFilter: "blur(10px)" }}
      >
        <SafeAreaView className="flex-1 justify-center px-6">
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Card variant="glass-strong" className="p-6">
                <Text className={`text-2xl font-bold mb-6 text-center ${textColor}`}>
                  Quick Add
                </Text>

                <View className="space-y-3">
                  {quickAddOptions.map((option, index) => (
                    <Pressable
                      key={option.id}
                      onPress={() => handleOptionPress(option.route)}
                      className="active:opacity-70"
                    >
                      <View className="flex-row items-center p-4 rounded-xl bg-surface">
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center mr-4"
                          style={{ backgroundColor: `${option.color}20` }}
                        >
                          <Ionicons
                            name={option.icon}
                            size={24}
                            color={option.color}
                          />
                        </View>
                        <Text className={`text-lg font-medium flex-1 ${textColor}`}>
                          {option.title}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={isDark ? "#737373" : "#9CA3AF"}
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={handleClose}
                  className="mt-6 p-4 rounded-xl bg-surface items-center active:opacity-70"
                >
                  <Text className={`text-base font-semibold ${secondaryTextColor}`}>
                    Cancel
                  </Text>
                </Pressable>
              </Card>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}
