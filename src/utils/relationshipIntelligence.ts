import { differenceInDays } from "date-fns";

export type DriftStatus = "ok" | "dueSoon" | "overdue";
export type Priority = "low" | "normal" | "high";

export interface PersonWithDrift {
  id: string;
  fullName: string;
  priority: Priority;
  preferredCadenceDays: number;
  lastInteractionAt: Date | null;
  lastInteractionType: string | null;
  daysSinceLastInteraction: number | null;
  driftStatus: DriftStatus;
  isImportantAndNeglected: boolean;
  createdAt: Date;
}

export function calculateDrift(
  lastInteractionAt: Date | null,
  preferredCadenceDays: number,
  createdAt: Date
): {
  daysSinceLastInteraction: number | null;
  driftStatus: DriftStatus;
} {
  const now = new Date();

  // If never contacted, use createdAt as baseline
  const referenceDate = lastInteractionAt || createdAt;
  const daysSince = differenceInDays(now, referenceDate);

  // Thresholds
  const okThreshold = preferredCadenceDays * 0.75;
  const overdueThreshold = preferredCadenceDays;

  let driftStatus: DriftStatus;
  if (daysSince <= okThreshold) {
    driftStatus = "ok";
  } else if (daysSince <= overdueThreshold) {
    driftStatus = "dueSoon";
  } else {
    driftStatus = "overdue";
  }

  return {
    daysSinceLastInteraction: lastInteractionAt ? daysSince : null,
    driftStatus,
  };
}

export function isImportantAndNeglected(
  priority: Priority,
  driftStatus: DriftStatus
): boolean {
  return priority === "high" && driftStatus === "overdue";
}

export function getDriftColor(driftStatus: DriftStatus, isDark: boolean): string {
  switch (driftStatus) {
    case "ok":
      return "#10B981"; // green
    case "dueSoon":
      return "#F59E0B"; // amber
    case "overdue":
      return "#EF4444"; // red
  }
}

export function getDriftLabel(
  driftStatus: DriftStatus,
  daysSinceLastInteraction: number | null,
  preferredCadenceDays: number
): string {
  if (daysSinceLastInteraction === null) {
    return "Never contacted";
  }

  const daysOverdue = daysSinceLastInteraction - preferredCadenceDays;

  switch (driftStatus) {
    case "ok":
      return `Contacted ${daysSinceLastInteraction} days ago`;
    case "dueSoon":
      const daysUntilDue = preferredCadenceDays - daysSinceLastInteraction;
      return `Due in ${daysUntilDue} days`;
    case "overdue":
      return `${daysOverdue} days overdue`;
  }
}

export function generateOutreachSuggestions(
  person: {
    fullName: string;
    tags: string[];
    lastInteractionType: string | null;
    daysSinceLastInteraction: number | null;
    notes?: string;
  },
  useNotes: boolean = false
): {
  casual: string;
  friendly: string;
  direct: string;
} {
  const firstName = person.fullName.split(" ")[0];
  const daysSince = person.daysSinceLastInteraction || 0;

  // Contextual elements
  const isFriend = person.tags.includes("friend");
  const isFamily = person.tags.includes("family");
  const isColleague = person.tags.includes("colleague");

  // Time-based context
  let timeContext = "";
  if (daysSince > 90) {
    timeContext = "It's been way too long! ";
  } else if (daysSince > 30) {
    timeContext = "It's been a while. ";
  }

  // Generate suggestions
  const casual = `Hey ${firstName}! ${timeContext}How have you been? Would love to catch up soon.`;

  let friendly = "";
  if (isFamily) {
    friendly = `Hi ${firstName}, ${timeContext}I've been thinking about you. Hope everything is going well! Let's plan a time to connect.`;
  } else if (isFriend) {
    friendly = `Hey ${firstName}! ${timeContext}I'd love to hear what you've been up to lately. Coffee/call soon?`;
  } else if (isColleague) {
    friendly = `Hi ${firstName}, ${timeContext}Hope you're doing well! Would be great to catch up and see how things are going.`;
  } else {
    friendly = `Hi ${firstName}, ${timeContext}Hope you're doing great! Would love to catch up sometime soon.`;
  }

  const direct = `Hi ${firstName}, just checking in! Available for a quick ${
    person.lastInteractionType === "call" ? "call" : "chat"
  }?`;

  return { casual, friendly, direct };
}
