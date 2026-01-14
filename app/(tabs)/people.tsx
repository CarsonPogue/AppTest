import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Card } from "../../src/components/ui/Card";
import { db } from "../../src/db/client";
import { eq } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { daysFromNow } from "../../src/utils/date";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

type Person = {
  id: string;
  name: string;
  relationship: string;
  lastContactDate?: Date;
  touchpointFrequencyDays: number;
  status: "recent" | "due-soon" | "overdue";
  daysUntilDue: number;
};

export default function PeopleScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadPeople();
    }, [user])
  );

  const loadPeople = async () => {
    if (!user) return;

    try {
      const allPeople = await db.query.people.findMany({
        where: eq(schema.people.userId, user.id),
      });

      const peopleWithStatus = allPeople.map((person) => {
        const daysSinceContact = person.lastContactDate
          ? Math.abs(daysFromNow(person.lastContactDate))
          : person.touchpointFrequencyDays + 1;

        const daysUntilDue =
          person.touchpointFrequencyDays - daysSinceContact;

        let status: "recent" | "due-soon" | "overdue";
        if (daysUntilDue > 3) {
          status = "recent";
        } else if (daysUntilDue >= 0) {
          status = "due-soon";
        } else {
          status = "overdue";
        }

        return {
          id: person.id,
          name: person.name,
          relationship: person.relationship,
          lastContactDate: person.lastContactDate
            ? new Date(person.lastContactDate)
            : undefined,
          touchpointFrequencyDays: person.touchpointFrequencyDays,
          status,
          daysUntilDue,
        };
      });

      // Sort: overdue first, then due soon, then recent
      peopleWithStatus.sort((a, b) => {
        const statusOrder = { overdue: 0, "due-soon": 1, recent: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      setPeople(peopleWithStatus);
    } catch (error) {
      console.error("Error loading people:", error);
    }
  };

  const getStatusColor = (status: Person["status"]) => {
    switch (status) {
      case "recent":
        return "#10B981";
      case "due-soon":
        return "#F59E0B";
      case "overdue":
        return "#EF4444";
    }
  };

  const getStatusText = (person: Person) => {
    if (person.daysUntilDue < 0) {
      return `${Math.abs(person.daysUntilDue)} days overdue`;
    } else if (person.daysUntilDue === 0) {
      return "Due today";
    } else {
      return `Due in ${person.daysUntilDue} days`;
    }
  };

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 py-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className={`text-3xl font-bold ${textColor}`}>People</Text>
          <Pressable
            className="bg-primary rounded-full w-10 h-10 items-center justify-center"
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/people/new");
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        {people.map((person) => (
          <Card
            key={person.id}
            className="mb-3"
            variant="glass"
            interactive
            onPress={() => console.log("Person pressed:", person.id)}
          >
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor: getStatusColor(person.status) + "20",
                }}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={getStatusColor(person.status)}
                />
              </View>
              <View className="flex-1">
                <Text className={`text-lg font-semibold ${textColor}`}>
                  {person.name}
                </Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  {person.relationship}
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: getStatusColor(person.status) }}
                >
                  {getStatusText(person)}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#737373" : "#9CA3AF"}
              />
            </View>
          </Card>
        ))}

        {people.length === 0 && (
          <View className="items-center justify-center py-12">
            <Text className={`text-lg ${secondaryTextColor} text-center`}>
              No contacts yet.{"\n"}Tap + to add your first person.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
