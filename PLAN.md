# Setup plan

## Goal

Create a transparent Fedora Linux setup repository that:

1. Stores the home files directly in `home/`.
2. Groups explicitly requested packages by purpose.
3. Installs native Fedora packages with `dnf`, with third-party repositories kept separate from the Fedora baseline.
4. Installs selected third-party RPM packages only from explicitly documented repositories.
5. Copies home files into `$HOME` with backups instead of creating symlinks.
6. Provides one main script while keeping each category independently runnable.

## Phases

### 1. Inventory — complete

The current Fedora Linux 44 KDE Plasma system was inspected read-only. The inventory is recorded in `apps/CURRENT-SYSTEM.md` and split into category files under `apps/`.

- 432 explicitly user-installed RPM packages were found with `dnf repoquery --userinstalled`.
- 7 Flatpak applications were found with `flatpak list --app`.
- 2 global npm packages were found with `npm list --global --depth=0`; no Cargo-installed applications were detected.
- No old home files were used to infer installed applications.

### 2. Review the lists

- Decide which currently installed applications are wanted in the reusable Fedora setup.
- Mark each item `keep`, `optional`, or `remove` during review.
- Keep Fedora base packages separate from RPM Fusion, COPR, vendor, and direct-RPM sources.
- Keep optional desktop and container alternatives out of the default installation.
- Separate native Fedora packages, third-party RPMs, Flatpak, and language-level packages.

### 3. Capture home files

- Recreate the selected home files under `home/`.
- Recreate selected `.config` files under `home/.config/`.
- Add a `.gitignore` before copying anything that could contain credentials.
- Make shell configuration conditional where a package is optional.

### 4. Implement installers

- Add a shared shell library for logging, checks, package installation, and backups.
- Add one script per application category.
- Add a main `scripts/install.sh` orchestrator with category selection and skip flags.
- Make all scripts safe to rerun and fail clearly on unsupported systems.

### 5. Test

- Run shell syntax checks and ShellCheck.
- Test package installation and home-file copying in a disposable Fedora VM or container where practical.
- Test an existing-file conflict and verify the backup path.
- Test Fedora-only, third-party-only, home-only, and dry-run modes.

### 6. Use on the current machine

Only after reviewing the generated scripts and package lists:

- Commit the reviewed repository.
- Run the installer interactively.
- Review every proposed package and backup before accepting it.
- Reboot or enable services only when explicitly required by the chosen packages.

## Safety rules

- This planning pass makes no changes to the current system.
- No script should use `rm`, overwrite an existing file silently, or pipe remote code into a shell.
- Third-party RPM installation must use signed, explicitly configured repositories; package installation may use `sudo` but builds must run as an unprivileged user.
- Home files must be backed up before replacement.
- The default run should be interactive; unattended installation must require an explicit flag.
- The main script should support `--dry-run`, `--category`, `--skip-third-party`, and `--skip-home`.
- Secrets and host-specific files remain outside this repository unless deliberately templated.

## Definition of done

- Every wanted application is in exactly one package category.
- Fedora packages and third-party RPMs are clearly separated.
- `home/` contains only files intended to be copied to `$HOME`.
- A fresh Fedora installation can be bootstrapped from the main script.
- Re-running the installer is safe and does not lose existing files.
- The README accurately documents the workflow.
