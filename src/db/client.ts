import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expo = openDatabaseSync("adult-crm.db");
export const db = drizzle(expo, { schema });

let ready: Promise<void> | null = null;

function addColumnSafe(table: string, columnDef: string) {
  try {
    expo.execSync(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
  } catch {}
}

function tableExists(name: string) {
  const rows = expo.getAllSync(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
    [name]
  );
  return rows.length > 0;
}

export function ensureDbReady() {
  if (!ready) {
    ready = (async () => {
      console.log("DB migrate start");

      // USERS
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          email TEXT NOT NULL,
          name TEXT,
          first_name TEXT NOT NULL,
          last_name TEXT,
          birthday TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          profile_photo_url TEXT,
          avatar_url TEXT,
          timezone TEXT NOT NULL,
          timezone_override TEXT,
          greeting_style TEXT DEFAULT 'casual',
          workdays TEXT DEFAULT '1,2,3,4,5',
          created_at TEXT NOT NULL
        );
      `);

      // If your existing users table was created earlier with missing cols, add them
      addColumnSafe("users", "name TEXT");
      addColumnSafe("users", "first_name TEXT");
      addColumnSafe("users", "last_name TEXT");
      addColumnSafe("users", "birthday TEXT");
      addColumnSafe("users", "password_hash TEXT");
      addColumnSafe("users", "profile_photo_url TEXT");
      addColumnSafe("users", "avatar_url TEXT");
      addColumnSafe("users", "timezone_override TEXT");
      addColumnSafe("users", "greeting_style TEXT DEFAULT 'casual'");
      addColumnSafe("users", "workdays TEXT DEFAULT '1,2,3,4,5'");

      // USER SETTINGS
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          notifications_habits INTEGER DEFAULT 1,
          notifications_people INTEGER DEFAULT 1,
          notifications_subscriptions INTEGER DEFAULT 1,
          notifications_home INTEGER DEFAULT 1,
          quiet_hours_enabled INTEGER DEFAULT 0,
          quiet_hours_start TEXT DEFAULT '22:00',
          quiet_hours_end TEXT DEFAULT '07:00',
          use_notes_for_suggestions INTEGER DEFAULT 0,
          analytics_enabled INTEGER DEFAULT 0,
          greeting_style TEXT DEFAULT 'casual',
          timezone_override TEXT,
          workdays TEXT DEFAULT '1,2,3,4,5',
          created_at TEXT NOT NULL
        );
      `);
      // Add columns if they don't exist (for existing databases)
      addColumnSafe("user_settings", "notifications_habits INTEGER DEFAULT 1");
      addColumnSafe("user_settings", "notifications_people INTEGER DEFAULT 1");
      addColumnSafe("user_settings", "notifications_subscriptions INTEGER DEFAULT 1");
      addColumnSafe("user_settings", "notifications_home INTEGER DEFAULT 1");
      addColumnSafe("user_settings", "quiet_hours_enabled INTEGER DEFAULT 0");
      addColumnSafe("user_settings", "quiet_hours_start TEXT DEFAULT '22:00'");
      addColumnSafe("user_settings", "quiet_hours_end TEXT DEFAULT '07:00'");
      addColumnSafe("user_settings", "use_notes_for_suggestions INTEGER DEFAULT 0");
      addColumnSafe("user_settings", "analytics_enabled INTEGER DEFAULT 0");

      // EVENTS
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT DEFAULT 'event',
          status TEXT DEFAULT 'confirmed',
          start_time TEXT NOT NULL,
          end_time TEXT,
          start_at TEXT,
          end_at TEXT,
          location TEXT,
          color TEXT,
          all_day INTEGER DEFAULT 0,
          recurrence TEXT,
          notes TEXT,
          reminder_minutes INTEGER DEFAULT 15,
          created_at TEXT NOT NULL
        );
      `);
      addColumnSafe("events", "description TEXT");
      addColumnSafe("events", "type TEXT DEFAULT 'event'");
      addColumnSafe("events", "status TEXT DEFAULT 'confirmed'");
      addColumnSafe("events", "start_time TEXT");
      addColumnSafe("events", "end_time TEXT");
      addColumnSafe("events", "color TEXT");
      addColumnSafe("events", "all_day INTEGER DEFAULT 0");
      addColumnSafe("events", "recurrence TEXT");
      addColumnSafe("events", "reminder_minutes INTEGER DEFAULT 15");

      // HABITS
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS habits (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          frequency TEXT DEFAULT 'daily',
          frequency_config TEXT,
          target_count INTEGER DEFAULT 1,
          target_per_period INTEGER DEFAULT 1,
          archived INTEGER DEFAULT 0,
          icon TEXT,
          color TEXT,
          reminder_time TEXT,
          created_at TEXT NOT NULL
        );
      `);
      addColumnSafe("habits", "archived INTEGER DEFAULT 0");
      addColumnSafe("habits", "icon TEXT");
      addColumnSafe("habits", "color TEXT");
      addColumnSafe("habits", "frequency_config TEXT");
      addColumnSafe("habits", "target_count INTEGER DEFAULT 1");
      addColumnSafe("habits", "reminder_time TEXT");

      // HABIT LOGS
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS habit_logs (
          id TEXT PRIMARY KEY NOT NULL,
          habit_id TEXT NOT NULL,
          user_id TEXT,
          completed_at TEXT NOT NULL,
          skipped INTEGER DEFAULT 0,
          skip_reason TEXT,
          note TEXT,
          created_at TEXT
        );
      `);
      addColumnSafe("habit_logs", "skipped INTEGER DEFAULT 0");
      addColumnSafe("habit_logs", "skip_reason TEXT");
      addColumnSafe("habit_logs", "note TEXT");

      // PEOPLE
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS people (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          avatar_url TEXT,
          last_contact_date TEXT,
          touchpoint_frequency_days INTEGER DEFAULT 14,
          notes TEXT,
          created_at TEXT NOT NULL
        );
      `);

      // INTERACTIONS
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS interactions (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          person_id TEXT NOT NULL,
          type TEXT,
          occurred_at TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL
        );
      `);

      // SUBSCRIPTIONS
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          amount INTEGER DEFAULT 0,
          amount_cents INTEGER DEFAULT 0,
          currency TEXT DEFAULT 'USD',
          billing_cycle TEXT DEFAULT 'monthly',
          billing_period TEXT DEFAULT 'monthly',
          next_renewal_date TEXT,
          next_bill_date TEXT,
          category TEXT NOT NULL,
          payment_method TEXT,
          auto_renew INTEGER DEFAULT 1,
          status TEXT DEFAULT 'active',
          notes TEXT,
          created_at TEXT NOT NULL
        );
      `);
      addColumnSafe("subscriptions", "amount INTEGER DEFAULT 0");
      addColumnSafe("subscriptions", "currency TEXT DEFAULT 'USD'");
      addColumnSafe("subscriptions", "billing_cycle TEXT DEFAULT 'monthly'");
      addColumnSafe("subscriptions", "next_renewal_date TEXT");
      addColumnSafe("subscriptions", "category TEXT");
      addColumnSafe("subscriptions", "payment_method TEXT");
      addColumnSafe("subscriptions", "auto_renew INTEGER DEFAULT 1");
      addColumnSafe("subscriptions", "notes TEXT");

      // BOOKINGS
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT,
          status TEXT DEFAULT 'pending',
          created_at TEXT
        );
      `);

      // MAINTENANCE ITEMS (Simplified tracking)
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS maintenance_items (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          priority TEXT DEFAULT 'normal',
          interval_days INTEGER NOT NULL,
          next_due_date TEXT NOT NULL,
          last_completed_date TEXT,
          notes TEXT,
          created_at TEXT NOT NULL
        );
      `);

      // MAINTENANCE TASKS (Advanced asset-based tracking)
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS maintenance_tasks (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT,
          title TEXT NOT NULL,
          active INTEGER DEFAULT 1,
          next_due_date TEXT,
          created_at TEXT
        );
      `);

      // SMART HOME ROOMS
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS smart_home_rooms (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          icon TEXT,
          created_at TEXT NOT NULL
        );
      `);

      // SMART HOME DEVICES
      expo.execSync(`
        CREATE TABLE IF NOT EXISTS smart_home_devices (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          room_id TEXT,
          name TEXT NOT NULL,
          type TEXT,
          state TEXT,
          state_json TEXT,
          manufacturer TEXT,
          model TEXT,
          created_at TEXT NOT NULL
        );
      `);
      addColumnSafe("smart_home_devices", "state TEXT");
      addColumnSafe("smart_home_devices", "manufacturer TEXT");
      addColumnSafe("smart_home_devices", "model TEXT");

      // quick visibility
      const tables = expo.getAllSync(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
      );
      console.log("tables:", tables.map((t: any) => t.name));

      const usersCols = expo.getAllSync("PRAGMA table_info(users);");
      console.log("users columns:", usersCols.map((c: any) => c.name));

      console.log("DB migrate done");
    })();
  }
  return ready;
}