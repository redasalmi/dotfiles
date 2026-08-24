# Fedora Linux home configuration

A simple, copy-based Fedora Linux setup for my personal home configuration and development tools. This repository will not use GNU Stow or another configuration manager: the installer will copy files from `home/` into `$HOME`.

This pass only creates the plan and package inventory. It does not install packages or change the current system.

## Documentation

- [Plan](PLAN.md) — project phases, safety rules, and acceptance criteria
- [Repository structure](STRUCTURE.md) — where home files, app lists, and scripts belong
- [Home files inventory](HOME.md) — files to copy and files that must stay out of Git
- [Scripts plan](SCRIPTS.md) — category installers, orchestration, and third-party package handling
- [Application inventory](apps/README.md) — current packages grouped by category
- [Current system snapshot](apps/CURRENT-SYSTEM.md) — read-only package inventory from the current machine

## Planned layout

```text
.
├── apps/             # one package list per category
├── home/             # files copied into $HOME
├── scripts/          # category installers and the main entry point
├── .gitignore
├── HOME.md
├── PLAN.md
├── SCRIPTS.md
└── STRUCTURE.md
```

The application inventory is queried from the current Fedora machine and split into native RPM, third-party RPM, Flatpak, and user-level tool categories.
