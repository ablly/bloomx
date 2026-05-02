type JsonObject = Record<string, unknown>;

type MakeHook = {
  id?: number | string;
  name?: string;
  address?: string;
  typeName?: string;
};

type MakeHooksResponse = {
  hooks?: MakeHook[];
  hook?: MakeHook;
};

type MakeRequestOptions = {
  zone: string;
  authScheme: 'Token' | 'Bearer';
  path: string;
  init?: RequestInit;
};

const workflows = [
  {
    name: 'bloomx_seller_application',
    secret: 'MAKE_SELLER_APPLICATION_WEBHOOK',
    eventType: 'seller_application.created',
    purpose: 'Notify operations when a seller application is created.',
  },
  {
    name: 'bloomx_support_ticket',
    secret: 'MAKE_SUPPORT_TICKET_WEBHOOK',
    eventType: 'support_ticket.created',
    purpose: 'Create an after-sales ticket and alert operations.',
  },
  {
    name: 'bloomx_payment_success',
    secret: 'MAKE_PAYMENT_SUCCESS_WEBHOOK',
    eventType: 'payment.succeeded',
    purpose: 'Record successful payments and send receipts.',
  },
  {
    name: 'bloomx_monthly_settlement',
    secret: 'MAKE_SETTLEMENT_REPORT_WEBHOOK',
    eventType: 'settlement.monthly_snapshot',
    purpose: 'Generate merchant settlement reports every month.',
  },
  {
    name: 'bloomx_api_health',
    secret: 'MAKE_API_HEALTH_WEBHOOK',
    eventType: 'api_health.snapshot',
    purpose: 'Review API health snapshots and alert on failures.',
  },
];

const zones = (process.env.MAKE_ZONE?.trim()
  ? [process.env.MAKE_ZONE.trim()]
  : ['eu1.make.com', 'eu2.make.com', 'us1.make.com', 'us2.make.com']);

const authSchemes: Array<'Token' | 'Bearer'> =
  process.env.MAKE_AUTH_SCHEME === 'Bearer' ? ['Bearer'] : ['Token', 'Bearer'];

const requiredEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const token = requiredEnv('MAKE_API_TOKEN');

const asObject = (value: unknown): JsonObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};

const makeRequest = async <T>({zone, authScheme, path, init}: MakeRequestOptions): Promise<T> => {
  const response = await fetch(`https://${zone}/api/v2${path}`, {
    ...init,
    headers: {
      Authorization: `${authScheme} ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Make API ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) as T : {} as T;
};

const extractTeamId = (me: unknown) => {
  const root = asObject(me);
  const authUser = asObject(root.authUser || root.user || root);
  const roles = [
    ...((authUser.userTeamRoles || root.userTeamRoles || []) as unknown[]),
    ...((authUser.teams || root.teams || []) as unknown[]),
  ];

  for (const role of roles) {
    const item = asObject(role);
    const team = asObject(item.team);
    const id = item.teamId || item.id || team.id;
    if (id) return String(id);
  }

  return '';
};

const discoverMakeContext = async () => {
  const explicitTeamId = process.env.MAKE_TEAM_ID?.trim();
  const errors: string[] = [];

  for (const zone of zones) {
    for (const authScheme of authSchemes) {
      try {
        const me = await makeRequest<unknown>({zone, authScheme, path: '/users/me'});
        const teamId = explicitTeamId || extractTeamId(me);
        if (!teamId) {
          throw new Error('Authenticated, but no team id was found. Set MAKE_TEAM_ID explicitly.');
        }
        return {zone, authScheme, teamId};
      } catch (error) {
        errors.push(`${zone} ${authScheme}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  throw new Error(`Unable to authenticate with Make API.\n${errors.join('\n')}`);
};

const listHooks = async (zone: string, authScheme: 'Token' | 'Bearer', teamId: string) => {
  const response = await makeRequest<MakeHooksResponse>({
    zone,
    authScheme,
    path: `/hooks?teamId=${encodeURIComponent(teamId)}&typeName=gateway-webhook`,
  });
  return response.hooks || [];
};

const createHook = async (zone: string, authScheme: 'Token' | 'Bearer', teamId: string, name: string) => {
  const response = await makeRequest<MakeHooksResponse>({
    zone,
    authScheme,
    path: '/hooks',
    init: {
      method: 'POST',
      body: JSON.stringify({
        name,
        teamId,
        typeName: 'gateway-webhook',
        method: true,
        headers: true,
        stringify: false,
      }),
    },
  });
  return response.hook;
};

const pingHook = async (zone: string, authScheme: 'Token' | 'Bearer', hookId: MakeHook['id']) => {
  if (!hookId) return undefined;
  const response = await makeRequest<MakeHook | MakeHooksResponse>({
    zone,
    authScheme,
    path: `/hooks/${hookId}/ping`,
  });
  if ('hook' in response) return response.hook;
  return response;
};

const main = async () => {
  const context = await discoverMakeContext();
  const existingHooks = await listHooks(context.zone, context.authScheme, context.teamId);
  const hooks: Array<{
    name: string;
    secret: string;
    eventType: string;
    purpose: string;
    id?: MakeHook['id'];
    address?: string;
  }> = [];

  for (const workflow of workflows) {
    const existing = existingHooks.find((hook) => hook.name === workflow.name);
    const hook = existing || await createHook(context.zone, context.authScheme, context.teamId, workflow.name);
    const detail = await pingHook(context.zone, context.authScheme, hook?.id);

    hooks.push({
      name: workflow.name,
      secret: workflow.secret,
      eventType: workflow.eventType,
      purpose: workflow.purpose,
      id: hook?.id,
      address: detail?.address || hook?.address,
    });
  }

  console.log(JSON.stringify({
    zone: context.zone,
    teamId: context.teamId,
    authScheme: context.authScheme,
    hooks,
    firebaseSecretCommands: hooks.map((hook) => `firebase functions:secrets:set ${hook.secret}`),
    nextSteps: [
      'Paste each webhook address into the matching Firebase Secret.',
      'Deploy functions with firebase deploy --only functions.',
      'Create one seller application and confirm makeWorkflowEvents.status is delivered.',
    ],
  }, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
