import { startOfDay, differenceInDays, subDays } from "date-fns";

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  fireEmojis: string;
  streakLevel: number;
  streakColor: string;
}

export function calculateStreak(
  logs: Array<{ completedAt: Date; skipped: boolean }>
): StreakInfo {
  if (logs.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRate: 0,
      fireEmojis: "",
      streakLevel: 0,
      streakColor: "#9CA3AF",
    };
  }

  // Sort logs by date (most recent first)
  const sortedLogs = [...logs].sort(
    (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
  );

  // Calculate current streak
  let currentStreak = 0;
  let today = startOfDay(new Date());
  let checkDate = today;

  for (const log of sortedLogs) {
    const logDate = startOfDay(log.completedAt);
    const daysDiff = differenceInDays(checkDate, logDate);

    if (daysDiff === 0 && !log.skipped) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else if (daysDiff === 1) {
      // Check if there's a log for this date
      const hasLog = sortedLogs.some(
        (l) =>
          differenceInDays(today, startOfDay(l.completedAt)) === daysDiff &&
          !l.skipped
      );
      if (!hasLog) break;
      checkDate = subDays(checkDate, 1);
    } else if (daysDiff > 1) {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const log of sortedLogs.reverse()) {
    if (log.skipped) continue;

    const logDate = startOfDay(log.completedAt);

    if (!lastDate) {
      tempStreak = 1;
      lastDate = logDate;
    } else {
      const daysDiff = differenceInDays(logDate, lastDate);
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      lastDate = logDate;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate completion rate (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentLogs = logs.filter(
    (log) => log.completedAt >= thirtyDaysAgo && !log.skipped
  );
  const completionRate = Math.round((recentLogs.length / 30) * 100);

  // Total completions
  const totalCompletions = logs.filter((log) => !log.skipped).length;

  // Fire emoji visualization
  const { fireEmojis, streakLevel, streakColor } =
    getFireVisualization(currentStreak);

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate,
    fireEmojis,
    streakLevel,
    streakColor,
  };
}

function getFireVisualization(streak: number): {
  fireEmojis: string;
  streakLevel: number;
  streakColor: string;
} {
  if (streak === 0) {
    return { fireEmojis: "", streakLevel: 0, streakColor: "#9CA3AF" };
  } else if (streak <= 2) {
    return { fireEmojis: "🌱", streakLevel: 1, streakColor: "#10B981" };
  } else if (streak <= 6) {
    return { fireEmojis: "🔥", streakLevel: 2, streakColor: "#F59E0B" };
  } else if (streak <= 13) {
    return { fireEmojis: "🔥🔥", streakLevel: 3, streakColor: "#F97316" };
  } else if (streak <= 29) {
    return { fireEmojis: "🔥🔥🔥", streakLevel: 4, streakColor: "#EF4444" };
  } else if (streak <= 59) {
    return {
      fireEmojis: "🔥🔥🔥🔥",
      streakLevel: 5,
      streakColor: "#DC2626",
    };
  } else if (streak <= 99) {
    return {
      fireEmojis: "🔥🔥🔥🔥🔥",
      streakLevel: 6,
      streakColor: "#B91C1C",
    };
  } else {
    return {
      fireEmojis: "🔥🔥🔥🔥🔥💯",
      streakLevel: 7,
      streakColor: "#7C2D12",
    };
  }
}

export function getStreakMessage(streak: number): string {
  if (streak === 0) {
    return "Start your streak today!";
  } else if (streak === 1) {
    return "Great start! Keep it going!";
  } else if (streak <= 6) {
    return "Building momentum!";
  } else if (streak <= 13) {
    return "You're on fire!";
  } else if (streak <= 29) {
    return "Incredible consistency!";
  } else if (streak <= 59) {
    return "Unstoppable!";
  } else if (streak <= 99) {
    return "Legendary streak!";
  } else {
    return "HALL OF FAME! 🏆";
  }
}
