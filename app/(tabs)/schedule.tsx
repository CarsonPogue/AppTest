import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Calendar } from "../../src/components/calendar/Calendar";
import { Card } from "../../src/components/ui/Card";
import { Checkbox } from "../../src/components/ui/Checkbox";
import { db } from "../../src/db/client";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { format, startOfDay, endOfDay, isSameDay } from "date-fns";
import { nanoid } from "../../src/utils/nanoid";

type Event = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location: string | null;
  notes: string | null;
  status: string;
  color: string;
};

type Habit = {
  id: string;
  title: string;
  icon: string;
  color: string;
  completedToday: boolean;
};

export default function ScheduleScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
      loadHabits();
    }, [user, selectedDate])
  );

  const loadEvents = async () => {
    if (!user) return;

    try {
      const allEvents = await db.query.events.findMany({
        where: eq(schema.events.userId, user.id),
        orderBy: [schema.events.startTime],
      });

      const mappedEvents: Event[] = allEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: new Date(e.startTime),
        endTime: new Date(e.endTime),
        location: e.location,
        notes: e.notes,
        status: e.status,
        color: e.color || "#3B82F6",
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const loadHabits = async () => {
    if (!user) return;

    try {
      const today = startOfDay(new Date());
      const allHabits = await db.query.habits.findMany({
        where: and(
          eq(schema.habits.userId, user.id),
          eq(schema.habits.archived, false)
        ),
      });

      const habitsWithCompletion = await Promise.all(
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
            completedToday: log ? !log.skipped : false,
          };
        })
      );

      setHabits(habitsWithCompletion);
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  };

  const handleHabitToggle = async (habitId: string, completed: boolean) => {
    if (!user) return;

    try {
      const today = startOfDay(new Date());
      const existingLog = await db.query.habitLogs.findFirst({
        where: and(
          eq(schema.habitLogs.habitId, habitId),
          gte(schema.habitLogs.completedAt, today),
          lte(schema.habitLogs.completedAt, endOfDay(new Date()))
        ),
      });

      if (completed && !existingLog) {
        // Create completion log
        await db.insert(schema.habitLogs).values({
          id: nanoid(),
          userId: user.id,
          habitId,
          completedAt: new Date().toISOString(),
          skipped: false,
          notes: null,
        });
      } else if (!completed && existingLog) {
        // Delete completion log
        await db.delete(schema.habitLogs).where(eq(schema.habitLogs.id, existingLog.id));
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadHabits();
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadEvents(), loadHabits()]);
    setRefreshing(false);
  };

  const eventsForSelectedDate = events.filter((event) =>
    isSameDay(event.startTime, selectedDate)
  );

  const upcomingEvents = events
    .filter((event) => event.startTime >= new Date())
    .slice(0, 10);

  const getEventTimeText = (event: Event) => {
    const startTime = format(event.startTime, "h:mm a");
    const endTime = format(event.endTime, "h:mm a");
    return `${startTime} - ${endTime}`;
  };

  const renderEventCard = (event: Event) => (
    <Card
      key={event.id}
      variant="glass"
      className="mb-3"
      interactive
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/schedule/${event.id}` as any);
      }}
    >
      <View className="flex-row items-start">
        <View
          className="w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-xl"
          style={{ backgroundColor: event.color }}
        />
        <View className="flex-1 ml-3">
          <Text className={`text-base font-semibold ${textColor} mb-1`}>
            {event.title}
          </Text>
          <View className="flex-row items-center mb-1">
            <Ionicons
              name="time-outline"
              size={14}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
            <Text className={`text-sm ml-1 ${secondaryTextColor}`}>
              {getEventTimeText(event)}
            </Text>
          </View>
          {event.location && (
            <View className="flex-row items-center">
              <Ionicons
                name="location-outline"
                size={14}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text className={`text-sm ml-1 ${secondaryTextColor}`}>
                {event.location}
              </Text>
            </View>
          )}
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? "#737373" : "#9CA3AF"}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-3xl font-bold ${textColor}`}>Schedule</Text>
          <View className="flex-row">
            {/* View Mode Toggle */}
            <Pressable
              onPress={() => {
                setViewMode(viewMode === "calendar" ? "list" : "calendar");
                Haptics.selectionAsync();
              }}
              className="mr-3 p-2"
            >
              <Ionicons
                name={viewMode === "calendar" ? "list" : "calendar"}
                size={24}
                color={isDark ? "#F7FAFC" : "#1A202C"}
              />
            </Pressable>

            {/* Add Event Button */}
            <Pressable
              className="bg-primary rounded-full w-10 h-10 items-center justify-center"
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/schedule/new-event" as any);
              }}
            >
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View className="flex-row mb-4">
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/schedule/import" as any);
            }}
            className="flex-1 mr-2"
          >
            <Card variant="glass" className="flex-row items-center justify-center py-3">
              <Ionicons name="cloud-download-outline" size={18} color="#3B82F6" />
              <Text className="text-sm font-medium text-primary ml-2">
                Import Calendar
              </Text>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => {
              setSelectedDate(new Date());
              Haptics.selectionAsync();
            }}
            className="flex-1 ml-2"
          >
            <Card variant="glass" className="flex-row items-center justify-center py-3">
              <Ionicons name="today-outline" size={18} color="#8B5CF6" />
              <Text className="text-sm font-medium ml-2" style={{ color: "#8B5CF6" }}>
                Today
              </Text>
            </Card>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Habits Section */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-lg font-semibold ${textColor}`}>
              Today's Habits
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/habits/new" as any);
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="add-circle-outline" size={20} color={isDark ? "#60A5FA" : "#3B82F6"} />
                <Text className="text-sm font-medium text-primary ml-1">Add</Text>
              </View>
            </Pressable>
          </View>

          {habits.length > 0 ? (
            <View className="flex-row flex-wrap">
              {habits.map((habit) => (
                <Pressable
                  key={habit.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/habits/${habit.id}` as any);
                  }}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleHabitToggle(habit.id, !habit.completedToday);
                  }}
                  className="w-[48%] mr-[2%] mb-3"
                >
                  <Card variant="glass" className="p-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text style={{ fontSize: 32 }}>{habit.icon}</Text>
                      <Checkbox
                        checked={habit.completedToday}
                        onPress={() => handleHabitToggle(habit.id, !habit.completedToday)}
                        color={habit.color}
                      />
                    </View>
                    <Text className={`text-sm font-medium ${textColor}`} numberOfLines={2}>
                      {habit.title}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : (
            <Card variant="glass" className="items-center py-8">
              <Ionicons
                name="checkmark-circle-outline"
                size={48}
                color={isDark ? "#4B5563" : "#D1D5DB"}
              />
              <Text className={`text-sm ${secondaryTextColor} mt-2 text-center`}>
                No habits yet. Tap Add to create one.
              </Text>
            </Card>
          )}
        </View>

        {viewMode === "calendar" ? (
          <>
            {/* Calendar */}
            <Card variant="glass" className="mb-4 p-4">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                events={events}
              />
            </Card>

            {/* Events for Selected Date */}
            <View className="mb-6">
              <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
                {format(selectedDate, "EEEE, MMMM d")}
              </Text>

              {eventsForSelectedDate.length === 0 ? (
                <Card variant="glass" className="items-center py-8">
                  <Ionicons
                    name="calendar-outline"
                    size={48}
                    color={isDark ? "#4B5563" : "#D1D5DB"}
                  />
                  <Text className={`text-base ${secondaryTextColor} mt-3 text-center`}>
                    No events scheduled
                  </Text>
                  <Pressable
                    onPress={() => router.push("/schedule/new-event" as any)}
                    className="mt-3"
                  >
                    <Text className="text-sm font-medium text-primary">
                      Add an event
                    </Text>
                  </Pressable>
                </Card>
              ) : (
                eventsForSelectedDate.map(renderEventCard)
              )}
            </View>
          </>
        ) : (
          <>
            {/* List View */}
            <View className="mb-6">
              <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
                Upcoming Events
              </Text>

              {upcomingEvents.length === 0 ? (
                <Card variant="glass" className="items-center py-8">
                  <Ionicons
                    name="calendar-outline"
                    size={48}
                    color={isDark ? "#4B5563" : "#D1D5DB"}
                  />
                  <Text className={`text-base ${secondaryTextColor} mt-3 text-center`}>
                    No upcoming events
                  </Text>
                  <Pressable
                    onPress={() => router.push("/schedule/new-event" as any)}
                    className="mt-3"
                  >
                    <Text className="text-sm font-medium text-primary">
                      Add an event
                    </Text>
                  </Pressable>
                </Card>
              ) : (
                upcomingEvents.map((event) => (
                  <View key={event.id} className="mb-4">
                    <Text className={`text-sm ${secondaryTextColor} mb-2`}>
                      {format(event.startTime, "EEEE, MMMM d, yyyy")}
                    </Text>
                    {renderEventCard(event)}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
