## ADDED Requirements

### Requirement: Realtime admin data subscriptions
The admin console SHALL update operational datasets in near real time from real Firestore records.

#### Scenario: Authorized admin receives live updates
- **WHEN** an authorized admin opens `/admin`
- **THEN** the console subscribes to operational collections after authentication is restored
- **AND** the console updates visible metrics and tables when subscribed records change

#### Scenario: Unauthenticated user does not start admin listeners
- **WHEN** Firebase Auth is still loading or no user is signed in
- **THEN** the admin console MUST NOT subscribe to protected operational collections

### Requirement: Partial dataset failure isolation
The admin console SHALL isolate collection read failures so one failing collection does not blank the whole backend.

#### Scenario: One protected collection fails
- **WHEN** one subscribed collection returns a permission or network error
- **THEN** that dataset records an error
- **AND** other datasets that can be read remain visible

### Requirement: Testable admin aggregation
Admin snapshot aggregation SHALL be deterministic and testable without Firebase or Activepieces network access.

#### Scenario: Snapshot built from fixtures
- **WHEN** tests provide dataset fixtures and one dataset error
- **THEN** the snapshot preserves rows, status counts, payment reconciliation, risks, queue items, and dataset errors

### Requirement: Production workflow provider
BloomX production workflow automation SHALL default to Activepieces while preserving Node-RED and Windmill as open-source complements.

#### Scenario: Workflow platform selection
- **WHEN** a workflow involves merchant review, payment notification, support triage, settlement drafts, health checks, or event routing
- **THEN** the default production provider is Activepieces
- **AND** Node-RED may be used for lightweight event bridges
- **AND** Windmill may be used for scripted batch jobs

