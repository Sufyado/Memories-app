# Vistoria

Vistoria is a **Visual Memory & Knowledge Archive** — a mobile-first app for
capturing memories, procedures, and experiences as permanent, organized,
searchable visual "Stories" (think: durable Instagram/Snapchat Stories, not
ephemeral ones).

> This is a working V1 in progress. See [Project status](#project-status)
> for what's implemented so far.

## Architecture

The core data model is not "Stories" — it's a generic **Memory / Knowledge
Object**, of which the Story Viewer is just one presentation:

```
Archive → Folder (nestable) → Story → Slides
```

- **Folder** — organizes Stories, can nest inside another Folder.
- **Story** — a permanent visual record (title, description, cover, tags,
  visibility, version, status).
- **Slide** — an ordered unit inside a Story. Holds optional media (image or
  video) plus content blocks (heading, body, caption, checklist, warning,
  quote, link, file).
- **Media** — binary files live in Supabase Storage; the database only holds
  metadata (path, mime type, dimensions, duration, thumbnail).

This separation is deliberate: today the app renders Stories as a Story
Viewer (Instagram/Snapchat-style, full-bleed slides) and a Library
grid/list. The same records are designed to later support a Document view,
a Timeline view, semantic search, and AI features without a data model
change — see `src/types/domain.ts` for the shared shape.

## Tech stack

- **App**: [Expo](https://expo.dev) (React Native + React Native Web),
  TypeScript (strict mode), [Expo Router](https://docs.expo.dev/router/introduction/)
  for file-based navigation — the same routes power iOS, Android, and Web.
- **Backend**: [Supabase](https://supabase.com) — Postgres (with Row Level
  Security), Auth, and Storage for media.
- **Search**: Postgres full-text search to start; the schema is designed so
  semantic/AI search can be added later without a redesign.

## Project structure

```
src/
  app/                 Expo Router routes (one file per screen/tab)
  components/          Reusable UI (themed-text, themed-view, app-tabs, ui/*)
  constants/           Design tokens: colors, spacing, typography
  hooks/                useTheme, useColorScheme
  lib/
    i18n/               Arabic/English translations + RTL-aware provider
  types/
    domain.ts           Shared domain types (Folder, Story, Slide, Media, …)
assets/                 Icons, splash, tab bar assets
```

## Setup

### Prerequisites

- Node.js 20+
- npm
- For native builds: Xcode (iOS) and/or Android Studio (Android), or use
  [EAS Build](https://docs.expo.dev/build/introduction/) instead of local
  toolchains.

### Install

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in your Supabase project's values:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Only variables prefixed `EXPO_PUBLIC_` are bundled into the app — never put
a `service_role` key in `.env`. (Supabase wiring lands in Phase 2; the
placeholders are here so the convention is established from the start.)

### Run

```bash
npm run android   # Android emulator/device
npm run ios       # iOS simulator (macOS only)
npm run web       # Web (also powers the public Story share-link viewer)
```

### Lint & typecheck

```bash
npm run lint
npx tsc --noEmit
```

## Project status

Development proceeds in phases (see the project plan). Phase 1 —
**project setup, navigation, and design system** — is complete:

- Expo + TypeScript (strict) + Expo Router, running on iOS/Android/Web.
- Bottom/top tab navigation: Home, Library, Search, Create, Profile.
- Design tokens (colors for light/dark, spacing, typography) and reusable
  UI primitives (`Screen`, `Button`, `EmptyState`).
- Arabic/English localization with full RTL support (`src/lib/i18n`),
  including a working language switch on the Profile screen.
- Domain types mirroring the planned database schema.

Not yet implemented: authentication, database, media upload, the Story
Viewer/Editor, search, tags, comments, sharing, and export. Screens for
those areas currently show placeholder empty states.

## Database schema (planned)

Tables: `users`, `folders`, `stories`, `story_slides`, `media`, `tags`,
`story_tags`, `comments`, `story_members`, `share_links`, `story_versions`,
`activity_log`. See `src/types/domain.ts` for the TypeScript shape each
table is expected to mirror; the actual Supabase migrations and Row Level
Security policies land in Phase 2.
