#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
MAESTRO_BIN="${MAESTRO_BIN:-$HOME/.maestro/bin/maestro}"
ARTIFACTS_DIR="${MAESTRO_ARTIFACTS_DIR:-$ROOT_DIR/artifacts}"
ARTIFACTS_DISPLAY="$ARTIFACTS_DIR"
SEPARATOR='============================================================'

if [[ "$ARTIFACTS_DISPLAY" == "$ROOT_DIR/"* ]]; then
  ARTIFACTS_DISPLAY="${ARTIFACTS_DISPLAY#"$ROOT_DIR/"}"
fi

if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  BOLD=$'\033[1m'
  GREEN=$'\033[32m'
  RED=$'\033[31m'
  YELLOW=$'\033[33m'
  RESET=$'\033[0m'
  maestro_ansi_flag="--no-ansi"
else
  BOLD=''
  GREEN=''
  RED=''
  YELLOW=''
  RESET=''
  maestro_ansi_flag="--no-ansi"
fi

format_duration() {
  local total_seconds="$1"

  if ((total_seconds >= 60)); then
    printf '%dm %02ds' "$((total_seconds / 60))" "$((total_seconds % 60))"
  else
    printf '%ds' "$total_seconds"
  fi
}

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
  flows=()
  while IFS=$'\t' read -r _ flow; do
    flows+=("$flow")
  done < <(
    for flow in "$ROOT_DIR"/.maestro/flows/auth/*/tc-*.yaml; do
      filename="${flow##*/}"
      case_number="${filename#tc-}"
      case_number="${case_number%%-*}"
      printf '%d\t%s\n' "$((10#$case_number))" "$flow"
    done | sort -n
  )
fi

mkdir -p \
  "$ARTIFACTS_DIR/junit" \
  "$ARTIFACTS_DIR/logs" \
  "$ARTIFACTS_DIR/maestro" \
  "$ARTIFACTS_DIR/recordings" \
  "$ARTIFACTS_DIR/screenshots" \
  "$ARTIFACTS_DIR/allure-results"

suite_status=0
passed_count=0
failed_count=0
artifact_error_count=0
flow_index=0
failed_flows=()
suite_started_at="$(date +%s)"
total_flows="${#flows[@]}"

for flow in "${flows[@]}"; do
  flow_index="$((flow_index + 1))"
  flow_id="$(basename "$flow" .yaml)"
  flow_name="$flow_id"

  while IFS= read -r line; do
    if [[ "$line" == name:* ]]; then
      flow_name="${line#name: }"
      break
    fi
  done < "$flow"

  junit_path="$ARTIFACTS_DIR/junit/$flow_id.xml"
  log_path="$ARTIFACTS_DIR/logs/$flow_id.log"
  recording_path="$ARTIFACTS_DIR/recordings/$flow_id.mp4"
  screenshot_path="$ARTIFACTS_DIR/screenshots/$flow_id-failure.png"
  device_recording="/sdcard/maestro-$flow_id.mp4"

  rm -f "$junit_path" "$log_path" "$recording_path" "$screenshot_path"
  adb shell rm -f "$device_recording" >/dev/null 2>&1 || true
  recording_pid="$(adb shell "screenrecord --bit-rate 1000000 --time-limit 180 '$device_recording' >/dev/null 2>&1 & echo \$!" 2>/dev/null || true)"
  recording_pid="${recording_pid//$'\r'/}"
  started_at="$(($(date +%s) * 1000))"
  flow_started_at="$(date +%s)"

  printf '\n%s%s%s\n' "$BOLD" "$SEPARATOR" "$RESET"
  printf '%s[%02d/%02d] %s%s\n' "$BOLD" "$flow_index" "$total_flows" "$flow_name" "$RESET"
  printf '%s%s%s\n\n' "$BOLD" "$SEPARATOR" "$RESET"

  set +e
  "$MAESTRO_BIN" test \
    -e VALID_EMAIL="$VALID_EMAIL" \
    -e VALID_PASSWORD="$VALID_PASSWORD" \
    --format NOOP \
    "$maestro_ansi_flag" \
    --test-output-dir "$ARTIFACTS_DIR/maestro/$flow_id" \
    --debug-output "$ARTIFACTS_DIR/maestro/$flow_id" \
    "$flow" 2>&1 | tee "$log_path"
  flow_status="${PIPESTATUS[0]}"
  set -e

  stopped_at="$(($(date +%s) * 1000))"

  if [[ "$flow_status" -ne 0 ]]; then
    if ! adb exec-out screencap -p > "$screenshot_path"; then
      rm -f "$screenshot_path"
    fi
  fi

  if [[ -n "$recording_pid" ]]; then
    adb shell kill -INT "$recording_pid" >/dev/null 2>&1 || true
    sleep 1
  fi
  adb pull "$device_recording" "$recording_path" >/dev/null 2>&1 || true
  adb shell rm -f "$device_recording" >/dev/null 2>&1 || true

  if [[ ! -s "$recording_path" ]]; then
    printf '%s[WARN]%s Screen recording was not captured for %s.\n' "$YELLOW" "$RESET" "$flow_name" >&2
    artifact_error_count="$((artifact_error_count + 1))"
    suite_status=1
  fi

  node "$ROOT_DIR/.maestro/scripts/allure-results.js" add \
    "$flow" \
    "$flow_status" \
    "$started_at" \
    "$stopped_at" \
    "$ARTIFACTS_DIR/allure-results" \
    "$junit_path" \
    "$log_path" \
    "$recording_path" \
    "$screenshot_path"

  flow_duration="$(format_duration "$(($(date +%s) - flow_started_at))")"

  if [[ "$flow_status" -eq 0 ]]; then
    passed_count="$((passed_count + 1))"
    printf '\n%s[PASS]%s %s (%s)\n' "$GREEN" "$RESET" "$flow_name" "$flow_duration"
  else
    failed_count="$((failed_count + 1))"
    failed_flows+=("$flow_name")
    suite_status=1
    printf '\n%s[FAIL]%s %s (%s)\n' "$RED" "$RESET" "$flow_name" "$flow_duration"
  fi
done

suite_duration="$(format_duration "$(($(date +%s) - suite_started_at))")"

printf '\n%s%s%s\n' "$BOLD" "$SEPARATOR" "$RESET"
printf '%sTEST SUMMARY%s\n' "$BOLD" "$RESET"
printf '%s%s%s\n' "$BOLD" "$SEPARATOR" "$RESET"
printf 'Total:           %d\n' "$total_flows"
printf '%sPassed:%s          %d\n' "$GREEN" "$RESET" "$passed_count"
printf '%sFailed:%s          %d\n' "$RED" "$RESET" "$failed_count"
printf '%sArtifact errors:%s %d\n' "$YELLOW" "$RESET" "$artifact_error_count"
printf 'Duration:        %s\n' "$suite_duration"

if [[ "$failed_count" -gt 0 ]]; then
  printf '\n%sFailed flows:%s\n' "$RED" "$RESET"
  for failed_flow in "${failed_flows[@]}"; do
    printf '  - %s\n' "$failed_flow"
  done
fi

printf '\nArtifacts:\n'
printf '  JUnit:      %s/junit/\n' "$ARTIFACTS_DISPLAY"
printf '  Allure:     %s/allure-results/\n' "$ARTIFACTS_DISPLAY"
printf '  Logs:       %s/logs/\n' "$ARTIFACTS_DISPLAY"
printf '  Recordings: %s/recordings/\n' "$ARTIFACTS_DISPLAY"
printf '%s\n' "$SEPARATOR"

exit "$suite_status"
