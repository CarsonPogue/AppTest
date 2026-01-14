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
import { format, addMonths } from "date-fns";

const CATEGORIES = [
  { value: "streaming", label: "Streaming", icon: "play-circle" },
  { value: "software", label: "Software", icon: "code" },
  { value: "cloud", label: "Cloud", icon: "cloud" },
  { value: "fitness", label: "Fitness", icon: "barbell" },
  { value: "news", label: "News", icon: "newspaper" },
  { value: "music", label: "Music", icon: "musical-notes" },
  { value: "other", label: "Other", icon: "ellipsis-horizontal" },
];

const BILLING_CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "quarterly", label: "Quarterly" },
];

export default function NewSubscriptionScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [nextRenewalDate, setNextRenewalDate] = useState(addMonths(new Date(), 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState("streaming");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = "Enter a valid amount";
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
      await db.insert(schema.subscriptions).values({
        id: nanoid(),
        userId: user.id,
        name: name.trim(),
        amount: parseFloat(amount),
        billingCycle,
        nextRenewalDate: nextRenewalDate.toISOString(),
        category,
        website: website.trim() || null,
        notes: notes.trim() || null,
        status: "active",
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error("Error creating subscription:", error);
      Alert.alert("Error", "Failed to add subscription. Please try again.");
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
        <Text className={`text-xl font-bold ${textColor}`}>New Subscription</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Name */}
        <Input
          label="Service Name"
          placeholder="e.g., Netflix, Spotify"
          value={name}
          onChangeText={setName}
          error={errors.name}
          containerClassName="mb-4"
        />

        {/* Amount */}
        <Input
          label="Amount"
          placeholder="9.99"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          error={errors.amount}
          containerClassName="mb-4"
        />

        {/* Billing Cycle */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Billing Cycle
          </Text>
          <View className="flex-row flex-wrap">
            {BILLING_CYCLES.map((cycle) => (
              <Pressable
                key={cycle.value}
                onPress={() => {
                  setBillingCycle(cycle.value);
                  Haptics.selectionAsync();
                }}
                className="mr-2 mb-2"
              >
                <View
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor:
                      billingCycle === cycle.value
                        ? "#3B82F6"
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor:
                      billingCycle === cycle.value
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
                        billingCycle === cycle.value
                          ? "#FFFFFF"
                          : isDark
                          ? "#F7FAFC"
                          : "#1A202C",
                    }}
                  >
                    {cycle.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Next Renewal Date */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${textColor}`}>
            Next Renewal Date
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
              {format(nextRenewalDate, "MMMM d, yyyy")}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={isDark ? "#A0AEC0" : "#718096"}
            />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={nextRenewalDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setNextRenewalDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}
        </View>

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
                        ? "#3B82F6"
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor:
                      category === cat.value
                        ? "#3B82F6"
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

        {/* Website */}
        <Input
          label="Website (Optional)"
          placeholder="https://example.com"
          value={website}
          onChangeText={setWebsite}
          keyboardType="url"
          autoCapitalize="none"
          containerClassName="mb-4"
        />

        {/* Notes */}
        <Input
          label="Notes (Optional)"
          placeholder="e.g., Premium plan, includes 4 screens"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          containerClassName="mb-6"
        />

        {/* Save Button */}
        <Button onPress={handleSave} variant="primary" className="mb-8">
          Add Subscription
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
