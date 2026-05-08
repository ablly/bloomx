import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {
  adminRoleForIdentity,
  allowedAdminEmails,
  buildAdminCustomClaims,
  isAdminIdentity,
  normalizeAdminRole,
} from './adminAuthorization';

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

const ALLOWED_COLLECTIONS = new Set([
  'users',
  'sellers',
  'seller_applications',
  'products',
  'purchases',
  'payment_transactions',
  'credit_ledger',
  'refunds',
  'webhook_events',
  'seller_settlements',
  'automationWorkflowEvents',
  'admin_action_requests',
  'audit_logs',
  'system_config',
]);

const ALLOWED_ACTIONS = new Set([
  'adjust_user_role',
  'freeze_user',
  'unfreeze_user',
  'adjust_user_credits',
  'export_user_audit',
  'submit_review',
  'approve_product_listing',
  'reject_product_listing',
  'suspend_product_listing',
  'replay_failed_event',
  'export_record_summary',
  'save_system_config',
  'approve_admin_action',
  'reject_admin_action',
]);

const TERMINAL_STATUSES = new Set(['approved_executed', 'rejected', 'execution_failed']);
const EXECUTABLE_STATUSES = new Set(['pending_approval', 'dry_run_recorded', 'execution_failed']);
const USER_ROLES = new Set(['buyer', 'seller', 'admin']);

type AdminActionPayload = {
  actionType?: string;
  targetCollection?: string;
  targetId?: string;
  reason?: string;
  dryRun?: boolean;
  metadata?: Record<string, unknown>;
};

type AdminClaimsPayload = {
  targetUid?: string;
  role?: string;
  reason?: string;
};

function assertString(value: unknown, field: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new functions.https.HttpsError('invalid-argument', `${field} is required`);
  }
  return normalized;
}

function assertSafeDocumentId(value: string): string {
  if (value.includes('/') || value.length > 160) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid targetId');
  }
  return value;
}

function sanitizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key.length <= 64)
      .slice(0, 20)
      .map(([key, entry]) => {
        if (entry === null || ['string', 'number', 'boolean'].includes(typeof entry)) return [key, entry];
        return [key, String(entry).slice(0, 500)];
      }),
  );
}

function metadataString(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === 'string' ? value.trim() : '';
}

function metadataNumber(metadata: Record<string, unknown>, key: string): number | undefined {
  const value = metadata[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function normalizeProductModelNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(
    value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .filter((item) => item.length <= 160 && !/[\r\n]/.test(item)),
  ));
}

function pricePerCallFromProduct(product: admin.firestore.DocumentData): number {
  const configured = Number(product.pricePerCall ?? product.subscription_price_credits);
  if (Number.isFinite(configured) && configured > 0) return Number(configured.toFixed(6));

  const pricing = product.pricing as Record<string, unknown> | undefined;
  const input = Number(pricing?.input_per_1k ?? 0);
  const output = Number(pricing?.output_per_1k ?? 0);
  const estimated = input + output;
  return Number.isFinite(estimated) && estimated > 0 ? Number(Math.max(1, estimated).toFixed(6)) : 1;
}

export function buildListedApiOffer(
  productId: string,
  product: Record<string, unknown>,
  actor: {uid: string; email: string; role: string},
): Record<string, unknown> {
  const modelNames = normalizeProductModelNames(product.models);
  const modelName = modelNames[0] || String(product.name || productId);
  const sellerId = String(product.seller_id || product.sellerId || product.ownerId || '');

  return {
    id: productId,
    offerId: productId,
    productId,
    sellerId,
    ownerId: sellerId,
    sellerUid: product.seller_uid || product.sellerUid || null,
    sellerName: product.sellerName || product.seller_name || null,
    name: String(product.name || modelName),
    description: String(product.description || ''),
    modelName,
    modelNames,
    models: modelNames,
    providerType: product.provider_type || product.providerType || null,
    baseUrl: product.base_url || product.baseUrl || null,
    pricing: product.pricing || null,
    pricePerCall: pricePerCallFromProduct(product),
    status: 'listed',
    source: 'admin_product_approval',
    listedBy: actor.uid,
    listedAt: adminTimestamp(),
    updatedAt: adminTimestamp(),
  };
}

