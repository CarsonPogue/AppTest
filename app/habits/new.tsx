import React, { useState } from "react";
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
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { db } from "../../src/db/client";
import * as schema from "../../src/db/schema";
import { nanoid } from "../../src/utils/nanoid";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const EMOJI_OPTIONS = [
  "🧘",
  "💪",
  "📚",
  "✍️",
  "🏃",
  "🎯",
  "💧",
  "🥗",
  "😴",
  "🧠",
  "🎨",
  "🎵",
  "☕",
  "🌅",
  "🙏",
];

const COLOR_OPTIONS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Orange", value: "#F97316" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Red", value: "#EF4444" },
  { name: "Yellow", value: "#F59E0B" },
];

const FREQUENCY_OPTIONS = [
  { label: "Daily", value: "daily" as const },
  { label: "Weekly", value: "weekly" as const },
  { label: "Custom", value: "custom" as const },
];

const WEEKDAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export default function NewHabitScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [color, setColor] = useState("#3B82F6");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [customInterval, setCustomInterval] = useState("1");
  const [targetCount, setTargetCount] = useState("1");
  const [reminderTime, setReminderTime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (frequency === "weekly" && selectedDays.length === 0) {
      newErrors.days = "Select at least one day";
    }

    if (frequency === "custom" && (!customInterval || parseInt(customInterval) < 1)) {
      newErrors.interval = "Enter a valid interval";
    }

    if (!targetCount || parseInt(targetCount) < 1) {
      newErrors.targetCount = "Enter a valid target count";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user) return;

    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      const frequencyConfig =
        frequency === "weekly"
          ? { days: selectedDays }
          : frequency === "custom"
          ? { custom_interval: parseInt(customInterval) }
          : undefined;

      await db.insert(schema.habits).values({
        id: nanoid(),
        userId: user.id,
        title: title.trim(),
        description: description.trim() || null,
        frequency,
        frequencyConfig: frequencyConfig as any,
        targetCount: parseInt(targetCount),
        icon,
        color,
        reminderTime: reminderTime || null,
        archived: false,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error("Error creating habit:", error);
      Alert.alert("Error", "Failed to create habit. Please try again.");
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="close"
            size={28}
            color={isDark ? "#F7FAFC" : "#1A202C"}
          />
        </Pressable>
        <Text className={`text-xl font-bold ${textColor}`}>New Habit</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Title */}
        <Input
          label="Title"
          placeholder="e.g., Morning Meditation"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          containerClassName="mb-4"
        />

        {/* Description */}
        <Input
          label="Description (Optional)"
          placeholder="e.g., 10 minutes of mindfulness"
          value={description}
          onChangeText={setDescription}
          containerClassName="mb-4"
        />

        {/* Icon */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>Icon</Text>
          <View className="flex-row flex-wrap">
            {EMOJI_OPTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  setIcon(emoji);
                  Haptics.selectionAsync();
                }}
                className="mr-2 mb-2"
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor:
                      icon === emoji
                        ? isDark
                          ? "rgba(96, 165, 250, 0.2)"
                          : "rgba(59, 130, 246, 0.2)"
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                    borderWidth: icon === emoji ? 2 : 1,
                    borderColor:
                      icon === emoji
                        ? color
                        : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Text className="text-2xl">{emoji}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Color */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>Color</Text>
          <View className="flex-row flex-wrap">
            {COLOR_OPTIONS.map((colorOption) => (
              <Pressable
                key={colorOption.value}
                onPress={() => {
                  setColor(colorOption.value);
                  Haptics.selectionAsync();
                }}
                className="mr-2 mb-2"
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: colorOption.value,
                    opacity: color === colorOption.value ? 1 : 0.5,
                    borderWidth: color === colorOption.value ? 3 : 0,
                    borderColor: isDark ? "#FFFFFF" : "#000000",
                  }}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Frequency */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Frequency
          </Text>
          <View className="flex-row">
            {FREQUENCY_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  setFrequency(option.value);
                  Haptics.selectionAsync();
                }}
                className="mr-2"
              >
                <View
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor:
                      frequency === option.value
                        ? color
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor:
                      frequency === option.value
                        ? color
                        : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Text
                    className="font-medium"
                    style={{
                      color:
                        frequency === option.value
                          ? "#FFFFFF"
                          : isDark
                          ? "#F7FAFC"
                          : "#1A202C",
                    }}
                  >
                    {option.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Weekly Days Selection */}
        {frequency === "weekly" && (
          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${textColor}`}>
              Which days?
            </Text>
            <View className="flex-row">
              {WEEKDAYS.map((day) => (
                <Pressable
                  key={day.value}
                  onPress={() => {
                    toggleDay(day.value);
                    Haptics.selectionAsync();
                  }}
                  className="mr-2"
                >
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{
                      backgroundColor: selectedDays.includes(day.value)
                        ? color
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                      borderWidth: 1,
                      borderColor: selectedDays.includes(day.value)
                        ? color
                        : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color: selectedDays.includes(day.value)
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
            {errors.days && (
              <Text className="text-sm mt-1" style={{ color: "#EF4444" }}>
                {errors.days}
              </Text>
            )}
          </View>
        )}

        {/* Custom Interval */}
        {frequency === "custom" && (
          <Input
            label="Every X days"
            placeholder="e.g., 3"
            value={customInterval}
            onChangeText={setCustomInterval}
            keyboardType="number-pad"
            error={errors.interval}
            containerClassName="mb-4"
          />
        )}

        {/* Target Count */}
        <Input
          label="Target Count"
          placeholder="e.g., 1"
          value={targetCount}
          onChangeText={setTargetCount}
          keyboardType="number-pad"
          error={errors.targetCount}
          containerClassName="mb-4"
        />

        {/* Reminder Time (Optional) */}
        <Input
          label="Reminder Time (Optional)"
          placeholder="e.g., 07:00"
          value={reminderTime}
          onChangeText={setReminderTime}
          containerClassName="mb-6"
        />

        {/* Save Button */}
        <Button
          onPress={handleSave}
          variant="primary"
          className="mb-8"
        >
          Create Habit
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
