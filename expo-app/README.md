# PlanForge — Expo (React Native) app

Mobile companion to the PlanForge web app and API. Read-focused for v1: list workspaces → projects → tasks. Future versions add offline cache and task editing.

## Run

```bash
pnpm install
pnpm --filter @planforge/expo-app start
```

Make sure `apiBaseUrl` in `app.json` (or `EXPO_PUBLIC_API_URL`) points to your running backend.

For physical devices, use your machine's LAN IP (not `localhost`).