function summarizeDocument(data: admin.firestore.DocumentData | undefined): Record<string, unknown> {
  if (!data) return {};
  const keys = [
    'email',
    'role',
    'status',
    'credits_balance',
    'credits',
    'provider',
    'eventType',
    'processingStatus',
    'userId',
    'uid',
    'sellerId',
    'updatedAt',
    'adminReviewStatus',
    'replayStatus',
      'lastAdminActionRequestId',
      'lastProductListingAction',
      'modelName',
    ];

  return Object.fromEntries(
    keys
      .filter((key) => data[key] !== undefined)
      .map((key) => {
        const value = data[key];
        if (value && typeof value === 'object' && typeof value.toDate === 'function') {
          return [key, value.toDate().toISOString()];
        }
        return [key, value];
      }),
  );
}

function adminTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}

function adminActionRequestRef(requestId: string) {
  return firestore.collection('admin_action_requests').doc(requestId);
}

function auditLogRef(requestId: string) {
  return firestore.collection('audit_logs').doc(requestId);
}

function ensureExecutableTarget(actionType: string, targetCollection: string, metadata: Record<string, unknown>) {
  if (['freeze_user', 'unfreeze_user', 'adjust_user_role', 'adjust_user_credits', 'export_user_audit'].includes(actionType)) {
    if (targetCollection !== 'users') {
      throw new functions.https.HttpsError('failed-precondition', 'User action can only target users');
    }
  }

  if (actionType === 'replay_failed_event' && !['webhook_events', 'automationWorkflowEvents'].includes(targetCollection)) {
    throw new functions.https.HttpsError('failed-precondition', 'Replay action can only target webhook or workflow events');
  }

  if (['approve_product_listing', 'reject_product_listing', 'suspend_product_listing'].includes(actionType)) {
    if (targetCollection !== 'products') {
      throw new functions.https.HttpsError('failed-precondition', 'Product listing action can only target products');
    }
  }

  if (actionType === 'adjust_user_role') {
    const nextRole = metadataString(metadata, 'nextRole');
    if (!USER_ROLES.has(nextRole)) {
      throw new functions.https.HttpsError('failed-precondition', 'nextRole is required for role changes');
    }
  }

  if (actionType === 'adjust_user_credits') {
    const creditDelta = metadataNumber(metadata, 'creditDelta');
    if (creditDelta === undefined || creditDelta === 0 || Math.abs(creditDelta) > 100000) {
      throw new functions.https.HttpsError('failed-precondition', 'creditDelta is required and must be within policy');
    }
  }

  if (['save_system_config'].includes(actionType)) {
    throw new functions.https.HttpsError('failed-precondition', 'This action requires a dedicated production API');
  }
}

function buildTargetPatch(
  actionType: string,
  targetCollection: string,
  requestId: string,
  actor: {uid: string; email: string; role: string},
  metadata: Record<string, unknown>,
): admin.firestore.UpdateData<admin.firestore.DocumentData> | null {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const base = {
    lastAdminActionRequestId: requestId,
    lastAdminActionType: actionType,
    lastAdminActionBy: actor.uid,
    updatedAt: now,
  };

  if (actionType === 'freeze_user') {
    return {
      ...base,
      status: 'suspended',
      suspendedAt: now,
      suspendedBy: actor.uid,
    };
  }

  if (actionType === 'unfreeze_user') {
    return {
      ...base,
      status: 'active',
      unsuspendedAt: now,
      unsuspendedBy: actor.uid,
    };
  }

  if (actionType === 'adjust_user_role') {
    return {
      ...base,
      role: metadataString(metadata, 'nextRole'),
      roleChangedAt: now,
      roleChangedBy: actor.uid,
    };
  }

  if (actionType === 'adjust_user_credits') {
    return {
      ...base,
      credits_balance: admin.firestore.FieldValue.increment(metadataNumber(metadata, 'creditDelta') ?? 0),
      creditsAdjustedAt: now,
      creditsAdjustedBy: actor.uid,
    };
  }

  if (actionType === 'submit_review') {
    return {
      ...base,
      adminReviewStatus: 'review_requested',
      adminReviewRequestedAt: now,
      adminReviewRequestedBy: actor.uid,
    };
  }

  if (actionType === 'replay_failed_event') {
    return {
      ...base,
      replayStatus: 'queued',
      replayQueuedAt: now,
      replayQueuedBy: actor.uid,
      status: targetCollection === 'webhook_events' ? 'queued_for_replay' : 'retry_queued',
    };
  }

  if (actionType === 'export_record_summary' || actionType === 'export_user_audit') {
    return null;
  }

  throw new functions.https.HttpsError('failed-precondition', 'Action is not executable in this release');
}

