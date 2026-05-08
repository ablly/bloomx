import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  hashPlatformApiKey,
} = require('../functions/lib/platformApiKeys.js') as {
  hashPlatformApiKey: (key: string) => string;
};

test('hashPlatformApiKey returns deterministic sha256 hex hashes', () => {
  const left = hashPlatformApiKey('sk-bloomx-live-demo-key');
  const right = hashPlatformApiKey('sk-bloomx-live-demo-key');
  const other = hashPlatformApiKey('sk-bloomx-live-other-key');

  assert.equal(left, right);
  assert.notEqual(left, other);
  assert.equal(left.length, 64);
  assert.match(left, /^[a-f0-9]{64}$/);
});
