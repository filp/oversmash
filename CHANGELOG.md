# 1.3.0 (December 29th 2017)

Fixes `.player` to work with changes to the blizzard API, specifically how it no longer
seems to support using a dash `-` in place of the pound `#` sign. URL-encoding the pound
sign as part of the URL appears to resolve it.
