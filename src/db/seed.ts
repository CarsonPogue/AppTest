import { db } from "./client";
import * as schema from "./schema";
import { nanoid } from "../utils/nanoid";
import {
  addDays,
  addMonths,
  startOfDay,
  setHours,
  setMinutes,
} from "date-fns";

export async function seedDatabase() {
  const userId = nanoid();

  // Create user
  await db.insert(schema.users).values({
    id: userId,
    email: "demo@adultcrm.app",
    name: "Demo User",
    timezone: "America/New_York",
  });

  // Seed habits
  const habitIds = [
    nanoid(),
    nanoid(),
    nanoid(),
    nanoid(),
    nanoid(),
  ];

  await db.insert(schema.habits).values([
    {
      id: habitIds[0],
      userId,
      title: "Morning Meditation",
      description: "10 minutes of mindfulness",
      frequency: "daily",
      targetCount: 1,
      icon: "🧘",
      color: "#8B5CF6",
      reminderTime: "07:00",
    },
    {
      id: habitIds[1],
      userId,
      title: "Exercise",
      description: "30 min workout",
      frequency: "weekly",
      frequencyConfig: { days: [1, 3, 5] }, // Mon, Wed, Fri
      targetCount: 3,
      icon: "💪",
      color: "#10B981",
    },
    {
      id: habitIds[2],
      userId,
      title: "Read",
      description: "At least 20 pages",
      frequency: "daily",
      targetCount: 1,
      icon: "📚",
      color: "#3B82F6",
    },
    {
      id: habitIds[3],
      userId,
      title: "Journal",
      frequency: "daily",
      targetCount: 1,
      icon: "✍️",
      color: "#F59E0B",
    },
    {
      id: habitIds[4],
      userId,
      title: "Call Family",
      frequency: "weekly",
      frequencyConfig: { days: [0] }, // Sunday
      targetCount: 1,
      icon: "📞",
      color: "#EC4899",
    },
  ]);

  // Seed some habit logs (create a streak)
  const habitLogData = [];
  for (let i = 7; i >= 0; i--) {
    habitLogData.push({
      id: nanoid(),
      habitId: habitIds[0], // Meditation
      completedAt: addDays(startOfDay(new Date()), -i),
      skipped: false,
    });
  }
  if (habitLogData.length > 0) {
    await db.insert(schema.habitLogs).values(habitLogData);
  }

  // Seed people
  const peopleIds = [nanoid(), nanoid(), nanoid(), nanoid()];

  await db.insert(schema.people).values([
    {
      id: peopleIds[0],
      userId,
      name: "Sarah Johnson",
      relationship: "Friend",
      touchpointFrequencyDays: 14,
      lastContactDate: addDays(new Date(), -5),
      phone: "555-0101",
      email: "sarah@example.com",
      notes: "College roommate, loves hiking",
    },
    {
      id: peopleIds[1],
      userId,
      name: "Mom",
      relationship: "Family",
      touchpointFrequencyDays: 7,
      lastContactDate: addDays(new Date(), -8), // Overdue
      phone: "555-0102",
    },
    {
      id: peopleIds[2],
      userId,
      name: "Alex Chen",
      relationship: "Colleague",
      touchpointFrequencyDays: 30,
      lastContactDate: addDays(new Date(), -20),
      email: "alex@company.com",
      notes: "Product manager, weekly 1:1s",
    },
    {
      id: peopleIds[3],
      userId,
      name: "David Miller",
      relationship: "Friend",
      touchpointFrequencyDays: 21,
      lastContactDate: addDays(new Date(), -2),
      phone: "555-0104",
      notes: "Gym buddy",
    },
  ]);

  // Seed some interactions
  await db.insert(schema.personInteractions).values([
    {
      id: nanoid(),
      personId: peopleIds[0],
      interactionDate: addDays(new Date(), -5),
      type: "text",
      note: "Caught up on life updates",
    },
    {
      id: nanoid(),
      personId: peopleIds[1],
      interactionDate: addDays(new Date(), -8),
      type: "call",
      note: "Weekly check-in call",
    },
  ]);

  // Seed events
  const today = startOfDay(new Date());
  await db.insert(schema.events).values([
    {
      id: nanoid(),
      userId,
      title: "Team Standup",
      startTime: setMinutes(setHours(today, 9), 0),
      endTime: setMinutes(setHours(today, 9), 30),
      type: "calendar",
      status: "confirmed",
      color: "#3B82F6",
    },
    {
      id: nanoid(),
      userId,
      title: "Lunch with Sarah",
      startTime: setMinutes(setHours(today, 12), 30),
      endTime: setMinutes(setHours(today, 13), 30),
      type: "calendar",
      status: "confirmed",
      location: "Cafe Downtown",
      color: "#10B981",
    },
    {
      id: nanoid(),
      userId,
      title: "Finish project proposal",
      startTime: today,
      endTime: null,
      type: "task",
      status: "pending",
      color: "#F59E0B",
    },
    {
      id: nanoid(),
      userId,
      title: "Review Q1 goals",
      startTime: addDays(today, 1),
      endTime: null,
      type: "task",
      status: "pending",
    },
  ]);

  // Seed booking link
  await db.insert(schema.bookingLinks).values({
    id: nanoid(),
    userId,
    slug: "coffee-chat",
    title: "Coffee Chat",
    durationMinutes: 30,
    availabilityWindows: [
      { day: 1, startTime: "09:00", endTime: "17:00" }, // Monday
      { day: 2, startTime: "09:00", endTime: "17:00" }, // Tuesday
      { day: 3, startTime: "09:00", endTime: "17:00" }, // Wednesday
      { day: 4, startTime: "09:00", endTime: "17:00" }, // Thursday
      { day: 5, startTime: "09:00", endTime: "17:00" }, // Friday
    ],
    bufferBeforeMinutes: 15,
    bufferAfterMinutes: 15,
    maxPerDay: 3,
    requiresApproval: true,
    active: true,
  });

  // Seed subscriptions
  await db.insert(schema.subscriptions).values([
    {
      id: nanoid(),
      userId,
      name: "Netflix",
      amount: 15.99,
      billingCycle: "monthly",
      nextRenewalDate: addMonths(new Date(), 1),
      category: "Streaming",
      paymentMethod: "Visa ••4242",
      autoRenew: true,
    },
    {
      id: nanoid(),
      userId,
      name: "Spotify Premium",
      amount: 10.99,
      billingCycle: "monthly",
      nextRenewalDate: addDays(new Date(), 5),
      category: "Music",
      autoRenew: true,
    },
    {
      id: nanoid(),
      userId,
      name: "GitHub Pro",
      amount: 4.0,
      billingCycle: "monthly",
      nextRenewalDate: addDays(new Date(), 15),
      category: "Software",
    },
    {
      id: nanoid(),
      userId,
      name: "Adobe Creative Cloud",
      amount: 54.99,
      billingCycle: "monthly",
      nextRenewalDate: addDays(new Date(), 20),
      category: "Software",
    },
  ]);

  // Seed maintenance
  const carId = nanoid();
  await db.insert(schema.maintenanceAssets).values([
    {
      id: carId,
      userId,
      name: "Honda Civic",
      type: "vehicle",
      makeModel: "2020 Honda Civic",
      purchaseDate: new Date("2020-03-15"),
    },
  ]);

  await db.insert(schema.maintenanceTasks).values([
    {
      id: nanoid(),
      assetId: carId,
      title: "Oil Change",
      recurrenceType: "both",
      intervalDays: 90,
      intervalMiles: 3000,
      lastCompleted: addDays(new Date(), -85),
      lastMileage: 42000,
      nextDueDate: addDays(new Date(), 5),
      nextDueMileage: 45000,
      reminderAdvanceDays: 7,
    },
    {
      id: nanoid(),
      assetId: carId,
      title: "Tire Rotation",
      recurrenceType: "time",
      intervalDays: 180,
      lastCompleted: addDays(new Date(), -120),
      nextDueDate: addDays(new Date(), 60),
      reminderAdvanceDays: 14,
    },
  ]);

  // Seed smart home
  const livingRoomId = nanoid();
  const bedroomId = nanoid();

  await db.insert(schema.smartHomeRooms).values([
    {
      id: livingRoomId,
      userId,
      name: "Living Room",
      icon: "🛋️",
      order: 0,
    },
    {
      id: bedroomId,
      userId,
      name: "Bedroom",
      icon: "🛏️",
      order: 1,
    },
  ]);

  await db.insert(schema.smartHomeDevices).values([
    {
      id: nanoid(),
      roomId: livingRoomId,
      name: "Ceiling Light",
      type: "light",
      state: { on: false, brightness: 80 },
      manufacturer: "Philips Hue",
      model: "White & Color",
    },
    {
      id: nanoid(),
      roomId: livingRoomId,
      name: "Floor Lamp",
      type: "light",
      state: { on: true, brightness: 60 },
      manufacturer: "Philips Hue",
      model: "White",
    },
    {
      id: nanoid(),
      roomId: bedroomId,
      name: "Bedside Lamp",
      type: "light",
      state: { on: false, brightness: 40 },
      manufacturer: "Philips Hue",
      model: "White",
    },
    {
      id: nanoid(),
      roomId: livingRoomId,
      name: "Thermostat",
      type: "thermostat",
      state: { temperature: 72 },
      manufacturer: "Nest",
      model: "Learning Thermostat",
    },
  ]);

  console.log("✅ Database seeded successfully!");
}
