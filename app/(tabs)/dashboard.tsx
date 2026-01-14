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
    nextPerson: { name: string; daysOverdue: number } | null;
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

    const upcomingEvents = await db.query.events.findMany({
      where: and(
        eq(schema.events.userId, userId),
        gte(schema.events.startTime, now),
        eq(schema.events.status, "confirmed")
      ),
      orderBy: [schema.events.startTime],
      limit: 1,
    });

    const eventsInWeek = await db.query.events.findMany({
      where: and(
        eq(schema.events.userId, userId),
        gte(schema.events.startTime, now),
        lte(schema.events.startTime, sevenDaysFromNow),
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
    const today = startOfDay(new Date());

    const allHabits = await db.query.habits.findMany({
      where: and(
        eq(schema.habits.userId, userId),
        eq(schema.habits.archived, false)
      ),
    });

    let completedCount = 0;
    for (const habit of allHabits) {
      const log = await db.query.habitLogs.findFirst({
        where: and(
          eq(schema.habitLogs.habitId, habit.id),
          gte(schema.habitLogs.completedAt, today),
          lte(schema.habitLogs.completedAt, endOfDay(new Date()))
        ),
      });
      if (log && !log.skipped) {
        completedCount++;
      }
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
    const allPeople = await db.query.people.findMany({
      where: eq(schema.people.userId, userId),
    });

    const overduePeople = allPeople.filter((p) => {
      if (!p.lastContactDate) return true;
      const daysSinceContact = Math.abs(daysFromNow(p.lastContactDate));
      return daysSinceContact >= p.touchpointFrequencyDays;
    });

    const sorted = overduePeople.sort((a, b) => {
      const aDays = a.lastContactDate
        ? Math.abs(daysFromNow(a.lastContactDate)) - a.touchpointFrequencyDays
        : a.touchpointFrequencyDays;
      const bDays = b.lastContactDate
        ? Math.abs(daysFromNow(b.lastContactDate)) - b.touchpointFrequencyDays
        : b.touchpointFrequencyDays;
      return bDays - aDays;
    });

    const nextPerson = sorted[0]
      ? {
          name: sorted[0].name,
          daysOverdue: sorted[0].lastContactDate
            ? Math.abs(daysFromNow(sorted[0].lastContactDate)) -
              sorted[0].touchpointFrequencyDays
            : sorted[0].touchpointFrequencyDays,
        }
      : null;

    return {
      overdueCount: overduePeople.length,
      nextPerson,
    };
  };

  const loadSubscriptionsSummary = async (userId: string) => {
    const now = new Date();
    const thirtyDaysFromNow = addMonths(now, 1);

    const nextSub = await db.query.subscriptions.findMany({
      where: and(
        eq(schema.subscriptions.userId, userId),
        gte(schema.subscriptions.nextRenewalDate, now)
      ),
      orderBy: [schema.subscriptions.nextRenewalDate],
      limit: 1,
    });

    const subsInMonth = await db.query.subscriptions.findMany({
      where: and(
        eq(schema.subscriptions.userId, userId),
        gte(schema.subscriptions.nextRenewalDate, now),
        lte(schema.subscriptions.nextRenewalDate, thirtyDaysFromNow)
      ),
    });

    return {
      nextCharge: nextSub[0]
        ? {
            name: nextSub[0].name,
            date: new Date(nextSub[0].nextRenewalDate),
            amount: nextSub[0].amount,
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Greeting */}
        <View className="mb-6">
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
          <View>
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
          <View>
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
          <View>
            {summary?.people.nextPerson && (
              <View className="mb-2">
                <Text className={`text-sm ${secondaryTextColor}`}>Next to Contact</Text>
                <Text className={`text-base font-semibold ${textColor}`}>
                  {summary.people.nextPerson.name}
                </Text>
                <Text className={`text-sm`} style={{ color: "#EF4444" }}>
                  {summary.people.nextPerson.daysOverdue > 0
                    ? `${summary.people.nextPerson.daysOverdue} days overdue`
                    : "Due soon"}
                </Text>
              </View>
            )}
            <View className="flex-row items-center">
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text className={`text-sm ml-2 ${secondaryTextColor}`}>
                {summary?.people.overdueCount || 0} overdue touchpoints
              </Text>
            </View>
          </View>
        </DashboardCard>

        {/* Subscriptions Card */}
        <DashboardCard
          title="Subscriptions"
          icon="card-outline"
          iconColor="#EC4899"
          route="/(tabs)/home"
          isEmpty={!summary?.subscriptions.nextCharge}
          emptyMessage="No subscriptions tracked"
          emptyAction="Add Subscription"
          onEmptyActionPress={() => router.push("/home/subscriptions/new" as any)}
          delay={3}
        >
          <View>
            {summary?.subscriptions.nextCharge && (
              <View className="mb-2">
                <Text className={`text-sm ${secondaryTextColor}`}>Next Renewal</Text>
                <Text className={`text-base font-semibold ${textColor}`}>
                  {summary.subscriptions.nextCharge.name}
                </Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  ${summary.subscriptions.nextCharge.amount.toFixed(2)} on{" "}
                  {formatDate(summary.subscriptions.nextCharge.date, "MMM d")}
                </Text>
              </View>
            )}
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={16} color="#EC4899" />
              <Text className={`text-sm ml-2 ${secondaryTextColor}`}>
                {summary?.subscriptions.countNext30Days || 0} renewals in next 30 days
              </Text>
            </View>
          </View>
        </DashboardCard>
      </ScrollView>
    </SafeAreaView>
  );
}
