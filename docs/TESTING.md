# Manual test checklist

This project was built without an Android/iOS simulator or a live Supabase
project available in the dev environment. Everything below was verified
structurally (TypeScript strict mode, `expo export --platform web` bundling
successfully after every phase) but **not** click-tested. Run through this
list after setup (see README's "Setup" and "Running the app") before trusting
any of it in front of a real user.

Set up once: create a Supabase project, run the 6 migrations in
`supabase/migrations/`, fill in `.env`, then `npm run android` / `npm run ios`
/ `npm run web`.

## Auth
- [ ] Sign up with email/password → lands on Home signed in
- [ ] Sign out → lands on Sign In
- [ ] Sign in with the same account → back on Home
- [ ] Close and reopen the app → still signed in (session persisted)

## Folders & Library
- [ ] Create a folder from Home and from the Create tab
- [ ] Open a folder → empty state → "New Story" scoped to that folder
- [ ] Library: toggle Grid ↔ List, setting persists after reopening the app
- [ ] Rename and delete a folder (stories inside move to Unfiled, not deleted)

## Creating a story + slides
- [ ] Create a story, pick a folder, save → lands in the editor
- [ ] Add Slide → Camera → take a photo → shows upload progress → appears in the slide list
- [ ] Add Slide → Gallery → pick a video → same
- [ ] Add Slide → Text-only slide (heading/body, no media)
- [ ] Add a checklist / warning / quote / link block on a slide
- [ ] Duplicate a slide, delete a slide (with confirmation)
- [ ] Reorder slides by long-pressing the drag handle and dragging
- [ ] Edit the story title, description, and add a couple of tags
- [ ] Tap Done → returns to the Story Viewer, content matches what was built

## Story Viewer
- [ ] Tap right/left to move between slides; progress bar advances per slide
- [ ] Video slide: progress bar tracks actual playback; auto-advances when the video ends
- [ ] Text/image slide: auto-advances after a few seconds
- [ ] Long-press to pause; release to resume from where it paused
- [ ] Info button: shows title/description/tags, comments list, add a comment
- [ ] Tap a tag in the info sheet → tag results screen
- [ ] Edit button appears only if you're the owner or an editor (see Team below)
- [ ] Close returns to where you came from (Library/Folder/Home)

## Search
- [ ] Search a word that only appears in a slide's body → the story shows up
- [ ] Search a tag name → matches
- [ ] Empty query shows your tags; tapping one opens its results

## Sharing & team roles
- [ ] Share screen → set visibility to Public → Create share link → Copy link
- [ ] Open the copied `vistoria://s/<slug>` link on a second device with the app installed
- [ ] Disable the link → reopening it should fail; Enable it again → works
- [ ] Invite a second **existing** account by email as Viewer → they can open the story but not the editor
- [ ] Promote them to Editor → the Edit button now appears for them
- [ ] Remove them → they lose access

## Web Viewer (no login)
- [ ] `npx expo export --platform web`, deploy `dist/`, set `EXPO_PUBLIC_WEB_BASE_URL`
- [ ] Open the public share URL in a plain browser, logged out → same viewer experience, no install prompt
- [ ] A **private** story's share URL (or a disabled link) does not render its content

## Export
- [ ] Share screen → Export JSON → a `.json` file with story+slides+media+tags
- [ ] Export ZIP → contains `story.json` and a `media/` folder with the actual files
- [ ] Export PDF → one section per slide, images included, opens in a normal PDF viewer

## Sync & lifecycle
- [ ] Edit a story on Device A, reopen it on Device B (or pull-to-refresh) → sees the update
- [ ] Delete a story from Library → confirmation → gone, and its media/comments/tags go with it (cascade)
- [ ] Force-quit and reopen the app → still on the right tab, session intact

## Localization
- [ ] Profile → switch to العربية → UI text switches; RTL fully applies after the app restart it prompts for
- [ ] Switch back to English → LTR restored
