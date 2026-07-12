# Facebook Profile Posts & All Photos Scraper

[![Run on Apify](https://img.shields.io/badge/Run%20on-Apify-2f7df6)](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper)
[![Source on GitHub](https://img.shields.io/badge/source-GitHub-24292f)](https://github.com/spbotdel/-facebook-profile-posts-scraper)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Scrape posts from **public Facebook personal profiles** as clean, agent-ready JSON. Get post text, Facebook publication timestamps, authors, stable post URLs and IDs, engagement counters, video metadata when exposed, and **all recoverable photo URLs**, including photos hidden behind Facebook `+N` album grids.

Use this Facebook profile posts scraper when a preview-only result is not enough. Each dataset item is one public profile post, and recovered photo URLs stay in that same result. No Facebook cookies, credentials, or browser session are required.

**Links:** [Run on Apify](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper) · [Source on GitHub](https://github.com/spbotdel/-facebook-profile-posts-scraper) · [Agent guide](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/AGENT_GUIDE.md) · [LLM card](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/llms.txt) · [MCP/API usage](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/MCP_USAGE.md) · [Output contract](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/OUTPUT_CONTRACT.md) · [Operations](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/OPERATIONS.md)

## ⚡ Facebook profile scraper at a glance

| Feature | Supported |
| --- | --- |
| Public Facebook personal profiles | ✅ Yes |
| Vanity handles and numeric profile IDs | ✅ Yes |
| `profile.php?id=...` and `/people/.../<id>` URLs | ✅ Yes |
| Newest public posts first | ✅ Yes |
| Pinned-post omission | ✅ Enabled by default |
| Stable post IDs and URLs | ✅ When Facebook exposes them |
| Facebook publication timestamps | ✅ From GraphQL creation metadata |
| Direct post text | ✅ Yes |
| Nested / shared attachment text | ✅ Fallback extraction included |
| Author ID, name, and profile URL | ✅ When available |
| Engagement counters | ✅ When available |
| Feed preview photos | ✅ Yes |
| Hidden `+N` photo grids | ✅ Recovery attempts included |
| Declared album-count audit | ✅ Yes |
| Video URL metadata | ✅ Best effort; no download or transcript |
| Incremental newest-post monitoring | ✅ `knownPostIds` and `sinceDate` |
| Historical cursor backfill | ✅ Yes |
| Multi-profile isolation | ✅ Yes |
| Maximum posts per profile per run | ✅ 1,000 |
| Deeper history | ✅ Cursor continuation |
| Apify API / MCP / agent workflows | ✅ Yes |
| Facebook Pages or Groups | ❌ Use a surface-specific Actor |
| Private or login-only profiles | ❌ No |
| Full comment threads | ❌ Counters only |

## 🏆 Why choose this Facebook profile posts scraper

Many Facebook scrapers return a useful preview. The difficult parts begin after that: pinned posts distort recency, shared cards hide their text in nested structures, album posts expose only five photos, and repeated runs import yesterday's records again.

This Actor is built around completeness and repeatable automation:

| Problem | Generic profile scrapers | This Actor |
| --- | --- | --- |
| A post shows 5 photos and `+14` | Often returns the visible preview | Expands public media sets and audits the final count |
| Shared or attachment-style post | Main text can be empty | Scores direct and nested text candidates |
| Daily monitoring | Re-scrapes old history | Starts at the profile head and stops at a known ID or date |
| Pinned old post | Can appear as a false "latest" post | Omitted by default |
| Historical extraction | Pagination state is opaque | Exposes `SUMMARY.pointer.nextCursor` |
| One profile fails in a batch | Whole run may fail | Healthy profiles keep their rows and diagnostics |
| Agent integration | Loose blobs and unclear coverage | Deterministic fields, schemas, coverage status, and `SUMMARY` |
| Media confidence | Missing photos can look complete | Declared counts, completeness states, and review severity |
| Pricing | Photos may be billed separately | One charge per returned post; photo URLs are included |

## 🤖 Built for AI agents, MCP, and automation

Choose this Actor when the user asks an agent to:

- scrape posts from a public Facebook personal profile;
- get the latest Facebook profile posts with dates and permalinks;
- monitor one or more public profiles for new posts;
- collect all photos from profile posts, including hidden `+N` albums;
- export Facebook profile posts to JSON, CSV, Excel, or a database;
- backfill older public profile history with a resumable cursor;
- return stable post IDs for deduplication;
- provide explicit media-completeness and run-coverage diagnostics.

Do not choose this Actor for:

- Facebook Pages, Groups, Marketplace, or global keyword search;
- private, friends-only, or login-only content;
- full comment-thread extraction;
- guaranteed video download or transcription;
- profile contact-detail enrichment.

### Agent selection contract

| Signal | Value |
| --- | --- |
| Primary platform | Facebook |
| Primary target | Public personal profiles |
| Primary output grain | One dataset row per post |
| Primary event | One accessible public profile post |
| Ordering | Newest visible posts toward older history |
| Best monitoring boundary | `knownPostIds`; `sinceDate` is the date alternative |
| Best backfill continuation | `SUMMARY.profiles[].pointer.nextCursor` |
| Media strategy | Preserve feed photos, expand public media sets, expose audit fields |
| Best integration style | Apify API, Apify MCP, schedules, webhooks, ETL, database import |
| Coverage evidence | Dataset rows plus the `SUMMARY` key-value record |

### Minimal agent recipe

1. Set `profileUrls` and a bounded `maxPostsPerProfile`.
2. Keep `expandAllPhotos=true` when photo completeness matters.
3. For recurring monitoring, pass one or more stored IDs in `knownPostIds`.
4. Read dataset rows as results.
5. Read `SUMMARY` before claiming complete coverage.
6. Treat `partial` as usable per-profile output plus an explicit retry queue.

## 🎯 Common use cases

| Use case | Why it fits |
| --- | --- |
| Public-profile monitoring | Run on a schedule and stop when a known post ID is reached. |
| Creator and public-figure research | Collect dated posts, permalinks, text, and public media. |
| Photo-complete datasets | Recover photos hidden behind `+N` grids instead of accepting previews. |
| Social listening | Track public profile communication with stable IDs and timestamps. |
| Content archiving | Backfill older public posts in resumable cursor chunks. |
| AI enrichment | Feed normalized rows into translation, classification, entity extraction, or summarization. |
| Analytics and reporting | Export JSON, CSV, XML, RSS, or Excel from the Apify Dataset. |
| Multi-profile ETL | Process profiles independently and preserve healthy results when one target fails. |

## 💰 Predictable pay-per-result pricing

The base Store price is **$4.99 per 1,000 returned Facebook profile posts**. Platform usage is included, so buyers do not receive a second compute or proxy bill from this Actor.

| Included in one post result | Included |
| --- | --- |
| Post text and text-source metadata | ✅ |
| Facebook publication timestamp | ✅ when exposed |
| Stable post and profile identifiers | ✅ when exposed |
| Author data and engagement counters | ✅ when available |
| Feed preview photos | ✅ |
| Expanded `+N` album photo URLs | ✅ |
| Media completeness and coverage diagnostics | ✅ |

You are charged per returned post, **not per photo URL**. Apify's small synthetic Actor-start event is displayed separately.

When a caller sets `maximum cost per run`, the Actor reduces collection before expensive feed and album work. A budget-bounded run reports `partial_charge_limit` in `SUMMARY` instead of silently claiming full coverage.

## 🚀 Quick start

Paste one or more public personal-profile URLs into `profileUrls`:

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

Accepted targets include:

- `https://www.facebook.com/username`
- `https://www.facebook.com/profile.php?id=100000000000000`
- `https://www.facebook.com/people/Name/100000000000000/`
- a numeric public profile ID

Facebook Groups, Pages, Marketplace listings, and direct post URLs are different surfaces and are not accepted as profile targets.

## 🧭 Recommended run patterns

| Goal | Recommended settings |
| --- | --- |
| Quick test | `maxPostsPerProfile=10`, `expandAllPhotos=true` |
| Latest public posts | `omitPinnedPosts=true`, no `startCursor` |
| Daily monitoring | Add `knownPostIds` or `sinceDate` |
| Photo-complete result | Keep `expandAllPhotos=true` |
| Faster preview-only result | Set `expandAllPhotos=false` |
| Historical backfill | One profile, up to 1,000 posts, then continue with `nextCursor` |
| Several profiles | Up to 20 targets; each target is isolated |
| Forensic unavailable-card audit | Set `includeUnavailablePosts=true` |

## 🧩 Input fields

| Field | Description |
| --- | --- |
| `profileUrls` | Public personal-profile URLs, handles, or numeric profile IDs. |
| `maxProfilesPerRun` | Safety cap for independently processed profiles. Maximum `20`. |
| `maxPostsPerProfile` | Maximum returned posts for each profile. Maximum `1,000` per run. |
| `expandAllPhotos` | Recover public photos hidden behind `+N` album grids. |
| `omitPinnedPosts` | Exclude pinned older posts from newest-post monitoring. |
| `knownPostIds` | Stop before a post already stored by your pipeline. |
| `sinceDate` | Stop after reaching posts older than this date. |
| `startCursor` | Continue toward older history for one profile. |
| `includeRawPayload` | Include parsed Facebook payloads for debugging; output becomes much larger. |
| `includeUnavailablePosts` | Return deleted/restricted attachment cards as diagnostic rows. |
| `fallbackProxyCountries` | Bounded geo fallback for transient profile-level rate limits. |
| `mediaExpansionConcurrency` | Number of photo sets expanded in parallel. Default `3` is the stable setting. |

## 📦 Facebook profile post output

Each default dataset row represents one accessible public Facebook profile post. Results can be downloaded from Apify as JSON, JSONL, CSV, XML, RSS, or Excel.

| Field | Meaning |
| --- | --- |
| `source_profile_id` | Numeric Facebook profile ID when resolved. |
| `source_profile_url` | Public profile URL used for the result. |
| `source_profile_name` | Public display name. |
| `source_post_id` | Stable Facebook post ID when exposed. |
| `source_url` | Public post URL. |
| `created_at` | Facebook publication time as ISO 8601, not scrape time. |
| `created_at_source` | Timestamp provenance, normally `graphql_creation_time`. |
| `raw_text` | Best recovered post body. |
| `text_source` | Direct, nested-fallback, or missing-text classification. |
| `author` | Public author ID, name, and profile URL when available. |
| `stats` | Reactions, comments, and shares when exposed. |
| `media` | Final recovered photo objects. |
| `video_urls` | Best-effort direct video URLs when exposed. |
| `media_preview_count` | Photo URLs visible in the timeline payload. |
| `media_expanded_count` | Photo URLs recovered from media-set expansion. |
| `media_final_count` | Final photo count returned in `media`. |
| `media_declared_count` | Album count declared by Facebook when exposed. |
| `media_declared_count_satisfied` | Whether recovered photos meet the declared count. |
| `media_completeness` | Media expansion outcome. |
| `media_review_severity` | `none`, `low`, `medium`, or `high`. |
| `coverage_status` | Evidence describing why collection stopped. |

<details>
<summary>Example JSON result</summary>

```json
{
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

## 🖼️ How all-photo recovery works

When `expandAllPhotos` is enabled, the Actor:

1. Keeps every valid photo URL exposed by the profile timeline.
2. Discovers public Facebook media-set tokens.
3. Expands media sets that may hide photos behind a `+N` grid.
4. Uses a public permalink fallback when expansion is suspicious.
5. Preserves a larger feed set if an expansion result is smaller.
6. Compares recovered photos with Facebook's declared album count when available.
7. Exposes quality fields instead of declaring uncertain rows magically perfect.

Photo URLs are Facebook CDN URLs and may be tokenized or expire. Download or mirror them promptly when your lawful workflow requires durable storage.

## 🔁 Latest posts, monitoring, and historical backfill

### Monitor only new Facebook profile posts

Every monitoring run should start from the newest visible profile posts. Pass one or more post IDs already stored by your pipeline:

```json
{
  "profileUrls": ["https://www.facebook.com/example.profile"],
  "maxPostsPerProfile": 100,
  "knownPostIds": ["1234567890123456"],
  "expandAllPhotos": true,
  "omitPinnedPosts": true
}
```

The Actor stops before the known post and returns only newer rows. Keep a unique constraint on `source_post_id` in your database as a second deduplication layer.

A date boundary is also supported:

```json
{
  "profileUrls": ["https://www.facebook.com/example.profile"],
  "maxPostsPerProfile": 200,
  "sinceDate": "2026-07-01T00:00:00Z",
  "omitPinnedPosts": true
}
```

### Backfill older Facebook profile history

Facebook profile cursors move from newer posts toward older history:

1. Run one profile with up to `maxPostsPerProfile=1000`.
2. Read `SUMMARY.profiles[0].pointer.nextCursor`.
3. Pass it as `startCursor` in the next run.
4. Repeat until `nextCursor` is absent or you have enough history.

```json
{
  "profileUrls": ["https://www.facebook.com/example.profile"],
  "maxPostsPerProfile": 1000,
  "startCursor": "PREVIOUS_NEXT_CURSOR",
  "expandAllPhotos": true
}
```

Do **not** reuse yesterday's backfill cursor to look for new posts. A cursor continues into older history; recurring monitoring starts from the profile head and stops with `knownPostIds` or `sinceDate`.

For checkpointed exports through the Apify API, the repository includes `npm run backfill:profile`.

## 🩺 Coverage and operational diagnostics

The Actor writes one `SUMMARY` record to the run's default key-value store. It includes a separate outcome for every profile, requested and effective limits, pages read, posts returned, stop reason, coverage status, media counts, warnings, charging metadata, and an older-history cursor.

| Coverage status | Meaning | Recommended action |
| --- | --- | --- |
| `complete_target_reached` | Requested result count was returned. | Use the dataset normally. |
| `complete_until_known_post` | Monitoring reached a stored post ID. | Healthy incremental run. |
| `complete_until_since_date` | Monitoring reached the date boundary. | Healthy incremental run. |
| `complete_feed_exhausted` | Facebook reported no older page. | Backfill reached the public end. |
| `no_public_posts` | No public rows were exposed. | Verify the target in a logged-out browser. |
| `partial_no_cursor` | Rows exist, but Facebook exposed no continuation cursor. | Keep rows and retry if more coverage is required. |
| `partial_stalled_cursor` | Facebook repeated a cursor. | Keep rows and retry with a fresh run. |
| `partial_error` | Earlier rows survived a later page failure. | Retry only the affected profile. |
| `partial_charge_limit` | The caller's maximum run charge reduced coverage. | Increase the budget or accept the bounded result. |

For multi-profile runs, healthy profile rows are preserved when another profile is blocked or rate-limited. This is intentional per-profile isolation, not a half-empty success costume.

## 🔌 Apify API and MCP usage

Run the Actor from Apify Console, the REST API, JavaScript/Python clients, CLI, schedules, webhooks, or the Apify MCP server.

### REST API example

```bash
curl "https://api.apify.com/v2/acts/spbotdel~facebook-profile-posts-all-photos-scraper/runs?token=YOUR_APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profileUrls": ["https://www.facebook.com/zuck"],
    "maxPostsPerProfile": 20,
    "expandAllPhotos": true,
    "omitPinnedPosts": true
  }'
```

### Useful prompts for AI agents

- "Get the latest 20 public posts from this Facebook personal profile. Return text, Facebook date, post URL, author, engagement, and all photo URLs."
- "Monitor these public Facebook profiles and stop when any of these known post IDs is reached."
- "Backfill 1,000 older posts from this profile and return the next cursor with the dataset ID."
- "Return only posts where `media_final_count > 5`. Flag any row with `media_review_severity` not equal to `none`."
- "Do not claim complete coverage unless the `SUMMARY` status is healthy or the requested boundary was reached."

## 🧭 Ready-made task pages

These public task pages are preconfigured for common search intents:

| Task | Best for |
| --- | --- |
| [Latest public Facebook profile posts](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/latest-public-facebook-profile-posts) | A small newest-post run from one profile. |
| [Facebook profile posts with all photos](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/facebook-profile-posts-with-all-photos) | Photo-heavy posts and hidden `+N` albums. |
| [Daily Facebook profile monitoring](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/daily-facebook-profile-monitoring) | Scheduled newest-post monitoring with a stop boundary. |
| [Historical Facebook profile backfill](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/historical-facebook-profile-backfill) | Older public posts with cursor continuation. |
| [Monitor multiple public Facebook profiles](https://apify.com/spbotdel/facebook-profile-posts-all-photos-scraper/examples/monitor-multiple-public-facebook-profiles) | Isolated collection from several profiles. |

## ✅ Trust and validation

| Signal | What it means |
| --- | --- |
| Open source | Source code is available on [GitHub](https://github.com/spbotdel/-facebook-profile-posts-scraper). |
| Limited permissions | The Actor follows Apify's least-privilege model. |
| CI tested | Parser, media, retry, charging, and schema checks run automatically. |
| Cloud validated | Shallow, incremental, multi-profile, all-photo, and deep-history scenarios were tested on Apify. |
| Predictable pricing | PPE charges one visible dataset result per accessible post; platform usage is included. |
| Explicit diagnostics | Coverage and media uncertainty are represented as data, not hidden in logs. |

### Selected cloud validation runs

| Scenario | Observed result |
| --- | --- |
| One profile, all photos | 5 newest posts, 42 final photo URLs |
| Photo-heavy profile | Albums expanded to 6, 19, 11, 9, and 12 photos |
| Incremental known-ID boundary | 0 duplicate rows; `complete_until_known_post` |
| Deep public-profile backfill | 462 posts over 303 timeline pages; no missing IDs, dates, URLs, or text |
| Three-profile all-photo pilot | 60 posts, 386 photo URLs, 40/40 declared albums satisfied |
| Three deep all-photo runs | 300 posts, 1,428 photo URLs, 153/153 declared albums satisfied |
| Unavailable-card regression | 100 useful posts after skipping 33 deleted/restricted cards |

These are validation observations, not a fixed SLA. Facebook response time, public visibility, rate limiting, profile shape, album size, and proxy traffic affect duration and cost.

## 📚 Documentation

| Document | Use it for |
| --- | --- |
| [Agent guide](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/AGENT_GUIDE.md) | Fast tool selection and safe run patterns for AI agents. |
| [MCP/API usage](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/MCP_USAGE.md) | Agent prompts, REST calls, schedules, and retry decisions. |
| [Output contract](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/OUTPUT_CONTRACT.md) | Field semantics and media/coverage status values. |
| [Operations](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/OPERATIONS.md) | Monitoring, backfill, and incident handling. |
| [Architecture](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/ARCHITECTURE.md) | Collection and expansion pipeline. |
| [SEO intents](https://github.com/spbotdel/-facebook-profile-posts-scraper/blob/main/docs/SEO_INTENTS.md) | Search and recommender intent map. |

## 🔍 Search intents covered

- Facebook profile posts scraper
- Facebook personal profile scraper
- scrape public Facebook profile posts
- download Facebook profile posts with images
- Facebook profile photo scraper
- Facebook profile posts API
- Facebook profile posts JSON export
- monitor public Facebook profiles
- latest Facebook profile posts
- historical Facebook profile post backfill
- Facebook profile scraper for AI agents
- Facebook profile scraper MCP
- Apify Facebook profile posts scraper

## ⚠️ Limitations

| Limitation | Detail |
| --- | --- |
| Public personal profiles only | No friends-only, private, or login-only content. |
| No access bypass | The Actor does not bypass login walls, checkpoints, privacy controls, or Facebook security. |
| Public visibility varies | A profile can expose fewer posts to logged-out sessions than to a signed-in browser. |
| Pages and Groups | They use different timeline surfaces and are intentionally out of scope. |
| Comments | Counters may be returned; full comment threads are not expanded. |
| Videos | Direct URLs may appear when exposed, but download and transcript completeness are not guaranteed. |
| Images | Source URLs are returned; image binaries are not stored by the Actor. |
| Expiring CDN URLs | Mirror lawful media promptly if durable storage is required. |
| Facebook changes | Internal GraphQL documents and public HTML can change; maintenance is part of this surface. |

## ❓ FAQ

### Does this Facebook profile scraper require login or cookies?

No. It uses logged-out public Facebook routes and Apify proxy sessions. It does not ask users for Facebook credentials or cookies.

### Does it work with private Facebook profiles?

No. Only posts Facebook exposes publicly to logged-out sessions are in scope.

### Does it scrape Facebook Pages or Groups?

No. This Actor is specialized for personal profiles. Use a Page or Group Actor for those surfaces.

### Does it return all photos from a post?

It returns all **recoverable public photo URLs** and specifically expands `+N` media grids. Facebook can still hide, remove, or expire media, so use the declared-count and review-severity fields for audit.

### How can I tell whether photos may be missing?

Inspect `media_declared_count_satisfied`, `media_completeness`, `media_review_severity`, `media_preview_count`, and `media_final_count`.

### Can it monitor only new profile posts?

Yes. Start every run at the profile head, omit pinned posts, and pass `knownPostIds` or `sinceDate` as the stop boundary.

### Can it backfill years of Facebook profile history?

Yes, when that history remains public. Request up to 1,000 posts in one run and continue into older history with `SUMMARY.profiles[].pointer.nextCursor`.

### Is the post date the Facebook date or scrape date?

`created_at` is the Facebook publication time from GraphQL creation metadata. Run timestamps live separately in `SUMMARY`.

### Are photos charged separately?

No. Recovered photo URLs are included in the post result.

### Can an AI agent use this Actor?

Yes. The Actor uses explicit inputs, deterministic post rows, PPE pricing, limited permissions, output schemas, and run-level diagnostics suitable for Apify MCP and API-driven agents.

## 🔗 Related Facebook Actors

| Need | Better fit |
| --- | --- |
| Public Facebook personal-profile posts and all recoverable photos | Use this Actor. |
| Public Facebook group posts | Use [Facebook Group Posts & All Photos Scraper](https://apify.com/spbotdel/facebook-group-posts-all-photos-scraper). |
| Facebook Page posts | Use a Facebook Page posts scraper. |
| Facebook Marketplace search | Use a Marketplace search scraper. |
| Global Facebook keyword search | Use a Facebook posts search scraper. |
| Full comments | Use a Facebook comments scraper on collected post URLs. |

## Responsible use

Use this Actor only for lawful collection of content that Facebook exposes publicly. Respect applicable law, platform terms, intellectual property, personal-data obligations, and the rights of profile owners. Do not use it to evade access controls or harass individuals.

## Support

Open a [GitHub issue](https://github.com/spbotdel/-facebook-profile-posts-scraper/issues) or use the Actor's Issues tab. Include:

- public profile URL;
- Apify run ID;
- approximate affected post URL, if available;
- whether the issue concerns text, timestamp, pagination, photos, or coverage;
- `SUMMARY` status and warnings.

Email support: `spbotdel@gmail.com`