function writeReplayQueueEntry(
  transaction: admin.firestore.Transaction,
  requestId: string,
  targetCollection: string,
  targetId: string,
  targetData: admin.firestore.DocumentData,
  actor: {uid: string; email: string; role: string},
  metadata: Record<string, unknown>,
) {
  if (targetCollection === 'webhook_events') {
    transaction.set(firestore.collection('stripe_webhook_replay_queue').doc(requestId), {
      id: requestId,
      requestId,
      sourceCollection: targetCollection,
      sourceId: targetId,
      provider: targetData.provider ?? 'stripe',
      environment: targetData.environment ?? process.env.STRIPE_ENVIRONMENT ?? 'test',
      providerEventId: targetData.eventId ?? targetId,
      eventType: targetData.eventType ?? 'unknown',
      status: 'queued',
      attempts: 0,
      requestedBy: actor,
      metadata,
      createdAt: adminTimestamp(),
      updatedAt: adminTimestamp(),
    }, {merge: true});
    return;
  }

  if (targetCollection === 'automationWorkflowEvents') {
    transaction.set(firestore.collection('workflow_replay_queue').doc(requestId), {
      id: requestId,
      requestId,
      sourceCollection: targetCollection,
      sourceId: targetId,
      workflowName: targetData.workflowName ?? targetData.workflow ?? metadata.workflowName ?? 'unknown',
      status: 'queued',
      attempts: 0,
      requestedBy: actor,
      metadata,
      createdAt: adminTimestamp(),
      updatedAt: adminTimestamp(),
    }, {merge: true});
  }
}

function productListingActionStatus(actionType: string) {
  if (actionType === 'approve_product_listing') {
    return {
      productStatus: 'active',
      offerStatus: 'listed',
      secretStatus: 'active',
      reviewStatus: 'approved',
      verified: true,
    };
  }

  if (actionType === 'reject_product_listing') {
    return {
      productStatus: 'rejected',
      offerStatus: 'rejected',
      secretStatus: 'disabled',
      reviewStatus: 'rejected',
      verified: false,
    };
  }

  return {
    productStatus: 'suspended',
    offerStatus: 'suspended',
    secretStatus: 'suspended',
    reviewStatus: 'suspended',
    verified: false,
  };
}

async function executeProductListingAction(
  transaction: admin.firestore.Transaction,
  actionType: string,
  productId: string,
  requestId: string,
  actor: {uid: string; email: string; role: string},
  metadata: Record<string, unknown>,
) {
  const productRef = firestore.collection('products').doc(productId);
  const productSnap = await transaction.get(productRef);

  if (!productSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Product record not found');
  }

  const product = productSnap.data() ?? {};
  const sellerId = String(product.seller_id || product.sellerId || '');
  if (!sellerId) {
    throw new functions.https.HttpsError('failed-precondition', 'Product is missing seller id');
  }

  const modelNames = normalizeProductModelNames(product.models);
  if (actionType === 'approve_product_listing' && modelNames.length === 0) {
    throw new functions.https.HttpsError('failed-precondition', 'Product has no tested models to list');
  }

  const sellerProductRef = firestore.collection('sellers').doc(sellerId).collection('products').doc(productId);
  const secretRef = firestore.collection('merchantApiSecrets').doc(productId);
  const offerRef = firestore.collection('apiOffers').doc(productId);
  const [sellerProductSnap, secretSnap] = await Promise.all([
    transaction.get(sellerProductRef),
    transaction.get(secretRef),
  ]);

  if (actionType === 'approve_product_listing' && !secretSnap.exists) {
    throw new functions.https.HttpsError('failed-precondition', 'Merchant API secret is missing');
  }

  const status = productListingActionStatus(actionType);
  const now = adminTimestamp();
  const productPatch = {
    status: status.productStatus,
    is_verified: status.verified,
    adminReviewStatus: status.reviewStatus,
    adminReviewedAt: now,
    adminReviewedBy: actor.uid,
    lastAdminActionRequestId: requestId,
    lastAdminActionType: actionType,
    lastAdminActionBy: actor.uid,
    lastProductListingAction: actionType,
    reviewReason: metadataString(metadata, 'reviewReason') || metadataString(metadata, 'recordTitle') || null,
    updatedAt: now,
  };

  transaction.set(productRef, productPatch, {merge: true});
  transaction.set(sellerProductRef, sellerProductSnap.exists ? productPatch : {...product, ...productPatch}, {merge: true});

  if (actionType === 'approve_product_listing') {
    transaction.set(offerRef, buildListedApiOffer(productId, product, actor), {merge: true});
  } else {
    transaction.set(offerRef, {
      id: productId,
      offerId: productId,
      productId,
      sellerId,
      ownerId: sellerId,
      modelName: modelNames[0] || String(product.name || productId),
      modelNames,
      models: modelNames,
      status: status.offerStatus,
      lastAdminActionRequestId: requestId,
      updatedAt: now,
    }, {merge: true});
  }

  if (secretSnap.exists) {
    transaction.set(secretRef, {
      status: status.secretStatus,
      runtimeEnabled: actionType === 'approve_product_listing',
      lastAdminActionRequestId: requestId,
      updatedAt: now,
    }, {merge: true});
  }

  return {
    before: summarizeDocument(product),
    after: {
      ...summarizeDocument(product),
      status: status.productStatus,
      adminReviewStatus: status.reviewStatus,
      lastProductListingAction: actionType,
      modelName: modelNames[0] || null,
    },
  };
}

