import React, { useState, useEffect } from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

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

  useEffect(() => {
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
    setVisible(false);
    setTimeout(() => {
      router.push(route as any);
    }, 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Blur Background with Vignette */}
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1 }}
      >
        <Pressable onPress={handleClose} style={{ flex: 1 }}>
          <BlurView
            intensity={40}
            tint={isDark ? "dark" : "light"}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Vignette overlay */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }}
          />

          <SafeAreaView style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={{ gap: 16 }}>
                {quickAddOptions.map((option, index) => (
                  <Animated.View
                    key={option.id}
                    entering={SlideInDown.delay(index * 50)
                      .duration(400)
                      .springify()
                      .damping(15)}
                  >
                    <Pressable
                      onPress={() => handleOptionPress(option.route)}
                      style={{
                        borderRadius: 24,
                        overflow: "hidden",
                        shadowColor: option.color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                        elevation: 8,
                      }}
                    >
                      <BlurView
                        intensity={30}
                        tint={isDark ? "dark" : "light"}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 20,
                          paddingHorizontal: 24,
                        }}
                      >
                        {/* Color background with glass effect */}
                        <View
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: option.color,
                            opacity: 0.85,
                          }}
                        />

                        <Ionicons name={option.icon} size={28} color="#FFFFFF" />
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "600",
                            color: "#FFFFFF",
                            marginLeft: 16,
                            flex: 1,
                          }}
                        >
                          {option.title}
                        </Text>
                        <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
                      </BlurView>
                    </Pressable>
                  </Animated.View>
                ))}

                {/* Cancel Button */}
                <Animated.View
                  entering={SlideInDown.delay(quickAddOptions.length * 50 + 100)
                    .duration(400)
                    .springify()
                    .damping(15)}
                >
                  <Pressable
                    onPress={handleClose}
                    style={{
                      borderRadius: 24,
                      overflow: "hidden",
                      marginTop: 8,
                    }}
                  >
                    <BlurView
                      intensity={50}
                      tint={isDark ? "dark" : "light"}
                      style={{
                        paddingVertical: 18,
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: isDark
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.05)",
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: isDark ? "#E5E7EB" : "#374151",
                        }}
                      >
                        Cancel
                      </Text>
                    </BlurView>
                  </Pressable>
                </Animated.View>
              </View>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
