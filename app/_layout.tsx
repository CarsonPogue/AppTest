import "../global.css";
import "react-native-gesture-handler";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "../src/stores/theme";
import { useUserStore } from "../src/stores/user";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isDark } = useTheme();
  const { setUser } = useUserStore();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const dbMod = await import("../src/db/client");
        const seedMod = await import("../src/db/seed");

        const db = dbMod.db;
        const seedDatabase = seedMod.seedDatabase;

        const result = await db.query.users.findFirst();
        if (!result) {
          await seedDatabase();
        }

        const user = await db.query.users.findFirst();
        if (!cancelled && user) {
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
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
