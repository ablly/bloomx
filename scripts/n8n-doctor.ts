const baseUrl = process.env.N8N_BASE_URL?.trim().replace(/\/$/, '');
const apiKey = process.env.N8N_API_KEY?.trim();

const expectedWorkflows = [
  'BloomX - Seller application review',
  'BloomX - Support ticket triage',
  'BloomX - Payment success receipt',
  'BloomX - Monthly settlement snapshot',
  'BloomX - API health monitor',
];

if (!baseUrl || !apiKey) {
  console.error('Missing N8N_BASE_URL or N8N_API_KEY.');
  console.error('Example:');
  console.error('$env:N8N_BASE_URL="https://n8n.example.com"');
  console.error('$env:N8N_API_KEY="<n8n-api-key>"');
  console.error('npm run n8n:doctor');
  process.exit(1);
}

const request = async (path: string) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: 'application/json',
      'X-N8N-API-KEY': apiKey,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`n8n API ${response.status}: ${text.slice(0, 500)}`);
  }

  return text ? JSON.parse(text) : null;
};

try {
  const payload = await request('/api/v1/workflows?limit=100');
  const workflows = Array.isArray(payload?.data) ? payload.data : [];
  const names = workflows.map((workflow: {name?: string}) => workflow.name).filter(Boolean);
  const missing = expectedWorkflows.filter((name) => !names.includes(name));

  console.log('n8n API connection: OK');
  console.log(`Workflow count returned: ${workflows.length}`);

  if (missing.length === 0) {
    console.log('All expected BloomX n8n workflows are present.');
  } else {
    console.log('Missing BloomX n8n workflows:');
    for (const name of missing) {
      console.log(`- ${name}`);
    }
    console.log('');
    console.log('Import the templates from n8n/workflows, activate them, then set the production webhook URLs in Firebase Secret Manager.');
  }
} catch (error) {
  console.error('n8n API connection failed.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
