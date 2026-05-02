import { existsSync, readFileSync } from 'node:fs';

type WorkflowEntry = {
  name: string;
  provider: 'activepieces' | 'node-red' | 'windmill';
  eventType: string;
  firebaseSecret: string;
  trigger: string;
};

const requiredSecrets = [
  'WORKFLOW_SIGNING_SECRET',
  'WORKFLOW_SELLER_APPLICATION_WEBHOOK',
  'WORKFLOW_SUPPORT_TICKET_WEBHOOK',
  'WORKFLOW_PAYMENT_SUCCESS_WEBHOOK',
  'WORKFLOW_SETTLEMENT_REPORT_WEBHOOK',
  'WORKFLOW_API_HEALTH_WEBHOOK',
  'WORKFLOW_EVENT_BUS_WEBHOOK',
];

const expectedProviders = new Set(['activepieces', 'node-red', 'windmill']);
const mapPath = 'workflows/free-workflow-map.bloomx.json';

function readMap() {
  if (!existsSync(mapPath)) {
    throw new Error(`Missing ${mapPath}`);
  }

  const parsed = JSON.parse(readFileSync(mapPath, 'utf8')) as {workflows?: WorkflowEntry[]};
  if (!Array.isArray(parsed.workflows) || parsed.workflows.length < 6) {
    throw new Error('Free workflow map must contain at least six BloomX workflow entries.');
  }

  return parsed.workflows;
}

function main() {
  const workflows = readMap();
  const missingSecrets = requiredSecrets.filter((secret) => !workflows.some((workflow) => workflow.firebaseSecret === secret) && secret !== 'WORKFLOW_SIGNING_SECRET');
  const invalidProviders = workflows.filter((workflow) => !expectedProviders.has(workflow.provider));
  const n8nReferences = workflows.filter((workflow) => JSON.stringify(workflow).toLowerCase().includes('n8n'));

  console.log('BloomX free workflow doctor');
  console.log('');
  console.log(`Workflow entries: ${workflows.length}`);
  console.log(`Providers: ${Array.from(new Set(workflows.map((workflow) => workflow.provider))).join(', ')}`);

  if (missingSecrets.length > 0) {
    throw new Error(`Missing workflow secret mappings: ${missingSecrets.join(', ')}`);
  }

  if (invalidProviders.length > 0) {
    throw new Error(`Invalid providers: ${invalidProviders.map((workflow) => workflow.name).join(', ')}`);
  }

  if (n8nReferences.length > 0) {
    throw new Error(`n8n references are not allowed in the active workflow map: ${n8nReferences.map((workflow) => workflow.name).join(', ')}`);
  }

  console.log('Free workflow map: OK');
  console.log('Required Firebase Secrets:');
  for (const secret of requiredSecrets) console.log(`- ${secret}`);
}

try {
  main();
} catch (error) {
  console.error('Free workflow doctor failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
