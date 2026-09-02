# Vistoria

Visual Memory & Knowledge Archive — a mobile (and web-viewable) app for capturing
memories, know-how, and projects as permanent, organized, searchable **Stories**:
short visual sequences you swipe/tap through like Instagram/Snapchat Stories,
except nothing expires.

```
Archive → Folder → Story → Slides
```

A Story isn't locked to one media type per slide — a single slide can carry a
heading, an image or video, body text, a checklist, a warning, a quote, a link,
and a file attachment, in any combination.

## Architecture

**Core principle:** the data model is a generic "Memory / Knowledge Object", not
a Stories-only schema. `story_slides.blocks` is an ordered JSON array of typed
content blocks (`heading | body | caption | media | checklist | warning | quote
| link | file`); the Story Viewer is one way to render that data, and the schema
is intentionally not coupled to it — a Document/Timeline/Grid view could read
the same rows later without a migration.

```
app/                      Expo Router file-based routes (screens only)
  (auth)/                 sign-in, sign-up — shown when signed out
  (app)/                  tab bar: Home, Library, Search, Create, Profile
  folder/[id].tsx          folder detail (subfolders + stories)
  tag/[id].tsx             stories carrying one tag
  story/new.tsx            new story: title + folder
  story/[id]/index.tsx      Story Viewer (the core experience)
  story/[id]/edit.tsx       Story Editor (slides, reorder, media)
  story/[id]/share.tsx      visibility, share link, team roster, export
  s/[slug].tsx              public Web Viewer — no auth required

src/
  design-system/          tokens + reusable UI primitives (Text, Button, Card, …)
  lib/                    Supabase client, i18n, React Query client, language provider
  features/                one folder per domain area, each with:
    <feature>/api.ts        Supabase queries/mutations (thin, typed)
    <feature>/hooks.ts       React Query hooks wrapping api.ts
    <feature>/components/    feature-specific UI
  types/                   database.ts (hand-written Supabase types) + domain.ts
  store/                   zustand (client-only UI state: language, library layout)

supabase/migrations/       Postgres schema, RLS policies, functions, storage — see below
```

Every screen talks to Supabase through a `hooks.ts` in the relevant `features/*`
folder — no direct `supabase.from(...)` calls in screen components. Row Level
Security (not client-side filtering) is what actually enforces who can see what;
the client just asks for what it wants and Postgres decides.

## Tech stack

- **Expo (React Native) + TypeScript strict**, file-based routing via `expo-router`.
  The same app builds to a website (`expo export --platform web`), which is how
  the public Story links work in a browser with no app install.
- **Supabase**: Postgres (schema + RLS), Storage (media), Auth (email/password).
- **React Query** for all server state; **zustand** for the couple of pieces of
  client-only UI state (language, Library grid/list).
- **react-i18next** for English/Arabic, with `I18nManager` RTL switching.
- **expo-video**, **expo-image**, **expo-image-picker**, **expo-file-system**
  (direct-to-Storage upload with progress via `UploadTask`), **expo-image-manipulator**
  / **expo-video-thumbnails** (thumbnails), **react-native-draggable-flatlist**
  (slide reorder), **jszip** + **expo-print** (ZIP/PDF export).

## Setup

```bash
npm install
cp .env.example .env   # fill in your Supabase project's URL + anon key
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon/public key (safe to ship — RLS is what actually protects data) |
| `EXPO_PUBLIC_WEB_BASE_URL` | no | Where `expo export --platform web` is hosted, e.g. `https://vistoria.example.com`. Used to build `https://.../s/<slug>` share links. Without it, share links fall back to the `vistoria://s/<slug>` deep link, which only works app-to-app. |

`EXPO_PUBLIC_*` variables are inlined into the JS bundle at build time by Expo —
don't put anything here that isn't safe to ship to a client.

### Supabase configuration

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations in order (Supabase CLI: `supabase link` then
   `supabase db push`, or paste each file into the SQL editor in order):
   - `0001_init_schema.sql` — tables, generated `search_vector` columns, `updated_at` triggers
   - `0002_rls_policies.sql` — Row Level Security for every table
   - `0003_storage.sql` — the `story-media` Storage bucket + its own RLS
   - `0004_functions.sql` — `search_stories()`, `bump_story_version()`, activity-log triggers, auto owner-membership
   - `0005_reorder_slides.sql` — `reorder_slides()` (atomic drag-to-reorder)
   - `0006_public_access_and_profile_email.sql` — lets a signed-in *non-member* view a public share link too (not just anonymous visitors), and adds `profiles.email` so team invites can look someone up by email
3. Copy **Settings → API → Project URL** and **anon public key** into `.env`.
4. Email/password auth is enabled by default on a new Supabase project. To add
   Google/Apple later: enable the provider under **Authentication → Providers**
   and extend `src/features/auth/AuthProvider.tsx` — the schema and RLS need no
   changes (`profiles` already mirrors whichever `auth.users` row exists).

