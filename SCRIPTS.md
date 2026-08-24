# Script plan

The scripts will be POSIX-friendly Bash scripts with `set -Eeuo pipefail`. They should be safe to run repeatedly and should use paths relative to the repository root.

## Planned scripts

| Script | Responsibility |
| --- | --- |
| `scripts/install.sh` | Main entry point, argument parsing, ordering, and summary |
| `scripts/lib/common.sh` | Logging, Fedora checks, sudo checks, package helpers, backup/copy helpers |
| `scripts/install/00-base-system.sh` | Base system and build prerequisites |
| `scripts/install/01-shell-cli.sh` | Shell enhancements and command-line tools |
| `scripts/install/02-development-tools.sh` | Compilers, editors, debuggers, Git tooling, and build tools |
| `scripts/install/03-languages-runtimes.sh` | Language runtimes and version managers |
| `scripts/install/04-containers.sh` | Docker/Podman and related tools selected in the inventory |
| `scripts/install/05-desktop.sh` | Optional desktop, Wayland, audio, networking, and GUI applications |
| `scripts/install/06-fonts.sh` | Fonts and icon fonts |
| `scripts/install/07-third-party.sh` | Explicitly selected third-party RPM packages only |
| `scripts/install/08-media-creative.sh` | Media, creative, productivity, and service applications |
| `scripts/install/09-flatpak.sh` | Flatpak runtime and explicitly selected Flatpak applications |
| `scripts/install/10-user-tools.sh` | mise-managed Node version and global npm tools |
| `scripts/install/11-home.sh` | Backup and copy `home/` into `$HOME` |

## Main-script interface

The intended interface is:

```text
scripts/install.sh [options]

  --all                 install all reviewed categories
  --category NAME       install one category; repeatable
  --list                list categories
  --dry-run             show actions without changing the system
  --skip-third-party    do not run the third-party package category
  --skip-home          do not copy home files
  --yes                 skip confirmation prompts
  --help                show usage
```

The default should list the planned actions and ask for confirmation. `--yes` should never imply `--force` for home files; backups remain mandatory.

## Package-install behavior

- Refresh Fedora metadata and install native packages in one deliberate `dnf` transaction per category.
- Keep third-party repositories and packages separate from the Fedora baseline.
- Filter already-installed packages instead of failing on them.
- Use `sudo` only for `dnf` and service/group operations that are explicitly requested.
- Do not enable services or modify groups implicitly unless that behavior is documented and opt-in.
- Exit on an error and identify the failed category.

## Third-party package behavior

- Keep third-party RPM packages in `apps/07-third-party.md` and out of native Fedora package arrays.
- Prefer Fedora repositories first; use RPM Fusion, COPR, or an official vendor repository only when explicitly approved.
- Do not install arbitrary RPM files or execute installation scripts fetched from the internet. Repository configuration must be documented and reviewed.
- Preserve package signatures and use the repository metadata and trust configuration provided by Fedora or the approved third-party repository.
- Display the package names, repositories, and review prompts before installation.
- Provide `--skip-third-party` for machines that should remain Fedora-repository-only.
- Keep Flatpak and global npm installation in their own categories.

## Home-file behavior

- Resolve the repository root from the script location.
- Copy only from `home/`, never from the whole repository.
- Back up conflicts under a timestamped directory such as `~/.local/state/home/backups/`.
- Refuse or clearly report unsupported symlink targets rather than silently following them.
- Report a final list of copied and backed-up files.

## Validation before implementation

- `bash -n` on every script.
- ShellCheck with the project’s chosen exclusions documented.
- Dry-run tests for every category.
- A disposable Fedora test environment for package and permission behavior.
- A second run to verify idempotency.
