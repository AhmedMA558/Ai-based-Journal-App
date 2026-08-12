# mobile (Mindora)

**Mindora** - "Your thoughts. Your story. Your AI companion." - is the native Android/iOS client for the AI Journaling Platform, built with Expo/React Native. It is v2 of the platform: a second, independent frontend that talks to the same `gateway-service` (port 8080) the web app (`frontend/`) uses, not a replacement for it.

This phase (Phase 11) ships one complete vertical slice - auth through core journal CRUD - built and demoable in two passes:

- **Pass A (default today)**: runs entirely against a local mock service layer (`src/mocks/`) with realistic canned data. No backend needs to be running.
- **Pass B**: flips one env var to swap in the real axios-backed services (`src/services/`). Screens are identical between the two passes - only `src/services/index.ts` changes which module it re-exports.

Calendar, Search, AI Chat, Settings/2FA management, Analytics, Achievements, and Notifications were added after the initial slice. Command Palette, voice dictation, and confetti are still intentionally not in this app - see the Phase 11 plan for the full deferral list.

Notifications (reached from a bell-icon button on the Dashboard header, same modal pattern as Achievements) keeps the same static/decorative three-item list as `frontend/src/components/NotificationsDrawer.tsx` - there's no notifications backend anywhere in this platform, on either client. One thing it doesn't copy: the web version's "Mark all as read" is a complete no-op (fires a toast, touches no state at all); this one actually tracks read/unread locally and dims read items, since a fake backend and a fake button press are different kinds of dishonest.

Achievements is reached from an award-icon button on the Dashboard header (a modal-presented screen, like `JournalEditor`) rather than an 8th bottom tab - matches how the web app treats it (a modal triggered from the sidebar, not a permanent nav destination) and avoids crowding the tab bar further. Its four badges are computed from real journal data (`journalService`/`journalStats.calculateStreak`/distinct mood count) and real AI-chat usage this session (`lib/achievementTracking.ts`) - **not** ported from the web version's logic, because the web `AchievementsModal.tsx` has a real bug: `App.jsx` never passes it a `journalCount` prop, so it silently falls back to a hardcoded default of 5, meaning 3 of its 4 badges always show "unlocked" regardless of the user's actual progress. Also fixes a second logic bug in the same file while at it: "Emotional Master" is described as "5 distinct mood categories" but the web code checks `journalCount >= 5` (total entries, not distinct moods) - this port checks the actual distinct-mood count.

Analytics deliberately doesn't pull in a charting library - the web app's recharts-based radar/area charts are replaced with plain `View`-based bar visualizations (mood-frequency bars, a 7-day entry-count mini-chart). Given how much friction this phase already hit from native-module/Expo-SDK version mismatches, adding another native-adjacent dependency for one screen wasn't worth the risk; the metric cards and mood-breakdown bars carry the same information as the radar wheel/positivity-stream charts, just not as a literal radar/line chart.

## Tech stack

- **Expo** (managed workflow, SDK 54 - runs directly in the published Expo Go app, no custom dev client needed; every native module used here - `expo-secure-store`, `react-native-svg`, `expo-linear-gradient`, etc. - is one Expo Go already bundles for this SDK version)
- **React Navigation** (`native-stack` + `bottom-tabs`) - `AuthStack` (Login/Register/MfaChallenge) and `MainTabs` (Dashboard/Journals/Calendar/Search/Chat/Analytics/Settings, icon-only past 6 tabs), plus modal `JournalEditor`/`Achievements`/`Notifications` screens on the stack above the tabs
- **expo-clipboard** for the AI Chat "copy message" button
- **react-native-qrcode-svg** for the 2FA setup QR code (pure JS, built on the already-installed `react-native-svg`)
- **NativeWind v4** (Tailwind classNames on native components) - theme tokens in `tailwind.config.js` are ported from `frontend/src/index.css`'s `:root` block, same dark glassmorphism palette as the web app
- **axios**, with the same request/response-interceptor pattern as `frontend/src/services/api.js` (attach bearer token, silent refresh-and-retry-once on 401)
- **expo-secure-store** (Keystore-backed, for the two JWTs) + **@react-native-async-storage/async-storage** (non-sensitive session fields) - see `src/services/session.ts`
- **lucide-react-native** for icons (same component names as the web app's `lucide-react`)
- **Jest** + **jest-expo** + **@testing-library/react-native** for tests

## Scripts

```bash
npm install
npm start                 # expo start --dev-client
npm run android            # expo start --android
npm run ios                 # expo start --ios
npm test                     # jest
npm run typecheck             # tsc --noEmit
```

## Environment

Two env vars (read via `src/config/env.ts`, `EXPO_PUBLIC_*` prefix required by Expo to expose them client-side):

- `EXPO_PUBLIC_USE_MOCKS` - `"true"` (default) for Pass A, `"false"` for Pass B.
- `EXPO_PUBLIC_API_BASE_URL` - the gateway's reachable address for Pass B (e.g. your machine's LAN IP on port 8080 - `localhost` does not resolve to your dev machine from a physical device or most emulators).

