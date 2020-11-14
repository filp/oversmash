import urlJoin from 'url-join'
import request from 'request-promise'
import debug from 'debug'
import util from 'util'

import { scrapePlayerStats } from './scraper'

const log = debug('oversmash:main')

const defaultOptions = {
  normalizeNames: true,
  normalizeValues: true,
  normalizeNamesAs: 'snake',
  percentsToInts: true,
  defaultPlatform: 'pc',
  portraitUrlTemplate: 'https://d1u1mce87gyfbn.cloudfront.net/game/unlocks/%s.png',
  requestOptions: {
    baseUrl: 'https://playoverwatch.com/en-us',
    headers: {
      'User-Agent': 'https://github.com/filp/oversmash (hi jeff)'
    }
  }
}

function checkValidName (name) {
  if (name.indexOf('#') === -1) {
    throw new Error('Invalid player name, could not find a # sign')
  }
}

// Uses an internal Blizzard API to retrieve basic details about a player,
// through their Blizzard account ID. The API returns basic details about
// the players' career - display names, levels, and portraits, for each
// platform the player participated in.
async function findPlayer (req, options, name) {
  checkValidName(name)

  // Turn the pound sign into a URL-encoded pound sign, so we can get
  // a positive match including the account ID
  const nameEscapedUrl = name.replace('#', '%23')
  const searchPath = urlJoin('/search/account-by-name', nameEscapedUrl)

  log('findPlayer/http get', searchPath)

  const response = await req.get(searchPath, { json: true })

  log('findPlayer/http complete', response)

  const accounts = response.map(account => {
    return {
      id: account.id,
      level: account.level,
      portrait: portraitUrl(account.portrait, options),
      name: account.name,
      nameEscaped: account.urlName,
      platform: account.platform,
      public: account.isPublic
    }
  })

  return {
    name: name,
    nameEscaped: name.replace('#', '-'),
    nameEscapedUrl,
    accounts
  }
}

// Converts a portrait identifier (really just a filename as far as we care)
// into a full url for the portrait image
function portraitUrl (portraitId, options) {
  return util.format(options.portraitUrlTemplate, portraitId)
}

// Scrapes the playoverwatch website for details on a players' career, for
// a given platform.
async function findPlayerStats (req, options, platform, name) {
  checkValidName(name)

  const nameEscaped = name.replace('#', '-')
  const scrapePath = urlJoin('/career', platform, nameEscaped)

  log('findPlayerStats/http get', scrapePath)

  const html = await req.get(scrapePath)

  log('findPlayerStats/http complete')

  const stats = scrapePlayerStats(options, html)
  return { name, nameEscaped, platform, stats }
}

// Accepts an options object (taking precedence over defaultOptions)
// and returns a new oversmash object
export default function main (callerOptions = {}) {
  const callerOptionsWithRequestOptions = {
    ...callerOptions,

    // Correctly merge the requestOptions object if any values are overwritten by the caller,
    // without replacing the entire object.
    //
    // We only do this for the options we know we're setting defaults for - saves us doing
    // a full recursive object merge or bringing in a dependency to do it.
    requestOptions: {
      ...defaultOptions.requestOptions,
      ...(callerOptions.requestOptions || {}),
      headers: {
        ...defaultOptions.requestOptions.headers,
        ...((callerOptions.requestOptions && callerOptions.requestOptions.headers) || {})
      }
    }
  }

  const sharedOptions = { ...defaultOptions, ...callerOptionsWithRequestOptions }

  // Make sure we know how the caller expects names to be normalized
  if (['snake', 'camel'].indexOf(sharedOptions.normalizeNamesAs) === -1) {
    throw new Error('normalizeNamesAs must be set to \'snake\' or \'camel\'')
  }

  // This will blow-up if the caller overrides callerOptions in weird ways
  const defaultPlatform = sharedOptions.defaultPlatform

  // Prepare an instance of `request` configured with requestOptions
  // as provided by the caller (or from defaultOptions)
  const req = request.defaults(sharedOptions.requestOptions)

  log('default platform', defaultPlatform)

  return {
    options: Object.freeze(sharedOptions),

    async player (name) {
      return findPlayer(req, sharedOptions, name)
    },

    async playerStats (name, platform = defaultPlatform) {
      return findPlayerStats(req, sharedOptions, platform, name)
    }
  }
}
