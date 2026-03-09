# SkillBridge Desktop

Electron + React desktop app for managing SkillBridge skills.

## Setup

```bash
cd desktop
npm install
```

## Development

```bash
npm run dev
```

This starts Vite dev server and Electron concurrently with hot reload.

## Build

```bash
npm run build
```

Packages the app using electron-builder. Output in `release/`.

## Architecture

- **electron/main.js** — Main process, imports `../lib/` modules, exposes IPC handlers
- **electron/preload.js** — Context bridge exposing `window.api`
- **src/** — React renderer (Vite + React)
- All skill/config/sync logic reuses the parent project's `lib/` modules
