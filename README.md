# site

This repository is part of the Doomsday Radio multi-repo migration.

## Purpose
Public landing page and project index for Doomsday Radio.

## Source relationship
This repo is intentionally separated from the monorepo so it can be built, tested, and deployed independently.

## Notes
- Keep product logic, tests, and deployment config in this repo.
- Prefer stable public URLs or versioned contracts over relative cross-repo links.
- Only radio-specific assets belong in Bunny Storage; non-radio assets may remain in the repo.

## Bunny deployment

The `main` branch deploys the static landing page directly to the root of the shared
Bunny Storage Zone (`/`). The workflow does not publish the `.git` directory
or GitHub workflow files.

Configure these GitHub repository variables and secrets before enabling the
workflow:

| Name | Type | Value |
| --- | --- | --- |
| `BUNNY_STORAGE_ENDPOINT` | variable | `https://de-s3.storage.bunnycdn.com` |
| `BUNNY_STORAGE_ZONE` | variable | Shared Bunny Storage Zone name |
| `BUNNY_STORAGE_PASSWORD` | secret | Storage Zone S3 password |

The Bunny Pull Zone must use the custom hostname `doomsday.radio`. DNS should
point the domain to the Pull Zone hostname. Other product repositories deploy
into their respective subfolders (e.g. `lore/`, `wetter/`, `news/`).

The workflow uploads the repository root directly to `s3://${BUNNY_STORAGE_ZONE}/`
through the S3-compatible Bunny endpoint (without `--delete` on the root, so
subfolder deployments from other repositories are preserved). CDN cache purging
is deliberately not part of this setup; it can be added later with a separate Pull
Zone API secret. Bunny credentials are never written to the repository or emitted
in the workflow log.

## Local audio visualisation debug

The debug pages use the real stream through a same-origin proxy so WebAudio can
run the actual FFT on localhost. Start it from the repository root:

```sh
python3 site/tools/audio_proxy.py
```

Then open `http://localhost:8765/debug.html?debug`. Debug playback is routed
through WebAudio with gain `0`, so it remains silent while the analyser receives
the live stream. The production page continues to use the public stream directly.
