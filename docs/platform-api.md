# Platform API

The frontend writes marketplace configuration to Firebase. Runtime model calls should use the deployed Firebase Function.

## Endpoint

```text
POST <VITE_INVOKE_MERCHANT_MODEL_URL>
Authorization: Bearer <platformApiKey>
Content-Type: application/json
```

## Body

```json
{
  "modelName": "xianyu-demo-chat",
  "prompt": "Summarize this listing"
}
```

## Success Response

```json
{
  "id": "apiCallRecords document id",
  "modelName": "xianyu-demo-chat",
  "cost": 1,
  "output": "merchant model response text"
}
```

## Billing Behavior

- The function hashes the bearer key and finds an active record in `users/{uid}/api_keys/{keyId}`.
- The function finds a listed offer by `apiOffers.modelName`.
- The function deducts `pricePerCall` credits before calling the merchant endpoint.
- If the merchant endpoint cannot be reached or returns a non-2xx response, the function refunds the same credit amount and writes a `credit_ledger` refund record.
- Every attempt is stored in `apiCallRecords`, and successful calls write seller earnings.

## Merchant Secret Boundary

Public marketplace listings are stored in `apiOffers`.

Merchant API keys are stored in `merchantApiSecrets/{offerId}` and are only used by the Firebase Function through Admin access.
