import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Platform,
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
import * as schema from "../../src/db/schema";
import { nanoid } from "../../src/utils/nanoid";
import { hashPassword, isValidEmail, validatePassword } from "../../src/utils/auth";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";

export default function SignUpScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { login } = useUserStore();

  const [firstName, setFirstName] = useState("");
  const [birthday, setBirthday] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email";
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    const age = new Date().getFullYear() - birthday.getFullYear();
    if (age < 13) {
      newErrors.birthday = "You must be at least 13 years old";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);

    try {
      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email.toLowerCase()),
      });

      if (existingUser) {
        setErrors({ email: "Email already registered" });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        return;
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const userId = nanoid();
      await db.insert(schema.users).values({
        id: userId,
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        birthday: format(birthday, "yyyy-MM-dd"),
        passwordHash,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: new Date().toISOString(),
      });

      // Log in the user
      await login(userId);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to dashboard
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      console.error("Sign up error:", error);
      Alert.alert("Error", "Failed to create account. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center py-8">
          <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
            <Ionicons name="person-add" size={40} color="#3B82F6" />
          </View>
          <Text className={`text-3xl font-bold ${textColor}`}>Create Account</Text>
          <Text className={`text-base mt-2 ${secondaryTextColor} text-center`}>
            Join Adult CRM and take control of your life
          </Text>
        </View>

        <Card variant="glass" className="mb-6">
          <View className="p-2">
            {/* First Name */}
            <Input
              label="First Name *"
              placeholder="John"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
              containerClassName="mb-4"
              autoCapitalize="words"
            />

            {/* Birthday */}
            <View className="mb-4">
              <Text className={`text-sm font-medium mb-2 ${textColor}`}>
                Birthday *
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="rounded-xl px-4 py-3 flex-row items-center justify-between"
                style={{
                  borderWidth: 1,
                  borderColor: errors.birthday
                    ? "#EF4444"
                    : isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(0, 0, 0, 0.1)",
                  backgroundColor: isDark
                    ? "rgba(30, 41, 59, 0.5)"
                    : "rgba(255, 255, 255, 0.7)",
                }}
              >
                <Text style={{ color: isDark ? "#F7FAFC" : "#1A202C" }}>
                  {format(birthday, "MMMM d, yyyy")}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={isDark ? "#A0AEC0" : "#718096"}
                />
              </Pressable>
              {errors.birthday && (
                <Text className="text-sm mt-1" style={{ color: "#EF4444" }}>
                  {errors.birthday}
                </Text>
              )}
              {showDatePicker && (
                <DateTimePicker
                  value={birthday}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) {
                      setBirthday(selectedDate);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Email */}
            <Input
              label="Email *"
              placeholder="john@example.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              containerClassName="mb-4"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <View className="mb-4">
              <Input
                label="Password *"
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
              <Text className={`text-xs mt-1 ${secondaryTextColor}`}>
                At least 8 characters with uppercase, lowercase, and number
              </Text>
            </View>

            {/* Confirm Password */}
            <Input
              label="Confirm Password *"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              secureTextEntry={!showPassword}
              containerClassName="mb-4"
            />

            {/* Sign Up Button */}
            <Button
              onPress={handleSignUp}
              variant="primary"
              className="mb-3"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            {/* Login Link */}
            <Pressable
              onPress={() => router.replace("/auth/login")}
              className="items-center py-2"
            >
              <Text className={secondaryTextColor}>
                Already have an account?{" "}
                <Text className="text-primary font-semibold">Log In</Text>
              </Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
