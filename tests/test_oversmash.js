import assert from 'assert'
import oversmash from '../lib'

// Test names taken from masteroverwatch top lists at random. If you see yourself
// and would rather not be here, please open an issue!

async function testPlayerProfile (ow) {
  const p = await ow.player('HaventMetYou-2451')

  assert.equal(p.name, 'HaventMetYou-2451')
  assert.equal(p.accounts.length, 3)
}

async function testPlayerStats (ow) {
  const p = await ow.playerStats('HaventMetYou-2451', 'us', 'pc')

  assert.equal(p.name, 'HaventMetYou-2451')
  assert.equal(p.region, 'us')
  assert.equal(p.platform, 'pc')

  // Make sure we successfully extracted the competitive rank
  assert(p.stats.competitiveRank > 0)
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
