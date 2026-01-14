import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  birthday: text("birthday").notNull(), // ISO date string
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  timezone: text("timezone").notNull().default("America/New_York"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
