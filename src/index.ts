import util from 'util';
import fetch from 'node-fetch';
import debug from 'debug';

import { scrapePlayerStats } from './scraper.js';

const log = debug('oversmash:main');

const defaultOptions = {
  normalizeNames: true,
  normalizeValues: true,
  normalizeNamesAs: 'snake',
  percentsToInts: true,
  defaultPlatform: 'pc',
  portraitUrlTemplate:
    'https://d1u1mce87gyfbn.cloudfront.net/game/unlocks/%s.png',

  baseUrl: 'https://playoverwatch.com/en-us',
  headers: {},
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

type OversmashOptions = typeof defaultOptions;
type Account = {
  id: string;
  level: number;
  portrait: string; // Was this really a string or something else?
  name: string;
  urlName: string;
  platform: string;
  isPublic: boolean;
};

function checkValidName(name: string) {
  if (name.indexOf('#') === -1) {
    throw new Error('Invalid player name, could not find a # sign');
  }
}

const urlJoin = (base: string, ...added: string[]) =>
  [base, ...added].join('/');

const getHTTP = async (path: string, options: OversmashOptions) => {
  const url = urlJoin(options.baseUrl, path);

  return fetch(url, {
    headers: options.headers,
  });
};

// Uses an internal Blizzard API to retrieve basic details about a player,
// through their Blizzard account ID. The API returns basic details about
// the players' career - display names, levels, and portraits, for each
// platform the player participated in.
async function findPlayer(options: OversmashOptions, name: string) {
  checkValidName(name);

  // Turn the pound sign into a URL-encoded pound sign, so we can get
  // a positive match including the account ID
  const nameEscapedUrl = name.replace('#', '%23');
  const searchPath = urlJoin('/search/account-by-name', nameEscapedUrl);

  log('findPlayer/http get', searchPath);

  const response = await getHTTP(searchPath, options);
  const accountsJSON = (await response.json()) as Account[];

  log('findPlayer/http complete', response);

  const accounts = accountsJSON.map((account) => ({
    id: account.id,
    level: account.level,
    portrait: portraitUrl(account.portrait, options),
    name: account.name,
    nameEscaped: account.urlName,
    platform: account.platform,
    public: account.isPublic,
  }));

  return {
    name: name,
    nameEscaped: name.replace('#', '-'),
    nameEscapedUrl,
    accounts,
  };
}

// Converts a portrait identifier (really just a filename as far as we care)
// into a full url for the portrait image
function portraitUrl(portraitId: string, options: OversmashOptions) {
  return util.format(options.portraitUrlTemplate, portraitId);
}

// Scrapes the playoverwatch website for details on a players' career, for
// a given platform.
async function findPlayerStats(
  options: OversmashOptions,
  platform: string,
  name: string
) {
  checkValidName(name);

  const nameEscaped = name.replace('#', '-');
  const scrapePath = urlJoin('/career', platform, nameEscaped);

  log('findPlayerStats/http get', scrapePath);

  const response = await getHTTP(scrapePath, options);
  const html = await response.text();

  log('findPlayerStats/http complete');

  const stats = scrapePlayerStats(options, html);
  return { name, nameEscaped, platform, stats };
}

// Accepts an options object (taking precedence over defaultOptions)
// and returns a new oversmash object
export default function main(
  callerOptions: DeepPartial<OversmashOptions> = {}
) {
  const options = {
    ...defaultOptions,
    ...callerOptions,
  };

  // Make sure we know how the caller expects names to be normalized
  if (['snake', 'camel'].indexOf(options.normalizeNamesAs) === -1) {
    throw new Error("normalizeNamesAs must be set to 'snake' or 'camel'");
  }

  // This will blow-up if the caller overrides callerOptions in weird ways
  const defaultPlatform = options.defaultPlatform;

  log('default platform', defaultPlatform);

  return {
    options: Object.freeze(options),

    async player(name: string) {
      return findPlayer(options, name);
    },

    async playerStats(name: string, platform = defaultPlatform) {
      return findPlayerStats(options, platform, name);
    },
  };
}
