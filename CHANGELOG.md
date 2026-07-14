# Changelog

## 1.0.1 - 2026-07-14

- Rebuilt the Store README around user intent, measured validation, all-photo recovery, monitoring, historical backfills, pricing, and troubleshooting.
- Added an explicit AI-agent selection contract, hosted Apify MCP configuration, natural-language prompts, and mandatory post-run coverage checks.
- Clarified one-post-per-result pricing, nested/shared-card text recovery, Facebook publication timestamps, media completeness evidence, and public-profile boundaries.
- Improved Actor and input-schema descriptions for Store and MCP discovery without changing collection behavior.

## 1.0.0 - 2026-07-11

- Promoted the validated public-profile feed and all-photo recovery pipeline to the first production release.
- Added pay-per-event budget awareness so `maximum cost per run` caps collection before expensive feed and album work.
- Added `partial_charge_limit`, per-profile requested/effective limits, skipped-profile diagnostics, and run-level charging metadata.
- Bounded production memory to 512-1024 MB with a 1024 MB default.
- Kept the existing per-profile failure isolation, incremental boundaries, historical cursors, and auditable photo completeness contract.

## 0.1.0-beta.3 - 2026-07-11

- Skipped deleted or access-restricted Facebook timeline cards by default so empty unavailable entries no longer consume requested or billable post slots.
- Added `includeUnavailablePosts` for audit workflows that intentionally need those timeline cards.
- Added per-profile `unavailablePostsSkipped` diagnostics.

## 0.1.0-beta.2 - 2026-07-11

- Excluded Facebook `.kf` keyframe assets from photo results after content-type validation showed they are animation metadata rather than images.
- Added Facebook-declared album counts and explicit count-satisfaction fields for auditable `+N` completeness.
- Added bounded residential proxy-country fallback for profile-level rate limits and transient Facebook rejections.
- Added country-attempt diagnostics to each profile summary.

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
