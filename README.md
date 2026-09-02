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
    (tabs)/                Home, Library, Search, Create, Profile
    auth/                  Sign in / sign up (modal routes)
    create/                 New Folder / New Story (modal routes)
    library/[folderId].tsx  Drill into a folder
    story/[id]/
      index.tsx              Editor (title/description, slides, tags, team, delete)
      view.tsx                Viewer (full-screen slide playback)
      comments.tsx             Story-level comments
    s/[slug].tsx             Public Web Viewer (no account needed)
  components/
    library/                 Folder/story cards, grid-list toggle
    story/                   StoryPlayer (shared by both viewers), slide row,
                              add-slide buttons, progress bar, tag chips,
                              share sheet, team section
    ui/                      Screen, Button, Input, EmptyState, SignInPrompt, …
  constants/                Design tokens: colors, spacing, typography
  hooks/                    useTheme, useColorScheme
  lib/
    i18n/                   Arabic/English translations + RTL-aware provider
    supabase/                Client + hand-written Database types
    auth/auth-provider.tsx   Session state + sign in/up/out
    data/                    Supabase queries (folders/stories/slides/media/
                              tags/comments/profiles/search/share-links/
                              story-members)
    media/                   Camera/gallery picking, video thumbnails
  types/
    domain.ts               Shared domain types (Folder, Story, Slide, Media, …)
assets/                     Icons, splash, tab bar assets
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
2. In the SQL Editor, run the files in `supabase/migrations/` **in
   filename order** (schema, then RLS, then storage) — or, if you use the
   Supabase CLI and have it linked to your project, `supabase db push`.
   This also creates the private `media` Storage bucket.