## Structure

```
src/
  screens/       Login, Register, MfaChallenge, Dashboard, JournalList, JournalEditor,
                   Calendar, Search, Chat, Analytics, Settings, Achievements, Notifications
  navigation/     RootNavigator.tsx (AuthStack / MainTabs / modal JournalEditor), types.ts
  context/         AuthContext.tsx - wraps hooks/useAuth.ts's 10s session-poll (RN port of
                   App.jsx's session-expiry watcher) so screens can reach login()/logout()
  services/        real axios-backed authService/journalService/aiService/searchService/
                   userService/api/session, plus index.ts - the one file that switches
                   between real and mocks/
  mocks/           fixtures.ts (seed users + journals), mock{Auth,Journal,Ai,Search,User}
                   Service.ts - same function signatures as services/*.ts, used for Pass A
  components/      MoodWheel.tsx, ErrorBanner.tsx, ui/ (GlassPanel, GlassInput,
                   PrimaryButton, SkeletonBlock, FadeInView, EmptyState)
  lib/             moods.ts, journalStats.ts, utils.ts (cn()) - ported near-verbatim
                   from frontend/src/lib/, pure TypeScript with no DOM dependency
  types/           shared Journal/AuthResult/CurrentUser/ProfileData/MfaSetupData types
                   used by both real and mock services
```

## Testing native-storage-backed modules

`authService.ts`/`session.ts` import `expo-secure-store` and `@react-native-async-storage/async-storage`. `jest-expo` mocks `expo-*` packages automatically, but AsyncStorage (a community package, not `expo-*`-namespaced) needs its own mock wired explicitly via `moduleNameMapper` in `package.json`'s `jest` config, pointing at the package's own `jest/async-storage-mock` - otherwise any test that transitively imports `session.ts` fails at import time with `NativeModule: AsyncStorage is null`.

## Verification

1. **Pass A (mocks, no backend needed)**: `npx expo start --dev-client`, open on a device/emulator via the Expo Dev Client. Log in as `demo` / `password123` (no MFA) or `mfa_demo` / `password123` (MFA path, code `123456`). Tap through Dashboard, Journals, create/edit/delete an entry, Calendar, Search, AI Chat, and Settings (edit profile, change password, walk the full 2FA setup/enable/disable flow - confirmation code is always `123456` in Pass A), log out.
2. `npm run typecheck` and `npm test` (Jest - covers the pure logic in `journalStats.ts` and every mock service's CRUD/auth/search/MFA behavior).
3. **Pass B (real backend)**: set `EXPO_PUBLIC_USE_MOCKS=false` and `EXPO_PUBLIC_API_BASE_URL` to your gateway's reachable address, repeat the same tap-through against live data.

## Production build (EAS)

`eas.json` defines three build profiles (`development`, `preview`, `production`) - this repo ships the config, but actually running a build requires an Expo account and can't be done by an agent on your behalf (account login/creation and any cloud-billable action are both outside what should happen without you directly in the loop). To produce a real installable build yourself:

```bash
npm install -g eas-cli        # or just use `npx eas-cli ...` for each command below
eas login                      # your own Expo account
eas build:configure            # links this project to your account, sets the EAS project ID
eas build --platform android --profile preview      # internal-distribution APK, good for sharing/testing
eas build --platform android --profile production    # app-bundle (.aab), what the Play Store wants
```

Before a real Play Store / App Store submission, two things in this repo still need real attention, not more agent work:

- **`preview`/`production` profiles' `EXPO_PUBLIC_API_BASE_URL`** in `eas.json` is a placeholder (`https://REPLACE-WITH-YOUR-DEPLOYED-GATEWAY-URL`) - the backend needs to be deployed somewhere publicly reachable first (the k8s manifests in `../k8s/` are the closest existing path to that), since a build artifact can't reach `localhost`.
- **App icon / splash / adaptive icon** (`assets/icon.png`, `assets/splash-icon.png`, `assets/android-icon-*.png`) are still Expo's default template graphics from `create-expo-app` (the generic blue chevron logo, not anything Mindora-branded) - nobody has actually designed real app icon/splash art for this app yet. `app.json` already points at the right files and the adaptive-icon background color matches the app's own dark theme (`#090d16`), so swapping in real artwork later is a drop-in asset replacement, not a config change.

