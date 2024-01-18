#!/usr/bin/env bash

if [ ! -z "$@" ]
then
    QUERY=$@
    coproc ( xdg-open "https://www.google.com/search?q=${QUERY}" > /dev/null  2>&1 )
    exit 0
fi
