import { create } from "zustand";
import { useColorScheme } from "react-native";

type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: "system",
  setTheme: (theme) => set({ theme }),
  isDark: false,
}));

export function useTheme() {
  const { theme, setTheme } = useThemeStore();
  const systemColorScheme = useColorScheme();

  const isDark = theme === "system"
    ? systemColorScheme === "dark"
    : theme === "dark";

  return { theme, setTheme, isDark };
}
