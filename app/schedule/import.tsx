import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { db } from "../../src/db/client";
import * as schema from "../../src/db/schema";
import { nanoid } from "../../src/utils/nanoid";

export default function ImportCalendarScreen() {
  const { isDark } = useTheme();
  const { user } = useUserStore();
  const router = useRouter();

  const [isImporting, setIsImporting] = useState(false);

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const parseICS = (icsContent: string) => {
    const events: any[] = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === "BEGIN:VEVENT") {
        currentEvent = {};
      } else if (line === "END:VEVENT" && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent) {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex);
          const value = line.substring(colonIndex + 1);

          if (key.startsWith("DTSTART")) {
            currentEvent.startTime = parseICSDate(value);
          } else if (key.startsWith("DTEND")) {
            currentEvent.endTime = parseICSDate(value);
          } else if (key === "SUMMARY") {
            currentEvent.title = value;
          } else if (key === "LOCATION") {
            currentEvent.location = value;
          } else if (key === "DESCRIPTION") {
            currentEvent.notes = value.replace(/\\n/g, "\n");
          }
        }
      }
    }

    return events;
  };

  const parseICSDate = (dateString: string): Date => {
    // ICS date format: YYYYMMDDTHHMMSSZ or YYYYMMDD
    if (dateString.includes("T")) {
      const year = parseInt(dateString.substring(0, 4));
      const month = parseInt(dateString.substring(4, 6)) - 1;
      const day = parseInt(dateString.substring(6, 8));
      const hour = parseInt(dateString.substring(9, 11));
      const minute = parseInt(dateString.substring(11, 13));
      const second = parseInt(dateString.substring(13, 15));
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    } else {
      const year = parseInt(dateString.substring(0, 4));
      const month = parseInt(dateString.substring(4, 6)) - 1;
      const day = parseInt(dateString.substring(6, 8));
      return new Date(year, month, day);
    }
  };

  const handleImportICS = async () => {
    if (!user) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/calendar", "text/plain", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setIsImporting(true);

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      const parsedEvents = parseICS(fileContent);

      let importedCount = 0;
      for (const event of parsedEvents) {
        if (event.title && event.startTime && event.endTime) {
          await db.insert(schema.events).values({
            id: nanoid(),
            userId: user.id,
            title: event.title,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            location: event.location || null,
            notes: event.notes || null,
            status: "confirmed",
            color: "#3B82F6",
            reminderMinutes: 15,
          });
          importedCount++;
        }
      }

      setIsImporting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "Import Successful",
        `Imported ${importedCount} events from calendar file.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error importing calendar:", error);
      setIsImporting(false);
      Alert.alert("Import Failed", "Could not import calendar file. Please try again.");
    }
  };

  const handleImportDeviceCalendar = async () => {
    Alert.alert(
      "Coming Soon",
      "Device calendar integration will be available in a future update. For now, you can:\n\n1. Export your calendar as an ICS file\n2. Import it using the 'Import ICS File' option above"
    );
  };

  const handleConnectGoogle = async () => {
    Alert.alert(
      "Google Calendar",
      "To import from Google Calendar:\n\n1. Go to calendar.google.com\n2. Click Settings (gear icon)\n3. Select 'Import & Export'\n4. Click 'Export' to download your calendar\n5. Use the 'Import ICS File' option here to import the downloaded file",
      [{ text: "Got it" }]
    );
  };

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
        <Text className={`text-xl font-bold ${textColor}`}>Import Calendar</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Info Card */}
        <Card variant="glass" className="mb-6 p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <Text className={`text-sm ml-3 flex-1 ${secondaryTextColor}`}>
              Import events from your existing calendars. We support ICS/iCal format files from Google Calendar, Apple Calendar, Outlook, and more.
            </Text>
          </View>
        </Card>

        {/* Import ICS File */}
        <Pressable
          onPress={handleImportICS}
          disabled={isImporting}
        >
          <Card variant="glass" className="mb-4 p-6" interactive>
            <View className="flex-row items-center">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: "#3B82F6" + "20" }}
              >
                <Ionicons name="document-outline" size={32} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className={`text-lg font-semibold ${textColor} mb-1`}>
                  Import ICS File
                </Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  Select an .ics or .ical file to import
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDark ? "#737373" : "#9CA3AF"}
              />
            </View>
          </Card>
        </Pressable>

        {/* Google Calendar */}
        <Pressable onPress={handleConnectGoogle}>
          <Card variant="glass" className="mb-4 p-6" interactive>
            <View className="flex-row items-center">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: "#EA4335" + "20" }}
              >
                <Ionicons name="logo-google" size={32} color="#EA4335" />
              </View>
              <View className="flex-1">
                <Text className={`text-lg font-semibold ${textColor} mb-1`}>
                  Google Calendar
                </Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  Instructions to export from Google
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDark ? "#737373" : "#9CA3AF"}
              />
            </View>
          </Card>
        </Pressable>

        {/* Apple/iOS Calendar */}
        <Pressable onPress={handleImportDeviceCalendar}>
          <Card variant="glass" className="mb-4 p-6" interactive>
            <View className="flex-row items-center">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: "#000000" + "20" }}
              >
                <Ionicons name="logo-apple" size={32} color={isDark ? "#FFFFFF" : "#000000"} />
              </View>
              <View className="flex-1">
                <Text className={`text-lg font-semibold ${textColor} mb-1`}>
                  Device Calendar
                </Text>
                <Text className={`text-sm ${secondaryTextColor}`}>
                  Coming soon - iOS/Android integration
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDark ? "#737373" : "#9CA3AF"}
              />
            </View>
          </Card>
        </Pressable>

        {isImporting && (
          <Card variant="glass" className="items-center py-8 mb-4">
            <Text className={`text-base ${textColor} mb-2`}>
              Importing events...
            </Text>
            <Text className={`text-sm ${secondaryTextColor}`}>
              This may take a moment
            </Text>
          </Card>
        )}

        {/* How to Export Instructions */}
        <Card variant="glass" className="mb-6 p-4">
          <Text className={`text-base font-semibold ${textColor} mb-3`}>
            How to Export from Popular Calendars
          </Text>

          <View className="mb-3">
            <Text className={`text-sm font-semibold ${textColor} mb-1`}>
              Google Calendar:
            </Text>
            <Text className={`text-sm ${secondaryTextColor}`}>
              Settings → Import & Export → Export
            </Text>
          </View>

          <View className="mb-3">
            <Text className={`text-sm font-semibold ${textColor} mb-1`}>
              Apple Calendar (Mac):
            </Text>
            <Text className={`text-sm ${secondaryTextColor}`}>
              File → Export → Export
            </Text>
          </View>

          <View>
            <Text className={`text-sm font-semibold ${textColor} mb-1`}>
              Outlook:
            </Text>
            <Text className={`text-sm ${secondaryTextColor}`}>
              File → Save Calendar → iCalendar Format
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
