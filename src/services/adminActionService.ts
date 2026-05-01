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
  | 'save_system_config';

export interface AdminActionInput {
  actionType: AdminActionType;
  targetCollection: string;
  targetId: string;
  reason: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AdminActionResult {
  success: boolean;
  requestId: string;
  dryRun: boolean;
  status: string;
}

const functions = getFunctions(app);
const runAdminActionCallable = httpsCallable<AdminActionInput & { dryRun: true }, AdminActionResult>(
  functions,
  'runAdminAction',
);

export async function runAdminAction(input: AdminActionInput): Promise<AdminActionResult> {
  const result = await runAdminActionCallable({
    ...input,
    dryRun: true,
  });

  return result.data;
}