async function createActionRequest(
  data: AdminActionPayload,
  actor: {uid: string; email: string; role: string},
) {
  const actionType = assertString(data.actionType, 'actionType');
  const targetCollection = assertString(data.targetCollection, 'targetCollection');
  const targetId = assertSafeDocumentId(assertString(data.targetId, 'targetId'));
  const reason = assertString(data.reason, 'reason');
  const metadata = sanitizeMetadata(data.metadata);

  if (!ALLOWED_ACTIONS.has(actionType)) {
    throw new functions.https.HttpsError('invalid-argument', 'Unsupported actionType');
  }

  if (!ALLOWED_COLLECTIONS.has(targetCollection)) {
    throw new functions.https.HttpsError('invalid-argument', 'Unsupported targetCollection');
  }

  if (reason.length < 6 || reason.length > 500) {
    throw new functions.https.HttpsError('invalid-argument', 'Reason must be 6-500 characters');
  }

  const targetRef = firestore.collection(targetCollection).doc(targetId);
  const targetSnap = await targetRef.get();
  const requestRef = firestore.collection('admin_action_requests').doc();
  const requestId = requestRef.id;
  const auditRef = auditLogRef(requestId);
  const dryRun = data.dryRun === true;
  const status = dryRun ? 'dry_run_recorded' : 'pending_approval';
  const now = adminTimestamp();
  const requestRecord = {
    requestId,
    actionType,
    targetCollection,
    targetId,
    targetExists: targetSnap.exists,
    actor,
    reason,
    metadata,
    dryRun,
    requestedDryRun: dryRun,
    status,
    beforeSummary: summarizeDocument(targetSnap.data()),
    afterSummary: null,
    createdAt: now,
    updatedAt: now,
  };

  await Promise.all([
    requestRef.set(requestRecord),
    auditRef.set({
      ...requestRecord,
      mirroredRequestPath: `admin_action_requests/${requestId}`,
    }),
  ]);

  return {
    success: true,
    requestId,
    dryRun,
    status,
  };
}

