import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../stores/theme";
import { Card } from "../ui/Card";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { format, differenceInDays } from "date-fns";

type MaintenanceItem = {
  id: string;
  title: string;
  category: string;
  lastCompletedDate: Date | null;
  intervalDays: number;
  nextDueDate: Date;
  priority: string;
};

type MaintenanceListProps = {
  items: MaintenanceItem[];
  onPress?: (id: string) => void;
};

const getCategoryIcon = (category: string): string => {
  switch (category) {
    case "hvac":
      return "snow";
    case "plumbing":
      return "water";
    case "electrical":
      return "flash";
    case "appliance":
      return "cube";
    case "lawn":
      return "leaf";
    case "vehicle":
      return "car";
    case "home":
      return "home";
    default:
      return "construct";
  }
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case "hvac":
      return "#3B82F6";
    case "plumbing":
      return "#06B6D4";
    case "electrical":
      return "#F59E0B";
    case "appliance":
      return "#8B5CF6";
    case "lawn":
      return "#10B981";
    case "vehicle":
      return "#EF4444";
    case "home":
      return "#EC4899";
    default:
      return "#6B7280";
  }
};

export function MaintenanceList({ items, onPress }: MaintenanceListProps) {
  const { isDark } = useTheme();
  const router = useRouter();

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const getDaysUntilDue = (date: Date) => {
    return differenceInDays(date, new Date());
  };

  const getDueText = (days: number, priority: string) => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    if (priority === "high" && days <= 7) return `Due in ${days} days - High Priority`;
    return `Due in ${days} days`;
  };

  return (
    <View>
      {items.map((item) => {
        const daysUntil = getDaysUntilDue(item.nextDueDate);
        const isOverdue = daysUntil < 0;
        const isUrgent = daysUntil <= 3 || item.priority === "high";
        const categoryColor = getCategoryColor(item.category);

        return (
          <Card
            key={item.id}
            variant="glass"
            className="mb-3"
            interactive
            onPress={() => {
              Haptics.selectionAsync();
              if (onPress) {
                onPress(item.id);
              } else {
                router.push(`/home/maintenance/${item.id}` as any);
              }
            }}
          >
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: categoryColor + "20" }}
              >
                <Ionicons
                  name={getCategoryIcon(item.category) as any}
                  size={24}
                  color={categoryColor}
                />
              </View>

              <View className="flex-1">
                <Text className={`text-base font-semibold ${textColor} mb-1`}>
                  {item.title}
                </Text>
                <View className="flex-row items-center">
                  <Text
                    className="text-sm font-medium capitalize"
                    style={{
                      color: isOverdue ? "#EF4444" : isUrgent ? "#F59E0B" : isDark ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    {getDueText(daysUntil, item.priority)}
                  </Text>
                </View>
                {item.lastCompletedDate && (
                  <Text className={`text-xs mt-0.5 ${secondaryTextColor}`}>
                    Last: {format(item.lastCompletedDate, "MMM d, yyyy")}
                  </Text>
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
      })}
    </View>
  );
}
