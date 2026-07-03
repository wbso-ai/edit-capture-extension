# Slop Off — agent guidelines

## Releasing / pushing

Before every push: bump the version. Minor for features, patch for fixes.

1. Update `version` in **both** `manifest.json` and `package.json` — they
   must always match.
2. Title the release commit `vX.Y.Z: <short summary>` (see `git log` for
   the pattern).

Work may accumulate over several local commits, but nothing gets pushed
without the version reflecting it.
