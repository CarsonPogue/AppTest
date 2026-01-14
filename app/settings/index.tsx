import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Card } from "../../src/components/ui/Card";
import { db } from "../../src/db/client";
import { eq } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { nanoid } from "../../src/utils/nanoid";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

type UserSettings = {
  id: string;
  userId: string;
  notificationsHabits: number;
  notificationsPeople: number;
  notificationsSubscriptions: number;
  notificationsHome: number;
  quietHoursEnabled: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  useNotesForSuggestions: number;
  analyticsEnabled: number;
};

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useUserStore();
  const router = useRouter();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      // Create default settings if they don't exist
      if (!userSettings) {
        const newSettings = {
          id: nanoid(),
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

        await db.insert(schema.userSettings).values(newSettings);
        userSettings = newSettings;
      }

      setSettings(userSettings as UserSettings);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading settings:", error);
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!user || !settings) return;

    try {
      await db
        .update(schema.userSettings)
        .set({ [key]: value })
        .where(eq(schema.userSettings.userId, user.id));

      setSettings({ ...settings, [key]: value });
      Haptics.selectionAsync();
    } catch (error) {
      console.error("Error updating setting:", error);
      Alert.alert("Error", "Failed to update setting");
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      Alert.alert(
        "Export Data",
        "This will export all your data as a JSON file.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Export",
            onPress: async () => {
              try {
                // Fetch all user data
                const [
                  habits,
                  habitLogs,
                  people,
                  interactions,
                  events,
                  subscriptions,
                ] = await Promise.all([
                  db.query.habits.findMany({
                    where: eq(schema.habits.userId, user.id),
                  }),
                  db.query.habitLogs.findMany({
                    where: eq(schema.habitLogs.userId, user.id),
                  }),
                  db.query.people.findMany({
                    where: eq(schema.people.userId, user.id),
                  }),
                  db.query.interactions.findMany({
                    where: eq(schema.interactions.userId, user.id),
                  }),
                  db.query.events.findMany({
                    where: eq(schema.events.userId, user.id),
                  }),
                  db.query.subscriptions.findMany({
                    where: eq(schema.subscriptions.userId, user.id),
                  }),
                ]);

                const exportData = {
                  exportDate: new Date().toISOString(),
                  user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    birthday: user.birthday,
                  },
                  habits,
                  habitLogs,
                  people,
                  interactions,
                  events,
                  subscriptions,
                  settings,
                };

                const fileName = `adult-crm-export-${new Date().getTime()}.json`;
                const fileUri = `${FileSystem.documentDirectory}${fileName}`;

                await FileSystem.writeAsStringAsync(
                  fileUri,
                  JSON.stringify(exportData, null, 2)
                );

                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(fileUri);
                } else {
                  Alert.alert("Success", `Data exported to ${fileUri}`);
                }

                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              } catch (error) {
                console.error("Error exporting data:", error);
                Alert.alert("Error", "Failed to export data");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error in export flow:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and will delete all your data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "Type 'DELETE' to confirm account deletion",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Confirm",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      // Delete all user data
                      await Promise.all([
                        db
                          .delete(schema.habitLogs)
                          .where(eq(schema.habitLogs.userId, user.id)),
                        db
                          .delete(schema.habits)
                          .where(eq(schema.habits.userId, user.id)),
                        db
                          .delete(schema.interactions)
                          .where(eq(schema.interactions.userId, user.id)),
                        db
                          .delete(schema.people)
                          .where(eq(schema.people.userId, user.id)),
                        db
                          .delete(schema.events)
                          .where(eq(schema.events.userId, user.id)),
                        db
                          .delete(schema.subscriptions)
                          .where(eq(schema.subscriptions.userId, user.id)),
                        db
                          .delete(schema.userSettings)
                          .where(eq(schema.userSettings.userId, user.id)),
                      ]);

                      // Delete user account
                      await db
                        .delete(schema.users)
                        .where(eq(schema.users.id, user.id));

                      Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success
                      );

                      // Logout and redirect
                      await logout();
                      router.replace("/auth/login");
                    } catch (error) {
                      console.error("Error deleting account:", error);
                      Alert.alert(
                        "Error",
                        "Failed to delete account. Please try again."
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (isLoading || !settings) {
    return (
      <SafeAreaView className="flex-1 bg-background">
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

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Appearance */}
        <Card variant="glass" className="mb-4">
          <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
            Appearance
          </Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name="moon"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text className={`text-base ml-3 ${textColor}`}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Notifications */}
        <Card variant="glass" className="mb-4">
          <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
            Notifications
          </Text>

          <View className="mb-3">
            <View className="flex-row items-center justify-between">
              <Text className={`text-base ${textColor}`}>Habits</Text>
              <Switch
                value={settings.notificationsHabits === 1}
                onValueChange={(val) =>
                  updateSetting("notificationsHabits", val ? 1 : 0)
                }
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View className="mb-3">
            <View className="flex-row items-center justify-between">
              <Text className={`text-base ${textColor}`}>People Reminders</Text>
              <Switch
                value={settings.notificationsPeople === 1}
                onValueChange={(val) =>
                  updateSetting("notificationsPeople", val ? 1 : 0)
                }
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View className="mb-3">
            <View className="flex-row items-center justify-between">
              <Text className={`text-base ${textColor}`}>Subscriptions</Text>
              <Switch
                value={settings.notificationsSubscriptions === 1}
                onValueChange={(val) =>
                  updateSetting("notificationsSubscriptions", val ? 1 : 0)
                }
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View>
            <View className="flex-row items-center justify-between">
              <Text className={`text-base ${textColor}`}>Home & Tasks</Text>
              <Switch
                value={settings.notificationsHome === 1}
                onValueChange={(val) =>
                  updateSetting("notificationsHome", val ? 1 : 0)
                }
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </Card>

        {/* Quiet Hours */}
        <Card variant="glass" className="mb-4">
          <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
            Quiet Hours
          </Text>

          <View className="flex-row items-center justify-between mb-3">
            <Text className={`text-base ${textColor}`}>Enable Quiet Hours</Text>
            <Switch
              value={settings.quietHoursEnabled === 1}
              onValueChange={(val) =>
                updateSetting("quietHoursEnabled", val ? 1 : 0)
              }
              trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {settings.quietHoursEnabled === 1 && (
            <View>
              <Text className={`text-sm ${secondaryTextColor} mb-2`}>
                No notifications between {settings.quietHoursStart} and{" "}
                {settings.quietHoursEnd}
              </Text>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Coming Soon",
                    "Custom quiet hours will be available soon"
                  )
                }
                className="py-2"
              >
                <Text className="text-sm font-medium text-primary">
                  Customize Hours
                </Text>
              </Pressable>
            </View>
          )}
        </Card>

        {/* Privacy */}
        <Card variant="glass" className="mb-4">
          <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
            Privacy
          </Text>

          <View className="mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className={`text-base ${textColor}`}>
                  Use notes for AI suggestions
                </Text>
                <Text className={`text-xs mt-1 ${secondaryTextColor}`}>
                  Include contact notes when generating outreach messages
                </Text>
              </View>
              <Switch
                value={settings.useNotesForSuggestions === 1}
                onValueChange={(val) =>
                  updateSetting("useNotesForSuggestions", val ? 1 : 0)
                }
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className={`text-base ${textColor}`}>Analytics</Text>
                <Text className={`text-xs mt-1 ${secondaryTextColor}`}>
                  Help improve the app by sharing anonymous usage data
                </Text>
              </View>
              <Switch
                value={settings.analyticsEnabled === 1}
                onValueChange={(val) =>
                  updateSetting("analyticsEnabled", val ? 1 : 0)
                }
                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </Card>

        {/* Data Management */}
        <Card variant="glass" className="mb-4">
          <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
            Data Management
          </Text>

          <Pressable
            onPress={handleExportData}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <Ionicons
                name="download-outline"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text className={`text-base ml-3 ${textColor}`}>Export Data</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#737373" : "#9CA3AF"}
            />
          </Pressable>

          <View
            style={{
              height: 1,
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              marginVertical: 8,
            }}
          />

          <Pressable
            onPress={handleDeleteAccount}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text className="text-base ml-3" style={{ color: "#EF4444" }}>
                Delete Account
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#737373" : "#9CA3AF"}
            />
          </Pressable>
        </Card>

        {/* Account */}
        <Card variant="glass" className="mb-6">
          <Text className={`text-lg font-semibold mb-3 ${textColor}`}>
            Account
          </Text>

          <Pressable
            onPress={async () => {
              await logout();
              router.replace("/auth/login");
            }}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <Ionicons
                name="log-out-outline"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text className={`text-base ml-3 ${textColor}`}>Logout</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#737373" : "#9CA3AF"}
            />
          </Pressable>
        </Card>

        {/* Version */}
        <View className="items-center pb-8">
          <Text className={`text-xs ${secondaryTextColor}`}>
            Adult CRM v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