3. In Project Settings → API, copy the Project URL and the `anon` public key.
4. Copy `.env.example` to `.env` and fill them in:

   ```bash
   cp .env.example .env
   ```

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_WEB_BASE_URL=https://your-deployed-web-url
   ```

   Only variables prefixed `EXPO_PUBLIC_` are bundled into the app — never
   put a `service_role` key in `.env`. `EXPO_PUBLIC_WEB_BASE_URL` is only
   used to *display/copy* a full `/s/<slug>` share link on native (the web
   build reads `window.location.origin` instead) — it doesn't need to be
   set for local development, only once you've actually deployed the web
   build somewhere.
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

**Phase 3 — Folders, Stories, Library** ✅

- Data layer (`src/lib/data/`) talking to Supabase directly (typed via
  `src/lib/supabase/database.types.ts`), scoped to the signed-in user.
- Home: recent stories + top-level collections. Library: Grid/List
  toggle, folders with story counts, drilling into a folder
  (`/library/[folderId]`) with back navigation.
- Create → New Folder / New Story (`/create/new-folder`,
  `/create/new-story`) actually insert rows now.
- A minimal story detail screen (`/story/[id]`): edit title/description,
  delete (with confirmation), a "no slides yet" placeholder for Phase 4.
- Every screen that needs an account shows a sign-in prompt instead of an
  empty list when signed out, and every data fetch has a real error +
  retry state — no infinite spinners on a failed request.

**Phase 4 — Slides and media upload** ✅

- Supabase Storage: a private `media` bucket with RLS on
  `storage.objects` (`supabase/migrations/20260902020000_storage.sql`),
  keyed by `stories/<story_id>/<file>` so access can be checked from the
  path itself — no chicken-and-egg problem with the `media` metadata row
  not existing yet at upload time. Reading anything back uses a signed URL
  (`getSignedUrl`), since the bucket isn't public.
- Story detail now has a Slides section: add a slide from the camera,
  video capture, the photo/video library, or as text-only
  (`AddSlideButtons`), with an inline editable caption per slide
  (`SlideRow`), reorder via up/down, and delete (which also removes the
  slide's media from Storage, not just the database row).
- Video slides get a generated JPEG thumbnail (`expo-video-thumbnails`,
  native-only — skipped on web); images use the image itself.
- `supabase/tests/`: extended with a `storage` schema stub
  (`storage.foldername()` included) and scenario checks for the new
  bucket policies — owner can upload/delete, a viewer can read but not
  upload or delete, and access follows the same share-link rules as the
  story itself.

**Phase 5 — Story Viewer** ✅

- `/story/[id]/view`: the core experience — full-screen, edge-to-edge,
  Instagram/Snapchat-style playback of a story's slides. Segmented
  progress bar at the top (one segment per slide, filling as it plays);
  tap the left/right thirds of the screen to go to the previous/next
  slide, tap the center to pause/resume; images auto-advance after 5s,
  videos auto-advance when they finish (`playToEnd`) and drive the
  progress bar from actual playback position (`expo-video`).
  Always-dark chrome regardless of the device's light/dark theme setting
  (fixed white-on-black, since it's an immersive overlay, not a themed
  screen). An info panel shows the story's description; Edit (owner only)
  jumps to the editor; Comment/Share are wired up for real as of
  Phase 6/7.
- Tapping a story from Home/Library now opens the Viewer (not the
  editor) — matching the spec's "open the memory and scroll through it"
  principle. The route moved to `/story/[id]/index.tsx` so `/story/[id]`
  (editor) and `/story/[id]/view` (viewer) can coexist; the editor is
  reached via the Viewer's Edit button, or automatically right after
  creating a new story.
- Editor: added slide **duplicate** (appends a copy of the same
  media/caption) alongside the existing add/edit-caption/reorder/delete,
  plus a preview button that opens the Viewer.

**Phase 6 — Search, Tags, Comments** ✅

- Full-text search (`supabase/migrations/20260902030000_search.sql`,
  `search_stories()`): matches story title/description, slide text, tag
  names, and folder names. Runs `SECURITY INVOKER` (the default), so RLS
  applies per row — a title/tag match never surfaces a story the caller
  has no access to, verified in `supabase/tests/scenarios.sql` with a
  third test user who has zero access. The Search tab is wired to it with
  a 350ms debounce.
- Tags: the story editor has a Tags section (add by name — reuses an
  existing tag or creates one; remove). Tapping a tag in the Viewer's
  info panel jumps to Search pre-filled with that tag.
- Comments: `/story/[id]/comments`, reached from the Viewer's comment
  button (no longer a "coming soon" placeholder) — a simple list with
  author name + timestamp and a composer at the bottom. Story-level only
  in V1, per spec; the schema already carries a nullable `slide_id` for
  per-slide comments later.

**Phase 7 — Team, Sharing, Public Links, Web Viewer** ✅

- `StoryPlayer` (`src/components/story/story-player.tsx`): the Viewer's
  full playback UI was pulled out of `story/[id]/view.tsx` into a
  reusable component, parametrized by which actions are available
  (Edit/Comment/Share are all optional props). Both the authenticated
  Viewer and the new public Web Viewer render the exact same player —
  they just load their data differently and wire up different actions.
- Web Viewer: `/s/[slug]`. No account needed — an active `share_links`
  row is what grants read access via RLS (`stories`/`story_slides`/
  `media` select policies already allowed this since Phase 2/4), not
  being signed in. Resolves the slug, plays the story, Share re-shares
  the same URL via the native share sheet; no Edit/Comment (there's
  nothing to edit as a stranger, and posting a comment requires an
  account per the `comments insert` RLS policy).
- Share management (owner only, from the Viewer's Share button): create
  a link, copy it, share it, turn it off/back on
  (`src/components/story/share-sheet.tsx`, `src/lib/data/share-links.ts`).
  Slugs are `<slugified-title>-<random>`, retried on the rare collision.
- Team (owner only, in the editor's new Team section): invite an
  existing user as editor or viewer by email, remove a member.
  `supabase/migrations/20260902040000_team_lookup.sql` adds
  `find_user_by_email()` — a `SECURITY DEFINER` exact-match lookup, not a
  new broadly-readable `email` column on `profiles`, so this doesn't let
  any signed-in user enumerate everyone else's email address the way
  extending the existing "profiles select" policy would have.

Not yet implemented: export (PDF/ZIP/JSON), version history, activity log.

> **Testing note:** media upload, video playback, and camera/gallery
> access all need a real, configured Supabase project and a real
> device/browser — none of that is available in this sandboxed
> environment. What *was* verified here: schema, RLS, and storage
> policies against a real local Postgres instance
> (`supabase/tests/run.sh`); every screen (including the Viewer's
> not-found/error state) is type-checked, linted, and smoke-tested for
> crashes in a headless browser. The actual capture → add slide →
> reorder/duplicate/delete → watch it play flow has not been exercised
> end-to-end — please try it once you've set up Supabase and are running
> on a device or in a browser with camera/file access. Search, tags, and
> comments are in the same position: `search_stories()` and the RLS
> around it are verified against real Postgres, and every screen using
> them is smoke-tested for crashes, but querying real data (does the
> right story actually come back for a given search term, does a posted
> comment actually show up) needs that same live project. Same story for
> Phase 7: `find_user_by_email()` and every share-link RLS policy are
> verified against real Postgres (including the storage-object path
> derivation), and the Web Viewer's not-found state is confirmed in a
> headless browser (nonexistent slug → "Story not found", no crash), but
> the full loop — invite a real second account, create a link, open
> `/s/<slug>` in an actual browser signed out, confirm the native Share
> sheet appears on a device — needs that live project plus a second
> account and a real device/browser to try end-to-end.

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

Storage (`supabase/migrations/20260902020000_storage.sql`) mirrors the
same model on `storage.objects`: objects are keyed as
`stories/<story_id>/<file>`, and the policies derive access from that
`story_id` (owner/editor for write, the same read rules as above for
read) rather than joining to `media`, since the metadata row doesn't
exist yet at upload time.

Team invites (`find_user_by_email()`,
`supabase/migrations/20260902040000_team_lookup.sql`) are a
`SECURITY DEFINER` exact-match lookup rather than a broadly-readable
`email` column on `profiles` — a story owner can check whether a
specific email has an account, but no signed-in user can enumerate
everyone else's email address the way extending the existing
`profiles select` policy (`using (true)`) to include email would have.
