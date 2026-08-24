---
name: jellyfin-media-import
description: Imports newly downloaded movies, TV series, and anime from the media-library root into Movies, Shows, or Animes; identifies titles and episodes, applies Jellyfin-compatible names, and downloads matching external subtitles. Use when the user asks to organize, move, rename, or add root-level media in this folder, including requests that call Jellyfin "Jellycat."
compatibility: Requires filesystem tools and ffprobe. Web search or a configured subtitle provider is required for subtitle downloads.
---

# Jellyfin Media Import

Organize only new media found directly in the current library root. The managed destinations are `Movies/`, `Shows/`, and `Animes/`.

## Defaults

- Subtitle languages: English (`eng`) and French (`fre`), unless the user specifies a different language set.
- Treat anime movies as movies under `Movies/`; put episodic anime under `Animes/`.
- Preserve video quality, codecs, audio, chapters, and container. This workflow renames and moves files; it does not transcode them.
- Do not alter media already under `Movies/`, `Shows/`, or `Animes/` unless explicitly requested.

## Workflow

1. Inspect immediate root entries, excluding hidden entries, destination directories, and non-media files. Handle both loose video files and downloaded release directories.
2. Before renaming anything, record each original release name. Subtitle matching often depends on release group, source, resolution, FPS, and runtime.
3. Inventory videos and related subtitle, artwork, chapter, and metadata files. Use `ffprobe` for runtime, streams, and frame rate when useful.
4. Identify each title from the release name and metadata. Verify uncertain titles, years, external IDs, episode numbers, split episodes, specials, and anime classification with a current metadata search. Prefer TMDB IDs for folder disambiguation. Do not guess when two plausible matches would produce different destinations; ask one concise question.
5. Plan all source-to-destination paths and check for collisions before moving. Show the plan first only when identification is ambiguous, a destination exists, or the operation would overwrite/remove data.
6. Move and rename using the conventions below.
7. Find both English and French subtitles using the recorded release name, unless the user requested a different language set. For each language prefer, in order:
   - an exact release match;
   - the same source, cut, FPS, and runtime;
   - the same disc/stream release;
   - another reputable subtitle whose timing can be verified.
8. Download subtitles only from established subtitle sources. Do not run downloaded programs or installers. For archives, inspect members and extract only subtitle files; reject absolute paths and `..` traversal.
9. Save each subtitle beside its video with the exact video basename and Jellyfin language suffix (`eng` for English and `fre` for French). Never overwrite an existing subtitle unless the user requests it.
10. Validate the result and report moved media, downloaded subtitles, and anything unresolved.

## Naming

Use filesystem-safe official titles. Keep apostrophes and meaningful punctuation when supported, but replace `/` or path separators.

### Movies

```text
Movies/Movie Title (Year) [tmdbid-12345]/
  Movie Title (Year) [tmdbid-12345].mkv
  Movie Title (Year) [tmdbid-12345].eng.srt
  Movie Title (Year) [tmdbid-12345].fre.srt
```

A movie folder contains one main movie. Preserve valid extras and sidecar files in that folder. Rename a sidecar tied to the video to the same basename where its role is clear.

### TV series

```text
Shows/Series Title (Year) [tmdbid-12345]/
  Season 01/
    Series Title S01E01 Episode Title.mkv
    Series Title S01E01 Episode Title.eng.srt
    Series Title S01E01 Episode Title.fre.srt
  Season 00/
    Series Title S00E01 Special Title.mkv
```

Use zero-padded `SxxEyy`. Put specials in `Season 00`. For multi-episode files use `S01E01-E02`. Omit the episode title if it cannot be verified reliably.

### Episodic anime

```text
Animes/Series Title (Year) [tmdbid-12345]/
  Season 01/
    Series Title S01E01 Episode Title.mkv
    Series Title S01E01 Episode Title.eng.srt
    Series Title S01E01 Episode Title.fre.srt
```

Use the metadata provider's season/episode ordering consistently. Do not convert absolute anime numbering to seasons unless the mapping is verified. Use `Season 00` for OVAs, ONAs, shorts, or specials only when the selected provider classifies them as specials.

### Subtitle suffixes

Use ISO 639-2 language codes:

```text
Video basename.eng.srt
Video basename.eng.sdh.srt
Video basename.eng.forced.srt
Video basename.fre.srt
Video basename.fre.sdh.srt
Video basename.fre.forced.srt
```

Use `eng` for English and Jellyfin's conventional ISO 639-2/B code `fre` for French. Preserve `forced` and `sdh` distinctions when known. Prefer a complete non-SDH subtitle in each requested language by default. Check embedded streams independently for every requested language; avoid downloading a duplicate only for a language that already has a complete embedded stream, unless the user explicitly wants external subtitles.

## Subtitle validation

For every downloaded subtitle:

- confirm it is a real text subtitle (`.srt`, `.ass`, `.ssa`, or `.vtt`), not an HTML error page;
- decode and save as UTF-8 when conversion is lossless;
- ensure timestamps are syntactically valid and broadly fit within the video runtime;
- compare FPS/runtime/release information when available;
- reject obvious wrong-title, wrong-episode, machine-translated, or advertisement-only files;
- for an exact-release match, spot-check early and late cue timing where practical.

A subtitle ending before the video does not by itself indicate failure; credits may contain no dialogue.

## Safety and completion

- Quote paths and use collision-safe moves.
- Do not delete source files, samples, artwork, or text files merely because they appear unnecessary. Mention likely release-site clutter separately.
- Do not silently merge two releases into one folder.
- If no trustworthy matching subtitle is available in one or more requested languages, leave the media correctly organized and report each missing language rather than downloading a poor match.
- Finish by listing final video and subtitle paths and confirming that no targeted root media remains.
