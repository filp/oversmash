import assert from 'assert'
import oversmash from '../lib'

async function testPlayerProfile (ow) {
  const p = await ow.player('FATCOTTON420#2476')

  assert.equal(p.name, 'FATCOTTON420-2476')
  assert.equal(p.accounts.length, 1)
}

async function testPlayerStats (ow) {
  const p = await ow.playerStats('FATCOTTON420-2476', 'pc')

  assert.equal(p.name, 'FATCOTTON420-2476')
  assert.equal(p.platform, 'pc')

  assert(p.stats.endorsementLevel > 0)
  assert(p.stats.gamesWon > 2000)

  assert(p.stats.competitiveRank.tank > 0)
  assert(p.stats.competitiveRank.damage > 0)
  assert(p.stats.competitiveRank.support > 0)

  // Make sure diacritics replacement is working as intended:
  assert(p.stats.quickplay.lucio.combat.all_damage_done > 0)
}

async function runTests () {
  const ow = oversmash()

  await testPlayerProfile(ow)
  await testPlayerStats(ow)
}

runTests()
  .then(() => {
    console.log('OK!')
  })
