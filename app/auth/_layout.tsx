import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "../../src/stores/theme";
import { ensureDbReady } from "../../src/db/client";

export default function AuthLayout() {
  const { isDark } = useTheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    ensureDbReady()
      .then(() => setDbReady(true))
      .catch((e) => {
        console.error("DB migrate failed:", e);
        setDbReady(false);
      });
  }, []);

  if (!dbReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark ? "#0f1419" : "#f0f4f8",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
