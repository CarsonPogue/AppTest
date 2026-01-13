import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "../src/stores/theme";
import { db } from "../src/db/client";
import { seedDatabase } from "../src/db/seed";
import { useUserStore } from "../src/stores/user";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isDark } = useTheme();
  const { setUser } = useUserStore();

  useEffect(() => {
    // Initialize database and seed demo data
    async function initDatabase() {
      try {
        // Check if database is already seeded
        const result = await db.query.users.findFirst();

        if (!result) {
          console.log("Seeding database...");
          await seedDatabase();
        }

        // Set demo user
        const user = await db.query.users.findFirst();
        if (user) {
          setUser({
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl || undefined,
            timezone: user.timezone,
          });
        }
      } catch (error) {
        console.error("Database initialization error:", error);
      }
    }

    initDatabase();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
