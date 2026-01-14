import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { db } from "../../src/db/client";
import * as schema from "../../src/db/schema";
import { nanoid } from "../../src/utils/nanoid";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, addHours } from "date-fns";

const EVENT_COLORS = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
];

export default function NewEventScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(addHours(new Date(), 1));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (endTime <= startTime) {
      newErrors.time = "End time must be after start time";
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
      await db.insert(schema.events).values({
        id: nanoid(),
        userId: user.id,
        title: title.trim(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: location.trim() || null,
        notes: notes.trim() || null,
        status: "confirmed",
        color,
        reminderMinutes: 15,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", "Failed to create event. Please try again.");
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
        <Text className={`text-xl font-bold ${textColor}`}>New Event</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Title */}
        <Input
          label="Title"
          placeholder="e.g., Team Meeting"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          containerClassName="mb-4"
        />

        {/* Start Date & Time */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Start Date & Time
          </Text>
          <View className="flex-row">
            <Pressable
              onPress={() => setShowStartPicker(true)}
              className="flex-1 rounded-xl px-4 py-3 mr-2"
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
                {format(startTime, "MMM d, yyyy")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowStartTimePicker(true)}
              className="flex-1 rounded-xl px-4 py-3 ml-2"
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
                {format(startTime, "h:mm a")}
              </Text>
            </Pressable>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowStartPicker(Platform.OS === "ios");
                if (selectedDate) {
                  setStartTime(selectedDate);
                  // Also update end time to be 1 hour after
                  setEndTime(addHours(selectedDate, 1));
                }
              }}
            />
          )}

          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowStartTimePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setStartTime(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* End Date & Time */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            End Date & Time
          </Text>
          <View className="flex-row">
            <Pressable
              onPress={() => setShowEndPicker(true)}
              className="flex-1 rounded-xl px-4 py-3 mr-2"
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
                {format(endTime, "MMM d, yyyy")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowEndTimePicker(true)}
              className="flex-1 rounded-xl px-4 py-3 ml-2"
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
                {format(endTime, "h:mm a")}
              </Text>
            </Pressable>
          </View>

          {showEndPicker && (
            <DateTimePicker
              value={endTime}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowEndPicker(Platform.OS === "ios");
                if (selectedDate) {
                  setEndTime(selectedDate);
                }
              }}
            />
          )}

          {showEndTimePicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowEndTimePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setEndTime(selectedDate);
                }
              }}
            />
          )}

          {errors.time && (
            <Text className="text-sm text-red-500 mt-1">{errors.time}</Text>
          )}
        </View>

        {/* Location */}
        <Input
          label="Location (Optional)"
          placeholder="e.g., Conference Room A"
          value={location}
          onChangeText={setLocation}
          containerClassName="mb-4"
        />

        {/* Color */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Event Color
          </Text>
          <View className="flex-row flex-wrap">
            {EVENT_COLORS.map((colorOption) => (
              <Pressable
                key={colorOption.value}
                onPress={() => {
                  setColor(colorOption.value);
                  Haptics.selectionAsync();
                }}
                className="mr-3 mb-3"
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: colorOption.value,
                    borderWidth: 3,
                    borderColor:
                      color === colorOption.value
                        ? isDark
                          ? "#FFFFFF"
                          : "#1A202C"
                        : "transparent",
                  }}
                >
                  {color === colorOption.value && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Notes */}
        <Input
          label="Notes (Optional)"
          placeholder="Add any additional details..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          containerClassName="mb-6"
        />

        {/* Save Button */}
        <Button onPress={handleSave} variant="primary" className="mb-8">
          Create Event
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
