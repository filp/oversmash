import fs from 'fs';
import oversmash from '../src/index';

// Picked top player in overbuff, if this is you and you'd rather not be here,
// please send me a message!
const account = 'adara#21451';

async function captureSnapshots(ow) {
  await fs.promises.writeFile(
    './tests/snapshots/profile.json',
    JSON.stringify(await ow.player(account))
  );

  await fs.promises.writeFile(
    './tests/snapshots/stats.json',
    JSON.stringify(await ow.playerStats(account, 'pc'))
  );
}

captureSnapshots(oversmash({ normalizeNamesAs: 'camel' })).then(() => {
  console.log('captured snapshots!');
});
