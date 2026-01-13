# Adult CRM - Product Specification

## Vision

A personal operating system that helps adults manage life like a CRM. Track entities (people, habits, subscriptions, assets) and workflows (reminders, check-ins, tasks, automations) in a calm, beautiful, privacy-first mobile app.

## Target Users

**Primary**: Busy professionals (25-45) who want to be more intentional about:
- Maintaining relationships
- Building healthy habits
- Managing household responsibilities
- Staying on top of subscriptions and maintenance

**Secondary**: Anyone who feels overwhelmed by life admin and wants a single source of truth for personal management.

## Core Value Propositions

1. **Unified Dashboard**: Everything in one place (no app switching)
2. **Proactive Reminders**: System tells you what needs attention
3. **Privacy-First**: Local data, no tracking, full control
4. **Calm UX**: Beautiful, smooth, not anxiety-inducing
5. **Offline-First**: Works without internet, syncs when available

## User Stories

### Habits
- As a user, I want to track daily/weekly habits so I can build consistency
- As a user, I want to see my streaks so I feel motivated to continue
- As a user, I want flexible schedules so habits fit my life

### Relationships
- As a user, I want to be reminded to check in with people so relationships don't fade
- As a user, I want to log interactions so I remember what we discussed
- As a user, I want to see who I haven't talked to in a while

### Schedule
- As a user, I want to see my day at a glance so I know what's coming
- As a user, I want to time-block events so I manage my time intentionally
- As a user, I want to track tasks with due dates so nothing falls through the cracks

### Booking Links
- As a user, I want to share booking links so people can schedule time with me
- As a user, I want to set availability rules so I maintain boundaries
- As a user, I want to approve bookings so I have control over my time

### Subscriptions
- As a user, I want to track all subscriptions so I know what I'm paying for
- As a user, I want renewal reminders so I can cancel before auto-renew
- As a user, I want to see total monthly spend so I can budget

### Maintenance
- As a user, I want to track car maintenance so I don't miss oil changes
- As a user, I want reminders for home upkeep so small problems don't become big ones
- As a user, I want to log maintenance history so I track costs and timing

### Smart Home
- As a user, I want to control home devices from one app so I don't need multiple apps
- As a user, I want to organize devices by room so it's intuitive
- As a user, I want quick access to common controls (lights, thermostat)

## MVP Scope (4-8 Weeks)

### ✅ In Scope

**Foundation**:
- Bottom tab navigation (Today, Habits, People, Schedule, Home)
- Light/dark theme with system preference
- Local SQLite database
- Offline-capable
- Smooth animations and haptics

**Habits**:
- Create/edit/archive habits
- Daily, weekly, custom frequencies
- Log completions
- View streaks
- Skip with reason
- Basic reminders

**People**:
- Add/edit contacts
- Set touchpoint frequency
- Log interactions (call, text, meeting, other)
- Color-coded status (recent, due soon, overdue)
- Quick notes

**Schedule**:
- Calendar events
- Tasks with due dates
- Day/week/month views
- Basic CRUD operations

**Booking Links**:
- Create shareable links
- Set availability windows
- Configure buffers and limits
- Approval workflow
- Generate unique slugs

**Subscriptions**:
- List subscriptions
- Track renewal dates
- Cost tracking
- Category filtering
- Renewal reminders

**Maintenance**:
- Add assets (car, home, appliances)
- Create recurring tasks
- Time-based and usage-based reminders
- Log completions with cost

**Smart Home**:
- Mock device provider
- Room organization
- Device control UI (lights, switches, thermostats)
- State persistence
- "Demo Mode" indicator

**Today Dashboard**:
- Greeting
- Habits due today
- Upcoming events (next 3)
- People due for touchpoint
- Action items summary

### ⏭️ V2 Scope (Post-MVP)

**Integrations**:
- Real HomeKit/Google Home
- Google Calendar sync
- Apple Calendar sync
- Contact import

**Cloud Sync**:
- Supabase backend
- Auth (Apple, Google, email)
- Cross-device sync
- Conflict resolution

**Notifications**:
- Push notifications
- Background sync
- Remote reminders

**Sharing**:
- Family/household mode
- Shared calendars
- Shared maintenance assets

**Analytics**:
- Habit completion charts
- Spending breakdown
- Touchpoint heat maps

### 🚫 Non-Goals

**For MVP**:
- Social features (sharing, leaderboards, etc.)
- Payment processing
- Real-time collaboration
- Advanced automation workflows
- Voice commands
- Wearable integration
- AI/ML features
- Third-party integrations beyond listed

