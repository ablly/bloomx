import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

const DEFAULT_ADMIN_EMAIL = 'zqhablly@gmail.com';
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
  'replay_failed_event',
  'export_record_summary',
  'save_system_config',
]);

type AdminActionPayload = {
  actionType?: string;
  targetCollection?: string;
  targetId?: string;
  reason?: string;
  dryRun?: boolean;
  metadata?: Record<string, unknown>;
};

function allowedAdminEmails(): string[] {
  return String(process.env.ADMIN_ALLOWED_EMAILS || DEFAULT_ADMIN_EMAIL)
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

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

async function assertAdmin(context: functions.https.CallableContext) {
  const uid = context.auth?.uid;
  const email = String(context.auth?.token.email || '').trim().toLowerCase();

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Admin action requires sign in');
  }

  const allowedByEmail = allowedAdminEmails().includes(email);
  const userSnap = await firestore.collection('users').doc(uid).get();
  const role = String(userSnap.data()?.role || '');

  if (!allowedByEmail && role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin role is required');
  }

  return {
    uid,
    email,
    role: allowedByEmail ? 'owner' : role,
  };
}

export const runAdminAction = functions
  .runWith({invoker: 'public'})
  .https.onCall(async (data: AdminActionPayload, context) => {
    const actor = await assertAdmin(context);
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
    const auditRef = firestore.collection('audit_logs').doc();
    const requestId = auditRef.id;

    await auditRef.set({
      requestId,
      actionType,
      targetCollection,
      targetId,
      targetExists: targetSnap.exists,
      actor,
      reason,
      metadata,
      dryRun: true,
      requestedDryRun: data.dryRun !== false,
      status: 'dry_run_recorded',
      beforeSummary: summarizeDocument(targetSnap.data()),
      afterSummary: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      requestId,
      dryRun: true,
      status: 'dry_run_recorded',
    };
  });
