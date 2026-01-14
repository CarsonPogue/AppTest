import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Card } from "../../src/components/ui/Card";
import { SubscriptionList } from "../../src/components/subscriptions/SubscriptionList";
import { MaintenanceList } from "../../src/components/maintenance/MaintenanceList";
import { db } from "../../src/db/client";
import { eq } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  calculateDrift,
  isImportantAndNeglected,
  getDriftColor,
  getDriftLabel,
  type PersonWithDrift,
  type Priority,
} from "../../src/utils/relationshipIntelligence";

type FilterType = "all" | "high" | "normal" | "low";
type SectionType = "people" | "subscriptions" | "maintenance" | "home";

type Room = {
  id: string;
  name: string;
  icon: string;
  deviceCount: number;
};

export default function LifeScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();
  const [selectedSection, setSelectedSection] = useState<SectionType>("people");
  const [people, setPeople] = useState<PersonWithDrift[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadPeople();
      loadSubscriptions();
      loadMaintenanceItems();
      loadRooms();
    }, [user])
  );

  const loadPeople = async () => {
    if (!user) return;

    try {
      const allPeople = await db.query.people.findMany({
        where: eq(schema.people.userId, user.id),
      });

      const peopleWithDrift: PersonWithDrift[] = allPeople.map((person) => {
        const { daysSinceLastInteraction, driftStatus } = calculateDrift(
          person.lastInteractionAt ? new Date(person.lastInteractionAt) : null,
          person.preferredCadenceDays,
          new Date(person.createdAt)
        );

        return {
          id: person.id,
          fullName: person.fullName,
          priority: person.priority as Priority,
          preferredCadenceDays: person.preferredCadenceDays,
          lastInteractionAt: person.lastInteractionAt
            ? new Date(person.lastInteractionAt)
            : null,
          lastInteractionType: person.lastInteractionType,
          daysSinceLastInteraction,
          driftStatus,
          isImportantAndNeglected: isImportantAndNeglected(
            person.priority as Priority,
            driftStatus
          ),
          createdAt: new Date(person.createdAt),
        };
      });

      setPeople(peopleWithDrift);
    } catch (error) {
      console.error("Error loading people:", error);
    }
  };

  const loadSubscriptions = async () => {
    if (!user) return;

    try {
      const allSubs = await db.query.subscriptions.findMany({
        where: eq(schema.subscriptions.userId, user.id),
      });

      const mapped = allSubs.map((sub) => ({
        ...sub,
        nextRenewalDate: new Date(sub.nextRenewalDate),
      }));

      setSubscriptions(mapped);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    }
  };

  const loadMaintenanceItems = async () => {
    if (!user) return;

    try {
      const allItems = await db.query.maintenanceItems.findMany({
        where: eq(schema.maintenanceItems.userId, user.id),
      });

      const mapped = allItems.map((item) => ({
        ...item,
        lastCompletedDate: item.lastCompletedDate ? new Date(item.lastCompletedDate) : null,
        nextDueDate: new Date(item.nextDueDate),
      }));

      mapped.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());

      setMaintenanceItems(mapped);
    } catch (error) {
      console.error("Error loading maintenance items:", error);
    }
  };

  const loadRooms = async () => {
    if (!user) return;

    try {
      const allRooms = await db.query.smartHomeRooms.findMany({
        where: eq(schema.smartHomeRooms.userId, user.id),
      });

      const roomsWithDevices = await Promise.all(
        allRooms.map(async (room) => {
          const devices = await db.query.smartHomeDevices.findMany({
            where: eq(schema.smartHomeDevices.roomId, room.id),
          });

          return {
            id: room.id,
            name: room.name,
            icon: room.icon,
            deviceCount: devices.length,
          };
        })
      );

      setRooms(roomsWithDevices);
    } catch (error) {
      console.error("Error loading rooms:", error);
    }
  };

  const filteredPeople =
    filter === "all"
      ? people
      : people.filter((p) => p.priority === filter);

  // Section people by status
  const importantNeglected = filteredPeople.filter((p) => p.isImportantAndNeglected);
  const overdue = filteredPeople.filter(
    (p) => p.driftStatus === "overdue" && !p.isImportantAndNeglected
  );
  const dueSoon = filteredPeople.filter((p) => p.driftStatus === "dueSoon");
  const ok = filteredPeople.filter((p) => p.driftStatus === "ok");

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const renderPersonCard = (person: PersonWithDrift) => {
    const statusColor = getDriftColor(person.driftStatus, isDark);
    const statusLabel = getDriftLabel(
      person.driftStatus,
      person.daysSinceLastInteraction,
      person.preferredCadenceDays
    );

    return (
      <Card
        key={person.id}
        className="mb-3"
        variant="glass"
        interactive
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/people/${person.id}`);
        }}
      >
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{
              backgroundColor: statusColor + "20",
            }}
          >
            <Ionicons name="person" size={24} color={statusColor} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className={`text-lg font-semibold ${textColor}`}>
                {person.fullName}
              </Text>
              {person.priority === "high" && (
                <View className="ml-2 bg-red-500/20 px-2 py-0.5 rounded">
                  <Text className="text-xs font-semibold" style={{ color: "#EF4444" }}>
                    HIGH
                  </Text>
                </View>
              )}
            </View>
            {person.lastInteractionType && (
              <Text className={`text-xs ${secondaryTextColor} mt-0.5`}>
                Last: {person.lastInteractionType}
              </Text>
            )}
            <Text className="text-xs mt-1" style={{ color: statusColor }}>
              {statusLabel}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? "#737373" : "#9CA3AF"}
          />
        </View>
      </Card>
    );
  };

  const renderSection = (title: string, people: PersonWithDrift[], icon: string) => {
    if (people.length === 0) return null;

    return (
      <View className="mb-6">
        <View className="flex-row items-center mb-3 px-1">
          <Ionicons
            name={icon as any}
            size={18}
            color={isDark ? "#9CA3AF" : "#6B7280"}
          />
          <Text className={`text-sm font-semibold ml-2 ${secondaryTextColor} uppercase`}>
            {title} ({people.length})
          </Text>
        </View>
        {people.map(renderPersonCard)}
      </View>
    );
  };

  const getAddRoute = () => {
    switch (selectedSection) {
      case "people":
        return "/people/new";
      case "subscriptions":
        return "/home/subscriptions/new";
      case "maintenance":
        return "/home/maintenance/new";
      case "home":
        return null; // No add for rooms in this version
      default:
        return "/people/new";
    }
  };

  const addRoute = getAddRoute();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 py-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-3xl font-bold ${textColor}`}>Life</Text>
          {addRoute && (
            <Pressable
              className="bg-primary rounded-full w-10 h-10 items-center justify-center"
              onPress={() => {
                Haptics.selectionAsync();
                router.push(addRoute as any);
              }}
            >
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          )}
        </View>

        {/* Section Tabs */}
        <View className="flex-row mb-4">
          {([
            { key: "people", label: "People", icon: "people" },
            { key: "subscriptions", label: "Subscriptions", icon: "card" },
            { key: "maintenance", label: "Maintenance", icon: "construct" },
            { key: "home", label: "Home", icon: "home" },
          ] as const).map((section) => (
            <Pressable
              key={section.key}
              className={`flex-1 py-2 items-center border-b-2 ${
                selectedSection === section.key ? "border-primary" : "border-border"
              }`}
              onPress={() => {
                setSelectedSection(section.key);
                Haptics.selectionAsync();
              }}
            >
              <Ionicons
                name={section.icon as any}
                size={20}
                color={selectedSection === section.key ? (isDark ? "#60A5FA" : "#3B82F6") : (isDark ? "#737373" : "#9CA3AF")}
              />
              <Text
                className={`text-xs font-medium mt-1 ${
                  selectedSection === section.key ? "text-primary" : secondaryTextColor
                }`}
              >
                {section.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Priority Filter - Only for People */}
        {selectedSection === "people" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {(["all", "high", "normal", "low"] as FilterType[]).map((f) => (
              <Pressable
                key={f}
                onPress={() => {
                  setFilter(f);
                  Haptics.selectionAsync();
                }}
                className="mr-2"
              >
                <View
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor:
                      filter === f
                        ? "#3B82F6"
                        : isDark
                        ? "rgba(30, 41, 59, 0.5)"
                        : "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor:
                      filter === f
                        ? "#3B82F6"
                        : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Text
                    className="font-medium capitalize"
                    style={{
                      color: filter === f ? "#FFFFFF" : isDark ? "#F7FAFC" : "#1A202C",
                    }}
                  >
                    {f === "all" ? "All" : `${f} Priority`}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* People Section */}
        {selectedSection === "people" && (
          <>
            {renderSection("Important & Neglected", importantNeglected, "alert-circle")}
            {renderSection("Overdue", overdue, "warning")}
            {renderSection("Due Soon", dueSoon, "time")}
            {renderSection("All Good", ok, "checkmark-circle")}

            {filteredPeople.length === 0 && (
              <View className="items-center justify-center py-12">
                <Text className={`text-lg ${secondaryTextColor} text-center`}>
                  No contacts yet.{"\n"}Tap + to add your first person.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Subscriptions Section */}
        {selectedSection === "subscriptions" && (
          <>
            {subscriptions.length > 0 ? (
              <SubscriptionList subscriptions={subscriptions} />
            ) : (
              <Card variant="glass" className="items-center py-12">
                <Ionicons
                  name="card-outline"
                  size={48}
                  color={isDark ? "#4B5563" : "#D1D5DB"}
                />
                <Text className={`text-base ${secondaryTextColor} mt-3 text-center`}>
                  No subscriptions tracked yet
                </Text>
                <Text className={`text-sm ${secondaryTextColor} mt-1 text-center px-8`}>
                  Add your subscriptions to track renewals and manage costs
                </Text>
              </Card>
            )}
          </>
        )}

        {/* Maintenance Section */}
        {selectedSection === "maintenance" && (
          <>
            {maintenanceItems.length > 0 ? (
              <MaintenanceList items={maintenanceItems} />
            ) : (
              <Card variant="glass" className="items-center py-12">
                <Ionicons
                  name="construct-outline"
                  size={48}
                  color={isDark ? "#4B5563" : "#D1D5DB"}
                />
                <Text className={`text-base ${secondaryTextColor} mt-3 text-center`}>
                  No maintenance tasks yet
                </Text>
                <Text className={`text-sm ${secondaryTextColor} mt-1 text-center px-8`}>
                  Track home, vehicle, and appliance maintenance
                </Text>
              </Card>
            )}
          </>
        )}

        {/* Home Section */}
        {selectedSection === "home" && (
          <>
            {/* Demo Mode Banner */}
            <Card className="mb-4 bg-primary/10" variant="glass">
              <View className="flex-row items-center">
                <Ionicons name="information-circle" size={24} color="#3B82F6" />
                <Text className={`text-sm ml-3 flex-1 ${textColor}`}>
                  Demo Mode - Connect real HomeKit devices in Settings
                </Text>
              </View>
            </Card>

            {/* Rooms Grid */}
            <View className="flex-row flex-wrap justify-between">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className="w-[48%] mb-4"
                  variant="glass"
                  interactive
                  onPress={() => console.log("Room pressed:", room.id)}
                >
                  <View className="items-center py-4">
                    <Text className="text-4xl mb-2">{room.icon}</Text>
                    <Text className={`text-base font-semibold ${textColor}`}>
                      {room.name}
                    </Text>
                    <Text className={`text-sm ${secondaryTextColor}`}>
                      {room.deviceCount} device{room.deviceCount !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>

            {rooms.length === 0 && (
              <View className="items-center justify-center py-12">
                <Text className={`text-lg ${secondaryTextColor} text-center`}>
                  No rooms configured yet.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
