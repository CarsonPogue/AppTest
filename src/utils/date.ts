import { format, differenceInDays, startOfDay } from "date-fns";

export function formatDate(date: Date | number, formatStr = "MMM d, yyyy"): string {
  return format(date, formatStr);
}

export function formatTime(date: Date | number): string {
  return format(date, "h:mm a");
}

export function formatDateTime(date: Date | number): string {
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

export function daysFromNow(date: Date | number): number {
  return differenceInDays(startOfDay(new Date(date)), startOfDay(new Date()));
}

export function getDayName(dayIndex: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayIndex] || "";
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  // Morning: 5:00–11:59
  if (hour >= 5 && hour < 12) return "Good Morning";
  // Afternoon: 12:00–16:59
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  // Evening: 17:00–4:59
  return "Good Evening";
}
