import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/stores/theme";
import { View, Animated, Easing } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";

function AnimatedRainbowRing({ isDark }: { isDark: boolean }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={{
        width: 64,
        height: 64,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 0,
      }}
    >
      {/* Animated Rainbow gradient ring */}
      <Animated.View
        style={{
          position: "absolute",
          width: 64,
          height: 64,
          transform: [{ rotate }],
        }}
      >
        <LinearGradient
          colors={[
            "#FF6B9D",
            "#C239B3",
            "#6E85F5",
            "#45E3FF",
            "#8FE85A",
            "#FFC764",
            "#FF6B9D",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
          }}
        />
      </Animated.View>
      {/* White inner circle with black plus icon */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Ionicons name="add" size={32} color="#000000" />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { isDark } = useTheme();

  const colors = {
    primary: isDark ? "#60A5FA" : "#3B82F6",
    inactive: isDark ? "#737373" : "#9CA3AF",
    border: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 4,
          position: "absolute",
          bottom: 20,
          left: 40,
          right: 40,
          marginHorizontal: 20,
          borderRadius: 40,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 4,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="systemUltraThinMaterial"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 40,
              overflow: "hidden",
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
          tabBarIcon: ({ focused }) => <AnimatedRainbowRing isDark={isDark} />,
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
