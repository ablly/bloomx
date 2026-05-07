## ADDED Requirements

### Requirement: Payment operations reconciliation entry
The project SHALL provide an admin-visible payment reconciliation entry before production payment operations are considered complete.

#### Scenario: Production payment readiness review
- **WHEN** BloomX enables Stripe payment, refund, dispute, or credit ledger flows for real users
- **THEN** the admin console includes a reconciliation surface that shows payment transactions, credit ledger state, webhook health, refunds, disputes, and audit-relevant review queues
