import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Card } from "../../src/components/ui/Card";
import { db } from "../../src/db/client";
import { eq, and } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

type Habit = {
  id: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  frequency: string;
  currentStreak: number;
  completionRate: number;
};

export default function HabitsScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadHabits();
    }, [user])
  );

  const loadHabits = async () => {
    if (!user) return;

    try {
      const allHabits = await db.query.habits.findMany({
        where: and(
          eq(schema.habits.userId, user.id),
          eq(schema.habits.archived, false)
        ),
      });

      // Calculate streaks (simplified for MVP)
      const habitsWithStats = allHabits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        description: habit.description || undefined,
        icon: habit.icon,
        color: habit.color,
        frequency: habit.frequency,
        currentStreak: 5, // TODO: Calculate from logs
        completionRate: 85, // TODO: Calculate from logs
      }));

      setHabits(habitsWithStats);
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  };

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 py-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className={`text-3xl font-bold ${textColor}`}>Habits</Text>
          <Pressable
            className="bg-primary rounded-full w-10 h-10 items-center justify-center"
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/habits/new");
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        {habits.map((habit) => (
          <Card
            key={habit.id}
            className="mb-3"
            variant="glass"
            interactive
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/habits/${habit.id}`);
            }}
          >
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: habit.color + "20" }}
              >
                <Text className="text-3xl">{habit.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className={`text-lg font-semibold ${textColor}`}>
                  {habit.title}
                </Text>
                {habit.description && (
                  <Text className={`text-sm ${secondaryTextColor}`}>
                    {habit.description}
                  </Text>
                )}
                <View className="flex-row items-center mt-1">
                  <Text className={`text-xs ${secondaryTextColor}`}>
                    {habit.currentStreak} day streak
                  </Text>
                  <Text className={`text-xs mx-2 ${secondaryTextColor}`}>•</Text>
                  <Text className={`text-xs ${secondaryTextColor}`}>
                    {habit.completionRate}% completion
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#737373" : "#9CA3AF"}
              />
            </View>
          </Card>
        ))}

        {habits.length === 0 && (
          <View className="items-center justify-center py-12">
            <Text className={`text-lg ${secondaryTextColor} text-center`}>
              No habits yet.{"\n"}Tap + to create your first habit.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
