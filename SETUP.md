# Setup Instructions

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **npm** or **yarn**
   ```bash
   npm --version  # Should be 9.x or higher
   ```

3. **Expo CLI** (optional, but recommended)
   ```bash
   npm install -g expo-cli
   ```

### For iOS Development

4. **macOS** with **Xcode 15+**
   - Install from Mac App Store
   - Install Command Line Tools:
     ```bash
     xcode-select --install
     ```

5. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

### For Android Development

6. **Android Studio**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install Android SDK (API 33 or higher)
   - Set up Android Virtual Device (AVD) or connect physical device

### Quick Testing (No Native Setup Required)

7. **Expo Go App**
   - iOS: Download from App Store
   - Android: Download from Google Play
   - Use for quick testing without native builds

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd adult-crm
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- React Native and Expo
- NativeWind for styling
- Drizzle ORM for database
- React Navigation
- And more...

### 3. Start Development Server

```bash
npm start
```

This opens the Expo developer tools in your browser.

### 4. Run on Device/Simulator

**Option A: Expo Go (Quickest)**
1. Open Expo Go app on your phone
2. Scan the QR code from the terminal
3. App will load on your device

**Option B: iOS Simulator**
```bash
npm run ios
```

**Option C: Android Emulator**
```bash
npm run android
```

**Option D: Web (Experimental)**
```bash
npm run web
```

## First Launch

### Automatic Seeding

On first launch, the app will automatically:
1. Create SQLite database
2. Run migrations
3. Seed with demo data:
   - Demo user (demo@adultcrm.app)
   - 5 sample habits
   - 4 contacts with touchpoint reminders
   - Sample calendar events
   - Mock subscriptions
   - Vehicle maintenance tracker
   - Smart home demo rooms

### Demo User

The app will log you in as the demo user automatically:
- **Email**: demo@adultcrm.app
- **Name**: Demo User

You can explore all features immediately!

## Troubleshooting

### Issue: Metro bundler port conflict

**Solution**: Kill the process using port 8081
```bash
# macOS/Linux
lsof -ti:8081 | xargs kill -9

# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### Issue: iOS build fails with CocoaPods error

**Solution**: Reinstall pods
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### Issue: Android build fails

**Solution**: Clean and rebuild
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Issue: Database not seeding

**Solution**: Clear app data and restart

**iOS Simulator**:
```bash
xcrun simctl get_app_container booted com.adultcrm.app
# Navigate to that directory and delete adult-crm.db
```

**Android Emulator**:
```bash
adb shell
run-as com.adultcrm.app
rm databases/adult-crm.db
```

Then restart the app.

### Issue: TypeScript errors

**Solution**: Clear cache and restart
```bash
npm start -- --clear
```

### Issue: NativeWind styles not applying

**Solution**: Make sure Metro config is correct
1. Check `metro.config.js` includes NativeWind
2. Check `global.css` is imported in `app/_layout.tsx`
3. Restart Metro bundler

## Development Workflow

### Running the App

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Type Checking

```bash
# Check TypeScript types
npm run type-check
```

### Linting

```bash
# Lint code
npm run lint
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Database Management

```bash
# Generate migrations (after schema changes)
npm run db:generate

# Run migrations
npm run db:migrate
```

## Project Structure Overview

```
adult-crm/
├── app/                       # Screens (Expo Router)
│   ├── _layout.tsx           # Root layout
│   └── (tabs)/               # Tab screens
├── src/
│   ├── components/           # React components
│   │   └── ui/              # Reusable UI components
│   ├── db/                  # Database
│   │   ├── schema.ts        # Drizzle schema
│   │   ├── client.ts        # DB client
│   │   └── seed.ts          # Seed data
│   ├── stores/              # Zustand state
│   └── utils/               # Utilities
├── assets/                  # Images, fonts
├── global.css              # Tailwind CSS
├── package.json            # Dependencies
├── app.json               # Expo config
├── tsconfig.json          # TypeScript config
└── tailwind.config.js     # Tailwind config
```