async function approveActionRequest(
  data: AdminActionPayload,
  approver: {uid: string; email: string; role: string},
) {
  const targetCollection = assertString(data.targetCollection, 'targetCollection');
  const requestId = assertSafeDocumentId(assertString(data.targetId, 'targetId'));
  const reason = assertString(data.reason, 'reason');

  if (targetCollection !== 'audit_logs') {
    throw new functions.https.HttpsError('invalid-argument', 'Approval must target audit_logs');
  }

  if (reason.length < 6 || reason.length > 500) {
    throw new functions.https.HttpsError('invalid-argument', 'Reason must be 6-500 characters');
  }

  let finalStatus = 'approved_executed';
  let finalError: string | null = null;

  await firestore.runTransaction(async (transaction) => {
    const requestRef = adminActionRequestRef(requestId);
    const auditRef = auditLogRef(requestId);
    const requestSnap = await transaction.get(requestRef);
    const auditSnap = requestSnap.exists ? requestSnap : await transaction.get(auditRef);

    if (!auditSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Admin action request not found');
    }

    const audit = auditSnap.data() ?? {};
    const status = String(audit.status || '');

    if (TERMINAL_STATUSES.has(status)) {
      throw new functions.https.HttpsError('failed-precondition', 'Admin action request already reached a terminal state');
    }

    if (!EXECUTABLE_STATUSES.has(status)) {
      throw new functions.https.HttpsError('failed-precondition', 'Admin action request is not executable');
    }

    const originalActionType = String(audit.actionType || '');
    const originalTargetCollection = String(audit.targetCollection || '');
    const originalTargetId = assertSafeDocumentId(assertString(audit.targetId, 'audit.targetId'));
    const metadata = sanitizeMetadata(audit.metadata);

    try {
      ensureExecutableTarget(originalActionType, originalTargetCollection, metadata);
      const targetRef = firestore.collection(originalTargetCollection).doc(originalTargetId);
      const beforeSnap = await transaction.get(targetRef);

      if (!beforeSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Target record not found');
      }

      const listingResult = ['approve_product_listing', 'reject_product_listing', 'suspend_product_listing'].includes(originalActionType)
        ? await executeProductListingAction(
            transaction,
            originalActionType,
            originalTargetId,
            requestId,
            approver,
            metadata,
          )
        : null;
      const patch = listingResult ? null : buildTargetPatch(originalActionType, originalTargetCollection, requestId, approver, metadata);
      if (patch) {
        transaction.update(targetRef, patch);
      }
      if (originalActionType === 'replay_failed_event') {
        writeReplayQueueEntry(
          transaction,
          requestId,
          originalTargetCollection,
          originalTargetId,
          beforeSnap.data() ?? {},
          approver,
          metadata,
        );
      }

      const afterSummary = listingResult
        ? listingResult.after
        : patch
        ? {
            ...summarizeDocument(beforeSnap.data()),
            ...Object.fromEntries(
              Object.entries(patch)
                .filter(([, value]) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
                .map(([key, value]) => [key, value]),
            ),
          }
        : summarizeDocument(beforeSnap.data());
      const executedPatch = {
        status: 'approved_executed',
        dryRun: false,
        approvalReason: reason,
        approvedBy: approver,
        approvedAt: adminTimestamp(),
        executedBy: approver,
        executedAt: adminTimestamp(),
        executionError: null,
        beforeSummary: listingResult ? listingResult.before : summarizeDocument(beforeSnap.data()),
        afterSummary,
        updatedAt: adminTimestamp(),
      };

      transaction.set(requestRef, executedPatch, {merge: true});
      transaction.set(auditRef, {
        ...executedPatch,
        requestId,
        mirroredRequestPath: `admin_action_requests/${requestId}`,
      }, {merge: true});
    } catch (error) {
      finalStatus = 'execution_failed';
      finalError = error instanceof Error ? error.message : 'Execution failed';
      const failedPatch = {
        status: finalStatus,
        approvalReason: reason,
        approvedBy: approver,
        approvedAt: adminTimestamp(),
        executionError: finalError,
        updatedAt: adminTimestamp(),
      };
      transaction.set(requestRef, failedPatch, {merge: true});
      transaction.set(auditRef, {
        ...failedPatch,
        requestId,
        mirroredRequestPath: `admin_action_requests/${requestId}`,
      }, {merge: true});
    }
  });

  return {
    success: finalStatus === 'approved_executed',
    requestId,
    dryRun: false,
    status: finalStatus,
    error: finalError,
  };
}

async function rejectActionRequest(
  data: AdminActionPayload,
  reviewer: {uid: string; email: string; role: string},
) {
  const targetCollection = assertString(data.targetCollection, 'targetCollection');
  const requestId = assertSafeDocumentId(assertString(data.targetId, 'targetId'));
  const reason = assertString(data.reason, 'reason');

  if (targetCollection !== 'audit_logs') {
    throw new functions.https.HttpsError('invalid-argument', 'Rejection must target audit_logs');
  }

  if (reason.length < 6 || reason.length > 500) {
    throw new functions.https.HttpsError('invalid-argument', 'Reason must be 6-500 characters');
  }

  await firestore.runTransaction(async (transaction) => {
    const requestRef = adminActionRequestRef(requestId);
    const auditRef = auditLogRef(requestId);
    const requestSnap = await transaction.get(requestRef);
    const auditSnap = requestSnap.exists ? requestSnap : await transaction.get(auditRef);

    if (!auditSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Admin action request not found');
    }

    const audit = auditSnap.data() ?? {};
    const status = String(audit.status || '');

    if (TERMINAL_STATUSES.has(status)) {
      throw new functions.https.HttpsError('failed-precondition', 'Admin action request already reached a terminal state');
    }

    const rejectedPatch = {
      status: 'rejected',
      rejectionReason: reason,
      rejectedBy: reviewer,
      rejectedAt: adminTimestamp(),
      updatedAt: adminTimestamp(),
    };

    transaction.set(requestRef, rejectedPatch, {merge: true});
    transaction.set(auditRef, {
      ...rejectedPatch,
      requestId,
      mirroredRequestPath: `admin_action_requests/${requestId}`,
    }, {merge: true});
  });

  return {
    success: true,
    requestId,
    dryRun: false,
    status: 'rejected',
  };
}

async function assertAdmin(context: functions.https.CallableContext) {
  const uid = context.auth?.uid;
  const email = String(context.auth?.token.email || '').trim().toLowerCase();

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Admin action requires sign in');
  }

  const allowedByEmail = allowedAdminEmails().includes(email);
  const userSnap = await firestore.collection('users').doc(uid).get();
  const role = String(userSnap.data()?.role || '');
  const token = context.auth?.token as Record<string, unknown>;

  if (!isAdminIdentity({uid, email, token}) && role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin role is required');
  }

  return {
    uid,
    email,
    role: allowedByEmail ? 'owner' : adminRoleForIdentity({uid, email, token}, role),
  };
}

