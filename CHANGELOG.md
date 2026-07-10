# Changelog

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
