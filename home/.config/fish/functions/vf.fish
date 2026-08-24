function vf
    set file (fd -t f | fzf)
    test -n "$file"; and $EDITOR "$file"
end