**Forever**:
- Becoming a social network
- Competing with specialized apps (e.g., full calendar suite)
- Monetization through ads
- Selling user data

## Data Model

### Core Entities

```typescript
User {
  id, email, name, avatar, timezone, preferences
}

Habit {
  id, title, frequency, icon, color, reminder_time
  → HabitLogs (one-to-many)
}

HabitLog {
  id, habit_id, completed_at, skipped, skip_reason, note
}

Person {
  id, name, relationship, touchpoint_frequency_days, last_contact_date, notes
  → PersonInteractions (one-to-many)
}

PersonInteraction {
  id, person_id, interaction_date, type, note
}

Event {
  id, title, start_time, end_time, type, status, recurrence
}

BookingLink {
  id, slug, title, duration, availability_windows, requires_approval
  → Bookings (one-to-many)
}

Booking {
  id, booking_link_id, invitee_name, invitee_email, requested_time, status
}

Subscription {
  id, name, amount, billing_cycle, next_renewal_date, category
}

MaintenanceAsset {
  id, name, type, make_model
  → MaintenanceTasks (one-to-many)
}

MaintenanceTask {
  id, asset_id, title, recurrence_type, interval_days, next_due_date
  → MaintenanceLogs (one-to-many)
}

SmartHomeRoom {
  id, name, icon
  → SmartHomeDevices (one-to-many)
}

SmartHomeDevice {
  id, room_id, name, type, state, manufacturer, model
}
```

## Key Screens & Navigation

### Bottom Tabs (Always Visible)

1. **Today** - Daily dashboard
2. **Habits** - Habit tracker
3. **People** - Relationship manager
4. **Schedule** - Calendar & tasks
5. **Home** - Smart home, maintenance, subscriptions

### Screen Flow

```
Today Tab
└── (no drill-down in MVP)

Habits Tab
├── Habit List
└── Habit Detail
    ├── Streak Calendar
    └── Edit Habit

People Tab
├── Person List
└── Person Detail
    ├── Interaction Timeline
    ├── Edit Person
    └── Log Interaction

Schedule Tab
├── Calendar View
│   └── Event Detail
├── Task List
│   └── Task Detail
└── Booking Links
    ├── Booking Link List
    ├── Create/Edit Link
    └── Booking Approvals

Home Tab
├── Rooms Tab
│   └── Room Detail (devices)
├── Maintenance Tab
│   └── Asset Detail (tasks)
└── Subscriptions Tab
    └── Subscription Detail
```

## Permissions & Privacy

### Permissions Required

**MVP**:
- Local notifications (optional, for reminders)
- Local authentication (biometric, optional, for security)

**V2**:
- Calendar access (for sync)
- Contacts access (for import)
- HomeKit/Google Home access (for device control)

### Privacy Principles

1. **Local-first**: All data stored on device
2. **No tracking**: No analytics without explicit consent
3. **No ads**: Never
4. **Transparent**: Clear what data is collected and why
5. **User control**: Export, delete, all data anytime
6. **Encryption**: SQLCipher for sensitive data (V2)

### Data Handling

**What stays local** (MVP):
- All user data
- Preferences
- Database

**What goes to server** (V2):
- Encrypted database backups
- Auth tokens
- Crash reports (opt-in)

**What's never collected**:
- Location tracking
- Usage analytics (unless opt-in)
- Contact lists beyond what user adds
- Screen recordings

## Notification Strategy

### Local Notifications (MVP)

**Habits**:
- Trigger: User-configured time
- Content: "Time to [habit name]"
- Action: Open app to habit

**Touchpoints**:
- Trigger: 3 days before due
- Content: "Check in with [person name]"
- Action: Open app to person

**Subscriptions**:
- Trigger: 7 days before renewal
- Content: "[Subscription] renews in 7 days ($X)"
- Action: Open app to subscription

**Maintenance**:
- Trigger: Based on advance days
- Content: "[Task] is due for [asset]"
- Action: Open app to task

**Events**:
- Trigger: 15 minutes before
- Content: "[Event] starts in 15 min"
- Action: Open app to event

**Bookings**:
- Trigger: When new booking request
- Content: "[Name] wants to book [time]"
- Action: Open app to booking approvals

### Notification Settings

**Global**:
- Enable/disable all notifications
- Quiet hours (e.g., 10pm - 7am)

**Per-module**:
- Habits: On/off
- Touchpoints: On/off
- Subscriptions: On/off
- Maintenance: On/off
- Events: On/off
- Bookings: On/off

### Push Notifications (V2)

