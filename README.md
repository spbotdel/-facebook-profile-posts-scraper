# Facebook Profile Posts & All Photos Scraper

Collect posts exposed on public Facebook personal profiles as normalized JSON. The Actor starts from the newest visible posts and returns text, Facebook publication timestamps, stable identifiers, author data, engagement when available, and all recoverable photo URLs, including photos hidden behind `+N` album grids.

The production pipeline has been validated in Apify cloud across shallow, incremental, multi-profile, and deep-history runs. Private, friends-only, and login-only content is intentionally out of scope.

[Open the Actor on Apify](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper)

## Why use this Actor?

| Capability | What you get |
| --- | --- |
| Newest public profile posts | A chronological newest-to-older feed, with pinned posts omitted by default |
| Full post text | Direct text plus fallback extraction for nested/shared attachment text |
| Facebook publish time | `created_at` from Facebook GraphQL `creation_time`, not the scrape time |
| All recoverable photos | Album and `+N` grids are expanded through public media-set routes |
| Stable deduplication | `source_post_id`, `source_url`, and numeric `source_profile_id` |
| Incremental monitoring | Stop on `knownPostIds` or `sinceDate` instead of importing old duplicates |
| Historical backfill | Continue toward older posts with `SUMMARY.pointer.nextCursor` |
| Multi-profile isolation | A failed or rate-limited profile does not discard healthy profile results |
| Bounded geo fallback | A rate-limited profile can retry through alternate residential proxy countries |
| Useful-result accounting | Deleted or access-restricted attachment cards are skipped by default and do not consume requested post slots |
| Agent-ready output | Clear input fields, deterministic JSON rows, output schema, and run diagnostics |

## Pricing

The Store price is **$4.99 per 1,000 returned posts**. Platform usage is included, so buyers do not receive a second compute or proxy charge from this Actor.

Each dataset row is one billable public Facebook profile post. All photo URLs recovered for that post are included in the same result. The small Actor-start event is shown separately by Apify.

If a caller sets `maximum cost per run`, the Actor calculates how many result rows still fit, reduces collection before feed and album work, and stops before processing additional profiles. A budget-bounded run reports `partial_charge_limit` and charging details in `SUMMARY`; it does not silently pretend that the requested coverage completed.

## Quick start

```json
{
  "profileUrls": [
    "https://www.facebook.com/example.profile"
  ],
  "maxPostsPerProfile": 20,
  "expandAllPhotos": true,
  "omitPinnedPosts": true
}
```

Accepted profile targets include vanity handles, `profile.php?id=...` URLs, `/people/.../<id>` URLs, and numeric profile IDs. Facebook Groups, Pages, Marketplace listings, and direct post URLs are different surfaces and are not accepted as profile targets.

## Common workflows

### Daily monitoring without old duplicates

Every scheduled run starts at the newest visible post. Pass one or more post IDs already stored by your pipeline:

```json
{
  "profileUrls": ["https://www.facebook.com/example.profile"],
  "maxPostsPerProfile": 100,
  "knownPostIds": ["1234567890123456"],
  "expandAllPhotos": true
}
```

The Actor stops before the known post and returns only newer rows. Store `source_post_id` with a unique constraint in your database as a second deduplication layer.

You can also use a date boundary:

```json
{
  "profileUrls": ["https://www.facebook.com/example.profile"],
  "maxPostsPerProfile": 200,
  "sinceDate": "2026-07-01T00:00:00Z"
}
```

### Historical backfill

The timeline cursor moves from newer posts toward older posts. For a deep backfill, run one profile at a time, read `SUMMARY.profiles[0].pointer.nextCursor`, and pass it as `startCursor` in the next run.

Do not reuse yesterday's backfill cursor to look for new posts. A cursor continues into older history; daily monitoring must start from the profile head and use `knownPostIds` or `sinceDate`.

For a checkpointed local export through the Apify API, use the bundled runner:

```bash
npm run backfill:profile -- \
  --profile "https://www.facebook.com/example.profile" \
  --output "./outputs/example-profile" \
  --chunk 1000 \
  --max-total 10000
```

It writes deduplicated JSONL, CSV, Markdown, per-batch snapshots, and resumable state. Set `APIFY_TOKEN` or authenticate the Apify CLI first; credentials are never written to the export.

## Output example

```json
{
  "source_platform": "facebook",
  "source_profile_id": "100013987020455",
  "source_profile_name": "Trang Phan",
  "source_post_id": "2513975625745314",
  "source_url": "https://www.facebook.com/.../posts/...",
  "created_at": "2026-07-08T08:36:46Z",
  "created_at_source": "graphql_creation_time",
  "raw_text": "Post text...",
  "author": {
    "source_user_id": "100013987020455",
    "name": "Trang Phan",
    "url": "https://www.facebook.com/..."
  },
  "stats": {
    "reactions": null,
    "comments": null,
    "shares": null
  },
  "media": [
    {
      "media_type": "photo",
      "source_url": "https://scontent...fbcdn.net/...jpg",
      "source": "media_set",
      "index": 1
    }
  ],
  "media_preview_count": 5,
  "media_expanded_count": 19,
  "media_final_count": 19,
  "media_completeness": "expanded",
  "coverage_status": "complete_target_reached"
}
```

See [Output contract](docs/OUTPUT_CONTRACT.md) for field semantics and [Operations](docs/OPERATIONS.md) for monitoring and failure handling.

## Photo completeness

Facebook often exposes only five preview images while the post contains more. When `expandAllPhotos` is enabled, the Actor discovers public `mediaset_token` values and expands those photo sets. It never replaces a larger feed set with a smaller expansion result.

Use these fields when auditing media:

