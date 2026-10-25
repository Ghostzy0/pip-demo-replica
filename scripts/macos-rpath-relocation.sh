# Shared macOS Mach-O rpath normalization for Whisper staging and its fixture test.
# Callers provide `set -euo pipefail` and invoke relocate_macos_rpaths on Darwin.

macos_lc_rpaths() {
  local binary="$1"
  local load_commands
  if ! load_commands="$(otool -l "${binary}")"; then
    echo "FATAL: could not inspect LC_RPATH entries in ${binary}" >&2
    return 1
  fi

  awk '
    /^[[:space:]]*cmd LC_RPATH[[:space:]]*$/ {
      if (in_rpath) {
        print "FATAL: previous LC_RPATH command has no path record" > "/dev/stderr"
        failed=1
        exit 1
      }
      in_rpath=1
      next
    }
    in_rpath && /^[[:space:]]*path / {
      path=$0
      sub(/^[[:space:]]*path /, "", path)
      if (sub(/[[:space:]]+\(offset [0-9]+\)$/, "", path) != 1) {
        print "FATAL: could not parse LC_RPATH line: " $0 > "/dev/stderr"
        exit 1
      }
      print path
      in_rpath=0
    }
    in_rpath && /^[[:space:]]*cmd / {
      print "FATAL: LC_RPATH command has no path record before " $0 > "/dev/stderr"
      failed=1
      exit 1
    }
    END {
      if (in_rpath) {
        print "FATAL: LC_RPATH command has no path record at end of otool output" > "/dev/stderr"
        exit 1
      }
      if (failed) exit 1
    }
  ' <<<"${load_commands}"
}

check_no_absolute_macos_rpaths() {
  local native_dir="$1" f description rpaths absolute
  [[ -d "${native_dir}" ]] || {
    echo "FATAL: staged macOS native directory is missing: ${native_dir}" >&2
    return 1
  }

  while IFS= read -r -d '' f; do
    if ! description="$(file -b "${f}")"; then
      echo "FATAL: could not identify staged native input ${f}" >&2
      return 1
    fi
    [[ "${description}" == *Mach-O* ]] || continue
    if ! rpaths="$(macos_lc_rpaths "${f}")"; then
      echo "FATAL: could not inspect staged Mach-O ${f}" >&2
      return 1
    fi
    absolute="$(printf '%s\n' "${rpaths}" | awk '/^\//')"
    if [[ -n "${absolute}" ]]; then
      echo "FATAL: refusing to package staged Mach-O with absolute LC_RPATH: ${f}" >&2
      printf '  %s\n' "${absolute}" >&2
      return 1
    fi
  done < <(find "${native_dir}" -type f -print0)
}

relocate_macos_rpaths() {
  local out_dir="$1"
  local f description rpaths rp remaining

  for f in "${out_dir}"/*; do
    # Symlinks share the payload of their target; patching the target is
    # enough, and codesign would follow the link and sign it twice.
    [[ -L "${f}" ]] && continue
    [[ -f "${f}" ]] || continue

    # Mach-O only: skips *.metal shader sidecars and anything else non-binary.
    if ! description="$(file -b "${f}")"; then
      echo "FATAL: could not identify native payload ${f}" >&2
      return 1
    fi
    [[ "${description}" == *Mach-O* ]] || continue

    if ! rpaths="$(macos_lc_rpaths "${f}")"; then
      echo "FATAL: could not read LC_RPATH entries in ${f}" >&2
      return 1
    fi

    # Drop every absolute LC_RPATH. Keep @loader_path, @executable_path,
    # @rpath, and other relative entries unchanged. Read complete path strings:
    # otool appends " (offset N)" after the path, which may itself contain spaces.
    while IFS= read -r rp; do
      [[ "${rp}" == /* ]] || continue
      if ! install_name_tool -delete_rpath "${rp}" "${f}"; then
        echo "FATAL: failed to remove absolute LC_RPATH '${rp}' from ${f}" >&2
        return 1
      fi
    done <<<"${rpaths}"

    if ! rpaths="$(macos_lc_rpaths "${f}")"; then
      echo "FATAL: could not verify LC_RPATH entries in ${f} after removal" >&2
      return 1
    fi
    remaining="$(printf '%s\n' "${rpaths}" | awk '/^\//')"
    if [[ -n "${remaining}" ]]; then
      echo "FATAL: absolute LC_RPATH remains in ${f}: ${remaining}" >&2
      return 1
    fi

    # Idempotent: a second run does not add another loader-relative rpath.
    if ! printf '%s\n' "${rpaths}" | grep -Fqx "@loader_path"; then
      if ! install_name_tool -add_rpath "@loader_path" "${f}"; then
        echo "FATAL: failed to add @loader_path to ${f}" >&2
        return 1
      fi
    fi

    if ! rpaths="$(macos_lc_rpaths "${f}")"; then
      echo "FATAL: could not verify LC_RPATH entries in ${f} after normalization" >&2
      return 1
    fi
    if ! printf '%s\n' "${rpaths}" | grep -Fqx "@loader_path"; then
      echo "FATAL: @loader_path is missing from ${f} after normalization" >&2
      return 1
    fi
    remaining="$(printf '%s\n' "${rpaths}" | awk '/^\//')"
    if [[ -n "${remaining}" ]]; then
      echo "FATAL: absolute LC_RPATH remains in ${f} after normalization: ${remaining}" >&2
      return 1
    fi

    if ! codesign --force --sign - --timestamp=none "${f}"; then
      echo "FATAL: failed to re-sign modified Mach-O ${f}" >&2
      return 1
    fi
    if ! codesign --verify --strict "${f}"; then
      echo "FATAL: ad-hoc signature verification failed for ${f}" >&2
      return 1
    fi
  done

  echo "[whisper-stt] rewrote macOS rpaths to @loader_path in ${out_dir}"
}