export const runAdminAction = functions
  .runWith({invoker: 'public'})
  .https.onCall(async (data: AdminActionPayload, context) => {
    const actor = await assertAdmin(context);
    const actionType = assertString(data.actionType, 'actionType');

    if (actionType === 'approve_admin_action') {
      return approveActionRequest(data, actor);
    }

    if (actionType === 'reject_admin_action') {
      return rejectActionRequest(data, actor);
    }

    return createActionRequest(data, actor);
  });

export const syncAdminCustomClaims = functions
  .runWith({invoker: 'public'})
  .https.onCall(async (data: AdminClaimsPayload, context) => {
    const actor = await assertAdmin(context);
    const targetUid = String(data.targetUid || actor.uid).trim();
    const reason = String(data.reason || 'sync admin custom claims').trim().slice(0, 500);

    if (!targetUid || targetUid.includes('/') || targetUid.length > 160) {
      throw new functions.https.HttpsError('invalid-argument', 'targetUid is invalid');
    }

    const role = normalizeAdminRole(data.role || actor.role);
    const claims = buildAdminCustomClaims(role);
    const now = adminTimestamp();
    const requestRef = firestore.collection('admin_action_requests').doc();
    const requestId = requestRef.id;
    const requestRecord = {
      requestId,
      actionType: 'sync_admin_custom_claims',
      targetCollection: 'users',
      targetId: targetUid,
      actor,
      reason,
      metadata: {
        claims,
      },
      status: 'approved_executed',
      dryRun: false,
      createdAt: now,
      updatedAt: now,
    };

    await admin.auth().setCustomUserClaims(targetUid, claims);
    await Promise.all([
      firestore.collection('users').doc(targetUid).set({
        role: 'admin',
        adminRole: role,
        adminClaimsSyncedAt: now,
        updatedAt: now,
      }, {merge: true}),
      requestRef.set(requestRecord),
      auditLogRef(requestId).set({
        ...requestRecord,
        mirroredRequestPath: `admin_action_requests/${requestId}`,
      }),
    ]);

    return {
      success: true,
      requestId,
      targetUid,
      role,
      claims,
      message: 'Admin custom claims synced. The target user must sign out and sign in again to refresh the token.',
    };
  });
