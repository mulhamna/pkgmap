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

# Fallback: npm ecosystem (npm, pnpm, yarn, bun)
if command -v npm >/dev/null 2>&1; then
  npm install -g "$PACKAGE"
elif command -v pnpm >/dev/null 2>&1; then
  pnpm add -g "$PACKAGE"
elif command -v yarn >/dev/null 2>&1; then
  yarn global add "$PACKAGE"
elif command -v bun >/dev/null 2>&1; then
  bun add -g "$PACKAGE"
else
  echo ""
  echo "Error: no supported package manager found."
  echo "Install Node.js from https://nodejs.org, then run:"
  echo "  npm install -g $PACKAGE"
  exit 1
fi

echo ""
echo "pkgmap installed successfully. Run: pkgmap"
