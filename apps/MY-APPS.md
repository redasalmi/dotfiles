# Apps installed by me

This is the curated application and tool manifest for this machine. It is intentionally smaller than `CURRENT-SYSTEM.md`: Fedora image packages, KDE defaults, drivers pulled in by the base install, libraries, and dependency packages are not listed here.

The RPM section is based on DNF transaction history after the Fedora image provisioning transactions, with removed packages excluded. Flatpaks, global npm tools, and user-level applications are listed separately. Review this file before using it as an installation manifest.

## Browsers

| Application   | Source          | Package or ID          |
| ------------- | --------------- | ---------------------- |
| Google Chrome | Third-party RPM | `google-chrome-stable` |
| Helium        | COPR RPM        | `helium-bin`           |

Firefox is part of the Fedora/KDE system snapshot and is intentionally not included as a personally installed application.

## Development and AI

| Application or tool                | Source                 | Package or ID                                          |
| ---------------------------------- | ---------------------- | ------------------------------------------------------ |
| Cursor                             | Third-party RPM        | `cursor`                                               |
| Ghostty                            | COPR RPM               | `ghostty`                                              |
| Zed                                | User-level application | `zed`                                                  |
| ChatGPT                            | Vendor RPM             | `chatgpt`                                              |
| Mise                               | COPR RPM               | `mise`                                                 |
| direnv                             | Fedora RPM             | `direnv`                                               |
| just                               | Fedora RPM             | `just`                                                 |
| GCC                                | Fedora RPM             | `gcc`, `gcc-c++`                                       |
| Make                               | Fedora RPM             | `make`                                                 |
| Meson                              | Fedora RPM             | `meson`                                                |
| Vala                               | Fedora RPM             | `vala`                                                 |
| GTK development files              | Fedora RPM             | `gtk3-devel`, `gtk4-devel`                             |
| Qt development files               | Fedora RPM             | `qt6-qtbase-devel`                                     |
| WebKit development files           | Fedora RPM             | `webkit2gtk4.1-devel`, `webkitgtk6.0-devel`            |
| SVG/AppIndicator development files | Fedora RPM             | `librsvg2-devel`, `libayatana-appindicator-gtk3-devel` |

## Mise-managed tools

These runtimes and tools are installed and versioned by `mise` from `home/.config/mise/config.toml`, rather than as Fedora or COPR packages.

| Tool                | Mise source       | Configuration key                     |
| ------------------- | ----------------- | ------------------------------------- |
| ast-grep            | Mise registry     | `ast-grep`                            |
| Bottom              | Mise registry     | `bottom`                              |
| Bun                 | Mise registry     | `bun`                                 |
| Deno                | Mise registry     | `deno`                                |
| oh-my-pi            | GitHub repository | `github:can1357/oh-my-pi`             |
| Go                  | Mise registry     | `go`                                  |
| Node.js             | Mise registry     | `node`                                |
| Pi coding agent     | npm package       | `npm:@earendil-works/pi-coding-agent` |
| OpenAI Codex        | npm package       | `npm:@openai/codex`                   |
| Playwright CLI      | npm package       | `npm:@playwright/cli`                 |
| Shopify CLI         | npm package       | `npm:@shopify/cli`                    |
| Chrome DevTools MCP | npm package       | `npm:chrome-devtools-mcp`             |
| Lighthouse          | npm package       | `npm:lighthouse`                      |
| pnpm                | Mise registry     | `pnpm`                                |
| Rust                | Mise registry     | `rust`                                |
| usage               | Mise registry     | `usage`                               |
| xh                  | Mise registry     | `xh`                                  |
| Yarn                | Mise registry     | `yarn`                                |

## Shell and CLI

