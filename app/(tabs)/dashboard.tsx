import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { DashboardCard } from "../../src/components/dashboard/DashboardCard";
import { db } from "../../src/db/client";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { getGreeting, formatTime, formatDate, daysFromNow } from "../../src/utils/date";
import { startOfDay, endOfDay, addDays, addWeeks, addMonths } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { calculateDrift, type Priority } from "../../src/utils/relationshipIntelligence";
import { BlurView } from "expo-blur";

type DashboardSummary = {
  events: {
    nextEvent: { title: string; startTime: Date } | null;
    countNext7Days: number;
  };
  habits: {
    completedToday: number;
    totalToday: number;
    nextHabit: { title: string; icon: string } | null;
  };
  people: {
    overdueCount: number;
    importantNeglectedCount: number;
    nextPerson: { fullName: string; daysOverdue: number; priority: string } | null;
  };
  subscriptions: {
    nextCharge: { name: string; date: Date; amount: number } | null;
    countNext30Days: number;
  };
};

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;

    try {
      // Load all summaries in parallel for speed
      const [eventsData, habitsData, peopleData, subscriptionsData] =
        await Promise.all([
          loadEventsSummary(user.id),
          loadHabitsSummary(user.id),
          loadPeopleSummary(user.id),
          loadSubscriptionsSummary(user.id),
        ]);

      setSummary({
  events: eventsData,
  habits: habitsData,
  people: peopleData,
  subscriptions: subscriptionsData,
});

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setIsLoading(false);
    }
  };

  const loadEventsSummary = async (userId: string) => {
  const now = new Date();
  const sevenDaysFromNow = addWeeks(now, 1);

  const nowIso = now.toISOString();
  const weekIso = sevenDaysFromNow.toISOString();

  const upcomingEvents = await db.query.events.findMany({
    where: and(
      eq(schema.events.userId, userId),
      gte(schema.events.startTime, nowIso),
      eq(schema.events.status, "confirmed")
    ),
    orderBy: [schema.events.startTime],
    limit: 1,
  });

  const eventsInWeek = await db.query.events.findMany({
    where: and(
      eq(schema.events.userId, userId),
      gte(schema.events.startTime, nowIso),
      lte(schema.events.startTime, weekIso),
      eq(schema.events.status, "confirmed")
    ),
  });

  return {
    nextEvent: upcomingEvents[0]
      ? {
          title: upcomingEvents[0].title,
          startTime: new Date(upcomingEvents[0].startTime),
        }
      : null,
    countNext7Days: eventsInWeek.length,
  };
};

  const loadHabitsSummary = async (userId: string) => {
  const todayIso = startOfDay(new Date()).toISOString();
  const endIso = endOfDay(new Date()).toISOString();

  // Get all active habits
  const allHabits = await db.query.habits.findMany({
    where: and(
      eq(schema.habits.userId, userId),
      eq(schema.habits.archived, 0)
    ),
    orderBy: [schema.habits.createdAt],
  });

  // Count completed today
  let completedCount = 0;

  for (const habit of allHabits) {
    const log = await db.query.habitLogs.findFirst({
      where: and(
        eq(schema.habitLogs.habitId, habit.id),
        gte(schema.habitLogs.completedAt, todayIso),
        lte(schema.habitLogs.completedAt, endIso)
      ),
    });

    if (log) completedCount++;
  }

  const nextHabit =
    allHabits.length > 0
      ? { title: allHabits[0].title, icon: allHabits[0].icon }
      : null;

  return {
    completedToday: completedCount,
    totalToday: allHabits.length,
    nextHabit,
  };
};

  const loadPeopleSummary = async (userId: string) => {
  const people = await db.query.people.findMany({
    where: eq(schema.people.userId, userId),
  });

  const now = new Date();

  const scored = people
    .map((p) => {
      const cadence = p.preferredCadenceDays ?? 30;
      const last = p.lastInteractionAt ? new Date(p.lastInteractionAt) : null;

      const daysSince = last
        ? Math.floor((now.getTime() - last.getTime()) / 86400000)
        : cadence;

      const daysOverdue = Math.max(0, daysSince - cadence);

      return { p, daysOverdue };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const overdue = scored.filter((x) => x.daysOverdue > 0);

  const importantNeglected = overdue.filter(
    (x) => (x.p.priority ?? "").toLowerCase() === "high"
  );

  const next = overdue[0]?.p ?? null;

  return {
    overdueCount: overdue.length,
    importantNeglectedCount: importantNeglected.length,
    nextPerson: next
      ? {
          fullName: next.fullName,
          daysOverdue: overdue[0].daysOverdue,
          priority: next.priority,
        }
      : null,
  };
};

  const loadSubscriptionsSummary = async (userId: string) => {
  const now = new Date();
  const thirtyDaysFromNow = addMonths(now, 1);

  const subsInMonth = await db.query.subscriptions.findMany({
    where: and(
      eq(schema.subscriptions.userId, userId),
      gte(schema.subscriptions.nextRenewalDate, now.toISOString()),
      lte(schema.subscriptions.nextRenewalDate, thirtyDaysFromNow.toISOString())
    ),
    orderBy: [schema.subscriptions.nextRenewalDate],
  });

  const next = subsInMonth[0];

  return {
    nextCharge: next
      ? {
          name: next.name,
          date: new Date(next.nextRenewalDate),
          amount: next.amount,
        }
      : null,
    countNext30Days: subsInMonth.length,
  };
};

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const quickActions = [
    { icon: "calendar", label: "Event", route: "/schedule/new-event", color: "#8B5CF6" },
    { icon: "checkmark-circle", label: "Habit", route: "/habits/new", color: "#10B981" },
    { icon: "person-add", label: "Person", route: "/people/new", color: "#3B82F6" },
    { icon: "card", label: "Subscription", route: "/home/subscriptions/new", color: "#EC4899" },
  ];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <Text className={secondaryTextColor}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Sticky Greeting Header with Glass Effect */}
      <View style={{ overflow: "hidden" }}>
        <BlurView
          intensity={60}
          tint={isDark ? "dark" : "light"}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <View
          style={{
            backgroundColor: isDark ? "rgba(17, 24, 39, 0.7)" : "rgba(255, 255, 255, 0.7)",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <Text className={`text-3xl font-bold ${textColor}`}>
            {getGreeting()}, {user?.firstName || "there"}
          </Text>
          <Text className={`text-base mt-1 ${secondaryTextColor}`}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
            Quick Add
          </Text>
          <View className="flex-row justify-between">
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(action.route as any);
                }}
                className="items-center"
                style={{ width: "23%" }}
              >
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                  style={{ backgroundColor: action.color + "20" }}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={24}
                    color={action.color}
                  />
                </View>
                <Text
                  className="text-xs font-medium text-center"
                  style={{ color: isDark ? "#CBD5E0" : "#4A5568" }}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Overview Cards */}
        <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
          Overview
        </Text>

        {/* Events Card */}
        <DashboardCard
          title="Events"
          icon="calendar-outline"
          iconColor="#8B5CF6"
          route="/(tabs)/schedule"
          isEmpty={!summary?.events.nextEvent}
          emptyMessage="No upcoming events"
          emptyAction="Add Event"
          onEmptyActionPress={() => router.push("/schedule/new-event" as any)}
          delay={0}
        >
          <View
            style={{
              backgroundColor: isDark ? "rgba(55, 65, 81, 0.5)" : "rgba(243, 244, 246, 0.8)",
              borderRadius: 16,
              padding: 12,
            }}
          >
            {summary?.events.nextEvent && (
              <View className="mb-2">
                <Text className={`text-sm ${secondaryTextColor}`}>Next Event</Text>
                <Text className={`text-base font-semibold ${textColor}`}>
                  {summary.events.nextEvent.title}
                </Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  {formatTime(summary.events.nextEvent.startTime)} •{" "}
                  {formatDate(summary.events.nextEvent.startTime, "MMM d")}
                </Text>
              </View>
            )}
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={16} color="#8B5CF6" />
              <Text className={`text-sm ml-2 ${secondaryTextColor}`}>
                {summary?.events.countNext7Days || 0} events in next 7 days
              </Text>
            </View>
          </View>
        </DashboardCard>

        {/* Habits Card */}
        <DashboardCard
          title="Habits"
          icon="checkmark-circle-outline"
          iconColor="#10B981"
          route="/(tabs)/habits"
          isEmpty={!summary?.habits.nextHabit}
          emptyMessage="No habits yet"
          emptyAction="Create Habit"
          onEmptyActionPress={() => router.push("/habits/new" as any)}
          delay={1}
        >
          <View
            style={{
              backgroundColor: isDark ? "rgba(55, 65, 81, 0.5)" : "rgba(243, 244, 246, 0.8)",
              borderRadius: 16,
              padding: 12,
            }}
          >
            <View className="mb-2">
              <Text className={`text-sm ${secondaryTextColor}`}>Today's Progress</Text>
              <View className="flex-row items-baseline">
                <Text className={`text-2xl font-bold ${textColor}`}>
                  {summary?.habits.completedToday || 0}
                </Text>
                <Text className={`text-base ${secondaryTextColor} ml-1`}>
                  / {summary?.habits.totalToday || 0} completed
                </Text>
              </View>
            </View>
            {summary?.habits.nextHabit && (
              <View className="flex-row items-center">
                <Text className="text-xl mr-2">{summary.habits.nextHabit.icon}</Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  {summary.habits.nextHabit.title}
                </Text>
              </View>
            )}
          </View>
        </DashboardCard>

        {/* People Card */}
        <DashboardCard
          title="People"
          icon="people-outline"
          iconColor="#3B82F6"
          route="/(tabs)/people"
          isEmpty={!summary?.people.nextPerson}
          emptyMessage="No people to reach out to"
          emptyAction="Add Person"
          onEmptyActionPress={() => router.push("/people/new" as any)}
          delay={2}
        >
          <View
            style={{
              backgroundColor: isDark ? "rgba(55, 65, 81, 0.5)" : "rgba(243, 244, 246, 0.8)",
              borderRadius: 16,
              padding: 12,
            }}
          >
            {summary?.people.nextPerson && (
              <View className="mb-2">
                <View className="flex-row items-center mb-1">
                  <Text className={`text-sm ${secondaryTextColor}`}>Next to Contact</Text>
                  {summary.people.nextPerson.priority === "high" && (
                    <View className="ml-2 bg-red-500/20 px-2 py-0.5 rounded">
                      <Text className="text-xs font-semibold" style={{ color: "#EF4444" }}>
                        HIGH
                      </Text>
                    </View>
                  )}
                </View>
                <Text className={`text-base font-semibold ${textColor}`}>
                  {summary.people.nextPerson.fullName}
                </Text>
                <Text className={`text-sm`} style={{ color: "#EF4444" }}>
                  {summary.people.nextPerson.daysOverdue > 0
                    ? `${summary.people.nextPerson.daysOverdue} days overdue`
                    : "Due soon"}
                </Text>
              </View>
            )}
            <View>
              {(summary?.people?.importantNeglectedCount ?? 0) > 0 && (
  <View className="flex-row items-center mb-1">
    <Ionicons name="warning" size={16} color="#EF4444" />
    <Text className={`text-sm ml-2 ${secondaryTextColor}`}>
      {summary?.people?.importantNeglectedCount} important & neglected
    </Text>
  </View>
)}
              <View className="flex-row items-center">
  <Ionicons name="alert-circle" size={16} color="#F59E0B" />
  <Text className={`text-sm ml-2 ${secondaryTextColor}`}>
    {summary?.people?.importantNeglectedCount ?? 0}
  </Text>