- Booking confirmations/rejections
- Sync conflict notifications
- Shared calendar updates

## Booking Links System (Detailed)

### User Experience

**Creating a Link**:
1. Tap "New Booking Link" in Schedule tab
2. Enter:
   - Title (e.g., "Coffee Chat")
   - Duration (15, 30, 60, 90 min)
   - Availability windows (weekly schedule)
   - Buffer before/after (0, 15, 30 min)
   - Max per day (1-10 or unlimited)
   - Max per week (1-50 or unlimited)
   - Requires approval (toggle)
   - Allowed invitees (optional email list or public)
3. Get unique slug (e.g., `/book/john-coffee`)
4. Copy shareable link

**Sharing**:
- Copy link to clipboard
- Link format: `adultcrm.app/book/john-coffee` (V2)
- MVP: Just copy slug, manual sharing

**Invitee Experience** (V2):
1. Open booking link
2. See user's name and event type
3. View available slots (respecting rules)
4. Select slot
5. Enter name, email, optional message
6. Submit booking request

**Approval Workflow**:
1. User gets notification: "New booking from [name]"
2. Open Booking Approvals
3. See details: time, invitee, message
4. Approve or Reject
5. On approve: Event created in calendar, invitee notified (V2)

### Availability Algorithm

**Inputs**:
- Booking link config (windows, duration, buffers, limits)
- User's existing calendar events
- Existing bookings

**Process**:
1. Generate time slots from availability windows
2. Remove slots that conflict with existing events
3. Apply buffer times (exclude slots too close to events)
4. Apply max bookings constraints (day/week)
5. Return available slots for next 30 days

**Example**:
- Window: Mon-Fri 9am-5pm
- Duration: 30 min
- Buffer: 15 min before/after
- Max per day: 3
- Existing event: Mon 2pm-3pm
- Output: Mon slots 9am, 9:30am, 10am... (exclude 1:30-3:30pm due to buffer), max 3 total

### Edge Cases

- **No availability**: Show message "No slots available, check back later"
- **Past due**: Don't show slots in the past
- **Time zones**: Store in user's timezone, display in invitee's (V2)
- **All day events**: Block entire day
- **Recurring events**: Calculate all instances

## Design System (Detailed)

### Visual Principles

1. **Calm**: Soft colors, ample whitespace, no aggressive CTAs
2. **Clear**: Strong hierarchy, readable text, obvious actions
3. **Consistent**: Reusable patterns, predictable interactions
4. **Delightful**: Smooth animations, satisfying feedback

### Color Palette

**Light Mode**:
```
Primary (Blue):    #3B82F6
Success (Green):   #10B981
Warning (Amber):   #F59E0B
Error (Red):       #EF4444

Background:        #FFFFFF
Surface:           #F8F9FA
Surface Elevated:  #FFFFFF
Border:            #E5E7EB
Text Primary:      #111827
Text Secondary:    #6B7280
```

**Dark Mode**:
```
Primary:           #60A5FA
Success:           #34D399
Warning:           #FBBF24
Error:             #F87171

Background:        #0A0A0A
Surface:           #171717
Surface Elevated:  #262626
Border:            #404040
Text Primary:      #FAFAFA
Text Secondary:    #A3A3A3
```

### Typography

**Font**: Inter (fallback: SF Pro/Roboto)

**Scale**:
- Display: 36px, bold
- H1: 30px, bold
- H2: 24px, semibold
- H3: 20px, semibold
- Body: 15px, regular
- Caption: 13px, regular
- Small: 11px, regular

### Spacing

**Scale** (4px base):
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- 3xl: 48px

### Components

**Button**:
- Primary: Solid blue, white text
- Secondary: Blue border, blue text
- Ghost: No border, blue text
- Height: sm (32px), md (40px), lg (48px)
- Feedback: Scale to 0.95 on press

**Card**:
- Base: White/dark background, 1px border, 12px radius
- Elevated: Drop shadow, 16px radius
- Padding: 16px (base), 24px (elevated)
- Interactive: Scale to 0.98 on press

**Input**:
- Height: 44px (touch-friendly)
- Border: 1px solid, 8px radius
- Focus: Blue border, subtle glow
- Padding: 12px

**Checkbox**:
- Size: 24x24px
- Animation: Checkmark draws, circle fills
- Color: Habit color when checked
- Haptic feedback on toggle

### Animation Specs

**Durations**:
- Instant: 0ms (for reduced motion)
- Quick: 150ms (button press)
- Standard: 250ms (screen transition)
- Slow: 400ms (complex animation)

