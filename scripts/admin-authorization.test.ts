import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';

const require = createRequire(import.meta.url);
const {
  buildAdminCustomClaims,
  isAdminIdentity,
  normalizeAdminRole,
} = require('../functions/lib/adminAuthorization.js') as {
  buildAdminCustomClaims: (role: unknown) => {admin: true; adminRole: string};
  isAdminIdentity: (input: {
    uid?: string | null;
    email?: string | null;
    token?: Record<string, unknown> | null;
    allowedEmails?: string[];
  }) => boolean;
  normalizeAdminRole: (role: unknown) => string;
};

test('owner email is authorized during custom claims migration', () => {
  assert.equal(
    isAdminIdentity({
      uid: 'owner_uid',
      email: 'ZQHABLLY@gmail.com',
      token: {},
      allowedEmails: ['zqhablly@gmail.com'],
    }),
    true,
  );
});

test('admin custom claim authorizes protected admin operations', () => {
  assert.equal(
    isAdminIdentity({
      uid: 'finance_uid',
      email: 'finance@example.com',
      token: {admin: true, adminRole: 'finance'},
      allowedEmails: [],
    }),
    true,
  );
});

test('normal buyer without owner email or claims is not admin', () => {
  assert.equal(
    isAdminIdentity({
      uid: 'buyer_uid',
      email: 'buyer@example.com',
      token: {role: 'buyer'},
      allowedEmails: ['zqhablly@gmail.com'],
    }),
    false,
  );
});

test('admin role normalization rejects unsupported roles safely', () => {
  assert.equal(normalizeAdminRole('finance'), 'finance');
  assert.equal(normalizeAdminRole('superuser'), 'admin');
});

test('custom claims are minimal and stable', () => {
  assert.deepEqual(buildAdminCustomClaims('reviewer'), {
    admin: true,
    adminRole: 'reviewer',
  });
});
