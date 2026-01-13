import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Card } from "../../src/components/ui/Card";
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedTab, setSelectedTab] = useState<"rooms" | "maintenance" | "subscriptions">("rooms");

  useEffect(() => {
    loadRooms();
  }, [user]);

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

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 py-6">
        <Text className={`text-3xl font-bold mb-6 ${textColor}`}>Home</Text>

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
            <Card className="mb-4 bg-primary/10">
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
                  variant="elevated"
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
          <View className="items-center justify-center py-12">
            <Text className={`text-lg ${secondaryTextColor} text-center`}>
              Subscription manager coming soon
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
