import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  buildListedApiOffer,
  normalizeProductModelNames,
} = require('../functions/lib/adminActions.js') as {
  normalizeProductModelNames: (value: unknown) => string[];
  buildListedApiOffer: (
    productId: string,
    product: Record<string, unknown>,
    actor: { uid: string; email: string; role: string },
  ) => Record<string, unknown>;
};

test('normalizeProductModelNames removes empty and duplicate model names', () => {
  assert.deepEqual(
    normalizeProductModelNames(['deepseek-chat', ' ', 'deepseek-chat', 'qwen-max']),
    ['deepseek-chat', 'qwen-max'],
  );
});

test('buildListedApiOffer creates runtime listing from a reviewed product', () => {
  const offer = buildListedApiOffer('product_1', {
    seller_id: 'seller_1',
    seller_uid: 'seller_uid_1',
    name: 'DeepSeek proxy',
    description: 'OpenAI-compatible provider',
    base_url: 'https://provider.example/v1',
    provider_type: 'openai-compatible',
    auth_type: 'bearer',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    pricing: { input_per_1k: 0.1, output_per_1k: 0.2 },
  }, {
    uid: 'admin_1',
    email: 'admin@example.com',
    role: 'owner',
  });

  assert.equal(offer.status, 'listed');
  assert.equal(offer.productId, 'product_1');
  assert.equal(offer.offerId, 'product_1');
  assert.equal(offer.modelName, 'deepseek-chat');
  assert.deepEqual(offer.modelNames, ['deepseek-chat', 'deepseek-reasoner']);
  assert.equal(offer.sellerId, 'seller_1');
  assert.equal(offer.ownerId, 'seller_1');
  assert.equal(offer.pricePerCall, 1);
});
