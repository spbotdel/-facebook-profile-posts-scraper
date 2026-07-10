# Changelog

## 0.1.0-beta.1 - 2026-07-10

- Forced profile collection through Facebook's public `?sk=posts` route instead of the mixed default profile surface.
- Restricted cursor extraction to plausible profile-timeline connections, ignoring route labels and unrelated Relay cursors.
- Added bounded recovery for transient profile 404s, Facebook request rejections, and GraphQL rate limits.
- Prevented nested shared stories and memories from being emitted as separate timeline posts while preserving their text as an outer-post fallback.
- Added `scripts/backfill-profile.mjs` for checkpointed historical exports to JSONL, CSV, and Markdown.
- Validated a complete text-only public-profile backfill of 462 posts over 303 GraphQL pages, from July 2016 through July 2026.

## 0.1.0-beta.0 - 2026-07-10

- Added public personal-profile URL and numeric-ID resolution.
- Added logged-out profile timeline GraphQL queries and newest-to-older pagination.
- Added dynamic GraphQL document-ID discovery and fallback IDs.
- Added public HTML prefetch fallback for initial posts and cursors.
- Added bounded residential proxy session rotation for Facebook rate limits.
- Added direct and nested/shared post text extraction.
- Added Facebook publication timestamps, stable post IDs and URLs, author fields, and best-effort engagement.
- Added full public photo-set expansion with permalink fallback and completeness diagnostics.
- Added multi-profile isolation, `knownPostIds`, `sinceDate`, and historical `startCursor` support.
- Added output schemas, per-profile `SUMMARY`, cloud test fixtures, and unit tests.
