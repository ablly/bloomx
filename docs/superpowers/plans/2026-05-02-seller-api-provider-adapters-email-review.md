# Seller API Provider Adapters Email Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production seller API onboarding path: provider model discovery, smoke tests, pending review status, and email outbox planning without mock data.

**Architecture:** Cloud Functions owns all Provider requests, API secret encryption, product creation, and test logs. React seller UI only collects input and calls callable functions; marketplace listing remains gated by `active` status after admin review.

**Tech Stack:** Firebase Functions, Firestore, React, TypeScript, Vite, OpenSpec.

---

### Task 1: Provider Adapter Service

**Files:**
- Create: `functions/src/providerAdapters.ts`

- [ ] Add provider types, URL safety checks, auth header construction, model normalization, and smoke test helpers.
- [ ] Reject non-HTTPS, localhost, private IP, metadata hostnames, and Bedrock without dedicated connector.
- [ ] Return real Provider results only; never generate mock models.

### Task 2: Seller API Onboarding Callable Functions

**Files:**
- Create: `functions/src/sellerApiOnboarding.ts`
- Modify: `functions/src/index.ts`

- [ ] Add `fetchSellerApiModels`, `testSellerApiModels`, and `submitSellerApiProduct`.
- [ ] Require authenticated approved seller.
- [ ] Encrypt API secrets server-side using `API_SECRET_ENCRYPTION_KEY`.
- [ ] Write `merchantApiTestLogs` for fetch and smoke tests.
- [ ] Create products with `pending_review` only after all selected models pass smoke tests.

### Task 3: Seller Frontend Flow

**Files:**
- Create: `src/services/sellerApiOnboardingService.ts`
- Modify: `src/components/seller/SellerProductForm.tsx`
- Modify: `src/services/productService.ts`

- [ ] Add provider selection and server callable client.
- [ ] Fetch real model list via Cloud Function.
- [ ] Let seller select models returned by Provider.
- [ ] Submit product through Cloud Function, not direct Firestore active writes.
- [ ] Keep edit/delete behavior scoped to existing records.

### Task 4: Project Status And Verification

**Files:**
- Modify: `scripts/project-brief.ts`
- Modify: `public/project-hub.html`
- Modify: `openspec/changes/seller-api-provider-adapters-email-review/tasks.md`

- [ ] Update Chinese brief and hub with multi-provider onboarding and no mock rule.
- [ ] Run `npm --prefix functions run build`.
- [ ] Run `npm run build`.
- [ ] Run `npm run spec:validate:strict`.
- [ ] Probe `/seller/products/new`, `/admin/products`, `/project-hub.html`, `/workflows.html`.
- [ ] Scan changed files for hardcoded secrets.
