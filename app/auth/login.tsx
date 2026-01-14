import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { db } from "../../src/db/client";
import { verifyPassword } from "../../src/utils/auth";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function LoginScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { login } = useUserStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const handleLogin = async () => {
    setErrors({});

    if (!email || !password) {
      setErrors({
        email: !email ? "Email is required" : "",
        password: !password ? "Password is required" : "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);

    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email.toLowerCase()),
      });

      if (!user) {
        setErrors({ email: "No account found with this email" });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        return;
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        setErrors({ password: "Incorrect password" });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        return;
      }

      // Log in the user
      await login(user.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Failed to log in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingVertical: 40 }}>
        <View className="items-center py-8">
          <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
            <Ionicons name="log-in" size={40} color="#3B82F6" />
          </View>
          <Text className={`text-3xl font-bold ${textColor}`}>Welcome Back</Text>
          <Text className={`text-base mt-2 ${secondaryTextColor} text-center`}>
            Log in to continue managing your life
          </Text>
        </View>

        <Card variant="glass" className="mb-6">
          <View className="p-2">
            {/* Email */}
            <Input
              label="Email"
              placeholder="john@example.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              containerClassName="mb-4"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <View className="mb-6">
              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry={!showPassword}
                containerClassName="mb-0"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={isDark ? "#A0AEC0" : "#718096"}
                />
              </Pressable>
            </View>

            {/* Login Button */}
            <Button
              onPress={handleLogin}
              variant="primary"
              className="mb-3"
              disabled={isLoading}
            >
              {isLoading ? "Logging In..." : "Log In"}
            </Button>

            {/* Sign Up Link */}
            <Pressable
              onPress={() => router.replace("/auth/signup")}
              className="items-center py-2"
            >
              <Text className={secondaryTextColor}>
                Don't have an account?{" "}
                <Text className="text-primary font-semibold">Sign Up</Text>
              </Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