| Tool      | Source     | Package     |
| --------- | ---------- | ----------- |
| Fish      | Fedora RPM | `fish`      |
| Atuin     | Fedora RPM | `atuin`     |
| btop      | Fedora RPM | `btop`      |
| Dust      | Fedora RPM | `du-dust`   |
| Duf       | Fedora RPM | `duf`       |
| Eza       | Fedora RPM | `eza`       |
| Fastfetch | Fedora RPM | `fastfetch` |
| Micro     | Fedora RPM | `micro`     |
| NVTOP     | Fedora RPM | `nvtop`     |
| ripgrep   | Fedora RPM | `ripgrep`   |
| Tokei     | Fedora RPM | `tokei`     |
| Zoxide    | Fedora RPM | `zoxide`    |

## System, security, and hardware

| Application or tool  | Source          | Package or ID                |
| -------------------- | --------------- | ---------------------------- |
| Flatseal             | Fedora RPM      | `flatseal`                   |
| Proton Pass          | Vendor RPM      | `proton-pass`                |
| Epson printer driver | Vendor RPM      | `epson-inkjet-printer-escpr` |
| JetBrains Mono       | Fedora RPM      | `jetbrains-mono-fonts`       |
| Bitwarden            | Flathub Flatpak | `com.bitwarden.desktop`      |

## Files, network, and services

| Application or service | Source          | Package or ID                 |
| ---------------------- | --------------- | ----------------------------- |
| Cloudflare WARP        | Vendor RPM      | `cloudflare-warp`             |
| MEGAsync               | Vendor RPM      | `megasync`                    |
| qBittorrent            | Fedora RPM      | `qbittorrent`                 |
| Jellyfin               | Third-party RPM | `jellyfin`                    |
| LocalSend              | Flathub Flatpak | `org.localsend.localsend_app` |

## Communication

| Application | Source          | Package or ID |
| ----------- | --------------- | ------------- |
| Discord     | Third-party RPM | `discord`     |
| Slack       | Vendor RPM      | `slack`       |

## Media and creative

| Application or tool | Source          | Package or ID        |
| ------------------- | --------------- | -------------------- |
| Blender             | Fedora RPM      | `blender`            |
| GIMP                | Fedora RPM      | `gimp`               |
| Inkscape            | Fedora RPM      | `inkscape`           |
| Krita               | Fedora RPM      | `krita`              |
| FFmpeg              | RPM Fusion      | `ffmpeg`             |
| MPV                 | Fedora RPM      | `mpv`                |
| CMUS                | RPM Fusion      | `cmus`               |
| Spotify             | Flathub Flatpak | `com.spotify.Client` |

## Productivity and documents

| Application | Source     | Package or ID |
| ----------- | ---------- | ------------- |
| LibreOffice | Fedora RPM | `libreoffice` |
| Xournal++   | Fedora RPM | `xournalpp`   |
| Xpad        | Fedora RPM | `xpad`        |

## Gaming and compatibility

| Application or tool | Source          | Package or ID            |
| ------------------- | --------------- | ------------------------ |
| Steam               | RPM Fusion      | `steam`                  |
| GOverlay            | Fedora RPM      | `goverlay`               |
| Protontricks        | Fedora RPM      | `protontricks`           |
| Winetricks          | Fedora RPM      | `winetricks`             |
| Bottles             | Flathub Flatpak | `com.usebottles.bottles` |
| ProtonPlus          | Flathub Flatpak | `com.vysp3r.ProtonPlus`  |
| ProtonUp-Qt         | Flathub Flatpak | `net.davidotek.pupgui2`  |
| Gear Lever          | Flathub Flatpak | `it.mijorus.gearlever`   |
| Godot               | Fedora RPM      | `godot`                  |

## Third-party repository prerequisites

These are installation sources rather than applications:

- `rpmfusion-free-release`
- `rpmfusion-nonfree-release`

They should remain optional and be enabled only when installing the applications that require them.

## Deliberate exclusions

- Fedora/KDE base applications such as Firefox, Dolphin, Konsole, and the Plasma desktop.
- Packages installed only as dependencies of the applications above.
- Kernel updates and hardware/runtime components from system updates.
- Packages later removed from the RPM inventory, including Rustup, MPD, and Francis. Go is now managed by Mise.
