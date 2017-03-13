import cheerio from 'cheerio'
import debug from 'debug'

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
const heroFriendlyNames = {
  'torbjörn': 'torbjorn',
  'lúcio': 'lucio',
  'd.va': 'dva',
  'soldier: 76': 'soldier76',
  'all heroes': 'all'
}

// Methods used to build finders for different elements in the html
const finders = {
  heroList (careerType) {
    return `#${careerType} .career-stats-section select[data-js=career-select] option`
  },

  heroCards (careerType) {
    return `#${careerType} .career-stats-section div[data-group-id=stats]`
  }
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

function extractStatsFromGroup (p, group) {
  const groupStats = {}

  group.find('tbody tr').each((i, e) => {
    const elems = p(e).find('td')
    groupStats[elems.first().text()] = elems.last().text()
  })

  return groupStats
}

// Extracts all stats groups, given 'container', a cheerio object scoped to the
// correct parent element
function extractStatGroups (p, container) {
  const groups = {}

  container.find('.data-table').each((i, e) => {
    const elem = p(e)
    let groupName = elem.find('.stat-title').text().toLowerCase()

    if (statGroupNames[groupName]) {
      groupName = statGroupNames[groupName]
    }

    groups[groupName] = extractStatsFromGroup(p, elem)
  })

  return groups
}

// Gathers information from all the hero cards, performing transformations
// as necessary
function gatherHeroStats (p, careerType, heroes) {
  const heroStats = {}

  p(finders.heroCards(careerType)).each((i, e) => {
    const elem = p(e)

    let heroName = heroes[elem.attr('data-category-id')].toLowerCase()

    // Remap hero names to their developer-friendly counterparts
    if (heroFriendlyNames[heroName]) {
      heroName = heroFriendlyNames[heroName]
    }

    heroStats[heroName] = extractStatGroups(p, elem)

    log('scrape', careerType, heroName)
  })

  return heroStats
}

export function scrapePlayerStats (html) {
  const stats = {}
  const p = cheerio.load(html)

  for (const careerType of careerTypes) {
    log('start career stats', careerType)

    const heroes = buildHeroList(p, careerType)
    const heroStats = gatherHeroStats(p, careerType, heroes)

    stats[careerType] = heroStats

    log('end career stats', careerType)
  }

  return stats
}
