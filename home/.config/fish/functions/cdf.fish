function cdf
    set dir (fd -t d | fzf)
    test -n "$dir"; and cd "$dir"
end
