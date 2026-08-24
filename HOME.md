# Home files inventory

The `home/` directory contains the portable configuration selected from the current user's home directory. It mirrors paths relative to `$HOME`; the installer can copy these files into a new Fedora home directory.

## Included files

- Bash startup and Git configuration: `.bash_profile`, `.bashrc`, `.gitconfig`, and `.gtkrc-2.0`.
- Fish configuration, portable functions, and command completions under `.config/fish/`.
- Terminal, shell, editor, and tool configuration for Atuin, Ghostty, GTK, KDE, Mise, Xournal++, XSettingsD, and Zed.
- Pi configuration, themes, extensions, skills, portable skill-evaluation source, and dependency manifests under `.pi/agent/`.
- Rustup shell environment files under `.cargo/`.

The Fish configuration was made portable before copying: project-specific directory aliases and the distro-specific comment were removed. The completions were copied as portable text; tool-generated completions may need refreshing after version changes. It still conditionally loads `~/.config/fish/secrets.fish`, but that file is intentionally not included.

## Intentionally skipped

- Credentials and private material: `.ssh/`, `.gnupg/`, `.pki/`, `.aspnet/`, Fish secrets, Pi auth, Codex auth, and application credential files.
- `spotdl` configuration because it contains service credentials and tokens.
- Browser profiles and application state for Chromium, Chrome, Firefox, Helium, Discord, Slack, Proton Pass, and similar applications.
- Shell/history data, caches, logs, sockets, lock files, databases, sessions, and generated state.
- Pi sessions, caches, installed binaries, model caches, trust data, cloned package repositories, installed dependencies, and generated skill-evaluation results.
- Machine-specific project trust and absolute-path configuration from Codex.
- Generated Babel/Yarn files, Fish universal variables, Rustup state, and package-manager caches.
- The empty Micro bindings file, inactive rmpc configuration, Xpad note state, and other configuration for tools not needed in the portable baseline.

## Keep out of Git

Do not add any of the following:

- `.ssh/` private keys or known-host state;
- `.gnupg/`, credential stores, tokens, cookies, or password databases;
- browser profiles and application state;
- `.npmrc`, `.pypirc`, cloud-provider credentials, or private registry settings;
- caches, history files, sockets, lock files, and machine-generated state;
- files containing absolute paths, private hostnames, or secrets.

`.gitignore` contains repository-level safeguards for these paths. If a configuration needs a secret, commit a documented example such as `file.example` and have the shell configuration read the real file only when it exists.

## Copy policy

- Create parent directories as needed.
- Back up an existing target before replacing it.
- Preserve file contents and permissions where possible.
- Never follow a repository file outside the checkout through an unexpected symlink.
- Print every copied and backed-up path.
- Support a dry run before making changes.
