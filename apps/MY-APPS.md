# Apps installed by me

This is the curated application and tool manifest for this machine. It is intentionally smaller than `CURRENT-SYSTEM.md`: Fedora image packages, KDE defaults, drivers pulled in by the base install, libraries, and dependency packages are not listed here.

The RPM section is based on DNF transaction history after the Fedora image provisioning transactions, with removed packages excluded. Flatpaks, global npm tools, and user-level applications are listed separately. Review this file before using it as an installation manifest.

## Repository setup

Enable these repositories before installing the applications below.

### RPM Fusion (free and nonfree)

```bash
sudo dnf install \
  https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm \
  https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
```

### Flathub

```bash
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

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

## Fish universal-variable configuration

`home/.config/fish/fish_variables` is generated by Fish and intentionally ignored by Git. Run these commands in Fish on a new machine to recreate the user-configurable universal variables. `$HOME` keeps the path entries portable; the Pure prompt must be installed for the `pure_*` settings to apply.

```fish
set -U __done_min_cmd_duration 10000
set -U __done_notification_urgency_level low

set -U fish_user_paths "$HOME/AppImages" "$HOME/.cargo/bin" "$HOME/.local/bin"

set -U pure_begin_prompt_with_current_directory true
set -U pure_check_for_new_release false
set -U pure_color_at_sign pure_color_mute
set -U pure_color_aws_profile pure_color_warning
set -U pure_color_command_duration pure_color_warning
set -U pure_color_current_directory pure_color_primary
set -U pure_color_danger red
set -U pure_color_dark black
set -U pure_color_exit_status pure_color_danger
set -U pure_color_git_branch pure_color_mute
set -U pure_color_git_dirty pure_color_mute
set -U pure_color_git_stash pure_color_info
set -U pure_color_git_unpulled_commits pure_color_info
set -U pure_color_git_unpushed_commits pure_color_info
set -U pure_color_hostname pure_color_mute
set -U pure_color_info cyan
set -U pure_color_jobs pure_color_normal
set -U pure_color_k8s_context pure_color_success
set -U pure_color_k8s_namespace pure_color_primary
set -U pure_color_k8s_prefix pure_color_info
set -U pure_color_light white
set -U pure_color_mute brblack
set -U pure_color_nixdevshell_prefix pure_color_info
set -U pure_color_nixdevshell_symbol pure_color_mute
set -U pure_color_normal normal
set -U pure_color_prefix_root_prompt pure_color_danger
set -U pure_color_primary blue
set -U pure_color_prompt_on_error pure_color_danger
set -U pure_color_prompt_on_success pure_color_success
set -U pure_color_success magenta
set -U pure_color_system_time pure_color_mute
set -U pure_color_username_normal pure_color_mute
set -U pure_color_username_root pure_color_light
set -U pure_color_virtualenv pure_color_mute
set -U pure_color_warning yellow

set -U pure_convert_exit_status_to_signal false
set -U pure_enable_aws_profile true
set -U pure_enable_container_detection true
set -U pure_enable_git true
set -U pure_enable_k8s false
set -U pure_enable_nixdevshell false
set -U pure_enable_single_line_prompt false
set -U pure_enable_virtualenv true
set -U pure_reverse_prompt_symbol_in_vimode true
set -U pure_separate_prompt_on_error false
set -U pure_shorten_prompt_current_directory_length 0
set -U pure_shorten_window_title_current_directory_length 0
set -U pure_show_exit_status false
set -U pure_show_jobs false
set -U pure_show_numbered_git_indicator false
set -U pure_show_prefix_root_prompt false
set -U pure_show_subsecond_command_duration false
set -U pure_show_system_time false

set -U pure_symbol_aws_profile_prefix ''
set -U pure_symbol_container_prefix ''
set -U pure_symbol_exit_status_prefix '|'
set -U pure_symbol_exit_status_separator '|'
set -U pure_symbol_git_dirty '*'
set -U pure_symbol_git_stash '≡'
set -U pure_symbol_git_unpulled_commits '⇓'
set -U pure_symbol_git_unpushed_commits '⇑'
set -U pure_symbol_k8s_prefix '☸'
set -U pure_symbol_nixdevshell_prefix '❄️'
set -U pure_symbol_prefix_root_prompt '#'
set -U pure_symbol_prompt '❯'
set -U pure_symbol_reverse_prompt '❮'
set -U pure_symbol_ssh_prefix ''
set -U pure_symbol_title_bar_separator '-'
set -U pure_symbol_virtualenv_prefix ''

set -U pure_system_time_format '+%T'
set -U pure_threshold_command_duration 5
set -U pure_truncate_prompt_current_directory_keeps -1
set -U pure_truncate_window_title_current_directory_keeps -1
```

Fish and Fisher bookkeeping variables are intentionally omitted because Fish and Fisher generate them automatically.

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
