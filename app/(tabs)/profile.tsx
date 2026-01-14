import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/stores/theme";
import { useUserStore } from "../../src/stores/user";
import { Card } from "../../src/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { db } from "../../src/db/client";
import * as schema from "../../src/db/schema";
import { eq } from "drizzle-orm";

type MenuItem = {
  title: string;
  icon: string;
  route: string;
  color: string;
  description: string;
};

export default function ProfileScreen() {
  const { isDark } = useTheme();
  const { user, refreshUser } = useUserStore();
  const router = useRouter();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryTextColor = isDark ? "text-gray-400" : "text-gray-600";

  const pickImage = async () => {
    if (!user) return;

    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload a profile picture."
        );
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingPhoto(true);
        Haptics.selectionAsync();

        // Save to database
        const imageUri = result.assets[0].uri;
        await db
          .update(schema.users)
          .set({ profilePhotoUrl: imageUri })
          .where(eq(schema.users.id, user.id));

        // Refresh user data
        await refreshUser();

        setIsUploadingPhoto(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      setIsUploadingPhoto(false);
      Alert.alert("Error", "Failed to upload photo. Please try again.");
    }
  };

  const profileMenuItems: MenuItem[] = [
    {
      title: "Edit Profile",
      icon: "person-circle",
      route: "/profile/edit",
      color: "#3B82F6",
      description: "Name, birthday, preferences",
    },
    {
      title: "Settings",
      icon: "settings",
      route: "/settings",
      color: "#8B5CF6",
      description: "Notifications, privacy, data",
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <Pressable
      key={item.title}
      onPress={() => {
        Haptics.selectionAsync();
        router.push(item.route as any);
      }}
    >
      <Card variant="glass" className="mb-3" interactive>
        <View className="flex-row items-center">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: item.color + "20" }}
          >
            <Ionicons name={item.icon as any} size={28} color={item.color} />
          </View>
          <View className="flex-1">
            <Text className={`text-base font-semibold ${textColor} mb-1`}>
              {item.title}
            </Text>
            <Text className={`text-sm ${secondaryTextColor}`}>
              {item.description}
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
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="px-4 py-6">
          <View className="items-center mb-6">
            <Pressable onPress={pickImage} disabled={isUploadingPhoto}>
              <View className="relative mb-3">
                {user?.profilePhotoUrl ? (
                  <Image
                    source={{ uri: user.profilePhotoUrl }}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                    }}
                  />
                ) : (
                  <View
                    className="w-24 h-24 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(59, 130, 246, 0.2)"
                        : "rgba(59, 130, 246, 0.1)",
                    }}
                  >
                    <Ionicons name="person" size={48} color="#3B82F6" />
                  </View>
                )}

                {/* Camera Icon Overlay */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#3B82F6",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 3,
                    borderColor: isDark ? "#111827" : "#FFFFFF",
                  }}
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  )}
                </View>
              </View>
            </Pressable>
            <Text className={`text-2xl font-bold ${textColor}`}>
              {user?.firstName || "User"}
            </Text>
            <Text className={`text-base ${secondaryTextColor} mt-1`}>
              {user?.email || ""}
            </Text>
          </View>

          {/* Account Section */}
          <View className="mb-6">
            <Text className={`text-sm font-semibold mb-3 ${secondaryTextColor} uppercase`}>
              Account
            </Text>
            {profileMenuItems.map(renderMenuItem)}
          </View>

          {/* About Section */}
          <Card variant="glass" className="items-center py-6 mb-6">
            <Text className={`text-lg font-semibold ${textColor} mb-2`}>
              Praxis
            </Text>
            <Text className={`text-sm ${secondaryTextColor} mb-4`}>
              Version 1.0.0
            </Text>
            <Text className={`text-xs ${secondaryTextColor} text-center px-8`}>
              Your personal life management system
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
