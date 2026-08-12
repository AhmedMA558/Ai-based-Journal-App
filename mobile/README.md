# mobile (Mindora)

**Mindora** - "Your thoughts. Your story. Your AI companion." - is the native Android/iOS client for the AI Journaling Platform, built with Expo/React Native. It is v2 of the platform: a second, independent frontend that talks to the same `gateway-service` (port 8080) the web app (`frontend/`) uses, not a replacement for it.

This phase (Phase 11) ships one complete vertical slice - auth through core journal CRUD - built and demoable in two passes:

- **Pass A (default today)**: runs entirely against a local mock service layer (`src/mocks/`) with realistic canned data. No backend needs to be running.
- **Pass B**: flips one env var to swap in the real axios-backed services (`src/services/`). Screens are identical between the two passes - only `src/services/index.ts` changes which module it re-exports.

Calendar, Search, AI Chat, and Settings/2FA management were added after the initial slice. Analytics, Achievements, Command Palette, Notifications, voice dictation, and confetti are still intentionally not in this app - see the Phase 11 plan for the full deferral list.

## Tech stack

- **Expo** (managed workflow, SDK 54 - runs directly in the published Expo Go app, no custom dev client needed; every native module used here - `expo-secure-store`, `react-native-svg`, `expo-linear-gradient`, etc. - is one Expo Go already bundles for this SDK version)
- **React Navigation** (`native-stack` + `bottom-tabs`) - `AuthStack` (Login/Register/MfaChallenge) and `MainTabs` (Dashboard/Journals/Calendar/Search/Chat/Settings) with a modal `JournalEditor` screen
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
                   Calendar, Search, Chat, Settings
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
