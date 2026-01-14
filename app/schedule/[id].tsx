import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { Card } from "../../src/components/ui/Card";
import { db } from "../../src/db/client";
import { eq } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";

const EVENT_COLORS = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
];

export default function EventDetailScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [isEditing, setIsEditing] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("#3B82F6");

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    if (!user || !id) return;

    try {
      const eventData = await db.query.events.findFirst({
        where: eq(schema.events.id, id as string),
      });

      if (eventData) {
        setEvent(eventData);
        setTitle(eventData.title);
        setStartTime(new Date(eventData.startTime));
        setEndTime(new Date(eventData.endTime));
        setLocation(eventData.location || "");
        setNotes(eventData.notes || "");
        setColor(eventData.color || "#3B82F6");
      }
    } catch (error) {
      console.error("Error loading event:", error);
    }
  };

  const handleSave = async () => {
    if (!user || !event) return;

    try {
      await db
        .update(schema.events)
        .set({
          title: title.trim(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          location: location.trim() || null,
          notes: notes.trim() || null,
          color,
        })
        .where(eq(schema.events.id, event.id));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
      loadEvent();
    } catch (error) {
      console.error("Error updating event:", error);
      Alert.alert("Error", "Failed to update event. Please try again.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.delete(schema.events).where(eq(schema.events.id, event.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Error", "Failed to delete event.");
            }
          },
        },
      ]
    );
  };

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className={secondaryTextColor}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={28}
            color={isDark ? "#F7FAFC" : "#1A202C"}
          />
        </Pressable>
        <Text className={`text-xl font-bold ${textColor}`}>Event Details</Text>
        <Pressable
          onPress={() => {
            if (isEditing) {
              setIsEditing(false);
              // Reset to original values
              setTitle(event.title);
              setStartTime(new Date(event.startTime));
              setEndTime(new Date(event.endTime));
              setLocation(event.location || "");
              setNotes(event.notes || "");
              setColor(event.color || "#3B82F6");
            } else {
              setIsEditing(true);
            }
            Haptics.selectionAsync();
          }}
        >
          <Text className="text-base font-medium text-primary">
            {isEditing ? "Cancel" : "Edit"}
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4">
        {isEditing ? (
          <>
            {/* Edit Mode */}
            <Input
              label="Title"
              value={title}
              onChangeText={setTitle}
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
                    if (selectedDate) setStartTime(selectedDate);
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
                    if (selectedDate) setStartTime(selectedDate);
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
                    if (selectedDate) setEndTime(selectedDate);
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
                    if (selectedDate) setEndTime(selectedDate);
                  }}
                />
              )}
            </View>

            <Input
              label="Location (Optional)"
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

            <Input
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              containerClassName="mb-6"
            />

            <Button onPress={handleSave} variant="primary" className="mb-4">
              Save Changes
            </Button>

            <Button onPress={handleDelete} variant="outline" className="mb-8">
              <View className="flex-row items-center">
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text className="ml-2" style={{ color: "#EF4444" }}>
                  Delete Event
                </Text>
              </View>
            </Button>
          </>
        ) : (
          <>
            {/* View Mode */}
            <Card variant="glass" className="mb-4 p-6">
              <View
                className="w-2 h-16 absolute left-0 top-0 rounded-l-xl"
                style={{ backgroundColor: event.color }}
              />
              <View className="ml-3">
                <Text className={`text-2xl font-bold ${textColor} mb-4`}>
                  {event.title}
                </Text>

                <View className="flex-row items-center mb-3">
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <Text className={`text-base ml-3 ${textColor}`}>
                    {format(new Date(event.startTime), "EEEE, MMMM d, yyyy")}
                  </Text>
                </View>

                <View className="flex-row items-center mb-3">
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <Text className={`text-base ml-3 ${textColor}`}>
                    {format(new Date(event.startTime), "h:mm a")} -{" "}
                    {format(new Date(event.endTime), "h:mm a")}
                  </Text>
                </View>

                {event.location && (
                  <View className="flex-row items-center mb-3">
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                    <Text className={`text-base ml-3 ${textColor}`}>
                      {event.location}
                    </Text>
                  </View>
                )}
              </View>
            </Card>

            {event.notes && (
              <Card variant="glass" className="mb-4 p-4">
                <Text className={`text-sm font-semibold mb-2 ${textColor}`}>
                  Notes
                </Text>
                <Text className={`text-base ${secondaryTextColor}`}>
                  {event.notes}
                </Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
