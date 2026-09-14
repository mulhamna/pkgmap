#!/usr/bin/env sh
set -e

PACKAGE="@mulham28/pkgmap"
BREW_TAP="mulhamna/tap"

echo "Installing pkgmap..."

# macOS: prefer Homebrew
if [ "$(uname)" = "Darwin" ] && command -v brew >/dev/null 2>&1; then
  brew install "$BREW_TAP/pkgmap"
  exit 0
fi

# Bun is the supported runtime and installer.
if command -v bun >/dev/null 2>&1; then
  bun add --global "$PACKAGE"
elif command -v npm >/dev/null 2>&1; then
  echo "Warning: Bun is recommended; falling back to npm."
  npm install -g "$PACKAGE"
elif command -v pnpm >/dev/null 2>&1; then
  pnpm add -g "$PACKAGE"
elif command -v yarn >/dev/null 2>&1; then
  yarn global add "$PACKAGE"
else
  echo ""
  echo "Error: no supported package manager found."
  echo "Install Bun from https://bun.sh, then run:"
  echo "  bun add --global $PACKAGE"
  exit 1
fi

echo ""
echo "pkgmap installed successfully. Run: pkgmap"
