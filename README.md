# sevvr

A competitive social wellness app where users compete to stay off their phones. Built with Expo, React Native, and Supabase.

## Live Demo

The app is deployed and available at **https://sevvr.netlify.app/**

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)
- **For iOS Simulator (Mac only):** [Xcode](https://developer.apple.com/xcode/) installed from the Mac App Store
- **For on-device testing:** [Expo Go](https://expo.dev/go) installed on your phone

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

You can find these values in your [Supabase project dashboard](https://supabase.com/dashboard) under **Settings > API**.

### 3. Start the app

```bash
npx expo start
```

This launches the Expo dev server. From there you have two options:

#### Option A: iOS Simulator (Mac only)

Press **i** in the terminal to open the app in the iOS Simulator. This requires Xcode to be installed.

```bash
# Or start directly in the simulator:
npx expo start --ios
```

#### Option B: Your phone with Expo Go

1. Install **Expo Go** on your [iOS](https://apps.apple.com/app/expo-go/id982107779) or [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) device.
2. Make sure your phone and computer are on the same Wi-Fi network.
3. Scan the QR code shown in the terminal with your phone's camera (iOS) or the Expo Go app (Android).

## Project Structure

```
app/
  (auth)/       # Login, signup, forgot password screens
  (tabs)/       # Main app tabs: Sever, Stats, Social, Profile
components/     # Reusable UI components
lib/            # Service layer (Supabase calls, utilities)
providers/      # Auth context provider
constants/      # Theme, colors, typography
types/          # TypeScript type definitions
supabase/       # Database migrations
technical-plan/ # Implementation specs and design docs
```

## Available Scripts

| Command                | Description                     |
| ---------------------- | ------------------------------- |
| `npx expo start`       | Start the dev server            |
| `npx expo start --ios` | Start directly on iOS Simulator |
| `npx expo start --web` | Start the web version           |
| `npm run lint`         | Run ESLint                      |