</View>
            </View>
          </View>
        </DashboardCard>

        {/* Home Automation Card */}
        <DashboardCard
          title="Home Automation"
          icon="home-outline"
          iconColor="#F59E0B"
          route="/(tabs)/home"
          delay={3}
        >
          <View
            style={{
              backgroundColor: isDark ? "rgba(55, 65, 81, 0.5)" : "rgba(243, 244, 246, 0.8)",
              borderRadius: 16,
              padding: 12,
            }}
          >
            {/* 2x2 Grid */}
            <View className="flex-row mb-3">
              {/* Living Room Light */}
              <View style={{ flex: 1, marginRight: 6 }}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    // Toggle logic will be added
                  }}
                  style={{
                    backgroundColor: isDark ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
                    borderRadius: 12,
                    padding: 10,
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="bulb" size={28} color="#F59E0B" />
                  <Text className={`text-xs font-medium mt-2 ${textColor}`}>
                    Living Room
                  </Text>
                  <Text
                    className="text-xs font-semibold mt-1"
                    style={{ color: "#10B981" }}
                  >
                    On
                  </Text>
                </Pressable>
              </View>

              {/* Bedroom Light */}
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    // Toggle logic will be added
                  }}
                  style={{
                    backgroundColor: isDark ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
                    borderRadius: 12,
                    padding: 10,
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="bulb-outline" size={28} color="#9CA3AF" />
                  <Text className={`text-xs font-medium mt-2 ${textColor}`}>
                    Bedroom
                  </Text>
                  <Text
                    className="text-xs font-semibold mt-1"
                    style={{ color: "#EF4444" }}
                  >
                    Off
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="flex-row">
              {/* Garage Door */}
              <View style={{ flex: 1, marginRight: 6 }}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    // Toggle logic will be added
                  }}
                  style={{
                    backgroundColor: isDark ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
                    borderRadius: 12,
                    padding: 10,
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="car" size={28} color="#6B7280" />
                  <Text className={`text-xs font-medium mt-2 ${textColor}`}>
                    Garage
                  </Text>
                  <Text
                    className="text-xs font-semibold mt-1"
                    style={{ color: "#EF4444" }}
                  >
                    Closed
                  </Text>
                </Pressable>
              </View>

              {/* Front Door Lock */}
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    // Toggle logic will be added
                  }}
                  style={{
                    backgroundColor: isDark ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
                    borderRadius: 12,
                    padding: 10,
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="lock-closed" size={28} color="#10B981" />
                  <Text className={`text-xs font-medium mt-2 ${textColor}`}>
                    Front Door
                  </Text>
                  <Text
                    className="text-xs font-semibold mt-1"
                    style={{ color: "#10B981" }}
                  >
                    Locked
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </DashboardCard>
      </ScrollView>
    </SafeAreaView>
  );
}
