import assert from 'assert'
import oversmash from '../lib'

// Test names taken from masteroverwatch top lists at random. If you see yourself
// and would rather not be here, please open an issue!

async function testPlayerProfile (ow) {
  const p = await ow.player('FATCOTTON420#2476')

  assert.equal(p.name, 'FATCOTTON420-2476')
  assert.equal(p.accounts.length, 1)
}

async function testPlayerStats (ow) {
  const p = await ow.playerStats('FATCOTTON420#2476', 'pc')

  assert.equal(p.name, 'FATCOTTON420#2476')
  assert.equal(p.platform, 'pc')

  // Make sure diacritics replacement is working as intended:
  assert(p.stats.competitiveRank > 0)
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
