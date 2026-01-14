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
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { db } from "../../src/db/client";
import * as schema from "../../src/db/schema";
import { nanoid } from "../../src/utils/nanoid";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const TAG_OPTIONS = [
  "friend",
  "family",
  "colleague",
  "mentor",
  "partner",
  "neighbor",
  "client",
];

const PRIORITY_OPTIONS: Array<{ value: "low" | "normal" | "high"; label: string }> = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

const FREQUENCY_PRESETS = [
  { label: "Weekly", days: 7 },
  { label: "Bi-weekly", days: 14 },
  { label: "Monthly", days: 30 },
  { label: "Quarterly", days: 90 },
];

export default function NewPersonScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [preferredCadenceDays, setPreferredCadenceDays] = useState("14");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const textColor = isDark ? "text-white" : "text-gray-900";

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
    Haptics.selectionAsync();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Name is required";
    }

    if (!preferredCadenceDays || parseInt(preferredCadenceDays) < 1) {
      newErrors.frequency = "Enter a valid frequency";
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
      await db.insert(schema.people).values({
        id: nanoid(),
        userId: user.id,
        fullName: fullName.trim(),
        tags: tags.join(","),
        priority,
        preferredCadenceDays: parseInt(preferredCadenceDays),
        phone: phone.trim() || null,
        email: email.trim() || null,
        birthday: birthday.trim() || null,
        notes: notes.trim() || "",
        lastInteractionAt: null,
        lastInteractionType: null,
        createdAt: new Date().toISOString(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error("Error creating person:", error);
      Alert.alert("Error", "Failed to add person. Please try again.");
    }
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
        <Text className={`text-xl font-bold ${textColor}`}>New Person</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Full Name */}
        <Input
          label="Full Name"
          placeholder="e.g., Sarah Johnson"
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
          containerClassName="mb-4"
        />

        {/* Tags */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Tags (Select all that apply)
          </Text>
          <View className="flex-row flex-wrap">
            {TAG_OPTIONS.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                className="mr-2 mb-2"
              >
                <View
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor: tags.includes(tag)
                      ? "#3B82F6"
                      : isDark
                      ? "rgba(30, 41, 59, 0.5)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor: tags.includes(tag)
                      ? "#3B82F6"
                      : isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Text
                    className="font-medium capitalize"
                    style={{
                      color: tags.includes(tag)
                        ? "#FFFFFF"
                        : isDark
                        ? "#F7FAFC"
                        : "#1A202C",
                    }}
                  >
                    {tag}
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
            {PRIORITY_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  setPriority(option.value);
                  Haptics.selectionAsync();
                }}
                className="mr-2 mb-2"
              >
                <View
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor:
                      priority === option.value
                        ? "#3B82F6"
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor:
                      priority === option.value
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
                        priority === option.value
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

        {/* Check-in Frequency */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Check-in Frequency
          </Text>
          <View className="flex-row flex-wrap mb-2">
            {FREQUENCY_PRESETS.map((preset) => (
              <Pressable
                key={preset.days}
                onPress={() => {
                  setPreferredCadenceDays(preset.days.toString());
                  Haptics.selectionAsync();
                }}
                className="mr-2 mb-2"
              >
                <View
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor:
                      preferredCadenceDays === preset.days.toString()
                        ? "#3B82F6"
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor:
                      preferredCadenceDays === preset.days.toString()
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
                        preferredCadenceDays === preset.days.toString()
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
            value={preferredCadenceDays}
            onChangeText={setPreferredCadenceDays}
            keyboardType="number-pad"
            error={errors.frequency}
          />
        </View>

        {/* Phone */}
        <Input
          label="Phone (Optional)"
          placeholder="e.g., 555-0101"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          containerClassName="mb-4"
        />

        {/* Email */}
        <Input
          label="Email (Optional)"
          placeholder="e.g., sarah@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          containerClassName="mb-4"
        />

        {/* Birthday */}
        <Input
          label="Birthday (Optional)"
          placeholder="e.g., 1990-03-15"
          value={birthday}
          onChangeText={setBirthday}
          containerClassName="mb-4"
        />

        {/* Notes */}
        <Input
          label="Notes (Optional)"
          placeholder="e.g., Met at conference, loves hiking"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          containerClassName="mb-6"
        />

        {/* Save Button */}
        <Button onPress={handleSave} variant="primary" className="mb-8">
          Add Person
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
