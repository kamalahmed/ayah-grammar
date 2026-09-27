#!/usr/bin/env bash
set -euo pipefail

: "${HOSTINGER_DEPLOY_ROOT:?Missing HOSTINGER_DEPLOY_ROOT}"
: "${AYAH_SSH_CONFIG:?Missing AYAH_SSH_CONFIG}"
: "${GITHUB_SHA:?Missing GITHUB_SHA}"

[[ "$HOSTINGER_DEPLOY_ROOT" =~ ^/home/[A-Za-z0-9_]+/domains/[A-Za-z0-9.-]+/public_html/ayah$ ]] || {
  echo 'Unexpected Hostinger deploy root' >&2
  exit 1
}
[[ "$GITHUB_SHA" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid commit SHA' >&2; exit 1; }
[[ -f dist/index.html && -f dist/.htaccess && -f dist/sw.js && ! -e dist/books ]] || {
  echo 'The production build is incomplete or contains the private books folder' >&2
  exit 1
}

remote=ayah-hostinger
target=$HOSTINGER_DEPLOY_ROOT
account_home=${target%%/domains/*}
stage="$account_home/ayah-releases/$GITHUB_SHA"
ssh_cmd=(ssh -F "$AYAH_SSH_CONFIG")
rsync_cmd=(rsync -az --omit-dir-times -e "ssh -F $AYAH_SSH_CONFIG")

manifest_dir=$(mktemp -d)
trap 'rm -rf "$manifest_dir"' EXIT
(cd dist && find . -type f -print0 | sort -z | xargs -0 sha256sum) > "$manifest_dir/all.sha256"
(cd dist && find . -type f ! -path './index.html' -print0 | sort -z | xargs -0 sha256sum) > "$manifest_dir/assets.sha256"

"${ssh_cmd[@]}" "$remote" "test -f '$target/index.html' && mkdir -p '$stage'"
"${rsync_cmd[@]}" dist/ "$remote:$stage/"
"${rsync_cmd[@]}" "$manifest_dir/all.sha256" "$manifest_dir/assets.sha256" "$remote:$stage/"
"${ssh_cmd[@]}" "$remote" "cd '$stage' && sha256sum -c --quiet all.sha256"

# Keep old content-hashed assets for readers who still have an older tab open.
# Transfer the new entry point only after every other published file verifies.
"${rsync_cmd[@]}" --exclude='/index.html' dist/ "$remote:$target/"
"${ssh_cmd[@]}" "$remote" "cd '$target' && sha256sum -c --quiet '$stage/assets.sha256'"
"${rsync_cmd[@]}" dist/index.html "$remote:$target/.index-$GITHUB_SHA.tmp"
"${ssh_cmd[@]}" "$remote" "mv '$target/.index-$GITHUB_SHA.tmp' '$target/index.html' && cd '$target' && sha256sum -c --quiet '$stage/all.sha256'"

echo "Published and verified $GITHUB_SHA"
