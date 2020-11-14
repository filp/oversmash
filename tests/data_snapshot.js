import { promisify } from 'util'
import { writeFile } from 'fs'
import oversmash from '../lib'

// Picked top player in overbuff, if this is you and you'd rather not be here,
// please send me a message!
const account = 'adara#21451'
const writeFileAsync = promisify(writeFile)

async function captureSnapshots (ow) {
  await writeFileAsync('./tests/snapshots/profile.json', JSON.stringify(await ow.player(account)))
  await writeFileAsync('./tests/snapshots/stats.json', JSON.stringify(await ow.playerStats(account, 'pc')))
}

captureSnapshots(oversmash({ normalizeNamesAs: 'camel' }))
  .then(() => {
    console.log('captured snapshots!')
  })
