import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite/next";
import * as schema from "./schema";

const expo = openDatabaseSync("adult-crm.db");

export const db = drizzle(expo, { schema });

export type Database = typeof db;
