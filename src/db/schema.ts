import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Users table with profile extensions
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  firstName: text("first_name").notNull(),
  birthday: text("birthday").notNull(), // ISO date string
  passwordHash: text("password_hash").notNull(),
  profilePhotoUrl: text("profile_photo_url"),
  timezone: text("timezone").notNull().default("America/New_York"),
  timezoneOverride: text("timezone_override"),
  greetingStyle: text("greeting_style").notNull().default("casual"), // formal, casual, fun
  workdays: text("workdays").notNull().default("1,2,3,4,5"), // comma-separated day indices
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// User settings
export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  notificationsHabits: integer("notifications_habits").notNull().default(1), // 0 or 1 (boolean)
  notificationsPeople: integer("notifications_people").notNull().default(1),
  notificationsSubscriptions: integer("notifications_subscriptions").notNull().default(1),
  notificationsHome: integer("notifications_home").notNull().default(1),
  quietHoursEnabled: integer("quiet_hours_enabled").notNull().default(0),
  quietHoursStart: text("quiet_hours_start").default("22:00"), // HH:MM
  quietHoursEnd: text("quiet_hours_end").default("07:00"), // HH:MM
  useNotesForSuggestions: integer("use_notes_for_suggestions").notNull().default(0),
  analyticsEnabled: integer("analytics_enabled").notNull().default(0),
});

// Habits
export const habits = sqliteTable("habits", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(), // daily, weekly, custom
  frequencyConfig: text("frequency_config"), // JSON string
  targetCount: integer("target_count").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  reminderTime: text("reminder_time"),
  archived: integer("archived").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const habitLogs = sqliteTable("habit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  habitId: text("habit_id").notNull().references(() => habits.id),
  completedAt: text("completed_at").notNull(),
  skipped: integer("skipped").notNull(),
  skipReason: text("skip_reason"),
  note: text("note"),
  notes: text("notes"),
});

// People (Enhanced for Relationship Intelligence)
export const people = sqliteTable("people", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  tags: text("tags").notNull().default(""), // comma-separated
  priority: text("priority").notNull().default("normal"), // low, normal, high
  preferredCadenceDays: integer("preferred_cadence_days").notNull(),
  lastInteractionAt: text("last_interaction_at"),
  lastInteractionType: text("last_interaction_type"), // call, text, in_person, email, other
  phone: text("phone"),
  email: text("email"),
  birthday: text("birthday"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Interactions
export const interactions = sqliteTable("interactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  personId: text("person_id").notNull().references(() => people.id),
  occurredAt: text("occurred_at").notNull(),
  type: text("type").notNull(), // call, text, in_person, email, other
  summary: text("summary"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Legacy: Person Interactions (to be migrated to interactions table)
export const personInteractions = sqliteTable("person_interactions", {
  id: text("id").primaryKey(),
  personId: text("person_id").notNull().references(() => people.id),
  interactionDate: text("interaction_date").notNull(),
  type: text("type").notNull(),
  note: text("note"),
});

// Events
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  type: text("type").notNull(), // calendar, task, booking
  status: text("status").notNull(), // pending, confirmed, completed, cancelled
  location: text("location"),
  color: text("color"),
  allDay: integer("all_day").notNull().default(0),
  recurrence: text("recurrence"), // JSON string
});

// Booking Links
export const bookingLinks = sqliteTable("booking_links", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  availabilityWindows: text("availability_windows").notNull(), // JSON string
  bufferBeforeMinutes: integer("buffer_before_minutes").notNull(),
  bufferAfterMinutes: integer("buffer_after_minutes").notNull(),
  maxPerDay: integer("max_per_day"),
  maxPerWeek: integer("max_per_week"),
  requiresApproval: integer("requires_approval").notNull(),
  allowedInvitees: text("allowed_invitees"), // JSON string
  active: integer("active").notNull(),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  bookingLinkId: text("booking_link_id").notNull().references(() => bookingLinks.id),
  inviteeName: text("invitee_name").notNull(),
  inviteeEmail: text("invitee_email").notNull(),
  requestedTime: text("requested_time").notNull(),
  status: text("status").notNull(), // pending, approved, rejected, completed
  eventId: text("event_id").references(() => events.id),
  notes: text("notes"),
});

// Subscriptions
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  amount: integer("amount").notNull(), // stored as cents
  currency: text("currency").notNull().default("USD"),
  billingCycle: text("billing_cycle").notNull(), // monthly, yearly, weekly, custom
  nextRenewalDate: text("next_renewal_date").notNull(),
  category: text("category").notNull(),
  paymentMethod: text("payment_method"),
  autoRenew: integer("auto_renew").notNull().default(1),
  notes: text("notes"),
});

// Maintenance Items (Simplified version for direct tracking)
export const maintenanceItems = sqliteTable("maintenance_items", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  category: text("category").notNull(), // hvac, plumbing, electrical, appliance, lawn, vehicle, home, other
  priority: text("priority").notNull().default("normal"), // low, normal, high
  intervalDays: integer("interval_days").notNull(),
  nextDueDate: text("next_due_date").notNull(),
  lastCompletedDate: text("last_completed_date"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Maintenance (Advanced asset-based tracking)
export const maintenanceAssets = sqliteTable("maintenance_assets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // vehicle, home, appliance, device
  makeModel: text("make_model"),
  purchaseDate: text("purchase_date"),
});

export const maintenanceTasks = sqliteTable("maintenance_tasks", {
  id: text("id").primaryKey(),
  assetId: text("asset_id").notNull().references(() => maintenanceAssets.id),
  title: text("title").notNull(),
  description: text("description"),
  recurrenceType: text("recurrence_type").notNull(), // time, usage, both
  intervalDays: integer("interval_days"),
  intervalMiles: integer("interval_miles"),
  lastCompleted: text("last_completed"),
  lastMileage: integer("last_mileage"),
  nextDueDate: text("next_due_date"),
  nextDueMileage: integer("next_due_mileage"),
  reminderAdvanceDays: integer("reminder_advance_days").notNull(),
  active: integer("active").notNull().default(1),
});

export const maintenanceLogs = sqliteTable("maintenance_logs", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => maintenanceTasks.id),
  completedAt: text("completed_at").notNull(),
  mileage: integer("mileage"),
  cost: integer("cost"), // stored as cents
  notes: text("notes"),
});

// Smart Home
export const smartHomeRooms = sqliteTable("smart_home_rooms", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  order: integer("order").notNull(),
});

export const smartHomeDevices = sqliteTable("smart_home_devices", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => smartHomeRooms.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // light, switch, thermostat, lock, sensor
  state: text("state").notNull(), // JSON string
  manufacturer: text("manufacturer").notNull(),
  model: text("model").notNull(),
});
