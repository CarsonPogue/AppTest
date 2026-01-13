import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Users
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  timezone: text("timezone").notNull().default("UTC"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Habits
export const habits = sqliteTable("habits", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency", {
    enum: ["daily", "weekly", "custom"],
  }).notNull(),
  frequencyConfig: text("frequency_config", { mode: "json" }).$type<{
    days?: number[];
    customInterval?: number;
  }>(),
  targetCount: integer("target_count").notNull().default(1),
  icon: text("icon").notNull().default("⭐"),
  color: text("color").notNull().default("#3B82F6"),
  reminderTime: text("reminder_time"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const habitLogs = sqliteTable("habit_logs", {
  id: text("id").primaryKey(),
  habitId: text("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
  skipped: integer("skipped", { mode: "boolean" }).notNull().default(false),
  skipReason: text("skip_reason"),
  note: text("note"),
});

// Events (Calendar + Tasks + Bookings)
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }),
  type: text("type", { enum: ["calendar", "task", "booking"] }).notNull(),
  status: text("status", {
    enum: ["pending", "confirmed", "completed", "cancelled"],
  })
    .notNull()
    .default("pending"),
  location: text("location"),
  allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
  recurrence: text("recurrence", { mode: "json" }).$type<{
    frequency: string;
    interval?: number;
    until?: Date;
  }>(),
  color: text("color").default("#3B82F6"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// People (Relationships)
export const people = sqliteTable("people", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  relationship: text("relationship").notNull(),
  touchpointFrequencyDays: integer("touchpoint_frequency_days")
    .notNull()
    .default(14),
  lastContactDate: integer("last_contact_date", { mode: "timestamp" }),
  notes: text("notes"),
  phone: text("phone"),
  email: text("email"),
  birthday: text("birthday"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const personInteractions = sqliteTable("person_interactions", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  interactionDate: integer("interaction_date", { mode: "timestamp" }).notNull(),
  type: text("type", {
    enum: ["call", "text", "meeting", "other"],
  }).notNull(),
  note: text("note"),
});

// Booking Links
export const bookingLinks = sqliteTable("booking_links", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  availabilityWindows: text("availability_windows", {
    mode: "json",
  }).$type<
    Array<{
      day: number;
      startTime: string;
      endTime: string;
    }>
  >(),
  bufferBeforeMinutes: integer("buffer_before_minutes").notNull().default(0),
  bufferAfterMinutes: integer("buffer_after_minutes").notNull().default(0),
  maxPerDay: integer("max_per_day"),
  maxPerWeek: integer("max_per_week"),
  requiresApproval: integer("requires_approval", { mode: "boolean" })
    .notNull()
    .default(true),
  allowedInvitees: text("allowed_invitees", { mode: "json" }).$type<string[]>(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  bookingLinkId: text("booking_link_id")
    .notNull()
    .references(() => bookingLinks.id, { onDelete: "cascade" }),
  inviteeName: text("invitee_name").notNull(),
  inviteeEmail: text("invitee_email").notNull(),
  requestedTime: integer("requested_time", { mode: "timestamp" }).notNull(),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "completed"],
  })
    .notNull()
    .default("pending"),
  eventId: text("event_id").references(() => events.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Subscriptions
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  billingCycle: text("billing_cycle", {
    enum: ["monthly", "yearly", "weekly", "custom"],
  }).notNull(),
  nextRenewalDate: integer("next_renewal_date", { mode: "timestamp" }).notNull(),
  category: text("category").notNull(),
  paymentMethod: text("payment_method"),
  autoRenew: integer("auto_renew", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Maintenance
export const maintenanceAssets = sqliteTable("maintenance_assets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["vehicle", "home", "appliance", "device"],
  }).notNull(),
  makeModel: text("make_model"),
  purchaseDate: integer("purchase_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const maintenanceTasks = sqliteTable("maintenance_tasks", {
  id: text("id").primaryKey(),
  assetId: text("asset_id")
    .notNull()
    .references(() => maintenanceAssets.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  recurrenceType: text("recurrence_type", {
    enum: ["time", "usage", "both"],
  }).notNull(),
  intervalDays: integer("interval_days"),
  intervalMiles: integer("interval_miles"),
  lastCompleted: integer("last_completed", { mode: "timestamp" }),
  lastMileage: integer("last_mileage"),
  nextDueDate: integer("next_due_date", { mode: "timestamp" }),
  nextDueMileage: integer("next_due_mileage"),
  reminderAdvanceDays: integer("reminder_advance_days").notNull().default(7),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const maintenanceLogs = sqliteTable("maintenance_logs", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => maintenanceTasks.id, { onDelete: "cascade" }),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
  mileage: integer("mileage"),
  cost: real("cost"),
  notes: text("notes"),
});

// Smart Home
export const smartHomeRooms = sqliteTable("smart_home_rooms", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("🏠"),
  order: integer("order").notNull().default(0),
});

export const smartHomeDevices = sqliteTable("smart_home_devices", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => smartHomeRooms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["light", "switch", "thermostat", "lock", "sensor"],
  }).notNull(),
  state: text("state", { mode: "json" }).$type<{
    on?: boolean;
    brightness?: number;
    color?: string;
    temperature?: number;
    locked?: boolean;
  }>(),
  manufacturer: text("manufacturer").notNull().default("Mock"),
  model: text("model").notNull().default("Demo Device"),
});
