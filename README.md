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
  app/
    (tabs)/              Home, Library, Search, Create, Profile
    auth/                Sign in / sign up (modal routes)
  components/            Reusable UI (themed-text, themed-view, app-tabs, ui/*)
  constants/              Design tokens: colors, spacing, typography
  hooks/                  useTheme, useColorScheme
  lib/
    i18n/                 Arabic/English translations + RTL-aware provider
    supabase/client.ts     Supabase client (reads EXPO_PUBLIC_ env vars)
    auth/auth-provider.tsx Session state + sign in/up/out
  types/
    domain.ts             Shared domain types (Folder, Story, Slide, Media, …)
assets/                   Icons, splash, tab bar assets
supabase/
  migrations/              Schema + Row Level Security, in apply order
  tests/                   Local-only RLS test harness (see below)
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

### Supabase project setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the files in `supabase/migrations/` **in order**
   (`20260902010000_schema.sql` then `20260902010100_rls.sql`) — or, if you
   use the Supabase CLI and have it linked to your project, `supabase db push`.
3. In Project Settings → API, copy the Project URL and the `anon` public key.
4. Copy `.env.example` to `.env` and fill them in:

   ```bash
   cp .env.example .env
   ```

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   Only variables prefixed `EXPO_PUBLIC_` are bundled into the app — never
   put a `service_role` key in `.env`.
5. In Authentication → Providers, Email sign-up is enabled by default. For
   local development you may want to turn off "Confirm email" so
   `npx expo start` sign-ups work immediately.

Without a configured project the app still runs — the Profile → Sign in /
Sign up screens show a "Supabase not configured" notice instead of a
confusing network error, and every other screen works with local UI state.

### Testing the database locally (optional)

`supabase/tests/run.sh` applies the real migrations plus a minimal stub of
Supabase's `auth` schema to a throwaway **local** Postgres database, then
runs a set of RLS scenario checks (private stories are hidden from other
users, viewers can read but not edit, an active share link grants
anonymous read access and deactivating it revokes it again, …). It never
touches your actual Supabase project — useful after changing anything
under `supabase/migrations/`.

```bash
# needs a local `postgres` server (e.g. `apt install postgresql`)
./supabase/tests/run.sh
```

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

Development proceeds in phases (see the project plan).

**Phase 1 — project setup, navigation, and design system** ✅

- Expo + TypeScript (strict) + Expo Router, running on iOS/Android/Web.
- Bottom/top tab navigation: Home, Library, Search, Create, Profile.
- Design tokens (colors for light/dark, spacing, typography) and reusable
  UI primitives (`Screen`, `Button`, `EmptyState`, `Input`).
- Arabic/English localization with full RTL support (`src/lib/i18n`),
  including a working language switch on the Profile screen.
- Domain types mirroring the database schema.

**Phase 2 — Supabase: Auth, Database, RLS** ✅

- Full Postgres schema (`supabase/migrations/20260902010000_schema.sql`):
  `profiles`, `folders`, `stories`, `story_slides`, `media`, `tags`,
  `story_tags`, `comments`, `story_members`, `share_links`,
  `story_versions`, `activity_log` — with indexes, a Postgres full-text
  search column on stories/slides, and a trigger that creates a `profiles`
  row on sign-up.
- Row Level Security for every table
  (`supabase/migrations/20260902010100_rls.sql`), matching the
  owner/editor/viewer + share-link model in [Security](#security) below.
  Verified against a real local Postgres instance — see
  [Testing the database locally](#testing-the-database-locally-optional).
- Email/password auth (`src/lib/auth/auth-provider.tsx`), session
  persisted via `AsyncStorage`, wired into the Profile screen's
  sign in/out and new Sign in / Sign up screens.

Not yet implemented: folders/stories CRUD, media upload, the Story
Viewer/Editor, search, tags, comments, team sharing, and export. Screens
for those areas currently show placeholder empty states.

## Database schema

Tables: `profiles` (extends Supabase's built-in `auth.users`), `folders`,
`stories`, `story_slides`, `media`, `tags`, `story_tags`, `comments`,
`story_members`, `share_links`, `story_versions`, `activity_log`. See
`src/types/domain.ts` for the TypeScript shape the app expects, and
`supabase/migrations/` for the source of truth.

## Security

Row Level Security (`supabase/migrations/20260902010100_rls.sql`) enforces:

- **Owner** (a story's `created_by`, or a `story_members` row with
  `role = 'owner'`) — full read/write/delete, manages membership and share
  links.
- **Editor** (`story_members.role = 'editor'`) — read and edit content
  (slides, media, tags, share links), cannot delete the story or manage
  members.
- **Viewer** (`story_members.role = 'viewer'`) — read and comment only.
- **Share link** — an active row in `share_links` makes a story (and its
  slides, media, tags, comments) readable to anyone, authenticated or not.
  Deactivating the link revokes that access immediately. Nothing depends
  on an ID being hard to guess.

Folders are owner-only in V1 (not shared via `story_members`), matching
the spec: only Stories are explicitly shareable.
