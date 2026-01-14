import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { db } from "../../src/db/client";
import { eq, desc } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { nanoid } from "../../src/utils/nanoid";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  calculateDrift,
  getDriftColor,
  getDriftLabel,
  generateOutreachSuggestions,
  type Priority,
} from "../../src/utils/relationshipIntelligence";
import { format } from "date-fns";

type Interaction = {
  id: string;
  occurredAt: string;
  type: string;
  summary: string | null;
};

const INTERACTION_TYPES = [
  { value: "call", label: "Call", icon: "call" },
  { value: "text", label: "Text", icon: "chatbubble" },
  { value: "in_person", label: "In Person", icon: "people" },
  { value: "email", label: "Email", icon: "mail" },
  { value: "other", label: "Other", icon: "ellipsis-horizontal" },
];

export default function PersonDetailScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [person, setPerson] = useState<any>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [showLogInteraction, setShowLogInteraction] = useState(false);
  const [showOutreachSuggestions, setShowOutreachSuggestions] = useState(false);
  const [interactionType, setInteractionType] = useState("call");
  const [interactionSummary, setInteractionSummary] = useState("");

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  useEffect(() => {
    loadPerson();
    loadInteractions();
  }, [id]);

  const loadPerson = async () => {
    if (!user || !id) return;

    try {
      const personData = await db.query.people.findFirst({
        where: eq(schema.people.id, id as string),
      });

      setPerson(personData);
    } catch (error) {
      console.error("Error loading person:", error);
    }
  };

  const loadInteractions = async () => {
    if (!user || !id) return;

    try {
      const interactionsData = await db.query.interactions.findMany({
        where: eq(schema.interactions.personId, id as string),
        orderBy: [desc(schema.interactions.occurredAt)],
      });

      setInteractions(interactionsData as Interaction[]);
    } catch (error) {
      console.error("Error loading interactions:", error);
    }
  };

  const handleLogInteraction = async () => {
    if (!user || !person) return;

    try {
      const now = new Date().toISOString();

      // Create interaction
      await db.insert(schema.interactions).values({
        id: nanoid(),
        userId: user.id,
        personId: person.id,
        occurredAt: now,
        type: interactionType,
        summary: interactionSummary.trim() || null,
        createdAt: now,
      });

      // Update person's last interaction
      await db
        .update(schema.people)
        .set({
          lastInteractionAt: now,
          lastInteractionType: interactionType,
        })
        .where(eq(schema.people.id, person.id));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowLogInteraction(false);
      setInteractionSummary("");
      loadPerson();
      loadInteractions();
    } catch (error) {
      console.error("Error logging interaction:", error);
      Alert.alert("Error", "Failed to log interaction. Please try again.");
    }
  };

  if (!person) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className={secondaryTextColor}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { driftStatus, daysSinceLastInteraction } = calculateDrift(
    person.lastInteractionAt ? new Date(person.lastInteractionAt) : null,
    person.preferredCadenceDays,
    new Date(person.createdAt)
  );

  const statusColor = getDriftColor(driftStatus, isDark);
  const statusLabel = getDriftLabel(
    driftStatus,
    daysSinceLastInteraction,
    person.preferredCadenceDays
  );

  const tags = person.tags ? person.tags.split(",").filter(Boolean) : [];
  const suggestions = generateOutreachSuggestions(
    {
      fullName: person.fullName,
      tags,
      lastInteractionType: person.lastInteractionType,
      daysSinceLastInteraction,
      notes: person.notes,
    },
    false
  );

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
        <Text className={`text-xl font-bold ${textColor}`}>Contact</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Person Info Card */}
        <Card variant="glass" className="mb-4">
          <View className="items-center py-4">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: statusColor + "20" }}
            >
              <Ionicons name="person" size={40} color={statusColor} />
            </View>
            <Text className={`text-2xl font-bold ${textColor}`}>
              {person.fullName}
            </Text>
            <Text className="text-sm mt-1" style={{ color: statusColor }}>
              {statusLabel}
            </Text>

            {/* Tags */}
            {tags.length > 0 && (
              <View className="flex-row flex-wrap mt-3 justify-center">
                {tags.map((tag: string) => (
                  <View
                    key={tag}
                    className="px-3 py-1 rounded-full mr-2 mb-2"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(59, 130, 246, 0.2)"
                        : "rgba(59, 130, 246, 0.1)",
                    }}
                  >
                    <Text className="text-xs font-medium text-primary capitalize">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Priority Badge */}
            <View className="mt-3">
              <View
                className="px-3 py-1 rounded-full"
                style={{
                  backgroundColor:
                    person.priority === "high"
                      ? "rgba(239, 68, 68, 0.2)"
                      : person.priority === "low"
                      ? "rgba(156, 163, 175, 0.2)"
                      : "rgba(59, 130, 246, 0.2)",
                }}
              >
                <Text
                  className="text-xs font-semibold uppercase"
                  style={{
                    color:
                      person.priority === "high"
                        ? "#EF4444"
                        : person.priority === "low"
                        ? "#9CA3AF"
                        : "#3B82F6",
                  }}
                >
                  {person.priority} Priority
                </Text>
              </View>
            </View>

            {/* Contact Info */}
            <View className="w-full mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}>
              {person.phone && (
                <View className="flex-row items-center mb-2">
                  <Ionicons name="call-outline" size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  <Text className={`text-sm ml-2 ${secondaryTextColor}`}>{person.phone}</Text>
                </View>
              )}
              {person.email && (
                <View className="flex-row items-center mb-2">
                  <Ionicons name="mail-outline" size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  <Text className={`text-sm ml-2 ${secondaryTextColor}`}>{person.email}</Text>
                </View>
              )}
              {person.birthday && (
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={16} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  <Text className={`text-sm ml-2 ${secondaryTextColor}`}>Birthday: {person.birthday}</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View className="flex-row mb-4">
          <Button
            variant="primary"
            className="flex-1 mr-2"
            onPress={() => {
              setShowLogInteraction(true);
              Haptics.selectionAsync();
            }}
          >
            Log Interaction
          </Button>
          <Button
            variant="outline"
            className="flex-1 ml-2"
            onPress={() => {
              setShowOutreachSuggestions(!showOutreachSuggestions);
              Haptics.selectionAsync();
            }}
          >
            Outreach Ideas
          </Button>
        </View>

        {/* Outreach Suggestions */}
        {showOutreachSuggestions && (
          <Card variant="glass" className="mb-4">
            <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
              Suggested Messages
            </Text>

            <View className="mb-3">
              <Text className={`text-sm font-medium mb-1 ${textColor}`}>Casual</Text>
              <Text className={`text-sm ${secondaryTextColor}`}>{suggestions.casual}</Text>
            </View>

            <View className="mb-3">
              <Text className={`text-sm font-medium mb-1 ${textColor}`}>Friendly</Text>
              <Text className={`text-sm ${secondaryTextColor}`}>{suggestions.friendly}</Text>
            </View>

            <View>
              <Text className={`text-sm font-medium mb-1 ${textColor}`}>Direct</Text>
              <Text className={`text-sm ${secondaryTextColor}`}>{suggestions.direct}</Text>
            </View>
          </Card>
        )}

        {/* Log Interaction Form */}
        {showLogInteraction && (
          <Card variant="glass" className="mb-4">
            <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
              Log Interaction
            </Text>

            <Text className={`text-sm font-medium mb-2 ${textColor}`}>
              Type
            </Text>
            <View className="flex-row flex-wrap mb-4">
              {INTERACTION_TYPES.map((type) => (
                <Pressable
                  key={type.value}
                  onPress={() => {
                    setInteractionType(type.value);
                    Haptics.selectionAsync();
                  }}
                  className="mr-2 mb-2"
                >
                  <View
                    className="px-4 py-2 rounded-xl flex-row items-center"
                    style={{
                      backgroundColor:
                        interactionType === type.value
                          ? "#3B82F6"
                          : isDark
                          ? "rgba(30, 41, 59, 0.5)"
                          : "rgba(255, 255, 255, 0.7)",
                      borderWidth: 1,
                      borderColor:
                        interactionType === type.value
                          ? "#3B82F6"
                          : isDark
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={16}
                      color={
                        interactionType === type.value
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
                          interactionType === type.value
                            ? "#FFFFFF"
                            : isDark
                            ? "#F7FAFC"
                            : "#1A202C",
                      }}
                    >
                      {type.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Text className={`text-sm font-medium mb-2 ${textColor}`}>
              Summary (Optional)
            </Text>
            <TextInput
              placeholder="What did you talk about?"
              placeholderTextColor={isDark ? "#737373" : "#9CA3AF"}
              value={interactionSummary}
              onChangeText={setInteractionSummary}
              multiline
              numberOfLines={3}
              className="rounded-xl px-4 py-3 mb-4"
              style={{
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.15)"
                  : "rgba(0, 0, 0, 0.1)",
                backgroundColor: isDark
                  ? "rgba(30, 41, 59, 0.5)"
                  : "rgba(255, 255, 255, 0.7)",
                color: isDark ? "#F7FAFC" : "#1A202C",
              }}
            />

            <View className="flex-row">
              <Button
                variant="primary"
                className="flex-1 mr-2"
                onPress={handleLogInteraction}
              >
                Save
              </Button>
              <Button
                variant="outline"
                className="flex-1 ml-2"
                onPress={() => {
                  setShowLogInteraction(false);
                  setInteractionSummary("");
                }}
              >
                Cancel
              </Button>
            </View>
          </Card>
        )}

        {/* Interactions Timeline */}
        <Card variant="glass" className="mb-6">
          <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
            Interaction History
          </Text>

          {interactions.length === 0 ? (
            <Text className={`text-sm ${secondaryTextColor} text-center py-4`}>
              No interactions logged yet
            </Text>
          ) : (
            interactions.map((interaction, index) => (
              <View
                key={interaction.id}
                className="pb-3 mb-3"
                style={{
                  borderBottomWidth: index < interactions.length - 1 ? 1 : 0,
                  borderBottomColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                }}
              >
                <View className="flex-row items-center mb-1">
                  <Ionicons
                    name={
                      INTERACTION_TYPES.find((t) => t.value === interaction.type)
                        ?.icon as any || "ellipsis-horizontal"
                    }
                    size={16}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                  <Text className={`text-sm font-medium ml-2 ${textColor}`}>
                    {INTERACTION_TYPES.find((t) => t.value === interaction.type)
                      ?.label || interaction.type}
                  </Text>
                </View>
                <Text className={`text-xs ${secondaryTextColor} mb-1`}>
                  {format(new Date(interaction.occurredAt), "MMM d, yyyy 'at' h:mm a")}
                </Text>
                {interaction.summary && (
                  <Text className={`text-sm ${secondaryTextColor}`}>
                    {interaction.summary}
                  </Text>
                )}
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
