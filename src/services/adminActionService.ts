import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../lib/firebase';

export type AdminActionType =
  | 'adjust_user_role'
  | 'freeze_user'
  | 'unfreeze_user'
  | 'adjust_user_credits'
  | 'export_user_audit'
  | 'submit_review'
  | 'replay_failed_event'
  | 'export_record_summary'
  | 'save_system_config'
  | 'approve_admin_action'
  | 'reject_admin_action';

export interface AdminActionInput {
  actionType: AdminActionType;
  targetCollection: string;
  targetId: string;
  reason: string;
  dryRun?: boolean;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AdminActionResult {
  success: boolean;
  requestId: string;
  dryRun: boolean;
  status: string;
  error?: string | null;
}

const functions = getFunctions(app);
const runAdminActionCallable = httpsCallable<AdminActionInput, AdminActionResult>(
  functions,
  'runAdminAction',
);

export async function runAdminAction(input: AdminActionInput): Promise<AdminActionResult> {
  const result = await runAdminActionCallable(input);

  return result.data;
}

export function approveAdminAction(requestId: string, reason: string): Promise<AdminActionResult> {
  return runAdminAction({
    actionType: 'approve_admin_action',
    targetCollection: 'audit_logs',
    targetId: requestId,
    reason,
  });
}

export function rejectAdminAction(requestId: string, reason: string): Promise<AdminActionResult> {
  return runAdminAction({
    actionType: 'reject_admin_action',
    targetCollection: 'audit_logs',
    targetId: requestId,
    reason,
  });
}
