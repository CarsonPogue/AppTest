import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/stores/theme";
import { View } from "react-native";

export default function TabsLayout() {
  const { isDark } = useTheme();

  const colors = {
    primary: isDark ? "#60A5FA" : "#3B82F6",
    inactive: isDark ? "#737373" : "#9CA3AF",
    background: isDark ? "rgba(10, 10, 10, 0.95)" : "rgba(255, 255, 255, 0.95)",
    border: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
          position: "absolute",
          backdropFilter: "blur(20px)",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="life"
        options={{
          title: "Life",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          href: null, // Hide from tab bar, accessed from schedule
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          href: null, // Remove center FAB
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          href: null, // Hide from tab bar, accessed from profile
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          href: null, // Hide from tab bar, people now at /life
        }}
      />
    </Tabs>
  );
}
