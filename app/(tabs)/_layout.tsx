import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/stores/theme";
import { View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export default function TabsLayout() {
  const { isDark } = useTheme();

  const colors = {
    primary: isDark ? "#60A5FA" : "#3B82F6",
    inactive: isDark ? "#737373" : "#9CA3AF",
    background: isDark ? "rgba(10, 10, 10, 0.7)" : "rgba(255, 255, 255, 0.7)",
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
          borderTopWidth: 0.5,
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
          position: "absolute",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 4,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={isDark ? 80 : 100}
            tint={isDark ? "dark" : "light"}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        ),
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
        name="add"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 64,
                height: 64,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              {/* Rainbow gradient ring */}
              <LinearGradient
                colors={["#FF6B9D", "#C239B3", "#6E85F5", "#45E3FF", "#8FE85A", "#FFC764", "#FF6B9D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: "absolute",
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                }}
              />
              {/* Semi-transparent inner circle */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: isDark
                    ? "rgba(59, 130, 246, 0.8)"
                    : "rgba(59, 130, 246, 0.9)",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#3B82F6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Ionicons name="add" size={32} color="#FFFFFF" />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="life"
        options={{
          title: "Life",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
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
