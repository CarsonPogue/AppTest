import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Card } from "../../src/components/ui/Card";
import { Checkbox } from "../../src/components/ui/Checkbox";
import { db } from "../../src/db/client";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { getGreeting, formatTime, daysFromNow } from "../../src/utils/date";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { nanoid } from "../../src/utils/nanoid";

type HabitWithLog = {
  id: string;
  title: string;
  icon: string;
  color: string;
  completed: boolean;
};

type UpcomingEvent = {
  id: string;
  title: string;
  startTime: Date;
  type: string;
  location?: string;
};

type PersonDue = {
  id: string;
  name: string;
  daysOverdue: number;
};

export default function TodayScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);

  const [habits, setHabits] = useState<HabitWithLog[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [peopleDue, setPeopleDue] = useState<PersonDue[]>([]);
  const [stats, setStats] = useState({
    pendingBookings: 0,
    overdueTasks: 0,
    maintenanceDue: 0,
  });

  const loadData = async () => {
    if (!user) return;

    try {
      // Load today's habits
      const today = startOfDay(new Date());
      const allHabits = await db.query.habits.findMany({
        where: and(
          eq(schema.habits.userId, user.id),
          eq(schema.habits.archived, false)
        ),
      });

      const habitsWithLogs = await Promise.all(
        allHabits.map(async (habit) => {
          const log = await db.query.habitLogs.findFirst({
            where: and(
              eq(schema.habitLogs.habitId, habit.id),
              gte(schema.habitLogs.completedAt, today),
              lte(schema.habitLogs.completedAt, endOfDay(new Date()))
            ),
          });

          return {
            id: habit.id,
            title: habit.title,
            icon: habit.icon,
            color: habit.color,
            completed: !!log,
          };
        })
      );

      setHabits(habitsWithLogs);

      // Load upcoming events (next 3)
      const upcomingEvents = await db.query.events.findMany({
        where: and(
          eq(schema.events.userId, user.id),
          gte(schema.events.startTime, new Date()),
          eq(schema.events.status, "confirmed")
        ),
        orderBy: [schema.events.startTime],
        limit: 3,
      });

      setEvents(
        upcomingEvents.map((e) => ({
          id: e.id,
          title: e.title,
          startTime: new Date(e.startTime),
          type: e.type,
          location: e.location || undefined,
        }))
      );

      // Load people due for touchpoint
      const allPeople = await db.query.people.findMany({
        where: eq(schema.people.userId, user.id),
      });

      const duePeople = allPeople
        .filter((p) => {
          if (!p.lastContactDate) return true;
          const daysSinceContact = daysFromNow(p.lastContactDate);
          return Math.abs(daysSinceContact) >= p.touchpointFrequencyDays;
        })
        .slice(0, 2)
        .map((p) => ({
          id: p.id,
          name: p.name,
          daysOverdue: p.lastContactDate
            ? Math.abs(daysFromNow(p.lastContactDate)) - p.touchpointFrequencyDays
            : p.touchpointFrequencyDays,
        }));

      setPeopleDue(duePeople);

      // Load stats
      const pendingBookings = await db.query.bookings.findMany({
        where: eq(schema.bookings.status, "pending"),
      });

      const overdueTasks = await db.query.events.findMany({
        where: and(
          eq(schema.events.userId, user.id),
          eq(schema.events.type, "task"),
          eq(schema.events.status, "pending"),
          lte(schema.events.startTime, new Date())
        ),
      });

      const maintenanceDue = await db.query.maintenanceTasks.findMany({
        where: and(
          eq(schema.maintenanceTasks.active, true),
          lte(schema.maintenanceTasks.nextDueDate, addDays(new Date(), 7))
        ),
      });

      setStats({
        pendingBookings: pendingBookings.length,
        overdueTasks: overdueTasks.length,
        maintenanceDue: maintenanceDue.length,
      });
    } catch (error) {
      console.error("Error loading today data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleHabitToggle = async (habitId: string) => {
    try {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      if (habit.completed) {
        // Remove log
        await db
          .delete(schema.habitLogs)
          .where(
            and(
              eq(schema.habitLogs.habitId, habitId),
              gte(schema.habitLogs.completedAt, startOfDay(new Date()))
            )
          );
      } else {
        // Add log
        await db.insert(schema.habitLogs).values({
          id: nanoid(),
          habitId,
          completedAt: new Date(),
          skipped: false,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

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
            {getGreeting()}, {user?.name || "there"}
          </Text>
          <Text className={`text-base mt-1 ${secondaryTextColor}`}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Habits Due Today */}
        {habits.length > 0 && (
          <View className="mb-6">
            <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
              Today's Habits
            </Text>
            {habits.map((habit) => (
              <Card
                key={habit.id}
                className="mb-2 flex-row items-center"
                variant="glass"
              >
                <Checkbox
                  checked={habit.completed}
                  onToggle={() => handleHabitToggle(habit.id)}
                  color={habit.color}
                />
                <Text className="text-2xl ml-3">{habit.icon}</Text>
                <Text
                  className={`text-base flex-1 ml-3 ${
                    habit.completed
                      ? secondaryTextColor + " line-through"
                      : textColor
                  }`}
                >
                  {habit.title}
                </Text>
              </Card>
            ))}
          </View>
        )}

        {/* Upcoming Events */}
        {events.length > 0 && (
          <View className="mb-6">
            <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
              Upcoming
            </Text>
            {events.map((event) => (
              <Card key={event.id} className="mb-2" variant="glass">
                <View className="flex-row items-start">
                  <View className="bg-primary/10 rounded-lg p-2 mr-3">
                    <Ionicons
                      name={
                        event.type === "task"
                          ? "checkbox-outline"
                          : "calendar-outline"
                      }
                      size={20}
                      color="#3B82F6"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-medium ${textColor}`}>
                      {event.title}
                    </Text>
                    <Text className={`text-sm mt-1 ${secondaryTextColor}`}>
                      {formatTime(event.startTime)}
                      {event.location && ` • ${event.location}`}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* People Due for Touchpoint */}
        {peopleDue.length > 0 && (
          <View className="mb-6">
            <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
              Touchpoints Due
            </Text>
            {peopleDue.map((person) => (
              <Card key={person.id} className="mb-2" variant="glass">
                <View className="flex-row items-center">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      person.daysOverdue > 0 ? "bg-error/20" : "bg-warning/20"
                    }`}
                  >
                    <Ionicons
                      name="person"
                      size={20}
                      color={person.daysOverdue > 0 ? "#EF4444" : "#F59E0B"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-medium ${textColor}`}>
                      {person.name}
                    </Text>
                    <Text className={`text-sm ${secondaryTextColor}`}>
                      {person.daysOverdue > 0
                        ? `${person.daysOverdue} days overdue`
                        : "Due soon"}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Action Items */}
        {(stats.pendingBookings > 0 ||
          stats.overdueTasks > 0 ||
          stats.maintenanceDue > 0) && (
          <View className="mb-6">
            <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
              Action Items
            </Text>
            <Card variant="glass">
              {stats.pendingBookings > 0 && (
                <View className="flex-row items-center py-2">
                  <View className="bg-primary/10 rounded-full w-6 h-6 items-center justify-center mr-3">
                    <Text className="text-primary text-xs font-bold">
                      {stats.pendingBookings}
                    </Text>
                  </View>
                  <Text className={`text-base ${textColor}`}>
                    Pending booking approvals
                  </Text>
                </View>
              )}
              {stats.overdueTasks > 0 && (
                <View className="flex-row items-center py-2">
                  <View className="bg-error/10 rounded-full w-6 h-6 items-center justify-center mr-3">
                    <Text className="text-error text-xs font-bold">
                      {stats.overdueTasks}
                    </Text>
                  </View>
                  <Text className={`text-base ${textColor}`}>
                    Overdue tasks
                  </Text>
                </View>
              )}
              {stats.maintenanceDue > 0 && (
                <View className="flex-row items-center py-2">
                  <View className="bg-warning/10 rounded-full w-6 h-6 items-center justify-center mr-3">
                    <Text className="text-warning text-xs font-bold">
                      {stats.maintenanceDue}
                    </Text>
                  </View>
                  <Text className={`text-base ${textColor}`}>
                    Maintenance due this week
                  </Text>
                </View>
              )}
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
