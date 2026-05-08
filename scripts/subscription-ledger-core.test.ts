import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  sellerEarningBreakdown,
  subscriptionDocumentId,
} = require('../functions/lib/subscriptions.js') as {
  sellerEarningBreakdown: (grossCredits: number) => {
    gross_amount: number;
    platform_fee: number;
    seller_earnings: number;
  };
  subscriptionDocumentId: (uid: string, productId: string) => string;
};

test('subscriptionDocumentId is deterministic and path-safe', () => {
  const value = subscriptionDocumentId('user/demo', 'product.demo');
  assert.equal(value, 'user_demo_product_demo');
});

test('sellerEarningBreakdown keeps a 90/10 seller-platform split', () => {
  const breakdown = sellerEarningBreakdown(10);
  assert.deepEqual(breakdown, {
    gross_amount: 10,
    platform_fee: 1,
    seller_earnings: 9,
  });
});
