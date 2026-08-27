#!/usr/bin/env bash
set -Eeuo pipefail

config_file=${HOOKBIN_BACKUP_CONFIG:-/etc/hookbin/backup.env}
if [[ ${EUID} -ne 0 ]]; then
  printf 'error: this backup must run as root\n' >&2
  exit 1
fi
if [[ ! -r ${config_file} ]]; then
  printf 'error: missing backup config: %s\n' "$config_file" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$config_file"
: "${HOOKBIN_COMPOSE_FILE:?missing HOOKBIN_COMPOSE_FILE}"
: "${HOOKBIN_ENV_FILE:?missing HOOKBIN_ENV_FILE}"
: "${HOOKBIN_BACKUP_DIR:?missing HOOKBIN_BACKUP_DIR}"
: "${HOOKBIN_GPG_HOME:?missing HOOKBIN_GPG_HOME}"
: "${HOOKBIN_GPG_RECIPIENT:?missing HOOKBIN_GPG_RECIPIENT}"
: "${HOOKBIN_SFTP_KEY:?missing HOOKBIN_SFTP_KEY}"
: "${HOOKBIN_SFTP_KNOWN_HOSTS:?missing HOOKBIN_SFTP_KNOWN_HOSTS}"
: "${HOOKBIN_SFTP_USER:?missing HOOKBIN_SFTP_USER}"
: "${HOOKBIN_SFTP_HOST:?missing HOOKBIN_SFTP_HOST}"
: "${HOOKBIN_SFTP_REMOTE_DIR:?missing HOOKBIN_SFTP_REMOTE_DIR}"
: "${HOOKBIN_RETENTION_DAYS:?missing HOOKBIN_RETENTION_DAYS}"

for required_command in docker gpg sftp sha256sum find; do
  command -v "$required_command" >/dev/null || {
    printf 'error: required command unavailable: %s\n' "$required_command" >&2
    exit 1
  }
done
[[ -r ${HOOKBIN_ENV_FILE} ]] || { printf 'error: missing Hookbin env file\n' >&2; exit 1; }
[[ -r ${HOOKBIN_SFTP_KEY} ]] || { printf 'error: missing SFTP key\n' >&2; exit 1; }
[[ -r ${HOOKBIN_SFTP_KNOWN_HOSTS} ]] || { printf 'error: missing SFTP known-hosts file\n' >&2; exit 1; }
[[ ${HOOKBIN_RETENTION_DAYS} =~ ^[0-9]+$ ]] || { printf 'error: retention must be an integer\n' >&2; exit 1; }

install -d -o root -g root -m 0700 "$HOOKBIN_BACKUP_DIR"
tmp_dir=$(mktemp -d "$HOOKBIN_BACKUP_DIR/.tmp.XXXXXX")
cleanup() { rm -rf "$tmp_dir"; }
trap cleanup EXIT

set -a
# shellcheck disable=SC1090
source "$HOOKBIN_ENV_FILE"
set +a

backup_id="hookbin-$(date -u +%Y%m%dT%H%M%SZ)"
artifact_name="${backup_id}.dump.gpg"
artifact_path="$tmp_dir/$artifact_name"
checksum_name="${artifact_name}.sha256"
checksum_path="$tmp_dir/$checksum_name"

docker compose --env-file "$HOOKBIN_ENV_FILE" -f "$HOOKBIN_COMPOSE_FILE" \
  exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  | gpg --homedir "$HOOKBIN_GPG_HOME" --batch --yes --trust-model always \
      --recipient "$HOOKBIN_GPG_RECIPIENT" --output "$artifact_path" --encrypt

(cd "$tmp_dir" && sha256sum "$artifact_name" > "$checksum_name")

sftp -q -b - \
  -i "$HOOKBIN_SFTP_KEY" \
  -o BatchMode=yes \
  -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=yes \
  -o UserKnownHostsFile="$HOOKBIN_SFTP_KNOWN_HOSTS" \
  "$HOOKBIN_SFTP_USER@$HOOKBIN_SFTP_HOST" <<SFTP
cd $HOOKBIN_SFTP_REMOTE_DIR
put $artifact_path ${artifact_name}.part
put $checksum_path ${checksum_name}.part
rename ${artifact_name}.part $artifact_name
rename ${checksum_name}.part $checksum_name
SFTP

mv "$artifact_path" "$HOOKBIN_BACKUP_DIR/$artifact_name"
mv "$checksum_path" "$HOOKBIN_BACKUP_DIR/$checksum_name"
chmod 0600 "$HOOKBIN_BACKUP_DIR/$artifact_name" "$HOOKBIN_BACKUP_DIR/$checksum_name"

find "$HOOKBIN_BACKUP_DIR" -maxdepth 1 -type f -name 'hookbin-*.dump.gpg' \
  -mtime "+$HOOKBIN_RETENTION_DAYS" -print0 \
  | while IFS= read -r -d '' file_path; do
      rm -f -- "$file_path" "${file_path}.sha256"
    done

printf '%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$tmp_dir/last-success"
chmod 0600 "$tmp_dir/last-success"
mv "$tmp_dir/last-success" "$HOOKBIN_BACKUP_DIR/last-success"

printf 'backup succeeded: %s (retention=%sd)\n' "$artifact_name" "$HOOKBIN_RETENTION_DAYS"
