# Application inventory

These files contain the package and application inventory queried from the current Fedora Linux 44 KDE Plasma system, split into installable categories. Package names are recorded without versions so they can be reviewed before becoming installer manifests.

## Current machine

The read-only inventory contains **432 explicitly user-installed RPM packages**, **7 Flatpak applications**, and **2 global npm packages**. See [CURRENT-SYSTEM.md](CURRENT-SYSTEM.md) for the complete query output and the exact commands used. See [MY-APPS.md](MY-APPS.md) for the curated list of applications and tools installed intentionally after Fedora provisioning.

## Categories

- [Apps installed by me](MY-APPS.md)
- [Base system and hardware](00-base-system.md)
- [Shell and CLI](01-shell-cli.md)
- [Development tools](02-development-tools.md)
- [Languages and runtimes](03-languages-runtimes.md)
- [Containers and virtualization](04-containers.md)
- [Desktop and KDE Plasma](05-desktop.md)
- [Fonts](06-fonts.md)
- [Third-party packages and repositories](07-third-party.md)
- [Media, creative, productivity, and services](08-media-creative.md)
- [Flatpak applications](09-flatpak.md)
- [User-level tools](10-user-tools.md)

Flatpak applications and user-level npm packages remain separate from the RPM categories.

## Inventory policy

- Keep package names without versions or architectures in category files.
- Review every package before adding it to an installer manifest; user-installed includes system and hardware packages selected during installation.
- Keep third-party repositories and direct RPMs separate from Fedora packages.
- Keep optional applications out of the default baseline when practical.
