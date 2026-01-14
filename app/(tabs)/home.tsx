import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Card } from "../../src/components/ui/Card";
import { SubscriptionList } from "../../src/components/subscriptions/SubscriptionList";
import { db } from "../../src/db/client";
import { eq } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

type Room = {
  id: string;
  name: string;
  icon: string;
  deviceCount: number;
};

export default function HomeScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<"rooms" | "maintenance" | "subscriptions">("rooms");

  useFocusEffect(
    React.useCallback(() => {
      loadRooms();
      loadSubscriptions();
    }, [user])
  );

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

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 py-6">
        <Text className={`text-3xl font-bold mb-4 ${textColor}`}>Home</Text>

        {/* Profile & Settings Quick Access */}
        <View className="flex-row mb-6">
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/profile/edit" as any);
            }}
            className="flex-1 mr-2"
          >
            <Card variant="glass" className="flex-row items-center p-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: "#3B82F6" + "20" }}
              >
                <Ionicons name="person" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className={`text-sm font-semibold ${textColor}`}>Profile</Text>
                <Text className={`text-xs ${secondaryTextColor}`}>Edit info</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={isDark ? "#737373" : "#9CA3AF"}
              />
            </Card>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/settings" as any);
            }}
            className="flex-1 ml-2"
          >
            <Card variant="glass" className="flex-row items-center p-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: "#8B5CF6" + "20" }}
              >
                <Ionicons name="settings" size={20} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className={`text-sm font-semibold ${textColor}`}>Settings</Text>
                <Text className={`text-xs ${secondaryTextColor}`}>Preferences</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={isDark ? "#737373" : "#9CA3AF"}
              />
            </Card>
          </Pressable>
        </View>

        {/* Tabs */}
        <View className="flex-row mb-6">
          {(["rooms", "maintenance", "subscriptions"] as const).map((tab) => (
            <Pressable
              key={tab}
              className={`flex-1 py-2 items-center border-b-2 ${
                selectedTab === tab ? "border-primary" : "border-border"
              }`}
              onPress={() => {
                setSelectedTab(tab);
                Haptics.selectionAsync();
              }}
            >
              <Text
                className={`text-base font-medium ${
                  selectedTab === tab ? "text-primary" : secondaryTextColor
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        {selectedTab === "rooms" && (
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

        {selectedTab === "maintenance" && (
          <View className="items-center justify-center py-12">
            <Text className={`text-lg ${secondaryTextColor} text-center`}>
              Maintenance tracker coming soon
            </Text>
          </View>
        )}

        {selectedTab === "subscriptions" && (
          <>
            {/* Add Subscription Button */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/home/subscriptions/new" as any);
              }}
              className="mb-4"
            >
              <Card variant="glass" className="flex-row items-center justify-center py-4">
                <Ionicons name="add-circle" size={24} color="#3B82F6" />
                <Text className="text-base font-semibold text-primary ml-2">
                  Add Subscription
                </Text>
              </Card>
            </Pressable>

            {/* Subscriptions List */}
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
      </ScrollView>
    </SafeAreaView>
  );
}
