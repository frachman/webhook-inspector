#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"
api_pom="${repo_root}/apps/api/pom.xml"
maven_repo="${MAVEN_REPO_LOCAL:-${repo_root}/.m2/repository}"

usage() {
  printf '%s\n' \
    "Usage: ./scripts/project.sh <command>" \
    "" \
    "Commands:" \
    "  context  Show the durable handoff and current Git state" \
    "  doctor   Check the local tools required for backend work" \
    "  verify   Run clean backend integration tests and diff checks"
}

show_context() {
  printf '%s\n' "=== Git ==="
  git -C "${repo_root}" status --short --branch
  git -C "${repo_root}" log -1 --oneline --decorate
  printf '\n%s\n' "=== Project status ==="
  sed -n '1,240p' "${repo_root}/docs/PROJECT_STATUS.md"
}

doctor() {
  local failed=0
  local java_major

  printf '%s\n' "=== Java ==="
  if ! java -version 2>&1 || ! javac -version 2>&1; then
    failed=1
  else
    java_major="$(java -XshowSettings:properties -version 2>&1 | awk -F'= ' '/java.specification.version/ {print $2}')"
    java_major="${java_major#1.}"
    if [[ ! "${java_major}" =~ ^[0-9]+$ ]] || (( java_major < 17 )); then
      printf '%s\n' "Java 17 or newer is required."
      failed=1
    fi
  fi

  printf '\n%s\n' "=== Maven ==="
  if ! mvn -version; then
    failed=1
  fi

  printf '\n%s\n' "=== Docker ==="
  if ! docker info --format 'Server {{.ServerVersion}}' 2>/dev/null; then
    printf '%s\n' "Docker is unavailable. Start Docker before running verify."
    failed=1
  fi

  if (( failed != 0 )); then
    return 1
  fi
}

verify() {
  doctor
  printf '\n%s\n' "=== Backend integration tests ==="
  DEBUG=false mvn -Dmaven.repo.local="${maven_repo}" -f "${api_pom}" clean test
  printf '\n%s\n' "=== Git whitespace check ==="
  git -C "${repo_root}" diff --check
  git -C "${repo_root}" diff --cached --check
}

case "${1:-}" in
  context)
    show_context
    ;;
  doctor)
    doctor
    ;;
  verify)
    verify
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
