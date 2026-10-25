#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT}/scripts/macos-rpath-relocation.sh"
check_no_absolute_macos_rpaths "${1:?usage: check-macos-rpaths.sh <staged-native-dir>}"