| Field | Meaning |
| --- | --- |
| `media_preview_count` | Photo URLs visible in the feed payload |
| `media_expanded_count` | Photo URLs recovered from media-set or permalink expansion |
| `media_final_count` | Final photo count returned in `media` |
| `media_declared_count` | Album attachment count declared by Facebook when exposed |
| `media_declared_count_satisfied` | Whether recovered URLs meet the declared count |
| `media_completeness` | Expansion outcome such as `expanded`, `feed_complete`, or `likely_incomplete_plusN` |
| `media_review_severity` | `none`, `low`, `medium`, or `high` audit signal |

Photo URLs are Facebook CDN URLs and may be tokenized or expire. Download or mirror them promptly if your lawful workflow requires durable media storage.

## Run summary and health

Each run stores `SUMMARY` in the default key-value store. It includes a separate outcome for every profile, requested and effective post limits, posts returned, pages read, stop reason, coverage status, media counts, warnings, and an older-history cursor. `SUMMARY.charging` records the pricing model, result price, user run limit, and whether that limit reduced coverage.

Facebook can leave public timeline cards whose attached content was deleted or access-restricted. By default the Actor skips these empty cards, continues toward older posts, and reports the unique count in `SUMMARY.profiles[].unavailablePostsSkipped`. Set `includeUnavailablePosts: true` only when an audit intentionally needs those diagnostic rows.

The overall run health is:

- `healthy`: every selected profile completed its bounded task.
- `partial`: at least one profile returned partial coverage or another profile failed while usable results remain.
- `failed`: all selected profiles failed.

The Actor keeps successful profile rows even if another profile is rate-limited or unavailable.

## Cloud validation

The release was tested on Apify residential proxy sessions against three public personal profiles in July 2026.

| Scenario | Result | Duration | Platform usage |
| --- | ---: | ---: | ---: |
| One profile, feed only | 3 newest posts, 13 preview photos | 18 s | $0.0035 |
| One profile, all photos | 5 newest posts, 42 final photo URLs | 19 s | $0.0088 |
| Photo-heavy profile | 5 posts, 57 final photo URLs; albums expanded to 6, 19, 11, 9, and 12 photos | part of a 64 s multi-profile run | $0.0133 total run |
| Incremental known-ID boundary | 0 duplicate rows, `complete_until_known_post` | 55 s during rate-limit recovery | $0.0069 |
| Deep public-profile text backfill | 462 posts, 303 timeline pages, no empty text/dates/IDs/URLs, `complete_feed_exhausted` | 15 m 38 s | $0.3560 |
| Three-profile all-photo pilot | 60 posts, 386 photo URLs, 40/40 declared albums satisfied, 0 high-risk media rows | 5 m 03 s | $0.1283 |
| Three separate deep all-photo runs | 300 posts, 1,428 photo URLs, 153/153 declared albums satisfied, 0 duplicate IDs, 0 high-risk media rows | 2 m 39 s to 4 m 50 s per profile | $0.4961 total |
| Unavailable-card regression | 100 useful posts after skipping 33 deleted/restricted cards; 600 photo URLs; 55/55 declared albums satisfied | 3 m 31 s | $0.1188 |

A six-file download smoke test across all three profiles returned HTTP 200 and `image/jpeg` for every sampled CDN URL. The validation found and removed Facebook `.kf` keyframe metadata that superficially resembles a media URL but is not an image.

These are observed validation runs, not a fixed SLA. Facebook response time, rate limiting, profile shape, album size, and proxy traffic change cost and duration.

Deep feeds can contain a long tail of duplicate or non-post timeline units before Facebook reports exhaustion. The Actor follows the cursor to the explicit end rather than treating a temporary no-new-post plateau as proof that history is complete.

## Limitations

- Public personal profiles only. This Actor does not bypass privacy controls, login walls, checkpoints, or Facebook security.
- A public-looking profile may expose fewer posts to logged-out sessions than to a signed-in browser.
- Deleted or access-restricted attached content is skipped by default. Use `includeUnavailablePosts` for forensic timeline audits rather than ordinary post collection.
- Engagement counters are returned when the public payload exposes them; otherwise values are `null`.
- Video URLs may be reported when exposed, but videos are not downloaded, transcribed, or guaranteed complete. The product focus is posts and photos.
- Facebook can change internal GraphQL documents and HTML structure without notice. The Actor includes document-ID discovery, fallback IDs, fresh proxy sessions, and explicit diagnostics, but maintenance is still part of this surface.

## API and agents

Run the Actor through the Apify API, SDK, CLI, schedules, webhooks, or Apify MCP server. Agent callers should:

1. Set `profileUrls` and a bounded `maxPostsPerProfile`.
2. Use `knownPostIds` for recurring newest-post monitoring.
3. Read dataset rows as results and the `SUMMARY` key for coverage and retry decisions.
4. Treat `partial` as usable per-profile output plus an explicit retry queue, not as an all-or-nothing failure.

## Development

```bash
npm install
npm run check
npm test
apify validate-schema
```

Deploy to your own Apify account:

```bash
apify login
apify push
```

The implementation uses direct HTTP and logged-out Facebook GraphQL requests. It does not launch Playwright or ship a Facebook session.

See [Architecture](docs/ARCHITECTURE.md) for the processing pipeline.

Maintainers can use the [Store publication checklist](docs/STORE_PUBLICATION.md) for the release and customer-account smoke test.

## Responsible use

Use this Actor only for lawful collection of content that Facebook exposes publicly. Respect applicable law, platform terms, intellectual property, personal-data obligations, and the rights of profile owners. Do not use it to evade access controls or harass individuals.

## License and support

MIT. Report reproducible problems through [GitHub Issues](https://github.com/spbotdel/-facebook-profile-posts-scraper/issues) or email `spbotdel@gmail.com`.
