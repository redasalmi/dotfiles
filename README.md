# dotfiles

My personal dotfiles, still under construction 🚧

The dotfiles are managed using [Stow](https://www.gnu.org/software/stow/)

# Usage

Install Stow using your distribution package manager

```bash
  pacman -S stow
```

Clone the repo and use stow on the `.dotfiles` folder

```bash
  git clone https://github.com/redasalmi/dotfiles.git
  cd dotfiles/.dotfiles
  stow -t ~/. .
```

This will create a symlink between the files under the `.dotfiles` directory and the home folder
