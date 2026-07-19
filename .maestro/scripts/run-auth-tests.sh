#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
MAESTRO_BIN="${MAESTRO_BIN:-$HOME/.maestro/bin/maestro}"
ARTIFACTS_DIR="${MAESTRO_ARTIFACTS_DIR:-$ROOT_DIR/artifacts}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${VALID_EMAIL:-}" || -z "${VALID_PASSWORD:-}" ]]; then
  printf 'VALID_EMAIL and VALID_PASSWORD must be set in the environment or .env.\n' >&2
  exit 1
fi

if [[ ! -x "$MAESTRO_BIN" ]]; then
  printf 'Maestro executable not found at %s.\n' "$MAESTRO_BIN" >&2
  exit 1
fi

if [[ "$#" -gt 0 ]]; then
  flows=("$@")
else
  flows=(
    "$ROOT_DIR"/.maestro/flows/auth/login/tc-*.yaml
    "$ROOT_DIR"/.maestro/flows/auth/forgot-password/tc-*.yaml
    "$ROOT_DIR"/.maestro/flows/auth/check-mail/tc-*.yaml
    "$ROOT_DIR"/.maestro/flows/auth/create-account/tc-*.yaml
  )
fi

mkdir -p \
  "$ARTIFACTS_DIR/junit" \
  "$ARTIFACTS_DIR/logs" \
  "$ARTIFACTS_DIR/maestro" \
  "$ARTIFACTS_DIR/allure-results"

suite_status=0

for flow in "${flows[@]}"; do
  flow_id="$(basename "$flow" .yaml)"
  started_at="$(($(date +%s) * 1000))"

  set +e
  "$MAESTRO_BIN" test \
    -e VALID_EMAIL="$VALID_EMAIL" \
    -e VALID_PASSWORD="$VALID_PASSWORD" \
    --format junit \
    --output "$ARTIFACTS_DIR/junit/$flow_id.xml" \
    --test-output-dir "$ARTIFACTS_DIR/maestro/$flow_id" \
    --debug-output "$ARTIFACTS_DIR/maestro/$flow_id" \
    "$flow" 2>&1 | tee "$ARTIFACTS_DIR/logs/$flow_id.log"
  flow_status="${PIPESTATUS[0]}"
  set -e

  stopped_at="$(($(date +%s) * 1000))"
  node "$ROOT_DIR/.maestro/scripts/allure-results.js" add \
    "$flow" \
    "$flow_status" \
    "$started_at" \
    "$stopped_at" \
    "$ARTIFACTS_DIR/logs/$flow_id.log" \
    "$ARTIFACTS_DIR/allure-results"

  if [[ "$flow_status" -ne 0 ]]; then
    suite_status=1
  fi
done

exit "$suite_status"
