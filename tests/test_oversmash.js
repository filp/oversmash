import assert from 'assert'
import oversmash from '../lib'
import { promisify } from 'util'
import { readFile } from 'fs'
import objectPath from 'object-path'
import traverse from 'traverse'
import debug from 'debug'

const log = debug('oversmash:snapshot')
const readFileAsync = promisify(readFile)

async function loadSnapshot (name) {
  const data = await readFileAsync(`./tests/snapshots/${name}.json`)
  return JSON.parse(data)
}

function compareToSnapshot (snapshot, data) {
  traverse(data).forEach(function (node) {
    if (Array.isArray(node) || (typeof node === 'object' && node !== null)) return

    const path = this.path.join('.')
    const compareTo = objectPath.get(snapshot, path)
    const t = typeof node
    const ct = typeof compareTo

    if (t === 'undefined' || node === null) {
      log(`bad-value(${path}): is ${t === null ? 'null' : 'undefined'}`)
    }

    if (t !== ct) {
      log(`type-diverged(${path}): ${t} !== ${ct}`)
    }

    if (node !== compareTo) {
      log(`diverged(${path}): ${node} !== ${compareTo}`)
    }
  })
}

async function testPlayerProfile (ow, snapshot) {
  const p = await ow.player('FATCOTTON420#2476')

  assert.equal(p.name, 'FATCOTTON420#2476')
  assert.equal(p.nameEscaped, 'FATCOTTON420-2476')
  assert.equal(p.nameEscapedUrl, 'FATCOTTON420%232476')
  assert.equal(p.accounts.length, 1)

  compareToSnapshot(snapshot, p)
}

async function testPlayerStats (ow, snapshot) {
  const p = await ow.playerStats('FATCOTTON420#2476', 'pc')

  assert.equal(p.name, 'FATCOTTON420#2476')
  assert.equal(p.nameEscaped, 'FATCOTTON420-2476')
  assert.equal(p.platform, 'pc')

  assert(p.stats.endorsementLevel > 0)
  assert(p.stats.gamesWon > 2000)

  assert(p.stats.competitiveRank.tank > 0)
  assert(p.stats.competitiveRank.damage > 0)
  assert(p.stats.competitiveRank.support > 0)

  // Make sure diacritics replacement is working as intended:
  assert(p.stats.quickplay.lucio.combat.all_damage_done > 0)

  compareToSnapshot(snapshot, p)
}

async function runTests () {
  const ow = oversmash()

  await testPlayerProfile(ow, await loadSnapshot('profile'))
  await testPlayerStats(ow, await loadSnapshot('stats'))
}

runTests()
  .then(() => {
    console.log('OK!')
  })
