import { promisify } from 'util'
import { writeFile } from 'fs'
import oversmash from '../lib'

const account = 'FATCOTTON420#2476'
const writeFileAsync = promisify(writeFile)

async function captureSnapshots (ow) {
  await writeFileAsync('./tests/snapshots/profile.json', JSON.stringify(await ow.player(account)))
  await writeFileAsync('./tests/snapshots/stats.json', JSON.stringify(await ow.playerStats(account, 'pc')))
}

captureSnapshots(oversmash({ normalizeNamesAs: 'camel' }))
  .then(() => {
    console.log('captured snapshots!')
  })
