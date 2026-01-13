# Adult CRM - Personal Operating System

A privacy-first, local-first mobile app for managing your life like a CRM: habits, relationships, schedule, home automation, subscriptions, and maintenance reminders.

## 🎯 MVP Features

- **Today Dashboard**: Unified daily view of all modules
- **Habits**: Track daily/weekly habits with streaks and flexible schedules
- **People**: Relationship touchpoint reminders with interaction logging
- **Schedule**: Calendar, tasks, and booking links with approval workflow
- **Home**: Smart home control (demo), maintenance tracking, subscription management

## 🏗️ Tech Stack

- **Frontend**: React Native + Expo SDK 50
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind (Tailwind for React Native)
- **Animations**: React Native Reanimated 3
- **Navigation**: Expo Router (file-based)
- **State**: Zustand
- **Data**: TanStack Query
- **Database**: SQLite (expo-sqlite) + Drizzle ORM
- **Local-first**: All data stored locally, offline-capable

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- iOS: Xcode 15+ and CocoaPods
- Android: Android Studio and SDK
- Expo Go app (for quick testing)

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on iOS**:
   ```bash
   npm run ios
   ```

4. **Run on Android**:
   ```bash
   npm run android
   ```

5. **Run on Web** (experimental):
   ```bash
   npm run web
   ```

### First Launch

The app will automatically seed demo data on first launch:
- 5 sample habits (meditation, exercise, reading, journaling, calling family)
- 4 contacts with touchpoint reminders
- Sample calendar events
- Mock subscriptions
- Vehicle maintenance tracker
- Smart home demo rooms and devices

**Demo User**: `demo@adultcrm.app`

## 📁 Project Structure

```
adult-crm/
├── app/                      # Expo Router screens
│   ├── _layout.tsx          # Root layout with providers
│   └── (tabs)/              # Bottom tab navigation
│       ├── index.tsx        # Today dashboard
│       ├── habits.tsx       # Habit tracker
│       ├── people.tsx       # Relationship manager
│       ├── schedule.tsx     # Calendar & tasks
│       └── home.tsx         # Smart home & more
├── src/
│   ├── components/
│   │   └── ui/              # Reusable UI components
│   ├── db/
│   │   ├── schema.ts        # Database schema
│   │   ├── client.ts        # Drizzle client
│   │   └── seed.ts          # Seed data
│   ├── stores/              # Zustand stores
│   └── utils/               # Helper functions
├── package.json
├── app.json                 # Expo config
├── tailwind.config.js       # Tailwind config
└── tsconfig.json            # TypeScript config
```

## 🎨 Design System

### Colors

**Light Theme**:
- Primary: `#3B82F6` (Blue)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Amber)
- Error: `#EF4444` (Red)

**Dark Theme**:
- Primary: `#60A5FA` (Lighter Blue)
- Success: `#34D399` (Lighter Green)
- Automatic system preference detection

### Typography

- Font: Inter (system fallback: SF Pro / Roboto)
- Sizes: xs (11px) → 4xl (36px)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Components

- **Button**: Primary, secondary, ghost variants with spring animation
- **Card**: Base and elevated variants with press feedback
- **Checkbox**: Animated checkmark with haptic feedback

### Animations

- **Habit completion**: 400ms spring animation with checkmark draw
- **Card press**: Scale feedback (0.98x)
- **Screen transitions**: 250ms slide
- All animations respect `prefers-reduced-motion`

## 📱 Key Screens

### Today Dashboard

Aggregates data from all modules:
- Greeting with date
- Habits due today (interactive checklist)
- Upcoming events (next 3)
- People due for touchpoint (top 2)
- Action items (pending bookings, overdue tasks, maintenance due)

### Habits

- List of active habits with streak and completion rate
- Tap to view details and log completion
- Automatic streak calculation
- Skip with optional reason

### People

- Contact cards sorted by touchpoint status
- Color-coded: Green (recent), Yellow (due soon), Red (overdue)
- Log interactions: call, text, meeting, other
- Configurable touchpoint frequency

### Schedule (Placeholder)

- Calendar views: Day, Week, Month
- Tasks with due dates
- Booking links with availability rules and approval workflow

### Home

- **Rooms Tab**: Smart home control (demo mode)
- **Maintenance Tab**: Asset tracking (vehicle, home, appliances)
- **Subscriptions Tab**: Renewal reminders and cost tracking

## 🔐 Privacy & Security

- **Local-first**: All data stored on device (SQLite)
- **No tracking**: No analytics or telemetry
- **Offline-capable**: Full functionality without internet
- **Data export**: JSON export for backup
- **Future**: SQLCipher encryption, biometric lock

## 🛠️ Development

### Database Migrations

Drizzle automatically handles migrations. Schema is in `src/db/schema.ts`.

To reset database:
```bash
# iOS
xcrun simctl get_app_container booted com.adultcrm.app data
# Delete adult-crm.db and restart app

# Android
adb shell
run-as com.adultcrm.app
rm databases/adult-crm.db
```

### Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Building for Production

```bash
# Development build
eas build --profile development --platform ios

# Production build
eas build --profile production --platform all
```

## 🗺️ Roadmap

### MVP (4-8 weeks) ✅
- Core modules: Habits, People, Schedule, Home
- Today dashboard
- Local database with seed data
- UI/UX design system
- Animations and haptics

### V2 (Post-MVP)
- Real HomeKit/Google Home integration
- External calendar sync (Google Calendar, Apple Calendar)
- Contact import from phone
- Push notifications
- Cloud sync (Supabase)
- Data encryption
- Booking link public pages

### V3 (Future)
- Family/household sharing
- Automation workflows (IFTTT-style)
- Voice commands
- Wearable integration
- AI-powered touchpoint suggestions
- Budget analytics

## 🤝 Contributing

This is an MVP starter project. Key areas for contribution:
- Real HomeKit integration
- Calendar sync implementation
- Advanced streak calculations
- Booking link public page UI
- E2E tests

## 📄 License

MIT License - see LICENSE file for details

## 💡 Inspiration

Built with inspiration from:
- **Things 3**: Clean, calm UI
- **Linear**: Fast, purposeful animations
- **Arc Browser**: Thoughtful design details

## 🐛 Known Limitations (MVP)

- Smart home is demo-only (mock devices)
- No calendar sync yet (local only)
- No cloud backup (export/import via JSON)
- Streak calculation is simplified
- Schedule screen is placeholder
- No push notifications (local only)

## 📞 Support

For issues or feature requests, please file an issue on GitHub.

---

**Built with ❤️ for better life management**
