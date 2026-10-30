# Vice Tracker data

The mission and cheat-code list for the Vice Tracker app. The app downloads `data.json` from this repo's GitHub Pages site, so editing this file updates every player's app without shipping a new build.

Live file: `https://<your-username>.github.io/vice-tracker-data/data.json`

## How the app uses it

- The app ships with a copy of this file built in, so it works offline and on first launch.
- On launch, and when the player pulls to refresh on the home screen, it downloads the live file.
- It only switches to the downloaded file if its `version` is **higher** than the one it already has. Otherwise the download is ignored.
- Each player's ticked missions and saved items are stored against item `id`s, on their phone.

## Publishing an update

1. Edit `data.json`. You can do this in the browser: open the file on GitHub, click the pencil icon, edit, commit.
2. Raise `version` by 0.1 (2.1 → 2.2, 2.9 → 3.0) and set `updatedAt` to today's date.
3. Commit to `main`.
4. In the **Actions** tab, wait for **Validate and publish** to go green (about a minute). If it goes red, open the run: it lists exactly what's wrong. Nothing is published until it passes.
5. GitHub Pages caches files for up to 10 minutes. After that, players get the update the next time they open the app or pull to refresh.

## Rules

- **Never change or reuse an `id`.** Players' progress is stored against it. Renaming `story-001` to `story-1` silently un-ticks it for everyone. Change `name` freely instead.
- **Always bump `version`.** Without it, the app ignores the update.
- **Don't delete items players may have ticked.** It loses their progress on those items. The check fails if an `id` disappears; if you really mean it, the check's message tells you which ones.
- `id`s are lowercase letters, numbers and dashes, unique across the whole file (categories, missions and cheats).

## Format

```jsonc
{
  "version": 2.1,                   // +0.1 on every publish: 2.1, 2.2 ... 2.9, 3.0
  "updatedAt": "2026-11-02",        // YYYY-MM-DD, shown in Settings
  "categories": [
    {
      "id": "story",                // permanent
      "name": "Story missions",
      "items": [
        {
          "id": "story-001",        // permanent
          "name": "Mission name",
          "description": "One line shown in the list.",   // optional
          "spoiler": true           // optional: name hidden until completed when spoilers are hidden
        }
      ]
    }
  ],
  "cheats": [
    {
      "id": "cheat-001",            // permanent
      "name": "Max health",
      "effect": "One line on what it does.",
      "details": "Optional longer notes.",                 // optional
      "codes": { "playstation": "R1, R2, L1, X", "xbox": "RB, RT, LB, A" }  // one or both
    }
  ]
}
```

`data.schema.json` describes the same format, so editors like VS Code autocomplete fields and flag mistakes while you type.

## Checking locally (optional)

With Node.js installed:

```bash
node scripts/validate.mjs                    # checks data.json
node scripts/validate.mjs old-data.json      # also checks version went up and no ids vanished
```
