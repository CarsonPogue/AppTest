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
import { useTheme } from "../../../src/stores/theme";
import { useUserStore } from "../../../src/stores/user";
import { Button } from "../../../src/components/ui/Button";
import { Input } from "../../../src/components/ui/Input";
import { db } from "../../../src/db/client";
import * as schema from "../../../src/db/schema";
import { nanoid } from "../../../src/utils/nanoid";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, addDays } from "date-fns";

const CATEGORIES = [
  { value: "hvac", label: "HVAC", icon: "snow" },
  { value: "plumbing", label: "Plumbing", icon: "water" },
  { value: "electrical", label: "Electrical", icon: "flash" },
  { value: "appliance", label: "Appliance", icon: "cube" },
  { value: "lawn", label: "Lawn", icon: "leaf" },
  { value: "vehicle", label: "Vehicle", icon: "car" },
  { value: "home", label: "Home", icon: "home" },
  { value: "other", label: "Other", icon: "construct" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

const INTERVAL_PRESETS = [
  { label: "Weekly", days: 7 },
  { label: "Monthly", days: 30 },
  { label: "Quarterly", days: 90 },
  { label: "Semi-Annual", days: 180 },
  { label: "Yearly", days: 365 },
];

export default function NewMaintenanceScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("home");
  const [priority, setPriority] = useState("normal");
  const [intervalDays, setIntervalDays] = useState("30");
  const [nextDueDate, setNextDueDate] = useState(addDays(new Date(), 30));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!intervalDays || isNaN(parseInt(intervalDays)) || parseInt(intervalDays) <= 0) {
      newErrors.interval = "Enter a valid interval";
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
      await db.insert(schema.maintenanceItems).values({
        id: nanoid(),
        userId: user.id,
        title: title.trim(),
        category,
        priority,
        intervalDays: parseInt(intervalDays),
        nextDueDate: nextDueDate.toISOString(),
        lastCompletedDate: null,
        notes: notes.trim() || null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error("Error creating maintenance item:", error);
      Alert.alert("Error", "Failed to add maintenance task. Please try again.");
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
        <Text className={`text-xl font-bold ${textColor}`}>New Maintenance</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Title */}
        <Input
          label="Task Title"
          placeholder="e.g., Change air filter, Oil change"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          containerClassName="mb-4"
        />

        {/* Category */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Category
          </Text>
          <View className="flex-row flex-wrap">
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => {
                  setCategory(cat.value);
                  Haptics.selectionAsync();
                }}
                className="mr-2 mb-2"
              >
                <View
                  className="px-4 py-2 rounded-xl flex-row items-center"
                  style={{
                    backgroundColor:
                      category === cat.value
                        ? "#10B981"
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor:
                      category === cat.value
                        ? "#10B981"
                        : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={
                      category === cat.value
                        ? "#FFFFFF"
                        : isDark
                        ? "#F7FAFC"
                        : "#1A202C"
                    }
                  />
                  <Text
                    className="font-medium ml-2"
                    style={{
                      color:
                        category === cat.value
                          ? "#FFFFFF"
                          : isDark
                          ? "#F7FAFC"
                          : "#1A202C",
                    }}
                  >
                    {cat.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Priority
          </Text>
          <View className="flex-row flex-wrap">
            {PRIORITY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setPriority(opt.value);
                  Haptics.selectionAsync();
                }}
                className="mr-2 mb-2"
              >
                <View
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor:
                      priority === opt.value
                        ? "#3B82F6"
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor:
                      priority === opt.value
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
                        priority === opt.value
                          ? "#FFFFFF"
                          : isDark
                          ? "#F7FAFC"
                          : "#1A202C",
                    }}
                  >
                    {opt.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Interval */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Maintenance Interval
          </Text>
          <View className="flex-row flex-wrap mb-2">
            {INTERVAL_PRESETS.map((preset) => (
              <Pressable
                key={preset.days}
                onPress={() => {
                  setIntervalDays(preset.days.toString());
                  Haptics.selectionAsync();
                }}
                className="mr-2 mb-2"
              >
                <View
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor:
                      intervalDays === preset.days.toString()
                        ? "#10B981"
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor:
                      intervalDays === preset.days.toString()
                        ? "#10B981"
                        : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Text
                    className="font-medium"
                    style={{
                      color:
                        intervalDays === preset.days.toString()
                          ? "#FFFFFF"
                          : isDark
                          ? "#F7FAFC"
                          : "#1A202C",
                    }}
                  >
                    {preset.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Input
            placeholder="Or enter custom days"
            value={intervalDays}
            onChangeText={setIntervalDays}
            keyboardType="number-pad"
            error={errors.interval}
          />
        </View>

        {/* Next Due Date */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Next Due Date
          </Text>
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
              {format(nextDueDate, "MMMM d, yyyy")}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={isDark ? "#A0AEC0" : "#718096"}
            />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={nextDueDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setNextDueDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Notes */}
        <Input
          label="Notes (Optional)"
          placeholder="e.g., Use 16x25x1 MERV 11 filter"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          containerClassName="mb-6"
        />

        {/* Save Button */}
        <Button onPress={handleSave} variant="primary" className="mb-8">
          Add Maintenance Task
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
