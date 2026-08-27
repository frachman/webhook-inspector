#!/usr/bin/env bash
set -Eeuo pipefail

config_file=${HOOKBIN_RECEIVER_CONFIG:-/etc/hookbin/backup-receiver.env}
if [[ ${EUID} -ne 0 ]]; then
  printf 'error: receiver must run as root\n' >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$config_file"
: "${HOOKBIN_RECEIVER_INCOMING:?missing HOOKBIN_RECEIVER_INCOMING}"
: "${HOOKBIN_RECEIVER_VERIFIED:?missing HOOKBIN_RECEIVER_VERIFIED}"
: "${HOOKBIN_RECEIVER_RETENTION_DAYS:?missing HOOKBIN_RECEIVER_RETENTION_DAYS}"

install -d -o root -g root -m 0700 "$HOOKBIN_RECEIVER_VERIFIED"
find "$HOOKBIN_RECEIVER_INCOMING" -maxdepth 1 -type f \
  -name 'hookbin-*.dump.gpg' -print0 \
  | while IFS= read -r -d '' artifact_path; do
      checksum_path="${artifact_path}.sha256"
      [[ -r ${checksum_path} ]] || continue
      expected=$(awk 'NR == 1 {print $1}' "$checksum_path")
      actual=$(sha256sum "$artifact_path" | awk '{print $1}')
      if [[ $expected != "$actual" ]]; then
        printf 'error: checksum mismatch: %s\n' "$(basename "$artifact_path")" >&2
        exit 1
      fi
      artifact_name=$(basename "$artifact_path")
      mv "$artifact_path" "$HOOKBIN_RECEIVER_VERIFIED/$artifact_name"
      mv "$checksum_path" "$HOOKBIN_RECEIVER_VERIFIED/${artifact_name}.sha256"
      chmod 0600 "$HOOKBIN_RECEIVER_VERIFIED/$artifact_name" "$HOOKBIN_RECEIVER_VERIFIED/${artifact_name}.sha256"
      printf 'verified: %s\n' "$artifact_name"
    done

find "$HOOKBIN_RECEIVER_VERIFIED" -maxdepth 1 -type f \
  -name 'hookbin-*.dump.gpg' -mtime "+$HOOKBIN_RECEIVER_RETENTION_DAYS" -print0 \
  | while IFS= read -r -d '' file_path; do
      rm -f -- "$file_path" "${file_path}.sha256"
    done
