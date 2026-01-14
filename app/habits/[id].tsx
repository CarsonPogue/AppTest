import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { Checkbox } from "../../src/components/ui/Checkbox";
import { db } from "../../src/db/client";
import { eq, and, gte, desc } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { nanoid } from "../../src/utils/nanoid";
import {
  startOfDay,
  endOfDay,
  subDays,
  format,
  isSameDay,
  startOfWeek,
  addDays,
} from "date-fns";
import { calculateStreak, getStreakMessage } from "../../src/utils/streak";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  useSharedValue,
} from "react-native-reanimated";

type Habit = {
  id: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  frequency: string;
  targetCount: number;
};

type HabitLog = {
  id: string;
  completedAt: Date;
  skipped: boolean;
  note?: string;
};

const DAYS_TO_SHOW = 56; // 8 weeks
const { width } = Dimensions.get("window");
const CELL_SIZE = (width - 48) / 8; // 8 columns (7 days + padding)

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams();
  const { isDark } = useTheme();
  const router = useRouter();

  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [streakInfo, setStreakInfo] = useState<any>(null);

  const scale = useSharedValue(1);

  useEffect(() => {
    loadHabit();
  }, [id]);

  const loadHabit = async () => {
    if (!id) return;

    try {
      const habitData = await db.query.habits.findFirst({
        where: eq(schema.habits.id, id as string),
      });

      if (!habitData) {
        router.back();
        return;
      }

      setHabit({
        id: habitData.id,
        title: habitData.title,
        description: habitData.description || undefined,
        icon: habitData.icon,
        color: habitData.color,
        frequency: habitData.frequency,
        targetCount: habitData.targetCount,
      });

      // Load logs for the last 60 days
      const sixtyDaysAgo = subDays(new Date(), 60);
      const habitLogs = await db.query.habitLogs.findMany({
        where: and(
          eq(schema.habitLogs.habitId, id as string),
          gte(schema.habitLogs.completedAt, sixtyDaysAgo)
        ),
        orderBy: [desc(schema.habitLogs.completedAt)],
      });

      const formattedLogs = habitLogs.map((log) => ({
        id: log.id,
        completedAt: new Date(log.completedAt),
        skipped: log.skipped,
        note: log.note || undefined,
      }));

      setLogs(formattedLogs);

      // Check if today is completed
      const today = startOfDay(new Date());
      const todayLog = formattedLogs.find((log) =>
        isSameDay(log.completedAt, today)
      );
      setTodayCompleted(!!todayLog && !todayLog.skipped);

      // Calculate streak
      const streak = calculateStreak(formattedLogs);
      setStreakInfo(streak);
    } catch (error) {
      console.error("Error loading habit:", error);
    }
  };

  const handleToggleToday = async () => {
    if (!habit) return;

    try {
      const today = startOfDay(new Date());

      if (todayCompleted) {
        // Remove today's log
        await db
          .delete(schema.habitLogs)
          .where(
            and(
              eq(schema.habitLogs.habitId, habit.id),
              gte(schema.habitLogs.completedAt, today),
              gte(schema.habitLogs.completedAt, endOfDay(new Date()))
            )
          );
      } else {
        // Add today's log
        await db.insert(schema.habitLogs).values({
          id: nanoid(),
          habitId: habit.id,
          completedAt: new Date(),
          skipped: false,
        });

        // Animate fire emoji
        scale.value = withSequence(
          withSpring(1.3, { damping: 10 }),
          withSpring(1, { damping: 15 })
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadHabit();
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const renderCalendar = () => {
    const today = new Date();
    const startDate = subDays(today, DAYS_TO_SHOW - 1);
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Build calendar grid
    const firstDayOfWeek = startOfWeek(startDate);
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      const date = addDays(firstDayOfWeek, i);
      currentWeek.push(date);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return (
      <View>
        {/* Day labels */}
        <View className="flex-row mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <View
              key={i}
              style={{ width: CELL_SIZE }}
              className="items-center"
            >
              <Text
                className="text-xs font-medium"
                style={{ color: isDark ? "#A0AEC0" : "#718096" }}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} className="flex-row mb-1">
            {week.map((date, dayIndex) => {
              const log = logs.find((l) => isSameDay(l.completedAt, date));
              const isCompleted = log && !log.skipped;
              const isSkipped = log && log.skipped;
              const isToday = isSameDay(date, today);
              const isFuture = date > today;

              return (
                <View
                  key={dayIndex}
                  style={{
                    width: CELL_SIZE - 4,
                    height: CELL_SIZE - 4,
                    margin: 2,
                  }}
                  className="rounded-lg items-center justify-center"
                  backgroundColor={
                    isFuture
                      ? "transparent"
                      : isCompleted
                      ? habit?.color + "40"
                      : isSkipped
                      ? isDark
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(239, 68, 68, 0.1)"
                      : isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.05)"
                  }
                  style={{
                    borderWidth: isToday ? 2 : 0,
                    borderColor: habit?.color || "#3B82F6",
                  }}
                >
                  {isCompleted && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={habit?.color}
                    />
                  )}
                  {isSkipped && (
                    <Ionicons name="close" size={14} color="#EF4444" />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  if (!habit || !streakInfo) {
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
        <Pressable>
          <Ionicons
            name="ellipsis-horizontal"
            size={28}
            color={isDark ? "#F7FAFC" : "#1A202C"}
          />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Habit Info */}
        <View className="items-center mb-6">
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: habit.color + "20" }}
          >
            <Text className="text-5xl">{habit.icon}</Text>
          </View>
          <Text className={`text-2xl font-bold ${textColor}`}>
            {habit.title}
          </Text>
          {habit.description && (
            <Text className={`text-base mt-1 ${secondaryTextColor}`}>
              {habit.description}
            </Text>
          )}
        </View>

        {/* Streak Card */}
        <Card variant="glass" className="mb-6">
          <View className="items-center py-4">
            <Animated.Text style={[{ fontSize: 64 }, animatedStyle]}>
              {streakInfo.fireEmojis || "🌱"}
            </Animated.Text>
            <Text
              className="text-4xl font-bold mt-2"
              style={{ color: streakInfo.streakColor }}
            >
              {streakInfo.currentStreak} Days
            </Text>
            <Text className={`text-lg mt-1 ${secondaryTextColor}`}>
              {getStreakMessage(streakInfo.currentStreak)}
            </Text>

            {/* Today's completion */}
            <Pressable
              onPress={handleToggleToday}
              className="flex-row items-center mt-4 px-6 py-3 rounded-xl"
              style={{
                backgroundColor: todayCompleted
                  ? habit.color + "20"
                  : isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.05)",
              }}
            >
              <Checkbox
                checked={todayCompleted}
                onToggle={handleToggleToday}
                color={habit.color}
              />
              <Text
                className={`text-base font-medium ml-3 ${
                  todayCompleted ? textColor : secondaryTextColor
                }`}
              >
                {todayCompleted ? "Completed today!" : "Mark as done today"}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Stats */}
        <View className="flex-row mb-6">
          <Card variant="glass" className="flex-1 mr-2">
            <Text className={`text-sm ${secondaryTextColor}`}>
              Longest Streak
            </Text>
            <Text className={`text-2xl font-bold mt-1 ${textColor}`}>
              {streakInfo.longestStreak}
            </Text>
            <Text className={`text-xs ${secondaryTextColor}`}>days</Text>
          </Card>

          <Card variant="glass" className="flex-1 ml-2">
            <Text className={`text-sm ${secondaryTextColor}`}>
              Completion Rate
            </Text>
            <Text className={`text-2xl font-bold mt-1 ${textColor}`}>
              {streakInfo.completionRate}%
            </Text>
            <Text className={`text-xs ${secondaryTextColor}`}>last 30 days</Text>
          </Card>
        </View>

        {/* Calendar */}
        <Card variant="glass" className="mb-6">
          <Text className={`text-lg font-semibold mb-4 ${textColor}`}>
            History
          </Text>
          {renderCalendar()}
          <View className="flex-row items-center justify-center mt-4">
            <View className="flex-row items-center mr-4">
              <View
                className="w-4 h-4 rounded mr-2"
                style={{ backgroundColor: habit.color + "40" }}
              />
              <Text className={`text-xs ${secondaryTextColor}`}>Completed</Text>
            </View>
            <View className="flex-row items-center">
              <View
                className="w-4 h-4 rounded mr-2"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                }}
              />
              <Text className={`text-xs ${secondaryTextColor}`}>Missed</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
