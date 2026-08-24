---
name: music-library-organizer
description: Organizes a Music directory into artist and album folders, fills missing audio metadata from tags, filenames, folder context, and verified web sources, and validates the result without transcoding or deleting files. Use when the user asks to organize, tidy, sort, rename, tag, or add missing metadata to music files.
compatibility: Requires filesystem access, Python 3 with mutagen, and ffprobe. Web search is optional for identifying uncertain releases, artists, years, genres, or feature credits.
metadata:
  author: local
  version: "1.0.0"
---

# Music Library Organizer

Organize the user's music library safely and make its embedded metadata useful to music players. Work in the directory the user names; if they say “here,” use the current working directory.

## Non-negotiable safety

- Inventory before changing anything. Count audio files and record their original paths.
- Never transcode, re-encode, or alter audio streams. Moving files and editing tags is the scope.
- Never delete audio, artwork, scans, PDFs, sidecars, or source directories merely because they look unnecessary.
- Never overwrite an existing destination. Stop and resolve collisions before moving.
- Preserve existing useful tags such as comments, encoder information, lyrics, replay gain, and embedded artwork unless they are explicitly wrong and correction is in scope.
- Do not invent a release year, artist, album, or genre. Leave genuinely unknown values blank and report them.
- Use a temporary Python script or an explicit source-to-destination map for bulk changes. Do not use an unreviewed shell glob for destructive moves.
- Use quoted paths; filenames may contain spaces, apostrophes, Unicode, and parentheses.

## Default library layout

Use `Artist/Album/` for ordinary releases. Keep multi-disc folders and existing non-audio material with their release:

```text
Artist/
  Album/
    audio files
    cover/artwork/scans/PDFs

Spock's Beard/
  Studio Albums/
  Live/
  Compilations/
  Singles, EPs, Fan Club & Promo/

Miscellaneous/
  Memes & Audio Clips/
```

Preserve meaningful existing categories instead of flattening a well-organized discography. For example, rename `Spock's Beard - Discography/` to `Spock's Beard/`, but retain its `Studio Albums`, `Live`, `Compilations`, and `Singles, EPs, Fan Club & Promo` trees.

Loose files should be moved into artist/album folders when their identity is reliable. Keep memes, sound effects, and unidentified clips under `Miscellaneous/Memes & Audio Clips/` rather than pretending they are normal albums.

Do not rename filenames unless the user asks for filename cleanup. Folder organization and embedded tags are the primary changes.

## Metadata schema

For MP3, M4A, FLAC, OGG, OPUS, and WAV files, inspect and write tags with `mutagen` (using its easy interface where suitable). The normal fields are:

- `artist`
- `albumartist`
- `album`
- `title`
- `tracknumber` as `track/total` when known
- `discnumber` as `disc/total`
- `date` or year when verified
- `genre`

Every identifiable file should have artist, album artist, album, title, track number, disc number, and a defensible genre. For anonymous clips, use `Unknown` for artist and `Various Artists` for album artist rather than fabricating a name. Release dates may remain blank.

Use `Various Artists` as `albumartist` for a compilation track while retaining the actual performer in `artist`. Do not replace an existing compilation album with the performer’s name.

For multi-disc releases, use a common album value where the existing structure clearly represents one release and set the correct `discnumber`. If the existing album tags intentionally distinguish editions or discs, do not normalize them without strong evidence.

When a title tag is visibly truncated or corrupted, repair it from a reliable filename, track list, or external source. Preserve meaningful version labels such as `Live`, `Demo`, `Radio Edit`, `Remastered`, and `Extended Mix`.

## Identification and research

Resolve metadata in this order:

1. Existing embedded tags.
2. Album/artist folder names and track filenames.
3. Track order and release context from neighboring files.
4. Verified web sources when the result is uncertain.

For web research, prefer official artist/label pages, Bandcamp, MusicBrainz, Discogs, Spotify/Apple/Deezer listings, or reputable catalog pages. Verify surprising claims with more than one source when practical. Do not use a search result to force a weak match; ask one concise question if two plausible identities would produce different folders or tags.

If the same known files from the original workflow are present, use these established corrections and organization:

- `Spock's Beard - Discography/` → `Spock's Beard/`, retaining the four existing category folders; add `albumartist=Spock's Beard` and correct disc numbers.
- `Shadrane - 2008 - Temporal/` → `Shadrane/2008 - Temporal/`; add `albumartist=Shadrane` and `discnumber=1/1`.
- `dzair/hizia/` → `D'ZAIR/hizia/`; use album `Hizia`, genre `Alternative`, and do not guess its release year.
- Sun City loose tracks → `Sun City/Forever/`; use the verified 10-track order, feature credits, album year `2025`, and genre `Synthwave`.
- `garmarna-herr-mannelig.mp3` → `Garmarna/Miroque - Romantisches Mittelalter (2006)/`; use track 14/15, year 2006, genre `Folk`, and `albumartist=Various Artists`.
- Ihan X Twelve remix files → `Ihan X Twelve/Singles/`; clean YouTube/source suffixes from titles while retaining version distinctions; use genre `Dance` and verified years only.
- Randall's `Wahran` files → `Randall/Wahran/`; use year 2019, genre `House`, and distinguish the `Extended Mix`.
- Identifiable one-offs such as Said Lagam, Chikh Marmri, and No Disc x Cheb Lotfi go in artist/release folders with metadata inferred from reliable filenames or sources.
- Memes and gaming sound effects → `Miscellaneous/Memes & Audio Clips/`; use album `Memes & Audio Clips`, `Various Artists`, honest `Unknown` artists, and a numbered compilation order.

These mappings are evidence for the matching files, not permission to apply the names to unrelated audio.

## Workflow

### 1. Inventory

Inspect immediate and nested entries with `find`. Identify audio by extension, then inspect tags and technical validity with `mutagen` and `ffprobe`. Also inventory artwork, scans, PDFs, and other sidecars so they stay with the release.

Produce an internal table containing at least:

```text
source path | format | artist | album artist | album | title | track | disc | date | genre
```

Report the number of files and the fields that are missing before editing.

### 2. Plan

Build an explicit move map. Group by artist and album, retain categories for existing discographies, and keep each release distinct. Check every destination for collisions before moving. If a destination already exists, stop rather than merge silently.

Do not move files based only on a guessed artist when the guess would change the library structure. Research or ask first.

### 3. Move

Create destination directories and move files without changing their audio data. Move a complete existing release directory when safe so its artwork, scans, and PDFs remain intact. Move loose files individually when they belong to different artists or releases. Remove only directories that became empty as a direct result of the move.

### 4. Tag

Write only the planned metadata fields, preserving unrelated existing tags. For blank files, create a valid tag container before saving. Save one file at a time and allow Unicode. Do not embed online artwork unless the user asks; preserve artwork already embedded or stored beside the release.

### 5. Validate

Afterward:

- recount audio files and compare with the inventory;
- verify every destination path exists and no targeted source media remains;
- inspect that core fields are present for identifiable files;
- verify track/disc numbering for multi-disc releases;
- run `ffprobe -v error` against every audio file and report any failure;
- confirm sidecars and artwork remain in their release folders;
- spot-check representative MP3 and M4A tags after saving.

If any file fails validation, stop reporting it as unresolved; do not silently discard or replace it.

## Completion report

Be concise but include:

- number of audio files organized;
- top-level organization and notable category decisions;
- metadata fields added or corrected;
- validation performed, including `ffprobe` results;
- uncertain identities or dates left unresolved;
- any collisions or files intentionally not moved.
