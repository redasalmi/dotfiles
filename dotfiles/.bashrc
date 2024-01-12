#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls='ls --color=auto'
alias grep='grep --color=auto'
PS1='[\u@\h \W]\$ '

source /usr/share/bash-completion/bash_completion
source ~/.bash_aliases
source ~/.bash_functions
source ~/.bash_npm
source ~/.bash_pnpm

eval "$(fnm env --use-on-cd)"
eval "$(starship init bash)"
