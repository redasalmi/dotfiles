function backup --argument filename
    if test (count $argv) -ne 1
        echo 'Usage: backup FILE' >&2
        return 2
    end

    command cp -- "$filename" "$filename.bak"
end
