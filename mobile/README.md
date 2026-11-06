# MiniPOS Mobile

Native Android/iOS client for MiniPOS. This directory is an Expo/React Native
application; it is not a web or PWA build.

## Local setup

1. Copy `env.example` to `.env` and provide the Supabase URL and publishable
   key. Never place a service-role key in this app.
2. Run `npm install` from `mobile/`.
3. Run `npm run typecheck` and `npm test`.
4. Use `npm start` for Expo development, or `npm run export` for a static
   Android bundle check when a native device/emulator is unavailable.

The app uses the same Supabase Auth, `profiles` role mapping, product tables,
and transactional RPCs as the desktop client. It does not read or import the
desktop SQLite database.