**Easings**:
- Standard: cubic-bezier(0.4, 0.0, 0.2, 1)
- Spring: Reanimated spring (damping 15, stiffness 200)

**Use Cases**:
- Button press: Scale 0.95, 150ms
- Card press: Scale 0.98, 150ms
- Checkbox: Spring animation, 400ms
- Screen enter: Slide from right, 250ms
- Modal: Fade + scale from 0.95, 250ms

### Accessibility

**WCAG AA Compliance**:
- Text contrast: 4.5:1 minimum
- Large text: 3:1 minimum
- Touch targets: 44x44px minimum
- Focus indicators: Visible
- Screen reader: All elements labeled

**Responsive**:
- Font scaling: Respect system text size
- Layout: Adapt to different screen sizes
- Orientation: Support portrait and landscape

## Success Metrics

### MVP Launch Goals

**Technical**:
- App runs on iOS 15+ and Android 10+
- Launch time < 1 second
- 60fps animations
- Zero crash rate
- Works fully offline

**User Experience**:
- Onboarding completion > 80%
- Daily active users > 50%
- Average session time > 2 minutes
- Habit completion rate > 60%

**Quality**:
- 4.5+ star rating
- < 5% negative reviews
- No P0 bugs
- < 10 P1 bugs

### V2 Goals (3 Months)

**Growth**:
- 1,000+ active users
- 70%+ week 1 retention
- 10%+ organic referrals

**Engagement**:
- 3+ sessions per week
- 5+ habits per user
- 10+ people per user
- 3+ subscriptions per user

**Technical**:
- Cloud sync adoption > 60%
- Calendar sync working for 80%
- < 1% sync conflicts

## Competitive Analysis

### Direct Competitors

**Structured**:
- Pros: Beautiful UI, habit tracking
- Cons: No relationship tracking, iOS only

**Way of Life**:
- Pros: Simple habit tracking
- Cons: Dated UI, limited features

**Charlie**:
- Pros: Relationship tracking
- Cons: Too focused on sales/networking

**Fantastical**:
- Pros: Best-in-class calendar
- Cons: No habit or relationship tracking

### Our Differentiation

1. **Unified**: All life management in one app
2. **Relationships**: Proactive touchpoint reminders
3. **Privacy**: Local-first, no tracking
4. **Calm**: Non-anxiety-inducing design
5. **Cross-platform**: iOS + Android from day 1
6. **Booking links**: Built-in scheduling tool

## Monetization (Future)

### Free Tier

- All core features
- Unlimited habits, people, events
- Local storage only
- Basic export

### Pro Tier ($4.99/month or $49.99/year)

- Cloud sync
- Cross-device sync
- Calendar integrations
- Contact import
- Advanced analytics
- Custom themes
- Priority support

### Team Tier ($9.99/month per user)

- All Pro features
- Family/household sharing
- Shared calendars
- Shared maintenance assets
- Admin controls

**Note**: MVP is free, no paywalls. Monetization is V3+.

## Launch Plan

### Pre-Launch (Week 7)

- Beta test with 10-20 users
- Gather feedback
- Fix critical bugs
- Create App Store assets
- Write marketing copy
- Set up social media

### Launch (Week 8)

- Submit to App Store and Play Store
- Product Hunt launch
- Share on Twitter, Reddit (r/productivity)
- Personal network outreach
- Press release to tech blogs

### Post-Launch (Month 1)

- Monitor crash reports
- Respond to reviews
- Fix bugs quickly
- Gather feature requests
- Plan V2 features

---

## Open Questions

1. Should booking links be tied to external calendars (Google/Apple) in V2?
2. What's the right touchpoint reminder cadence default (7, 14, or 30 days)?
3. Should we support recurring maintenance based on mileage AND time (OR logic)?
4. Dark mode default or system preference?
5. Max number of habits before suggesting archiving old ones?

## Appendix

### Technical Constraints

- iOS: 15.0+
- Android: API 29+ (Android 10+)
- SQLite: ~50MB size limit per database
- Notifications: Limited by OS (iOS: provisional, Android: channels)
- Offline: Full functionality, no degradation

### Performance Targets

- App launch: < 1s
- Screen transition: < 250ms
- Database query: < 100ms
- Animation: 60fps
- Bundle size: < 50MB

### Accessibility Targets

- WCAG AA compliance
- VoiceOver/TalkBack support
- Dynamic type support
- Reduced motion support
- High contrast mode support

---

**Document Version**: 1.0
**Last Updated**: 2026-01-13
**Status**: MVP in development