### Database schema

| Table | Purpose |
|---|---|
| `profiles` | Mirrors `auth.users` (name, avatar, email) for joins from RLS'd tables |
| `folders` | Self-referencing `parent_folder_id` — nesting is supported by the schema even though V1's UI is flat |
| `stories` | Title/description/cover/status/visibility/version/slug; `search_vector` generated column |
| `story_slides` | Ordered `blocks` jsonb (the real content) + denormalized `heading`/`body`/`caption`/`event_date` for fast search and timeline use |
| `media` | Storage metadata only — the bytes live in Storage, never in Postgres |
| `tags`, `story_tags` | Per-owner tag vocabulary, many-to-many to stories |
| `comments` | Story-level in V1; `slide_id` and `video_timestamp_ms` columns are already there for slide/timestamp-level comments later |
| `story_members` | Per-story `owner \| editor \| viewer` roles (the owner is auto-enrolled here by trigger) |
| `share_links` | Public link slug + active flag — disabling a link doesn't delete it |
| `story_versions` | Snapshot written by `bump_story_version()` on every editor "Done" |
| `activity_log` | Best-effort event trail (`story_created`, `slide_added`, `story_updated`, `story_shared`) — no dedicated UI in V1, DB support only |

**Search:** `search_stories(p_query)` is a single Postgres function (SQL, `SECURITY
INVOKER`) that unions matches from story title/description, slide heading/body/
caption, tag names, folder names, and comment text, ranked by `ts_rank`. It's
called through one RPC from the client, so a future semantic/AI search can
replace the function body without an app change.

**Security:** every table has RLS enabled. Access resolves through two
`SECURITY DEFINER` helper functions — `is_story_member(story_id, min_role)` and
`is_story_public(story_id)` — so policies stay simple and consistent instead of
repeating the same subquery everywhere. Anonymous (and signed-in non-member)
reads are gated on `visibility = 'public' AND an active share_links row`, never
on knowing/guessing a UUID.

## Running the app

```bash
npm run android    # Android emulator or a device with Expo Go / a dev build
npm run ios         # iOS simulator (macOS only) or a device with Expo Go
npm run web          # local web preview at http://localhost:8081
```

The first run prompts Expo CLI to install the Android/iOS tooling it needs if
it isn't already on your machine. On a physical device without a dev build,
scan the QR code with **Expo Go**.

### Web Viewer

`npm run web` is fine for local development. For the public `/s/<slug>` links
to work from any browser without installing anything:

```bash
npx expo export --platform web   # outputs static files to ./dist
```

Deploy `./dist` to any static host (Vercel, Netlify, Cloudflare Pages, S3 + a
CDN, …) and point `EXPO_PUBLIC_WEB_BASE_URL` at that host before building. The
web build is the *same* Expo Router app — `/s/[slug]` behaves identically to
the in-app viewer, just without the edit/team controls and without requiring
a session (RLS grants it access directly).

### Production builds

This project uses the standard Expo/EAS flow — no custom native config beyond
what's declared in `app.json` (permissions strings, the `story-media` bucket
plugin config for `expo-image-picker`/`expo-video`).

```bash
npm install -g eas-cli
eas login
eas build --platform android   # or ios, or --platform all
```

See [Expo's build docs](https://docs.expo.dev/build/setup/) for signing/credentials
setup on each platform. `eas build` reads the same `.env` (via `eas.json`
`env` or EAS Secrets) — make sure your production Supabase project's URL/key
are configured there, not just locally.

## Demo content

Sign up, open **Profile**, and tap **Load demo content**. It creates the two
example archives from the product spec — a propagation experiment (professional
knowledge, 7 slides) and a personal memory (5 slides) — through the app's own
create/upload code paths, as your signed-in user, including a best-effort
placeholder photo per slide (skipped gracefully if the network fetch fails).

## What's deliberately not in V1

Per the product spec: no likes/followers/feed, no chat, no Stories expiration,
no ads/payments/marketplace, no AI (the search RPC and the `blocks` schema are
shaped so semantic search / auto-tagging / OCR can be added later without a
redesign), no complex notifications or analytics.

## Known limitations of this build

- The Story Editor's block editor is a fixed-layout form (heading → media →
  body → caption → checklist/quote/warning/link), one media slot per slide —
  not a fully freeform, reorderable block list. The data model supports the
  richer version; the V1 editor UI trades that flexibility for something
  simple to build correctly.
- Slide-level and video-timestamp comments are modeled in the schema
  (`comments.slide_id`, `comments.video_timestamp_ms`) but the UI only has
  story-level comments, per V1 scope.
- This was built in a container with no Android/iOS simulator and no live
  Supabase project — every phase was verified with `tsc --noEmit` and
  `expo export --platform web`, but nothing has been click-tested on a real
  device or against real data yet. Run through `docs/TESTING.md` after setup.
