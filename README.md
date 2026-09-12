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

The `main` branch deploys the static site to the shared Bunny Storage Zone
under the `site/` prefix. The workflow does not publish the `.git` directory
or GitHub workflow files.

Configure these GitHub repository variables and secrets before enabling the
workflow:

| Name | Type | Value |
| --- | --- | --- |
| `BUNNY_STORAGE_ZONE` | variable | Shared Bunny Storage Zone name |
| `BUNNY_PULL_ZONE_ID` | variable | Pull Zone ID serving `doomsday.radio` |
| `BUNNY_STORAGE_PASSWORD` | secret | Storage Zone password/API key |
| `BUNNY_API_KEY` | secret | Bunny API key allowed to purge the Pull Zone |

The Bunny Pull Zone must use the custom hostname `doomsday.radio`. DNS should
point the domain to the Pull Zone hostname. Product repositories use the same
Storage Zone with their own prefixes from the migration specification.

The workflow uploads the current `site/` prefix and purges the Pull Zone cache
after a successful upload. Bunny credentials are never written to the
repository or emitted in the workflow log.