## Key Files to Understand

### 1. `app/_layout.tsx`
Root layout that:
- Initializes providers (Query, Theme)
- Seeds database on first launch
- Sets up navigation

### 2. `src/db/schema.ts`
Complete database schema with all tables:
- Users, Habits, HabitLogs
- Events, People, PersonInteractions
- BookingLinks, Bookings
- Subscriptions
- MaintenanceAssets, MaintenanceTasks, MaintenanceLogs
- SmartHomeRooms, SmartHomeDevices

### 3. `src/db/seed.ts`
Demo data seeding:
- Creates demo user
- Populates sample data for all modules
- Runs on first app launch

### 4. `tailwind.config.js` + `global.css`
Design system configuration:
- Color tokens (light/dark themes)
- Spacing scale
- Typography

### 5. `app/(tabs)/_layout.tsx`
Bottom tab navigation setup:
- Today, Habits, People, Schedule, Home tabs
- Tab bar styling

## Next Steps

### After Setup

1. **Explore the app**:
   - Check out the Today dashboard
   - Toggle some habit completions
   - View people with touchpoint reminders
   - Navigate through all tabs

2. **Review the code**:
   - Start with `app/(tabs)/index.tsx` (Today screen)
   - Look at UI components in `src/components/ui/`
   - Check database schema in `src/db/schema.ts`

3. **Make your first change**:
   - Try changing the primary color in `global.css`
   - Add a new UI component
   - Modify the seed data

### Building Features

Follow the implementation plan in `IMPLEMENTATION_PLAN.md`:
- Phase 2: Enhance core modules (habits, schedule, people)
- Phase 3: Build extended modules (booking links, subscriptions, maintenance)
- Phase 4: Add polish and notifications
- Phase 5: Test and optimize
- Phase 6: Prepare for launch

## Production Builds

### EAS Build Setup

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure project**:
   ```bash
   eas build:configure
   ```

4. **Build for development**:
   ```bash
   eas build --profile development --platform ios
   eas build --profile development --platform android
   ```

5. **Build for production**:
   ```bash
   eas build --profile production --platform all
   ```

### Local Builds (Advanced)

**iOS**:
```bash
npx expo run:ios --configuration Release
```

**Android**:
```bash
npx expo run:android --variant release
```

## Environment Variables (Future)

For V2 (with cloud sync), create `.env`:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Analytics (optional)
EXPO_PUBLIC_POSTHOG_API_KEY=your_posthog_key
```

**Note**: MVP is local-only, no environment variables needed.

## Getting Help

### Resources

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **NativeWind Docs**: https://www.nativewind.dev
- **Drizzle ORM Docs**: https://orm.drizzle.team

### Common Commands

```bash
# Clear all caches
npm start -- --clear

# Reset Metro bundler
npx react-native start --reset-cache

# Check Expo diagnostics
npx expo-doctor

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

## Tips for Development

1. **Use hot reload**: Save files to see changes instantly
2. **Use TypeScript**: Catch errors before runtime
3. **Use Expo Go**: Fastest way to test on real devices
4. **Check logs**: Use `console.log` and view in terminal
5. **Use React DevTools**: Debug component state
6. **Test on both platforms**: iOS and Android can differ
7. **Use dark mode**: Test both themes
8. **Test offline**: Airplane mode should work fully

## Performance Tips

1. **Use FlashList**: For long lists (install separately)
2. **Optimize images**: Use WebP format, resize appropriately
3. **Profile animations**: Use Reanimated profiler
4. **Monitor bundle size**: Use `npx expo-doctor`
5. **Enable Hermes**: Included by default in Expo
6. **Lazy load screens**: Use React.lazy for heavy screens

---

**Happy coding! 🚀**

If you encounter issues, check `IMPLEMENTATION_PLAN.md` for known limitations and `README.md` for feature documentation.
