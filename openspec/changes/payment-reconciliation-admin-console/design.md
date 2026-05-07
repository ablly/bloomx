## Context

The payment backend already writes Stripe Checkout transactions, verified Webhook events, credit ledger entries, refunds, disputes, audit logs, and admin action records. AdminOperations can read real Firestore collections, but the current UI treats payment data as generic operational records rather than a production reconciliation surface.

This change keeps the system Stripe-only. Frontend code must not create Stripe objects directly and must not infer successful payment from redirect URLs. The admin console is a read/review surface backed by existing Firestore records and existing callable APIs.

## Goals / Non-Goals

**Goals:**

- Provide an admin-facing reconciliation summary for Stripe transactions, credit ledger entries, webhook failures, refunds, and disputes.
- Surface records that require human review without inventing data when Firestore is empty.
- Keep the aggregation logic testable without Firebase by extracting pure helper functions.
- Preserve the existing admin security boundary: no frontend writes to protected payment collections.

**Non-Goals:**

- Do not deploy Stripe live mode or configure production Webhook secrets.
- Do not add Dodo Payments or any new payment provider.
- Do not automatically claw back credits on refund/dispute Webhook events.
- Do not implement external workflow deployment; Activepieces/Node-RED/Windmill remain environment tasks.

## Decisions

- **Use existing Firestore collections rather than a new reconciliation collection.** This avoids migration risk and keeps the console aligned with service-of-record tables. Alternative considered: a new materialized `payment_reconciliation_snapshots` collection, deferred until volume or query cost requires it.
- **Extract pure summary helpers in `adminOperationsService`.** The UI can render an object model while tests cover status grouping, money totals, and review queues without mocking Firebase. Alternative considered: embedding all logic inside React, rejected because payment status rules need regression coverage.
- **Treat refunds/disputes as review signals, not ledger mutation triggers.** The console highlights the risk but does not change credits. This matches the current backend policy that Webhooks update local refund/dispute state only.
- **Show empty states as production truth.** If Firestore has no payment records, the UI must say there are no real records instead of showing mock tables.

## Risks / Trade-offs

- **Firestore timestamps and Stripe fields may vary by record source** -> Normalize defensively and display fallback identifiers.
- **Admin may expect direct refund execution from the table** -> Keep this iteration as review-first; existing server refund callable remains the controlled mutation path.
- **Large collections can make client-side aggregation expensive** -> This iteration limits itself to current admin datasets; introduce server snapshots later if needed.
- **Tests add a new local verification script** -> Keep it dependency-free with Node's built-in test runner to avoid expanding the toolchain.

## Migration Plan

1. Add pure reconciliation helpers and dependency-free tests.
2. Render the reconciliation summary in the existing admin operations screen.
3. Run build, function build, OpenSpec validation, workflow doctor, and brief.
4. Stage only files touched by this change and push after validation.
