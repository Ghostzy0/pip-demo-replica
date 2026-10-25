#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT}/scripts/macos-rpath-relocation.sh"

if [[ "$(uname -s)" != Darwin ]]; then
  echo "This fixture requires macOS Mach-O tools." >&2
  exit 2
fi

for tool in xcrun install_name_tool otool codesign file; do
  command -v "${tool}" >/dev/null || { echo "Missing required macOS tool: ${tool}" >&2; exit 2; }
done

tmp="$(mktemp -d "${TMPDIR:-/tmp}/whisper rpath fixture.XXXXXX")"
trap 'rm -rf "${tmp}"' EXIT
binary="${tmp}/native helper"
out_dir="${tmp}/staged helpers"
mkdir -p "${out_dir}" "${tmp}/build cmd LC_RPATH cache/whisper/bin"
cat >"${tmp}/fixture.c" <<'EOF'
int main(void) { return 0; }
EOF

xcrun --sdk macosx clang -Wl,-headerpad_max_install_names -o "${binary}" "${tmp}/fixture.c"
install_name_tool -add_rpath "${tmp}/build cmd LC_RPATH cache/whisper/bin" "${binary}"
install_name_tool -add_rpath '@executable_path/../Frameworks' "${binary}"
install_name_tool -add_rpath '@loader_path/lib' "${binary}"
cp "${binary}" "${out_dir}/native helper"
ln -s 'native helper' "${out_dir}/native helper alias"

expected_absolute="${tmp}/build cmd LC_RPATH cache/whisper/bin"
if ! macos_lc_rpaths "${out_dir}/native helper" | grep -Fqx "${expected_absolute}"; then
  echo "Fixture did not retain the full space-containing LC_RPATH containing 'cmd LC_RPATH'." >&2
  exit 1
fi

if bash "${ROOT}/scripts/check-macos-rpaths.sh" "${out_dir}" >"${tmp}/gate.stdout" 2>"${tmp}/gate.stderr"; then
  echo "Package gate accepted a staged Mach-O with an absolute LC_RPATH." >&2
  exit 1
fi
if ! grep -Fq "refusing to package staged Mach-O with absolute LC_RPATH" "${tmp}/gate.stderr"; then
  echo "Package gate failed without identifying the absolute LC_RPATH." >&2
  cat "${tmp}/gate.stderr" >&2
  exit 1
fi
if node -e 'require(process.argv[1]).__testing.checkMacAbsoluteRpaths(process.argv[2])' \
  "${ROOT}/scripts/before-pack.cjs" "${out_dir}" >"${tmp}/before-pack.stdout" 2>"${tmp}/before-pack.stderr"; then
  echo "before-pack.cjs accepted a staged Mach-O with an absolute LC_RPATH." >&2
  exit 1
fi
if ! grep -Fq "Refusing to package macOS native inputs with absolute LC_RPATH" "${tmp}/before-pack.stderr"; then
  echo "before-pack.cjs did not report the absolute LC_RPATH refusal." >&2
  cat "${tmp}/before-pack.stderr" >&2
  exit 1
fi

# A malformed terminal LC_RPATH record must fail parsing instead of looking clean.
mkdir -p "${tmp}/mock-bin"
cat >"${tmp}/mock-bin/otool" <<'EOF'
#!/usr/bin/env bash
cat "${OTOOL_FIXTURE_FILE:?}"
EOF
chmod +x "${tmp}/mock-bin/otool"
cat >"${tmp}/malformed-otool.txt" <<'EOF'
Load command 1
          cmd LC_RPATH
      cmdsize 48
EOF
if PATH="${tmp}/mock-bin:${PATH}" OTOOL_FIXTURE_FILE="${tmp}/malformed-otool.txt" \
  macos_lc_rpaths "${out_dir}/native helper" >"${tmp}/malformed.stdout" 2>"${tmp}/malformed.stderr"; then
  echo "Parser accepted an LC_RPATH command with no path record at EOF." >&2
  exit 1
fi
if ! grep -Fq "LC_RPATH command has no path record" "${tmp}/malformed.stderr"; then
  echo "Malformed LC_RPATH did not produce the expected parse failure." >&2
  cat "${tmp}/malformed.stderr" >&2
  exit 1
fi

relocate_macos_rpaths "${out_dir}"
first="$(macos_lc_rpaths "${out_dir}/native helper")"
relocate_macos_rpaths "${out_dir}"
second="$(macos_lc_rpaths "${out_dir}/native helper")"

if [[ "${first}" != "${second}" ]]; then
  echo "Normalization was not idempotent." >&2
  printf 'first:\n%s\nsecond:\n%s\n' "${first}" "${second}" >&2
  exit 1
fi
if printf '%s\n' "${second}" | grep -q '^/'; then
  echo "An absolute LC_RPATH remains after normalization: ${second}" >&2
  exit 1
fi
for expected in '@loader_path' '@loader_path/lib' '@executable_path/../Frameworks'; do
  if ! printf '%s\n' "${second}" | grep -Fqx "${expected}"; then
    echo "Normalization did not preserve/add ${expected}." >&2
    exit 1
  fi
done
printf 'Normalized LC_RPATH entries:\n%s\n' "${second}"
if [[ ! -L "${out_dir}/native helper alias" || "$(readlink "${out_dir}/native helper alias")" != 'native helper' ]]; then
  echo "Normalization changed the helper symlink." >&2
  exit 1
fi
bash "${ROOT}/scripts/check-macos-rpaths.sh" "${out_dir}"
node -e 'require(process.argv[1]).__testing.checkMacAbsoluteRpaths(process.argv[2])' \
  "${ROOT}/scripts/before-pack.cjs" "${out_dir}"
codesign --verify --strict "${out_dir}/native helper"
echo "macOS rpath fixture passed: before-pack gate rejected absolute path then accepted normalized Mach-O; exact parser, EOF failure, relative paths, idempotence, symlink, and signature verified."
