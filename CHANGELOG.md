# 1.5.1

1.5.1 

- Fixes issue with some hero stat values being `null` incorrectly, due to an error in value normalization in the scraper
- Reshuffled debug logging around. New `DEBUG=` values are `oversmash:*` for all logs, or `oversmash:scraper`, `oversmash:main`, and `oversmash:snapshot` respectively.

# 1.5.0

1.5.0

- Adds support for role queue ranks in `playerStats` method

```json
{
  stats: {
    competitiveRank: {
      support: 1234,
      tank: 1234,
      damage: 1234
    }
  }
}
```

- Adds `endorsementLevel` to `playerStats`
- Adds `gamesWon` to `playerStats`

# 1.4.0 & 1.4.1(May 14th 2019)

1.4.0

- Fixes support for player portraits
- Removes region-related code
- Adds missing fields to player profile
- Fixes errors in player stats scraping

1.4.1

- Fixes inconsistent name handling in oversmash.player

# 1.3.2 (December 29th 2017)

Fixes `.player` to work with changes to the blizzard API, specifically how it no longer
seems to support using a dash `-` in place of the pound `#` sign. URL-encoding the pound
sign as part of the URL appears to resolve it.
