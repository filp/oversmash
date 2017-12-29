import urlJoin from 'url-join'
import request from 'request-promise'
import debug from 'debug'

import { scrapePlayerStats } from './scraper'

const log = debug('oversmash')

const defaultOptions = {
  normalizeNames: true,
  normalizeValues: true,
  normalizeNamesAs: 'snake',
  percentsToInts: true,
  defaultRegion: 'us',
  defaultPlatform: 'pc',
  accountIdentityRegex: /^\/career\/([\w]+)\/.+$/,
  strictPlayerSearch: true,
  requestOptions: {
    baseUrl: 'https://playoverwatch.com/en-us',
    headers: {
      'User-Agent': 'https://github.com/filp/oversmash (hi jeff)'
    }
  }
}

// Uses an internal Blizzard API to retrieve basic details about a player,
// through their Blizzard account ID. The API returns basic details about
// the players' career - display names, levels, and portraits, for each
// platform/region the player participated in.
async function findPlayer (req, options, name) {
  // Turn the last dash into a URL-encoded pound sign, so we can get
  // a positive match including the account ID
  const nameEscaped = name.replace(/-(\d+)$/, '%23$1') // # == %23

  // Note that the pound sign here is ignored, we keep it in just to make
  // debug logs clearer, and because it doesn't cause any harm:
  const searchPath = urlJoin('/search/account-by-name', nameEscaped)

  log('findPlayer/http get', searchPath)

  const response = await req.get(searchPath, { json: true })

  log('findPlayer/http complete', response)

  const accounts = response.map(account => {
    console.log(account)
    const accountIdentity = account.careerLink.match(options.accountIdentityRegex)

    if (!accountIdentity) {
      throw new Error('Could not parse careerLink in response')
    }

    return {
      level: account.level,
      portrait: account.portrait,
      displayName: account.platformDisplayName,
      platform: accountIdentity[1]
    }
  })

  return {
    name: name,
    accounts
  }
}

// Scrapes the playoverwatch website for details on a players' career, for
// a given region and platform.
async function findPlayerStats (req, options, platform, region, name) {
  const scrapePath = urlJoin('/career', platform, region, name)
  log('findPlayerStats/http get', scrapePath)

  const html = await req.get(scrapePath)

  log('findPlayerStats/http complete')

  const stats = scrapePlayerStats(options, html)
  return { name, region, platform, stats }
}

// Accepts an options object (taking precedence over defaultOptions)
// and returns a new oversmash object
export default function main (callerOptions = {}) {
  const sharedOptions = { ...defaultOptions, ...callerOptions }

  // Make sure we know how the caller expects names to be normalized
  if (['snake', 'camel'].indexOf(sharedOptions.normalizeNamesAs) === -1) {
    throw new Error('normalizeNamesAs must be set to \'snake\' or \'camel\'')
  }

  // This will blow-up if the caller overrides callerOptions in weird ways
  const defaultRegion = sharedOptions.defaultRegion
  const defaultPlatform = sharedOptions.defaultPlatform

  // Prepare an instance of `request` configured with requestOptions
  // as provided by the caller (or from defaultOptions)
  const req = request.defaults(sharedOptions.requestOptions)

  log('default region', defaultRegion)
  log('default platform', defaultPlatform)

  return {
    async player (name) {
      return findPlayer(req, sharedOptions, name)
    },

    async playerStats (name, region = defaultRegion, platform = defaultPlatform) {
      return findPlayerStats(req, sharedOptions, platform, region, name)
    }
  }
}
