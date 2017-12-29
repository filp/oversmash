import cheerio from 'cheerio'
import debug from 'debug'
import noCase from 'no-case'
import camelCase from 'camelcase'

const log = debug('oversmash')
const careerTypes = ['quickplay', 'competitive']

// A map of strings used to rename stat groups to something easier
// to use/read. Keep in mind stat group names are lowercased before
// being matched to this list
const statGroupNames = {
  'hero specific': 'hero',
  'match awards': 'awards',
  'miscellaneous': 'misc'
}

// Renames heroes such as lúcio or torbjörn to more developer-friendly names
const friendlyHeroNames = {
  'torbjörn': 'torbjorn',
  'lúcio': 'lucio',
  'd.va': 'dva',
  'soldier: 76': 'soldier76',
  'all heroes': 'all'
}

// Very lazy diacritics replacement map for the few cases where
// we need them. While lazy, this is preferred to bringing in a full
// folding library/system
const lazyDiacriticsMap = {
  'ö': 'o',
  'ú': 'u'
}

// Used to find special characters and extract them, in order to match
// against lazyDiacriticsMap
const lazyDiacriticsRegex = new RegExp(`([${Object.keys(lazyDiacriticsMap).join('')}])`, 'i')

// Methods used to build finders for different elements in the html
const finders = {
  heroList (careerType) {
    return `#${careerType} .career-stats-section select[data-js=career-select] option`
  },

  heroCards (careerType) {
    return `#${careerType} .career-stats-section div[data-group-id=stats]`
  }
}

// If options.normalizeNames is enabled, things like achievement
// and stat names are normalized to a more developer-friendly format
// through this method
function normalizeKeyName (options, name) {
  if (options.normalizeNames) {
    let newName = noCase(name.replace('\'', ''), null, '_')
    const diacMatch = newName.match(lazyDiacriticsRegex)

    // Replace diacritics with their ascii equivalent (e.g ö -> o)
    if (diacMatch && lazyDiacriticsMap[diacMatch[1]]) {
      newName = newName.replace(diacMatch[1], lazyDiacriticsMap[diacMatch[1]])
    }

    if (options.normalizeNamesAs === 'camel') {
      return camelCase(newName)
    }

    return newName
  }

  return name
}

// Much like normalizeKeyName, attempts to intelligently normalize
// a value, i.e turning a string '123' or '12345,35' to a number, etc
function normalizeValue (options, value) {
  if (options.normalizeValues) {
    if ((value.indexOf('%') !== -1 && !options.percentsToInts) || value.indexOf(':') !== -1) {
      // If percentsToInts is not true, don't convert percentages
      // to integers - just pass the value through
      //
      // Additionally, also just pass the value through if the value
      // contains colons, indicating this is a time value
      return value
    } else if (value.indexOf('.') !== -1) {
      // Handle floating-point values
      return parseFloat(value.replace(',', ''))
    }

    // Everything that goes this far is assumed to be possible
    // to safely parse as an int
    return parseInt(value.replace(',', ''), 10)
  }

  return value
}

// Looks at the hero selector, and builds an object allowing us to
// later on pair each hero name with their stats
function buildHeroList (p, careerType) {
  // Each career type has a selector for the specific hero, as well
  // as an 'All heroes' option. The 'value' attribute on these elements
  // match the 'data-category-id' attribute on the divs containing the
  // actual card data
  const heroes = {}

  // select option[value]
  p(finders.heroList(careerType)).each((i, e) => {
    const elem = p(e)
    heroes[elem.attr('value')] = elem.text()
  })

  return heroes
}

function extractStatsFromGroup (options, p, group) {
  const groupStats = {}

  group.find('tbody tr').each((i, e) => {
    const elems = p(e).find('td')
    groupStats[normalizeKeyName(options, elems.first().text())] = normalizeValue(options, elems.last().text())
  })

  return groupStats
}

// Extracts all stats groups, given 'container', a cheerio object scoped to the
// correct parent element
function extractStatGroups (options, name, p, container) {
  const groups = { name }

  container.find('.data-table').each((i, e) => {
    const elem = p(e)
    let groupName = elem.find('.stat-title').text()

    if (options.normalizeNames) {
      groupName = groupName.toLowerCase()

      if (statGroupNames[groupName]) {
        groupName = statGroupNames[groupName]
      }
    }

    groups[normalizeKeyName(options, groupName)] = extractStatsFromGroup(options, p, elem)
  })

  return groups
}

// Gathers information from all the hero cards, performing transformations
// as necessary
function gatherHeroStats (options, p, careerType, heroes) {
  const heroStats = {}

  p(finders.heroCards(careerType)).each((i, e) => {
    const elem = p(e)

    let heroName = heroes[elem.attr('data-category-id')]

    if (options.normalizeNames) {
      heroName = heroName.toLowerCase()

      // Remap hero names to their developer-friendly counterparts
      if (friendlyHeroNames[heroName]) {
        heroName = friendlyHeroNames[heroName]
      }
    }

    heroStats[heroName] = extractStatGroups(options, heroName, p, elem)

    log('scrape', careerType, heroName, heroStats[heroName])
  })

  return heroStats
}

function extractCompetitiveRank (options, p) {
  return normalizeValue(options, p('.masthead-player .competitive-rank .h5').text())
}

function gatherAchievements (options, p) {
  const achievements = []

  p('.achievement-card').each((i, e) => {
    const elem = p(e)
    const achieved = !elem.hasClass('m-disabled')
    const name = normalizeKeyName(options, elem.find('.media-card-title').text())

    achievements.push({ name, achieved })
  })

  return achievements
}

export function scrapePlayerStats (options, html) {
  const stats = {}
  const p = cheerio.load(html)

  stats.competitiveRank = extractCompetitiveRank(options, p)
  stats.achievements = gatherAchievements(options, p)

  for (const careerType of careerTypes) {
    log('start career stats', careerType)

    const heroes = buildHeroList(p, careerType)
    const heroStats = gatherHeroStats(options, p, careerType, heroes)

    stats[careerType] = heroStats

    log('end career stats', careerType)
  }

  return stats
}
