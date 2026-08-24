function fish_prompt
    set -l normal (set_color normal)
    echo -n -s (set_color $fish_color_cwd) (prompt_pwd) $normal (fish_vcs_prompt) $normal '> '
end
