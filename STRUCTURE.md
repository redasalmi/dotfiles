# Repository structure

The repository is intentionally boring: package lists, copied home files, and shell scripts. There is no Stow package tree and no symlink manager.

```text
.
├── apps/
│   ├── README.md
│   ├── CURRENT-SYSTEM.md
│   ├── 00-base-system.md
│   ├── 01-shell-cli.md
│   ├── 02-development-tools.md
│   ├── 03-languages-runtimes.md
│   ├── 04-containers.md
│   ├── 05-desktop.md
│   ├── 06-fonts.md
│   ├── 07-third-party.md
│   ├── 08-media-creative.md
│   ├── 09-flatpak.md
│   └── 10-user-tools.md
├── home/
│   ├── .bash_profile
│   ├── .bashrc
│   ├── .cargo/
│   ├── .config/
│   ├── .gitconfig
│   ├── .gtkrc-2.0
│   └── .pi/
│       └── agent/
│           ├── extensions/
│           ├── skills/
│           └── themes/
├── scripts/
│   ├── install.sh
│   ├── lib/common.sh
│   └── install/
│       ├── 00-base-system.sh
│       ├── 01-shell-cli.sh
│       ├── 02-development-tools.sh
│       ├── 03-languages-runtimes.sh
│       ├── 04-containers.sh
│       ├── 05-desktop.sh
│       ├── 06-fonts.sh
│       ├── 07-third-party.sh
│       ├── 08-media-creative.sh
│       ├── 09-flatpak.sh
│       ├── 10-user-tools.sh
│       └── 11-home.sh
├── .gitignore
├── HOME.md
├── PLAN.md
├── README.md
├── SCRIPTS.md
└── STRUCTURE.md
```

## Directory rules

- `apps/` contains the read-only Fedora inventory and human-readable category lists. `CURRENT-SYSTEM.md` preserves the package query results; scripts may later encode only reviewed Fedora package names as shell arrays.
- `home/` mirrors the target home directory. For example, `home/.config/starship.toml` is copied to `$HOME/.config/starship.toml`.
- `scripts/install/` contains independently runnable category scripts. Numeric prefixes define the normal order.
- `scripts/lib/` contains shared functions only; it should not install packages when sourced.
- Documentation and license files stay at the repository root and are never copied to `$HOME`.

## Install model

1. `install.sh` validates that the host is Fedora Linux and checks its arguments.
2. Native packages are installed with `dnf`; Fedora repository packages are kept separate from third-party RPMs.
3. Third-party RPM packages are handled separately and only from explicitly configured repositories.
4. Home files are copied from `home/` to `$HOME` after existing targets are backed up.
5. The script prints a summary of installed categories and skipped items.

The future implementation should use paths relative to the repository, so it works regardless of where the repository is cloned.
