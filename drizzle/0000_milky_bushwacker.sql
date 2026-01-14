CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  profile_photo_url TEXT,
  birthday TEXT,
  password_hash TEXT NOT NULL,
  timezone TEXT NOT NULL,
  timezone_override TEXT,
  created_at TEXT NOT NULL
);