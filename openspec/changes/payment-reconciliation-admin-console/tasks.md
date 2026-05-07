## 1. Test Harness

- [x] 1.1 Add a dependency-free Node test script for admin payment reconciliation helpers.
- [x] 1.2 Add the `npm` script needed to run the focused reconciliation test.

## 2. Aggregation Logic

- [x] 2.1 Add typed payment reconciliation summary helpers to `adminOperationsService`.
- [x] 2.2 Cover collected totals, credited totals, failed webhooks, pending refunds, open disputes, and review queues with fixtures.

## 3. Admin UI

- [x] 3.1 Render a payment reconciliation workbench in the existing admin operations console.
- [x] 3.2 Render refund/dispute review rows and empty states without mock records.
- [x] 3.3 Update payment operations copy to state Stripe-only, Webhook, idempotency, ledger, and refund/dispute review boundaries.

## 4. Validation

- [x] 4.1 Run the focused reconciliation test.
- [x] 4.2 Run `npm run build`.
- [x] 4.3 Run `cd functions; npm run build`.
- [x] 4.4 Run `npm run spec:validate:strict`.
- [x] 4.5 Run `npm run workflow:doctor`.
- [x] 4.6 Run `npm run brief` and self-review remaining risks.
