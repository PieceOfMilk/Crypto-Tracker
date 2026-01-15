#!/usr/bin/env bash
set -euo pipefail

# --- paths
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing dependencies (workspace)…"
pnpm install --recursive

echo "Generating protobuf/Connect code…"
pushd "$ROOT_DIR/apps/streamer" > /dev/null
pnpm exec buf generate
popd > /dev/null

echo "Starting backend (streamer) and frontend (web)…"
# Start both apps; stop both when one exits (Ctrl+C will also stop both)
pnpm --filter streamer dev &  BE_PID=$!
pnpm --filter web      dev &  FE_PID=$!

trap 'echo; echo "stopping…"; kill $BE_PID $FE_PID 2>/dev/null || true' INT TERM
wait -n $BE_PID $FE_PID
kill $BE_PID $FE_PID 2>/dev/null || true
