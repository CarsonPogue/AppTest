import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useTheme } from "../../stores/theme";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

type Event = {
  id: string;
  title: string;
  startTime: Date;
  color?: string;
};

type CalendarProps = {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events?: Event[];
  onMonthChange?: (date: Date) => void;
};

export function Calendar({
  selectedDate,
  onDateSelect,
  events = [],
  onMonthChange,
}: CalendarProps) {
  const { isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const renderHeader = () => {
    return (
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={() => {
            const newMonth = subMonths(currentMonth, 1);
            setCurrentMonth(newMonth);
            onMonthChange?.(newMonth);
            Haptics.selectionAsync();
          }}
          className="p-2"
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? "#F7FAFC" : "#1A202C"}
          />
        </Pressable>

        <Text className={`text-xl font-bold ${textColor}`}>
          {format(currentMonth, "MMMM yyyy")}
        </Text>

        <Pressable
          onPress={() => {
            const newMonth = addMonths(currentMonth, 1);
            setCurrentMonth(newMonth);
            onMonthChange?.(newMonth);
            Haptics.selectionAsync();
          }}
          className="p-2"
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={isDark ? "#F7FAFC" : "#1A202C"}
          />
        </Pressable>
      </View>
    );
  };

  const renderDaysOfWeek = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <View className="flex-row mb-2">
        {days.map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className={`text-xs font-semibold ${secondaryTextColor}`}>
              {day}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayEvents = events.filter((event) =>
          isSameDay(event.startTime, currentDay)
        );
        const hasEvents = dayEvents.length > 0;
        const isSelected = isSameDay(currentDay, selectedDate);
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isTodayDate = isToday(currentDay);

        days.push(
          <Pressable
            key={currentDay.toString()}
            onPress={() => {
              onDateSelect(currentDay);
              Haptics.selectionAsync();
            }}
            className="flex-1 aspect-square items-center justify-center m-0.5"
            style={{
              backgroundColor: isSelected
                ? "#3B82F6"
                : isTodayDate && !isSelected
                ? isDark
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(59, 130, 246, 0.1)"
                : "transparent",
              borderRadius: 8,
              opacity: isCurrentMonth ? 1 : 0.3,
            }}
          >
            <Text
              className={`text-sm font-medium`}
              style={{
                color: isSelected
                  ? "#FFFFFF"
                  : isTodayDate
                  ? "#3B82F6"
                  : isDark
                  ? "#F7FAFC"
                  : "#1A202C",
              }}
            >
              {format(currentDay, "d")}
            </Text>
            {hasEvents && (
              <View className="flex-row mt-1">
                {dayEvents.slice(0, 3).map((event, idx) => (
                  <View
                    key={idx}
                    className="w-1 h-1 rounded-full mx-0.5"
                    style={{
                      backgroundColor: event.color || "#3B82F6",
                    }}
                  />
                ))}
              </View>
            )}
          </Pressable>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <View key={day.toString()} className="flex-row">
          {days}
        </View>
      );
      days = [];
    }

    return <View>{rows}</View>;
  };

  return (
    <View>
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
    </View>
  );
}
