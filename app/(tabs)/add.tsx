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
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      router.back();
    }, 250);
  };

  const handleOptionPress = (route: string) => {
    Haptics.selectionAsync();
    setVisible(false);
    setTimeout(() => {
      router.push(route as any);
    }, 250);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable onPress={handleClose} style={{ flex: 1 }}>
        {/* Subtle blur and dim background */}
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(200)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <BlurView
            intensity={20}
            tint={isDark ? "dark" : "light"}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            }}
          />
        </Animated.View>

        {/* Popup centered with smooth fade and scale animation */}
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={FadeIn.duration(250)
                .withInitialValues({ opacity: 0, transform: [{ scale: 0.95 }] })
                .withCallback(() => {
                  'worklet';
                  // Smooth scale animation
                })}
              exiting={FadeOut.duration(200)}
              style={{ gap: 12 }}
            >
              {quickAddOptions.map((option, index) => (
                <Animated.View
                  key={option.id}
                  entering={FadeIn.delay(index * 30).duration(200)}
                  exiting={FadeOut.duration(100)}
                >
                  <Pressable
                    onPress={() => handleOptionPress(option.route)}
                    style={{
                      borderRadius: 20,
                      overflow: "hidden",
                      shadowColor: option.color,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 5,
                    }}
                  >
                    <BlurView
                      intensity={30}
                      tint={isDark ? "dark" : "light"}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 16,
                        paddingHorizontal: 20,
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

                      <Ionicons name={option.icon} size={24} color="#FFFFFF" />
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: "600",
                          color: "#FFFFFF",
                          marginLeft: 14,
                          flex: 1,
                        }}
                      >
                        {option.title}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                    </BlurView>
                  </Pressable>
                </Animated.View>
              ))}

              {/* Cancel Button */}
              <Animated.View
                entering={FadeIn.delay(quickAddOptions.length * 30 + 50).duration(200)}
                exiting={FadeOut.duration(100)}
              >
                <Pressable
                  onPress={handleClose}
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    marginTop: 4,
                  }}
                >
                  <BlurView
                    intensity={30}
                    tint={isDark ? "dark" : "light"}
                    style={{
                      paddingVertical: 16,
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
                          ? "rgba(60, 60, 60, 0.9)"
                          : "rgba(80, 80, 80, 0.85)",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#FFFFFF",
                      }}
                    >
                      Cancel
                    </Text>
                  </BlurView>
                </Pressable>
              </Animated.View>
            </Animated.View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
