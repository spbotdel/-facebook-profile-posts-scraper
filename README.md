# Facebook Profile Posts & All Photos Scraper

[![Run on Apify](https://img.shields.io/badge/Run%20on-Apify-2f7df6)](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper)
[![Source on GitHub](https://img.shields.io/badge/source-GitHub-24292f)](https://github.com/spbotdel/-facebook-profile-posts-scraper)
[![AI agents](https://img.shields.io/badge/AI%20agents-MCP%20ready-6f42c1)](https://docs.apify.com/integrations/mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Scrape **latest or historical posts from public Facebook personal profiles** into clean, agent-ready JSON. Get post text, Facebook publication timestamps, stable post IDs and URLs, authors, engagement counters, best-effort video metadata, and **all recoverable photo URLs**, including photos hidden behind Facebook `+N` album grids.

> **One paid result = one public Facebook profile post.** Expanded photo URLs are included in the same dataset row and the same per-post price. No Facebook account, cookies, credentials, or browser session are required from the user.

| Best for | Not designed for |
| --- | --- |
| Public personal profiles, newest-post monitoring, historical backfills, photo-heavy posts, creator/public-figure research, AI agents, MCP, API and scheduled pipelines | Private or friends-only profiles, Facebook Pages or Groups, Marketplace, global keyword search, expanded comments, guaranteed video downloads or transcripts |

**Start here:** [Run the Actor](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper) · [Latest-post task](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/latest-public-facebook-profile-posts) · [All-photos task](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/facebook-profile-posts-with-all-photos) · [GitHub](https://github.com/spbotdel/-facebook-profile-posts-scraper) · [Agent guide](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/AGENT_GUIDE.md) · [Output contract](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/OUTPUT_CONTRACT.md)

## Table of contents

- [Why this Actor](#why-this-actor)
- [Quick start](#quick-start)
- [What data you get](#what-data-you-get)
- [How all-photo recovery works](#how-all-photo-recovery-works)
- [Run recipes](#run-recipes)
- [AI agents and MCP](#ai-agents-and-mcp)
- [API and integrations](#api-and-integrations)
- [Reliability and troubleshooting](#reliability-and-troubleshooting)
- [Pricing](#pricing)
- [FAQ](#faq)
- [Limitations and responsible use](#limitations-and-responsible-use)
- [Support and related tools](#support-and-related-tools)

## Why this Actor

### The profile-timeline problem

A public Facebook profile is not a clean chronological API. Pinned posts can look recent, shared cards can hide their useful text in nested structures, deleted attachments can consume result slots, and photo albums often expose five previews plus a `+N` overlay while keeping the rest behind a separate media set.

This Actor treats those details as part of the product:

1. Resolve the public personal-profile timeline and start from its newest visible posts.
2. Omit pinned older posts by default.
3. Recover direct or nested/shared-card text.
4. Detect media-set tokens and declared album counts.
5. Expand recoverable photo sets and retry suspicious rows.
6. Expose coverage and media-quality evidence instead of calling every incomplete response a triumph.

### Feature comparison

| Capability | Basic profile-post extraction | This Actor |
| --- | --- | --- |
| Public profile post text | Usually direct text only | Direct text plus recoverable nested/shared-card text |
| Stable post ID and permalink | Varies | Returned when Facebook exposes them |
| Facebook publication time | Varies | `created_at` with `created_at_source` provenance |
| Newest-post monitoring | Pinned/old rows can interfere | Pinned omission, `knownPostIds` and `sinceDate` |
| Feed preview photos | Usually | Yes |
| Hidden `+N` photo set | Often truncated | Media-set expansion, permalink fallback and retry |
| Album-count verification | Rare | Declared count and satisfaction flag when exposed |
| Unavailable cards | Can consume result slots | Skipped by default; optional diagnostic output |
| Multi-profile failures | One target can stop the batch | Per-profile isolation and separate diagnostics |
| Historical continuation | Often opaque | Cursor-backed chunks up to 1,000 posts per profile |
| AI-agent selection | Generic input/output | Explicit schemas, MCP prompts, `llms.txt` and `SUMMARY` |
| Result grain | Can be unclear | Exactly one dataset item per accessible post |

### Measured validation

The public release was tested in Apify cloud against real public profiles, photo-heavy albums, nested posts, rate limits and deep pagination. These are observed results, not a promise that Facebook will remain emotionally stable.

| Validation | Posts | Timeline pages | Final photo URLs | Declared albums satisfied | Missing core fields |
| --- | ---: | ---: | ---: | ---: | ---: |
| Deep public-profile history | 462 | 303 | Preview-only test | n/a | 0 IDs, dates, URLs or text |
| Three-profile all-photo pilot | 60 | Multiple | 386 | 40 / 40 | 0 |
| Three deeper all-photo runs | 300 | Multiple | 1,428 | 153 / 153 | 0 |

Individual validated albums expanded to 6, 9, 11, 12 and 19 photos. An unavailable-card regression still returned 100 useful posts after skipping 33 deleted or restricted cards. These observations are validation evidence, not an SLA.

### Trust signals

| Signal | Details |
| --- | --- |
| Open source | Review the implementation on [GitHub](https://github.com/spbotdel/-facebook-profile-posts-scraper). |
| CI tested | Parser, media, retry, charging, proxy and settings tests run automatically. |
| Limited permissions | The Actor uses Apify's least-privilege execution model. |
| No user Facebook credentials | Input accepts public profile URLs, not Facebook passwords or cookies. |
| Structured output | One post per row with IDs, dates, text, media and quality fields. |
| Explicit diagnostics | `SUMMARY` distinguishes complete boundaries, exhausted public history, partial runs and budget limits. |
| Agent documentation | [llms.txt](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/llms.txt), [Agent guide](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/AGENT_GUIDE.md) and [MCP guide](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/MCP_USAGE.md). |

## Quick start

### Run from Apify Console

1. Open the [Actor input page](https://console.apify.com/actors/dh91XwP7wQscfKkxU/input).
2. Paste one or more public Facebook personal-profile URLs.
3. Keep **Expand all photos** and **Omit pinned posts** enabled.
4. Set the number of posts per profile and click **Start**.

Minimal input:

```json
{
  "profileUrls": [
    "https://www.facebook.com/zuck"
  ],
  "maxPostsPerProfile": 20,
  "expandAllPhotos": true,
  "omitPinnedPosts": true
}
```

Each default-dataset item is one profile post. After the run, also read the `SUMMARY` record from the default key-value store for per-profile coverage, media totals, warnings, charging boundaries and continuation cursors.

### Supported profile URL formats

```text
https://www.facebook.com/username
https://www.facebook.com/profile.php?id=100000000000000
https://www.facebook.com/people/Name/100000000000000/
100000000000000
```

Use a public personal-profile URL, handle or numeric ID. Do not submit a Page, Group, Marketplace listing or direct post URL.

### Multiple profiles in one run

```json
{
  "profileUrls": [
    "https://www.facebook.com/lam.tp.chien.phuong",
    "https://www.facebook.com/trang.phan.298890",
    "https://www.facebook.com/zuck"
  ],
  "maxPostsPerProfile": 50,
  "expandAllPhotos": true,
  "omitPinnedPosts": true,
  "mediaExpansionConcurrency": 3
}
```

Up to 20 profiles can be processed in one run. Each profile is isolated: a temporary failure on one target does not erase healthy rows from the others. Inspect every entry in `SUMMARY.profiles[]`.

## What data you get

### One normalized row per post

| Data | Main fields |
| --- | --- |
| Profile identity | `source_profile_id`, `source_profile_url`, `source_profile_name`, `source_profile_type` |
| Post identity | `source_post_id`, `source_url`, `rank` |
| Time | `created_at`, `created_at_source`, `created_at_precision`, `creation_time` |
| Text | `raw_text`, `text_source`, `text_missing_reason`, `text_candidates` |
| Author | `author.source_user_id`, `author.name`, `author.url` |
| Engagement | `stats.reactions`, `stats.comments`, `stats.shares` when exposed |
| Photos | `media[].source_media_id`, `source_url`, `thumbnail_url`, dimensions and source |
| Video metadata | `video_urls[]` when direct public URLs are exposed |
| Media audit | preview/expanded/final/declared counts, completeness, risk and review severity |
| Run context | `coverage_status`, `warnings` |

<details>
<summary>Abridged JSON result</summary>

```json
{
  "record_type": "post",
  "source_platform": "facebook",
  "source_profile_id": "100013987020455",
  "source_profile_url": "https://www.facebook.com/example.profile",
  "source_profile_name": "Example Profile",
  "source_post_id": "2513975625745314",
  "source_url": "https://www.facebook.com/example.profile/posts/2513975625745314/",
  "created_at": "2026-07-08T08:36:46Z",
  "created_at_source": "graphql_creation_time",
  "raw_text": "Public post text...",
  "text_source": "direct_message",
  "author": {
    "source_user_id": "100013987020455",
    "name": "Example Profile",
    "url": "https://www.facebook.com/example.profile"
  },
  "stats": {
    "reactions": 18,
    "comments": 3,
    "shares": 1
  },
  "media": [
    {
      "source_media_id": "1234567890",
      "media_type": "photo",
      "source_url": "https://scontent...fbcdn.net/photo.jpg",
      "thumbnail_url": "https://scontent...fbcdn.net/photo.jpg",
      "source": "media_set",
      "index": 1
    }
  ],
  "media_preview_count": 5,
  "media_expanded_count": 19,
  "media_final_count": 19,
  "media_declared_count": 19,
  "media_declared_count_satisfied": true,
  "media_completeness": "expanded",
  "media_review_severity": "none",
  "coverage_status": "complete_target_reached"
}
```

</details>

### Run-level `SUMMARY`

The default key-value store receives one `SUMMARY` record. Agents and production pipelines should inspect it before accepting a run as complete.

| Field | Why it matters |
| --- | --- |
| `profiles[]` | Per-profile result count, attempts, stop reason, coverage and pointer. |
| `profiles[].coverageStatus` | Explains whether the target/boundary was reached or collection became partial. |
| `profiles[].pointer.nextCursor` | Cursor for the next older-history chunk. |
| `outputPosts` | Total post rows written. |
| `media` diagnostics | Final photos, declared-count satisfaction and review distribution. |
| `charging` | Price event, maximum charge, effective limits and budget state. |
| `skippedProfilesByChargeLimit` | Profiles not started because the caller's run budget was exhausted. |
| `warnings` | Non-fatal conditions that deserve inspection. |

See the complete [output contract](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/OUTPUT_CONTRACT.md).

### Export formats

Use Apify Dataset to export results as JSON, JSONL, CSV, Excel, XML or RSS, or send them through a webhook/integration to your own database.

## How all-photo recovery works

When `expandAllPhotos=true`, media is resolved in stages:

```text
Public profile timeline
    -> preview photos
    -> media-set token and declared-count detection
    -> photo-set expansion
    -> permalink fallback for suspicious +N rows
    -> retry and feed preservation
    -> final media list + quality fields
```

| Field | Interpretation |
| --- | --- |
| `media_preview_count` | Valid photo URLs exposed in the timeline payload. |
| `media_expanded_count` | Photos found through media-set expansion. |
| `media_final_count` | Final deduplicated photo count returned. |
| `media_declared_count` | Attachment count declared by Facebook when exposed. |
| `media_declared_count_satisfied` | Whether the final count meets that declaration. |
| `media_completeness` | Final recovery classification. |
| `media_review_severity` | `none`, `low`, `medium` or `high`; review `medium` and `high`. |
| `media_plus_n_risk` | `true` when evidence suggests Facebook hid more photos than were recovered. |

The Actor returns source photo URLs, not binary image files. Facebook CDN URLs can expire, so download lawful media promptly when durable storage is required.

## Run recipes

| Goal | Recommended configuration |
| --- | --- |
| Small evaluation | 10-20 posts, all photos and pinned omission enabled |
| Latest posts | Start at the profile head with no `startCursor` |
| Daily monitoring | Start at the head and stop with `knownPostIds` or `sinceDate` |
| Photo-complete collection | Keep `expandAllPhotos=true` and concurrency at `3` |
| Faster preview-only test | Set `expandAllPhotos=false` |
| Historical backfill | One profile, up to 1,000 posts, then continue with `pointer.nextCursor` |
| Multi-profile monitoring | Up to 20 profiles; validate each entry in `SUMMARY.profiles[]` |
| Deleted/restricted-card audit | Set `includeUnavailablePosts=true` |

### Latest public posts

```json
{
  "profileUrls": ["PROFILE_URL"],
  "maxPostsPerProfile": 50,
  "expandAllPhotos": true,
  "omitPinnedPosts": true
}
```

Do not pass an old `startCursor` when the goal is newest posts. A backfill cursor points toward older history.

### Daily incremental monitoring

Start at the newest profile posts every time and stop before a post already stored by your system:

```json
{
  "profileUrls": ["PROFILE_URL"],
  "maxPostsPerProfile": 100,
  "knownPostIds": ["LAST_STORED_POST_ID"],
  "expandAllPhotos": true,
  "omitPinnedPosts": true
}
```

Alternative date boundary:

```json
{
  "profileUrls": ["PROFILE_URL"],
  "maxPostsPerProfile": 200,
  "sinceDate": "2026-07-01T00:00:00Z",
  "expandAllPhotos": true,
  "omitPinnedPosts": true
}
```

Healthy incremental runs normally finish with `complete_until_known_post` or `complete_until_since_date`. Keep a unique constraint on `source_post_id`, with `source_url` as a fallback.

### Historical backfill

Request up to 1,000 posts from one profile in one run:

```json
{
  "profileUrls": ["PROFILE_URL"],
  "maxPostsPerProfile": 1000,
  "expandAllPhotos": true,
  "omitPinnedPosts": true,
  "mediaExpansionConcurrency": 3
}
```

For older history:

1. Read `SUMMARY.profiles[0].pointer.nextCursor` after the first run.
2. Pass that value as `startCursor` in the next run.
3. Store the new cursor only after the preceding batch is accepted.
4. Repeat until no next cursor remains or the required history is complete.

```json
{
  "profileUrls": ["PROFILE_URL"],
  "maxPostsPerProfile": 1000,
  "startCursor": "PREVIOUS_SUMMARY_NEXT_CURSOR",
  "expandAllPhotos": true,
  "omitPinnedPosts": true,
  "mediaExpansionConcurrency": 3
}
```

The repository also includes `npm run backfill:profile` for checkpointed JSONL, CSV and Markdown exports. See [operations](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/OPERATIONS.md).

### Unavailable timeline cards

Deleted or access-restricted attachment cards are skipped by default so they do not consume useful result slots. Set `includeUnavailablePosts=true` only when an audit intentionally needs diagnostic rows with `text_missing_reason=content_unavailable`.

## AI agents and MCP

This Actor is designed to be discovered, configured and validated by agents as well as people.

### Agent selection contract

Choose this Actor when the user asks for:

- posts from public Facebook personal profiles;
- latest posts or recurring profile monitoring;
- Facebook publication dates, stable post IDs and permalinks;
- direct and nested/shared post text;
- every recoverable public photo, including hidden `+N` album grids;
- structured JSON for translation, classification, research, archiving or database import;
- resumable historical profile backfills;
- Apify API, MCP, schedules, webhooks or no-code automation.

Choose another tool for Facebook Pages, Groups, Marketplace, global search, private/friends-only profiles, profile-metadata enrichment, full comment threads or guaranteed video extraction.

### Connect through Apify MCP

The hosted [Apify MCP server](https://docs.apify.com/integrations/mcp) exposes Store Actors to ChatGPT, Claude, Codex, Cursor and other MCP clients.

Minimal configuration:

```json
{
  "mcpServers": {
    "apify": {
      "url": "https://mcp.apify.com?tools=spbotdel/facebook-profile-posts-all-photos-scraper"
    }
  }
}
```

Authenticate through OAuth when prompted, or configure the Apify MCP server with an Apify token.

### Prompts that work well

- `Get the latest 20 public posts from this Facebook personal profile. Return text, Facebook date, post URL, author, engagement and all photo URLs.`
- `Monitor these public profiles. Omit pinned posts, stop at these known post IDs and report each profile's coverage separately.`
- `Backfill 1,000 older posts from this public profile and return SUMMARY.profiles[0].pointer.nextCursor.`
- `Return posts where media_final_count is greater than 5. Flag rows where media_declared_count_satisfied is false.`

### Required agent behavior after a run

1. Read default-dataset rows.
2. Read `SUMMARY` from the default key-value store.
3. Check every `SUMMARY.profiles[].coverageStatus` before claiming complete coverage.
4. Keep healthy profile rows when another target is partial; retry only the affected profile.
5. Review rows with `media_review_severity=medium` or `high` or an unsatisfied declared count.
6. Store known post IDs for monitoring or `pointer.nextCursor` for older backfills.
7. Never use an old backfill cursor to look for tomorrow's new posts.

More context: [Agent guide](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/AGENT_GUIDE.md) · [MCP/API guide](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/MCP_USAGE.md) · [llms.txt](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/llms.txt)

## API and integrations

Actor ID:

```text
spbotdel/facebook-profile-posts-all-photos-scraper
```

### REST API

```bash
curl -X POST "https://api.apify.com/v2/acts/spbotdel~facebook-profile-posts-all-photos-scraper/runs?token=$APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profileUrls": ["https://www.facebook.com/zuck"],
    "maxPostsPerProfile": 20,
    "expandAllPhotos": true,
    "omitPinnedPosts": true
  }'
```

### Python

```python
import os
from apify_client import ApifyClient

client = ApifyClient(os.environ['APIFY_TOKEN'])
run = client.actor('spbotdel/facebook-profile-posts-all-photos-scraper').call(run_input={
    'profileUrls': ['https://www.facebook.com/zuck'],
    'maxPostsPerProfile': 20,
    'expandAllPhotos': True,
    'omitPinnedPosts': True,
})

posts = client.dataset(run['defaultDatasetId']).list_items(clean=True).items
summary_record = client.key_value_store(run['defaultKeyValueStoreId']).get_record('SUMMARY')
summary = summary_record.get('value') if summary_record else None

print(len(posts), summary['profiles'][0]['coverageStatus'])
```

### Node.js

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const run = await client
    .actor('spbotdel/facebook-profile-posts-all-photos-scraper')
    .call({
        profileUrls: ['https://www.facebook.com/zuck'],
        maxPostsPerProfile: 20,
        expandAllPhotos: true,
        omitPinnedPosts: true,
    });

const { items: posts } = await client.dataset(run.defaultDatasetId).listItems();
const summaryRecord = await client
    .keyValueStore(run.defaultKeyValueStoreId)
    .getRecord('SUMMARY');

console.log(posts.length, summaryRecord.value.profiles[0].coverageStatus);
```

### Apify CLI

```bash
apify call spbotdel/facebook-profile-posts-all-photos-scraper -p '{"profileUrls":["https://www.facebook.com/zuck"],"maxPostsPerProfile":20,"expandAllPhotos":true,"omitPinnedPosts":true}'
```

### Schedules, webhooks and no-code tools

- Use **Apify Schedules** for daily or hourly profile monitoring.
- Add a webhook on `ACTOR.RUN.SUCCEEDED` to import the dataset into your application.
- Connect through Apify integrations in **Make, n8n or Zapier**.
- Export datasets directly to JSON, CSV or Excel for manual workflows.

## Reliability and troubleshooting

### Recommended settings

| Situation | Recommendation |
| --- | --- |
| First run on a new profile | Start with 10-20 posts and verify public visibility. |
| Normal all-photo run | Keep `mediaExpansionConcurrency=3` and photo expansion enabled. |
| Latest-post automation | Keep `omitPinnedPosts=true` and do not pass `startCursor`. |
| Deep history | Use one profile per backfill and persist a cursor only after successful import. |
| Several profiles | Inspect each profile in `SUMMARY.profiles[]`; retry only failed targets. |
| Durable image storage | Download CDN URLs soon after collection. |
| Forensic card audit | Enable `includeUnavailablePosts` only when those rows are useful. |

### Coverage statuses

| `SUMMARY.profiles[].coverageStatus` | Meaning | Action |
| --- | --- | --- |
| `complete_target_reached` | Requested post count was returned. | Use the rows normally. |
| `complete_until_known_post` | Monitoring reached a stored post ID. | Healthy incremental run. |
| `complete_until_since_date` | Monitoring reached the date boundary. | Healthy incremental run. |
| `complete_feed_exhausted` | Facebook exposed no older public page. | Backfill reached the visible end. |
| `no_public_posts` | No public post rows were visible. | Verify the profile in a logged-out browser. |
| `partial_no_cursor` | Rows exist but no continuation cursor was exposed. | Keep rows; retry if more history is required. |
| `partial_stalled_cursor` | Facebook repeated a cursor. | Keep rows and retry from a fresh run. |
| `partial_page_limit` | An internal safety page limit was reached. | Continue from the returned cursor when available. |
| `partial_error` | Earlier rows survived a later page failure. | Retry only this profile. |
| `partial_charge_limit` | The caller's maximum run charge reduced coverage. | Increase the budget or accept the bounded result. |

### Why did I receive fewer posts than requested?

Common reasons:

- the profile exposes fewer posts to logged-out visitors;
- a known-post or date boundary was reached;
- Facebook stopped returning an older cursor;
- the caller's maximum run charge bounded the result;
- the profile became private, restricted or temporarily rate-limited;
- deleted/restricted cards were skipped because `includeUnavailablePosts=false`.

Read the profile entry in `SUMMARY`; do not infer the reason from row count alone.

### A public profile returned zero posts

Open the exact profile in a logged-out browser and confirm that its Posts surface is public. Then retry the profile alone. Public visibility can differ from what a signed-in account sees.

### Photo URLs stopped working later

Facebook CDN links can be signed or temporary. Download lawful media soon after the run when durable storage is required.

## Pricing

The Store price is **$4.99 per 1,000 returned Facebook profile posts**. Platform usage is included under the current Store pricing configuration.

Apify also displays a tiny synthetic Actor-start event. The main billable event is one dataset post result.

| Included in one post result | Additional per-photo charge |
| --- | ---: |
| Post text and text-source diagnostics | $0 |
| Facebook publication timestamp | $0 |
| Stable post/profile identifiers and URLs | $0 |
| Author and engagement fields | $0 |
| Feed preview photos | $0 |
| Expanded `+N` album photo URLs | $0 |
| Media completeness and coverage diagnostics | $0 |

You pay per returned post, **not per photo URL**. A post with 19 recovered photos is still one result.

When a caller sets `maximum cost per run`, the Actor reduces collection before expensive feed and album work. A budget-bounded run reports `partial_charge_limit` instead of silently claiming complete coverage.

## FAQ

### Does this Actor require Facebook login or cookies?

No. It uses logged-out public Facebook routes and Apify proxy sessions. Users are not asked for Facebook credentials, cookies or browser profiles.

### Does it work with private or friends-only profiles?

No. Only posts Facebook exposes publicly to logged-out sessions are in scope.

### Does it scrape Facebook Pages or Groups?

No. This Actor is specialized for personal profiles. Use a Page or Group Actor for those surfaces.

### Does it collect profile bio, employment, email or phone?

No. The product is focused on profile **posts**, not profile-metadata or contact enrichment.

### Does it return every photo?

It returns all **recoverable public photo URLs** and specifically expands `+N` album grids. Facebook can still hide, remove or expire media, so use declared counts and media-review fields for audit.

### How can I audit possible missing photos?

Check `media_declared_count_satisfied`, `media_completeness`, `media_review_severity`, `media_plus_n_risk`, `media_preview_count` and `media_final_count`.

### Is `created_at` the Facebook date or scrape time?

`created_at` is Facebook's publication time from GraphQL creation metadata. Run timestamps live separately in `SUMMARY`.

### Does it recover text from shared or attached posts?

Yes. The parser ranks direct and nested text candidates and records the selected source in `text_source`. Deleted or inaccessible attachment cards can still have no recoverable text.

### Can it monitor only new posts?

Yes. Start every run at the profile head, omit pinned posts and pass `knownPostIds` or `sinceDate` as the stop boundary.

### Can it backfill years of profile history?

Yes, when that history remains public. Request up to 1,000 posts in a run and continue toward older history with `SUMMARY.profiles[].pointer.nextCursor`.

### What about video?

`video_urls` contains best-effort direct public media URLs when Facebook exposes them. Video download, long-term availability and transcripts are not guaranteed.

### Does it download images into Apify storage?

No. It returns source photo URLs. Downloading and durable storage belong in the caller's downstream pipeline.

### Can an AI agent use this Actor?

Yes. Inputs are explicit, output is one post per row, pricing is deterministic, and `SUMMARY` provides coverage evidence for MCP/API workflows.

## Limitations and responsible use

| Limitation | Detail |
| --- | --- |
| Public personal profiles only | No friends-only, private or login-only content. |
| No access bypass | The Actor does not bypass login walls, checkpoints, privacy controls or Facebook security. |
| Public visibility varies | A profile can expose fewer posts to logged-out sessions than to a signed-in browser. |
| Pages and Groups | These use different timeline surfaces and are intentionally out of scope. |
| Comments | Counters may be returned; full threads are not expanded. |
| Videos | Best-effort URLs only; download and transcript completeness are not guaranteed. |
| Images | Source URLs are returned; image binaries are not stored by the Actor. |
| Expiring CDN URLs | Mirror lawful media promptly when durable storage is needed. |
| Facebook changes | Public HTML and internal GraphQL documents can change; maintenance is part of this surface. |

Use the Actor only for lawful collection of content Facebook exposes publicly. Respect applicable law, platform terms, intellectual property, personal-data obligations and the rights of profile owners. Do not use it to evade access controls or harass individuals.

## Support and related tools

### Ready-made task pages

| Task | Best for |
| --- | --- |
| [Latest public Facebook profile posts](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/latest-public-facebook-profile-posts) | A small newest-post run from one profile. |
| [Facebook profile posts with all photos](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/facebook-profile-posts-with-all-photos) | Photo-heavy posts and hidden `+N` albums. |
| [Daily Facebook profile monitoring](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/daily-facebook-profile-monitoring) | Scheduled monitoring with a known-ID/date boundary. |
| [Historical Facebook profile backfill](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/historical-facebook-profile-backfill) | Older public posts with cursor continuation. |
| [Monitor multiple public Facebook profiles](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/monitor-multiple-public-facebook-profiles) | Isolated collection from several profiles. |

### Related Actor

Need posts from public Facebook groups instead? Use [Facebook Group Posts & All Photos Scraper](https://apify.com/spbotdel/facebook-group-posts-all-photos-scraper).

### Documentation

| Document | Use it for |
| --- | --- |
| [Agent guide](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/AGENT_GUIDE.md) | Tool selection and safe run patterns for agents. |
| [MCP/API usage](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/MCP_USAGE.md) | MCP prompts, API clients and monitoring state. |
| [Output contract](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/OUTPUT_CONTRACT.md) | Field semantics and media/coverage statuses. |
| [Operations](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/OPERATIONS.md) | Monitoring, backfill and incident handling. |
| [Architecture](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/ARCHITECTURE.md) | Collection and media-expansion pipeline. |

### Get help

Open a [GitHub issue](https://github.com/spbotdel/-facebook-profile-posts-scraper/issues) or use the Actor's Issues tab. Include:

- public profile URL;
- Apify run ID;
- affected post URL when available;
- whether the issue concerns text, timestamps, pagination, photos or coverage;
- relevant `SUMMARY` status and warnings.

Email: `spbotdel@gmail.com`
