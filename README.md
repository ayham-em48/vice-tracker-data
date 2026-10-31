# Vice Tracker data

The remote config for the Vice Tracker app: missions, side quests, collectibles, cheat codes, home screen cards, ads, the launch countdown and the store-update prompt. The app downloads `data.json` from this repo's GitHub Pages site, so editing this file updates every player's app without shipping a new build.

Live file: `https://ayham-em48.github.io/vice-tracker-data/data.json`

The same site also hosts `privacy.html` and `support.html` (linked from the App Store and Play listings) and `index.html`.

## How the app uses it

- The app ships with a copy of this file built in, so it works offline and on first launch.
- On launch, and when the player pulls to refresh on the home screen, it downloads the live file.
- It only switches to the downloaded file if its `version` is **higher** than the one it already has. Otherwise the download is ignored.
- Each player's ticked missions and saved items are stored against item `id`s, on their phone.

## Publishing an update

### With the editor (easiest)

Open the editor at `https://ayham-em48.github.io/vice-tracker-data/admin.html` from any device, or double-click `admin.html` in this folder. The first time, it asks for a GitHub token: create a [fine-grained token](https://github.com/settings/personal-access-tokens/new) for this repo only, with **Contents: Read and write** and **Actions: Read**.

Edit anything, then click **Submit** (or Ctrl+S). The editor:

- sets `version` (+0.1) and `updatedAt` (today) for you,
- checks the file with the same rules as the Action (`scripts/check.mjs`) and, if anything's wrong, lists the problems before pushing. Choose **Go back and fix**, or **Submit anyway** to publish as is: that adds `[submit anyway]` to the commit message, and the Action then reports the problems as warnings instead of blocking the publish,
- commits `data.json` to `main`, follows the **Validate and publish** run, and tells you whether it went live, failed validation, or failed to publish.

Ids of published items are locked in the editor. The page is public but does nothing without your token, which stays in your browser and is only sent to GitHub.

### By hand

1. Edit `data.json`. You can do this in the browser: open the file on GitHub, click the pencil icon, edit, commit.
2. Raise `version` by 0.1 (2.1 → 2.2, 2.9 → 3.0) and set `updatedAt` to today's date.
3. Commit to `main`.
4. In the **Actions** tab, wait for **Validate and publish** to go green (about a minute). If it goes red, open the run: it lists exactly what's wrong. Nothing is published until it passes.
5. GitHub Pages caches files for up to 10 minutes. After that, players get the update the next time they open the app or pull to refresh.

## Rules

- **Never change or reuse an `id`.** Players' progress is stored against it. Renaming `story-001` to `story-1` silently un-ticks it for everyone. Change `name` freely instead.
- **Always bump `version`.** Without it, the app ignores the update.
- **Don't delete items players may have ticked.** It loses their progress on those items. The check fails if an `id` disappears and lists which ones; if you really mean it, use **Submit anyway** in the editor (or put `[submit anyway]` in the commit message when editing by hand). Removing a category in the editor also removes its home card.
- `id`s are lowercase letters, numbers and dashes, unique across categories, items and cheats. Card ids are separate, so a card can share its category's id (`"id": "story"`, `"categoryId": "story"`).

## Format

Top-level sections, in file order:

| Key          | Required | What it controls |
| ------------ | -------- | ---------------- |
| `version`    | yes      | Bump by 0.1 on every publish. |
| `updatedAt`  | yes      | Date of the update, shown in Settings. |
| `update`     | no       | Store-update pop-up. |
| `cards`      | no       | Home screen cards and their order. |
| `ads`        | no       | Remote ad settings. |
| `countdown`  | no       | Countdown to the game's launch. |
| `categories` | yes      | Missions, side quests and collectibles. |
| `cheats`     | yes      | Cheat codes (use `[]` for none). |

```jsonc
{
  "$schema": "./data.schema.json",   // lets editors autocomplete and check the file
  "version": 1.1,                   // +0.1 on every publish: 1.1, 1.2 ... 1.9, 2.0
  "updatedAt": "2026-10-30",        // YYYY-MM-DD, shown in Settings

  "update": {
    "latestVersion": "1.0.0",       // players on an older app version get an optional "update" prompt
    "minVersion": "1.0.0",          // players below this get a required one
    "androidUrl": "https://play.google.com/store/apps/details?id=com.ayhamem48.vicetracker",
    "iosUrl": "https://apps.apple.com/app/id0000000000",
    "title": "Update available",    // max 40 characters
    "message": "A new version of Vice Tracker is ready ..."   // max 200 characters
  },

  "cards": [
    { "id": "favorites", "type": "favorites", "order": 0, "status": "live" },
    {
      "id": "cheats", "type": "cheats", "order": 1, "status": "live",
      "badge": { "label": "New", "style": "new", "expiresAt": "2026-11-26" }
    },
    {
      "id": "story", "type": "category", "categoryId": "story", "order": 2,
      "status": "partial",
      "notice": "Still being added: more missions every day."
    },
    {
      "id": "collectibles", "type": "category", "categoryId": "collectibles", "order": 4,
      "status": "coming_soon",
      "comingSoonText": "Locations land after launch week."
    }
  ],

  "ads": {
    "enabled": false,               // master switch
    "nativeEvery": 8,               // one native ad every N list items, minimum 4
    "listBanner": false,
    "detailBanner": true
  },

  "countdown": {
    "enabled": true,
    "launchDate": "2026-11-19",     // YYYY-MM-DD
    "game": "GTA 6",
    "outNowLabel": "Out now",       // shown instead of the countdown once the date passes
    "outNowDays": 7                 // for this many days
  },

  "categories": [
    {
      "id": "story",                // permanent
      "name": "Story missions",
      "items": [
        {
          "id": "story-001",        // permanent
          "name": "Prologue",
          "description": "One line shown in the list.",  // optional
          "character": "Michael, Trevor",                // optional: playable character(s)
          "spoiler": true           // optional: name hidden until completed when spoilers are hidden
        }
      ]
    },
    {
      "id": "side",
      "name": "Side quests",
      "items": [
        { "id": "side-001", "name": "Pulling Favors", "character": "Franklin",
          "giver": "Tonya" }        // optional: who gives the quest
      ]
    },
    {
      "id": "collectibles",
      "name": "Collectibles",
      "items": [
        { "id": "col-001", "name": "Letter Scraps (50)", "character": "Any",
          "count": 50 }             // optional: how many there are to find
      ]
    }
  ],

  "cheats": [
    {
      "id": "cheat-001",            // permanent
      "name": "Invincibility",
      "effect": "One line on what it does.",
      "details": "Optional longer notes.",                 // optional
      "codes": { "playstation": "Right, X, Right, ...", "xbox": "Right, A, Right, ..." }  // one or both
    }
  ]
}
```

### Cards

Cards are the stacked cards on the home screen. Without `cards`, the app shows Favorites, one card per category, then Cheats.

- `type`: `favorites`, `cheats`, or `category` (which also needs a `categoryId` matching a `categories[].id`).
- `order`: lower shows higher. Favorites is always first.
- `status`:
  - `live` (default): normal.
  - `partial`: open, with `notice` (max 80 characters) as a banner at the top of the list.
  - `coming_soon`: shown but locked, with `comingSoonText` (max 60 characters, default "Coming soon") as the subtitle.
  - `hidden`: not shown.
- `title`: optional, overrides the default card title.
- `badge`: optional. `label` (max 12 characters, empty means no badge), `style` (`new`, `hot` or `info`, default `info`), `expiresAt` (YYYY-MM-DD, the badge disappears after it).

### Ads

Missing or invalid values fall back to the defaults: `enabled: true`, `nativeEvery: 6`, `listBanner: true`, `detailBanner: true`.

`data.schema.json` describes the format, so editors like VS Code autocomplete fields and flag mistakes while you type.

## Checking locally (optional)

With Node.js installed:

```bash
node scripts/validate.mjs                    # checks data.json
node scripts/validate.mjs old-data.json      # also checks version went up and no ids vanished
```
