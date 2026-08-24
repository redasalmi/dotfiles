# Personal Fish configuration

# Optional Fish-compatible profile
if test -f "$HOME/.fish_profile"
    source "$HOME/.fish_profile"
end

# Environment
set -gx EDITOR zed
set -gx BUN_INSTALL "$HOME/.bun"
set -gx MANROFFOPT "-c"
set -gx MANPAGER "sh -c 'col -bx | bat -l man -p'"

set -g __fish_git_prompt_showdirtystate yes
set -g __fish_git_prompt_showuntrackedfiles yes
set -g __fish_git_prompt_showstashstate yes
set -g __fish_git_prompt_showupstream informative
set -g __fish_git_prompt_showcolorhints yes

# User tool paths
fish_add_path \
    "$HOME/.local/bin" \
    "$HOME/.cargo/bin" \
    "$BUN_INSTALL/bin" \
    "$HOME/AppImages"

# Load secrets from a file that is intentionally kept outside this repository.
if test -f "$HOME/.config/fish/secrets.fish"
    source "$HOME/.config/fish/secrets.fish"
end

# Interactive-only configuration
if status is-interactive
    # Shell integrations
    if type -q zoxide
        zoxide init fish | source
    end

    if type -q atuin
        atuin init fish | source
    end

    if type -q direnv
        direnv hook fish | source
    end

    if type -q mise
        mise activate fish | source
    end

    # Directory navigation
    alias .. 'cd ..'
    alias ... 'cd ../..'
    alias .... 'cd ../../..'
    alias ..... 'cd ../../../..'

    # Eza listing shortcuts
    alias ls 'eza -al --group-directories-first --icons=auto'
    alias la 'eza -a --group-directories-first --icons=auto'
    alias ll 'eza -l --group-directories-first --icons=auto'
    alias lt 'eza -aT --group-directories-first --icons=auto'
    alias l 'eza --icons=auto --group-directories-first'
    alias lta 'eza --tree --level=2 -a --icons=auto --group-directories-first'

    # Personal command shortcuts
    alias http 'xh'
    alias https 'xh --https'
    alias f 'fzf'
    alias cat 'bat'
    alias r 'rg'
    alias ff 'fd'
    alias top 'btm'
    alias df 'duf'
    alias cloc 'tokei'
    alias j 'just'
    alias du 'dust'

    # Useful command helpers
    alias grep 'grep --color=auto'
    alias psmem 'ps auxf | sort -nr -k 4'
    alias psmem10 'ps auxf | sort -nr -k 4 | head -10'
    alias jctl 'journalctl -p 3 -xb'
end
