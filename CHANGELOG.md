# 1.4.0 (May 14th 2019)

- Fixes support for player portraits
- Removes region-related code
- Adds missing fields to player profile
- Fixes errors in player stats scraping

# 1.3.2 (December 29th 2017)

Fixes `.player` to work with changes to the blizzard API, specifically how it no longer
seems to support using a dash `-` in place of the pound `#` sign. URL-encoding the pound
sign as part of the URL appears to resolve it.
