## ADDED Requirements

### Requirement: Payment reconciliation summary
The admin console SHALL summarize Stripe payment operations from real payment transactions, credit ledger, webhook, refund, and dispute records.

#### Scenario: Summary from real records
- **WHEN** an authorized admin opens the operations console and payment records exist
- **THEN** the console shows totals for collected Stripe amount, credited ledger amount, pending refunds, open disputes, failed webhooks, and records requiring review

#### Scenario: Empty production state
- **WHEN** an authorized admin opens the operations console and no payment records exist
- **THEN** the console shows an explicit empty state and MUST NOT render mock payment records

### Requirement: Refund and dispute review queue
The admin console SHALL highlight refund and dispute records that require human review before operational closure.

#### Scenario: Refund requires review
- **WHEN** a refund record has status `requested`, `pending`, `requires_action`, `failed`, or `processing`
- **THEN** the refund appears in the review queue with amount, transaction reference, reason, status, and latest known Stripe identifier when available

#### Scenario: Dispute requires review
- **WHEN** a dispute record has status other than `won`, `lost`, `closed`, or `resolved`
- **THEN** the dispute appears in the review queue with amount, transaction reference, reason, status, and latest known Stripe identifier when available

### Requirement: Client-side payment aggregation is testable
Payment reconciliation aggregation SHALL be implemented as deterministic logic that can be verified without Firebase or Stripe network access.

#### Scenario: Aggregation test
- **WHEN** test fixtures include transactions, ledger entries, webhook events, refunds, and disputes
- **THEN** the aggregation returns stable totals, review counts, and anomaly queues without requiring external services
