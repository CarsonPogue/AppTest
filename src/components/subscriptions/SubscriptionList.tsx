import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../stores/theme";
import { Card } from "../ui/Card";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { format, differenceInDays } from "date-fns";

type Subscription = {
  id: string;
  name: string;
  amount: number;
  billingCycle: string;
  nextRenewalDate: Date;
  category: string | null;
  status: string;
};

type SubscriptionListProps = {
  subscriptions: Subscription[];
  onPress?: (id: string) => void;
};

const getCategoryIcon = (category: string | null): string => {
  switch (category) {
    case "streaming":
      return "play-circle";
    case "software":
      return "code";
    case "cloud":
      return "cloud";
    case "fitness":
      return "barbell";
    case "news":
      return "newspaper";
    case "music":
      return "musical-notes";
    default:
      return "card";
  }
};

const getCategoryColor = (category: string | null): string => {
  switch (category) {
    case "streaming":
      return "#EF4444";
    case "software":
      return "#3B82F6";
    case "cloud":
      return "#8B5CF6";
    case "fitness":
      return "#10B981";
    case "news":
      return "#F59E0B";
    case "music":
      return "#EC4899";
    default:
      return "#6B7280";
  }
};

export function SubscriptionList({ subscriptions, onPress }: SubscriptionListProps) {
  const { isDark } = useTheme();
  const router = useRouter();

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const getDaysUntilRenewal = (date: Date) => {
    return differenceInDays(date, new Date());
  };

  const getRenewalText = (days: number) => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Renews today";
    if (days === 1) return "Renews tomorrow";
    return `Renews in ${days} days`;
  };

  return (
    <View>
      {subscriptions.map((subscription) => {
        const daysUntil = getDaysUntilRenewal(subscription.nextRenewalDate);
        const isUrgent = daysUntil <= 3;
        const categoryColor = getCategoryColor(subscription.category);

        return (
          <Card
            key={subscription.id}
            variant="glass"
            className="mb-3"
            interactive
            onPress={() => {
              Haptics.selectionAsync();
              if (onPress) {
                onPress(subscription.id);
              } else {
                router.push(`/home/subscriptions/${subscription.id}` as any);
              }
            }}
          >
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: categoryColor + "20" }}
              >
                <Ionicons
                  name={getCategoryIcon(subscription.category) as any}
                  size={24}
                  color={categoryColor}
                />
              </View>

              <View className="flex-1">
                <Text className={`text-base font-semibold ${textColor} mb-1`}>
                  {subscription.name}
                </Text>
                <View className="flex-row items-center">
                  <Text className={`text-sm font-medium ${textColor} mr-2`}>
                    ${subscription.amount.toFixed(2)}
                    <Text className={`text-xs ${secondaryTextColor}`}>
                      /{subscription.billingCycle}
                    </Text>
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: isUrgent ? "#EF4444" : isDark ? "#9CA3AF" : "#6B7280" }}
                  >
                    • {getRenewalText(daysUntil)}
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
        );
      })}
    </View>
  );
}
