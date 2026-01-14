import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { db } from "../../src/db/client";
import { eq } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, parse } from "date-fns";
import { Platform } from "react-native";

const GREETING_STYLES = [
  { value: "casual", label: "Casual" },
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
];

const WORKDAYS = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
  { value: "0", label: "Sun" },
];

export default function EditProfileScreen() {
  const { isDark } = useTheme();
  const { user, refreshUser } = useUserStore();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [birthday, setBirthday] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [greetingStyle, setGreetingStyle] = useState("casual");
  const [selectedWorkdays, setSelectedWorkdays] = useState<string[]>(["1", "2", "3", "4", "5"]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      if (user.birthday) {
        try {
          const parsed = parse(user.birthday, "yyyy-MM-dd", new Date());
          setBirthday(parsed);
        } catch (e) {
          console.error("Error parsing birthday:", e);
        }
      }
      setGreetingStyle(user.greetingStyle || "casual");
      const workdaysArray = (user.workdays || "1,2,3,4,5").split(",");
      setSelectedWorkdays(workdaysArray);
    }
  }, [user]);

  const toggleWorkday = (day: string) => {
    if (selectedWorkdays.includes(day)) {
      setSelectedWorkdays(selectedWorkdays.filter((d) => d !== day));
    } else {
      setSelectedWorkdays([...selectedWorkdays, day]);
    }
    Haptics.selectionAsync();
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      await db
        .update(schema.users)
        .set({
          firstName: firstName.trim(),
          birthday: format(birthday, "yyyy-MM-dd"),
          greetingStyle,
          workdays: selectedWorkdays.join(","),
        })
        .where(eq(schema.users.id, user.id));

      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="close"
            size={28}
            color={isDark ? "#F7FAFC" : "#1A202C"}
          />
        </Pressable>
        <Text className={`text-xl font-bold ${textColor}`}>Edit Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Profile Photo Placeholder */}
        <View className="items-center py-6">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-3"
            style={{
              backgroundColor: isDark
                ? "rgba(59, 130, 246, 0.2)"
                : "rgba(59, 130, 246, 0.1)",
            }}
          >
            <Ionicons name="person" size={48} color="#3B82F6" />
          </View>
          <Pressable onPress={() => Alert.alert("Coming Soon", "Photo upload will be available soon")}>
            <Text className="text-sm font-medium text-primary">Change Photo</Text>
          </Pressable>
        </View>

        {/* First Name */}
        <Input
          label="First Name"
          placeholder="John"
          value={firstName}
          onChangeText={setFirstName}
          error={errors.firstName}
          containerClassName="mb-4"
          autoCapitalize="words"
        />

        {/* Birthday */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>Birthday</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="rounded-xl px-4 py-3 flex-row items-center justify-between"
            style={{
              borderWidth: 1,
              borderColor: isDark
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

        {/* Greeting Style */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Greeting Style
          </Text>
          <View className="flex-row flex-wrap">
            {GREETING_STYLES.map((style) => (
              <Pressable
                key={style.value}
                onPress={() => {
                  setGreetingStyle(style.value);
                  Haptics.selectionAsync();
                }}
                className="mr-2 mb-2"
              >
                <View
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor:
                      greetingStyle === style.value
                        ? "#3B82F6"
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor:
                      greetingStyle === style.value
                        ? "#3B82F6"
                        : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Text
                    className="font-medium"
                    style={{
                      color:
                        greetingStyle === style.value
                          ? "#FFFFFF"
                          : isDark
                          ? "#F7FAFC"
                          : "#1A202C",
                    }}
                  >
                    {style.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Workdays */}
        <View className="mb-6">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Workdays (for scheduling)
          </Text>
          <View className="flex-row flex-wrap">
            {WORKDAYS.map((day) => (
              <Pressable
                key={day.value}
                onPress={() => toggleWorkday(day.value)}
                className="mr-2 mb-2"
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: selectedWorkdays.includes(day.value)
                      ? "#3B82F6"
                      : isDark
                      ? "rgba(30, 41, 59, 0.5)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor: selectedWorkdays.includes(day.value)
                      ? "#3B82F6"
                      : isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Text
                    className="font-semibold text-xs"
                    style={{
                      color: selectedWorkdays.includes(day.value)
                        ? "#FFFFFF"
                        : isDark
                        ? "#F7FAFC"
                        : "#1A202C",
                    }}
                  >
                    {day.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <Button onPress={handleSave} variant="primary" className="mb-8">
          Save Changes
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
