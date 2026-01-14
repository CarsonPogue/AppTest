import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../src/stores/theme";
import { useUserStore } from "../src/stores/user";
import { Card } from "../src/components/ui/Card";
import { db } from "../src/db/client";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { nanoid } from "../src/utils/nanoid";

type UserSettings = {
  id: string;
  userId: string;
  notificationsHabits: boolean;
  notificationsPeople: boolean;
  notificationsSubscriptions: boolean;
  notificationsHome: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  useNotesForSuggestions: boolean;
  analyticsEnabled: boolean;
};

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      let userSettings = await db.query.userSettings.findFirst({
        where: eq(schema.userSettings.userId, user.id),
      });

      // Create default settings if none exist
      if (!userSettings) {
        const id = nanoid();
        await db.insert(schema.userSettings).values({
          id,
          userId: user.id,
          notificationsHabits: 1,
          notificationsPeople: 1,
          notificationsSubscriptions: 1,
          notificationsHome: 1,
          quietHoursEnabled: 0,
          quietHoursStart: "22:00",
          quietHoursEnd: "07:00",
          useNotesForSuggestions: 0,
          analyticsEnabled: 0,
        });

        userSettings = {
          id,
          userId: user.id,
          notificationsHabits: 1,
          notificationsPeople: 1,
          notificationsSubscriptions: 1,
          notificationsHome: 1,
          quietHoursEnabled: 0,
          quietHoursStart: "22:00",
          quietHoursEnd: "07:00",
          useNotesForSuggestions: 0,
          analyticsEnabled: 0,
        };
      }

      setSettings({
        id: userSettings.id,
        userId: userSettings.userId,
        notificationsHabits: Boolean(userSettings.notificationsHabits),
        notificationsPeople: Boolean(userSettings.notificationsPeople),
        notificationsSubscriptions: Boolean(userSettings.notificationsSubscriptions),
        notificationsHome: Boolean(userSettings.notificationsHome),
        quietHoursEnabled: Boolean(userSettings.quietHoursEnabled),
        quietHoursStart: userSettings.quietHoursStart || "22:00",
        quietHoursEnd: userSettings.quietHoursEnd || "07:00",
        useNotesForSuggestions: Boolean(userSettings.useNotesForSuggestions),
        analyticsEnabled: Boolean(userSettings.analyticsEnabled),
      });

      setLoading(false);
    } catch (error) {
      console.error("Error loading settings:", error);
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: boolean | string) => {
    if (!settings || !user) return;

    try {
      const updateValue = typeof value === "boolean" ? (value ? 1 : 0) : value;

      await db
        .update(schema.userSettings)
        .set({ [key]: updateValue } as any)
        .where(eq(schema.userSettings.userId, user.id));

      setSettings({ ...settings, [key]: value });
      Haptics.selectionAsync();
    } catch (error) {
      console.error("Error updating setting:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <Text className={secondaryTextColor}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={28}
            color={isDark ? "#F7FAFC" : "#1A202C"}
          />
        </Pressable>
        <Text className={`text-xl font-bold ${textColor}`}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Appearance */}
        <View className="mb-6">
          <Text className={`text-sm font-semibold mb-3 ${secondaryTextColor} uppercase`}>
            Appearance
          </Text>
          <Card variant="glass">
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className={`text-base font-medium ${textColor}`}>Dark Mode</Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  Use dark color scheme
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#CBD5E0", true: "#60A5FA" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        </View>

        {/* Notifications */}
        <View className="mb-6">
          <Text className={`text-sm font-semibold mb-3 ${secondaryTextColor} uppercase`}>
            Notifications
          </Text>
          <Card variant="glass">
            <View className="flex-row items-center justify-between py-3 border-b border-border">
              <View className="flex-1">
                <Text className={`text-base font-medium ${textColor}`}>Habits</Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  Reminders for daily habits
                </Text>
              </View>
              <Switch
                value={settings?.notificationsHabits || false}
                onValueChange={(val) => updateSetting("notificationsHabits", val)}
                trackColor={{ false: "#CBD5E0", true: "#60A5FA" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View className="flex-row items-center justify-between py-3 border-b border-border">
              <View className="flex-1">
                <Text className={`text-base font-medium ${textColor}`}>People</Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  Reminders to reach out
                </Text>
              </View>
              <Switch
                value={settings?.notificationsPeople || false}
                onValueChange={(val) => updateSetting("notificationsPeople", val)}
                trackColor={{ false: "#CBD5E0", true: "#60A5FA" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View className="flex-row items-center justify-between py-3 border-b border-border">
              <View className="flex-1">
                <Text className={`text-base font-medium ${textColor}`}>Subscriptions</Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  Upcoming renewal alerts
                </Text>
              </View>
              <Switch
                value={settings?.notificationsSubscriptions || false}
                onValueChange={(val) => updateSetting("notificationsSubscriptions", val)}
                trackColor={{ false: "#CBD5E0", true: "#60A5FA" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className={`text-base font-medium ${textColor}`}>Home</Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  Smart home alerts
                </Text>
              </View>
              <Switch
                value={settings?.notificationsHome || false}
                onValueChange={(val) => updateSetting("notificationsHome", val)}
                trackColor={{ false: "#CBD5E0", true: "#60A5FA" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        </View>

        {/* Quiet Hours */}
        <View className="mb-6">
          <Text className={`text-sm font-semibold mb-3 ${secondaryTextColor} uppercase`}>
            Quiet Hours
          </Text>
          <Card variant="glass">
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className={`text-base font-medium ${textColor}`}>
                  Enable Quiet Hours
                </Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  Pause notifications at night
                </Text>
              </View>
              <Switch
                value={settings?.quietHoursEnabled || false}
                onValueChange={(val) => updateSetting("quietHoursEnabled", val)}
                trackColor={{ false: "#CBD5E0", true: "#60A5FA" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        </View>

        {/* Privacy */}
        <View className="mb-6">
          <Text className={`text-sm font-semibold mb-3 ${secondaryTextColor} uppercase`}>
            Privacy & Data
          </Text>
          <Card variant="glass">
            <View className="flex-row items-center justify-between py-3 border-b border-border">
              <View className="flex-1">
                <Text className={`text-base font-medium ${textColor}`}>
                  Use Notes for Suggestions
                </Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  Improve recommendations
                </Text>
              </View>
              <Switch
                value={settings?.useNotesForSuggestions || false}
                onValueChange={(val) => updateSetting("useNotesForSuggestions", val)}
                trackColor={{ false: "#CBD5E0", true: "#60A5FA" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1">
                <Text className={`text-base font-medium ${textColor}`}>
                  Analytics
                </Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  Help improve the app
                </Text>
              </View>
              <Switch
                value={settings?.analyticsEnabled || false}
                onValueChange={(val) => updateSetting("analyticsEnabled", val)}
                trackColor={{ false: "#CBD5E0", true: "#60A5FA" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        </View>

        {/* About */}
        <View className="mb-6">
          <Text className={`text-sm font-semibold mb-3 ${secondaryTextColor} uppercase`}>
            About
          </Text>
          <Card variant="glass">
            <View className="py-3 border-b border-border">
              <Text className={`text-sm ${secondaryTextColor}`}>Version</Text>
              <Text className={`text-base font-medium ${textColor}`}>1.0.0</Text>
            </View>
            <View className="py-3">
              <Text className={`text-sm ${secondaryTextColor}`}>Build</Text>
              <Text className={`text-base font-medium ${textColor}`}>2025.01</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
