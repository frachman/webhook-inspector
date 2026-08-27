#!/usr/bin/env bash
set -Eeuo pipefail

config_file=${HOOKBIN_BACKUP_CONFIG:-/etc/hookbin/backup.env}
# shellcheck disable=SC1090
source "$config_file"
: "${HOOKBIN_BACKUP_DIR:?missing HOOKBIN_BACKUP_DIR}"
max_age_minutes=${HOOKBIN_BACKUP_MAX_AGE_MINUTES:-1500}

[[ ${max_age_minutes} =~ ^[0-9]+$ ]] || {
  printf 'error: max age must be an integer\n' >&2
  exit 1
}
latest_file=$(find "$HOOKBIN_BACKUP_DIR" -maxdepth 1 -type f \
  -name 'hookbin-*.dump.gpg' -mmin "-$max_age_minutes" -print -quit)
if [[ -z ${latest_file} ]]; then
  printf 'error: no fresh encrypted backup found within %s minutes\n' "$max_age_minutes" >&2
  exit 1
fi

checksum_file="${latest_file}.sha256"
[[ -r ${checksum_file} ]] || {
  printf 'error: checksum missing for %s\n' "$latest_file" >&2
  exit 1
}
expected=$(awk 'NR == 1 {print $1}' "$checksum_file")
actual=$(sha256sum "$latest_file" | awk '{print $1}')
if [[ $expected != "$actual" ]]; then
  printf 'error: checksum mismatch\n' >&2
  exit 1
fi
printf 'backup check succeeded: %s\n' "$(basename "$latest_file")"
