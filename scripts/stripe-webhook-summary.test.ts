import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';

const require = createRequire(import.meta.url);
const {summarizeStripeObject} = require('../functions/lib/payments.js') as {
  summarizeStripeObject: (value: Record<string, unknown>) => Record<string, unknown>;
};

test('summarizeStripeObject omits undefined fields before Firestore writes', () => {
  const summary = summarizeStripeObject({
    object: 'checkout.session',
    id: 'cs_test_123',
    status: 'complete',
    payment_status: 'paid',
    amount_total: 1000,
    currency: 'usd',
    customer: 'cus_test_123',
    payment_intent: 'pi_test_123',
  });

  assert.equal(summary.object, 'checkout.session');
  assert.equal(summary.id, 'cs_test_123');
  assert.equal(summary.amount_total, 1000);
  assert.equal(Object.values(summary).some((value) => value === undefined), false);
  assert.equal(Object.hasOwn(summary, 'amount'), false);
  assert.equal(Object.hasOwn(summary, 'checkout_session'), false);
});
