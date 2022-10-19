import assert from 'assert';
import oversmash from '../src';
import { promisify } from 'util';
import { readFile } from 'fs';
import objectPath from 'object-path';
import traverse from 'traverse';
import debug from 'debug';

const log = debug('oversmash:snapshot');
const readFileAsync = promisify(readFile);

async function loadSnapshot(name) {
  const data = await readFileAsync(`./tests/snapshots/${name}.json`, 'utf-8');
  return JSON.parse(data);
}

function compareToSnapshot(snapshot, data) {
  traverse(data).forEach(function (node) {
    if (Array.isArray(node) || (typeof node === 'object' && node !== null))
      return;

    const path = this.path.join('.');
    const compareTo = objectPath.get(snapshot, path);
    const t = typeof node;
    const ct = typeof compareTo;

    if (t === 'undefined' || node === null) {
      log(`bad-value(${path}): is ${t === null ? 'null' : 'undefined'}`);
    }

    if (t !== ct) {
      log(`type-diverged(${path}): ${t} !== ${ct} (new !== old)`);
    }

    if (node !== compareTo) {
      log(`diverged(${path}): ${node} !== ${compareTo} (new !== old)`);
    }
  });
}

async function testPlayerProfile(ow, snapshot) {
  const p = await ow.player('adara#21451');

  assert.strictEqual(p.name, 'adara#21451');
  assert.strictEqual(p.nameEscaped, 'adara-21451');
  assert.strictEqual(p.nameEscapedUrl, 'adara%2321451');
  assert.strictEqual(p.accounts.length, 1);

  compareToSnapshot(snapshot, p);
}

async function testPlayerStats(ow, snapshot) {
  const p = await ow.playerStats('adara#21451', 'pc');

  assert.strictEqual(p.name, 'adara#21451');
  assert.strictEqual(p.nameEscaped, 'adara-21451');
  assert.strictEqual(p.platform, 'pc');

  assert(
    p.stats.endorsementLevel > 0,
    'expected endorsement level to be above zero'
  );
  assert(
    p.stats.gamesWon > 2000,
    'expected games won to be a number above the given value'
  );

  const oneRoleMatched = ['tank', 'damage', 'support'].some((role) => {
    return p.stats.competitiveRank[role] > 0;
  });

  assert(
    oneRoleMatched,
    'no competitive rank found for any role - missing placements?'
  );

  // Make sure diacritics replacement is working as intended:
  assert(
    p.stats.quickplay.lucio.combat.allDamageDone > 0,
    'failed to match stat for lucio, diacritics replacement might be broken'
  );

  compareToSnapshot(snapshot, p);
}

function testOptions(ow) {
  assert.strictEqual(
    ow.options.requestOptions.headers['User-Agent'],
    'oversmash tests'
  );
  assert.strictEqual(
    ow.options.requestOptions.baseUrl,
    'https://playoverwatch.com/en-us'
  );
}

async function runTests() {
  const ow = oversmash({
    normalizeNamesAs: 'camel',
    requestOptions: {
      headers: {
        'User-Agent': 'oversmash tests',
      },
    },
  });

  testOptions(ow);
  await testPlayerProfile(ow, await loadSnapshot('profile'));
  await testPlayerStats(ow, await loadSnapshot('stats'));
}

runTests().then(() => {
  console.log('OK!');
});
