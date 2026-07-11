# Store publication checklist

Technical release target: Actor `spbotdel/facebook-profile-posts-all-photos-scraper`, build tag `latest`, version `1.0.x`.

## Monetization

Configure this once in Apify Console:

1. Select **Pay per event**.
2. Keep **Pay per event + usage** disabled so platform usage is included.
3. Keep the synthetic Actor-start event at `$0.00005`.
4. Configure the default dataset item event:
   - title: `Facebook profile post`
   - description: `One accessible public Facebook profile post with text, timestamp, author, engagement, stable URL, and all recoverable photo URLs.`
   - price: `$0.00499` per result (`$4.99 / 1,000`)
5. Select **Facebook profile post** as the primary event.
6. Do not add custom events.

The code uses Apify's default dataset-item event and stops paid work when the caller's maximum run charge is exhausted.

## Store fields

- Title: `Facebook Profile Posts & All Photos Scraper`
- SEO title: `Facebook Profile Posts & Photos Scraper`
- SEO description: `Scrape public Facebook profile posts with text, timestamps, authors, stable URLs, engagement, and every recoverable photo hidden behind +N albums.`
- Category: `Social media`
- Support: `spbotdel@gmail.com`
- Source repository: `https://github.com/spbotdel/-facebook-profile-posts-scraper`

Upload a distinct square icon that does not use Facebook's official logo, review the README preview, accept the Store terms, and publish.

## Post-publication customer smoke test

Run from a separate Apify account with a low maximum charge:

```json
{
  "profileUrls": [
    "https://www.facebook.com/lam.tp.chien.phuong",
    "https://www.facebook.com/trang.phan.298890"
  ],
  "maxPostsPerProfile": 20,
  "expandAllPhotos": true
}
```

Expected checks:

- billed dataset rows equal returned dataset rows;
- `SUMMARY.charging.resultEventEnabled` is `true`;
- a low run charge produces `partial_charge_limit` instead of unpaid work;
- the run uses the `latest` 1.0.x build with 1024 MB memory;
- sampled `media[].source_url` values return image content.
