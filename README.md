# oversmash

API wrapper for Blizzard's Overwatch player stats. Uses promises.

Blizzard does not expose an official API, so this library relies partially on scraping, using [cheerio](https://github.com/cheeriojs/cheerio).  

Please also keep in mind there is no builtin rate-limiting support, so it's on you to use the library responsibly.

## Features

- Ability to retrieve basic user information, such as name, portrait, level and accounts
  - Correctly identifies the platform and region for each account
- Ability to retrieve detailed stats for a player, for a given region and platform
  - Includes **all** stats available on playoverwatch.com
  - Stats are retrieved and grouped automatically per career type (quickplay/competitive), hero, and group (e.g combat, awards, etc)
- Minimalist and straightforward API that only handles retrieving the data, everything else is up to you

## Usage

Install through `npm`:

```shell
$ npm install --save oversmash
```

Example:

```js
import oversmash from 'oversmash'

// Create a new oversmash object. `oversmash()` accepts an options
// object (see below)
const api = oversmash()

async function main () {
  const player = await api.player('bob-12345')
  console.log(player)

  // Output:
  // { name: 'bob-12345',
  //   accounts:
  //    [ { level: 440,
  //        portrait: 'https://blzgdapipro-a.akamaihd.net/game/unlocks/xyz.png',
  //        displayName: 'bob#12345',
  //        platform: 'pc',
  //        region: 'eu' } ] }

  const playerStats = await api.playerStats('bob-12345')
  console.log(playerStats)

  // Output (shortened for brevity):
  // { name: 'bob-12345',
  //   region: 'eu',
  //   platform: 'pc',
  //   stats:
  //    { quickplay:
  //       { all:
  //          { combat:
  //             { 'Melee Final Blows': '190',
  //               'Solo Kills': '2,913',
  //               'Objective Kills': '6,579',
  //               'Final Blows': '9,493',
  //               'Damage Done': '6,868,890',
  //               'Eliminations': '18,396',
  //               'Environmental Kills': '83',
  //               'Multikills': '155' },
  //            assists:
  //             { 'Healing Done': '1,083,825',
  //               'Recon Assists': '25',
  //               'Teleporter Pads Destroyed': '18' },
  //            best: { ... },
  //            average: { ... },
  //            awards: { ... },
  //            game:
  //             { ... },
  //            misc:
  //             { ... } },
  //         reaper: { ... } },
  //       competitive: { ... } }
  }
}
```

## Debugging

`oversmash` uses [debug](https://github.com/visionmedia/debug). Run your code calling oversmash with
`DEBUG=oversmash` to enable debug logging

## 🐝 🐝 🐝

See [`LICENSE.md`](/LICENSE.md) for license information

Contributions are welcome - please follow the style guidelines as enforced by the included `.eslintrc`!
