import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const mcpUrl = process.env.N8N_MCP_URL?.trim();
const mcpToken = process.env.N8N_MCP_TOKEN?.trim();

if (!mcpUrl || !mcpToken) {
  console.error('Missing N8N_MCP_URL or N8N_MCP_TOKEN.');
  console.error('Example:');
  console.error('$env:N8N_MCP_URL="https://your-n8n-host/mcp-server/http"');
  console.error('$env:N8N_MCP_TOKEN="<n8n-mcp-token>"');
  console.error('npm run n8n:mcp:doctor');
  process.exit(1);
}

const client = new Client({
  name: 'bloomx-n8n-mcp-doctor',
  version: '1.0.0',
});

const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
  requestInit: {
    headers: {
      Authorization: `Bearer ${mcpToken}`,
    },
  },
});

const readText = (result: {content?: Array<{text?: string}>}) => {
  return result.content?.map((item) => item.text ?? '').join('\n') ?? '';
};

try {
  await client.connect(transport);
  const tools = await client.listTools();
  console.log('n8n remote MCP connection: OK');
  console.log(`Tool count: ${tools.tools?.length ?? 0}`);

  const workflowSearch = await client.callTool({
    name: 'search_workflows',
    arguments: {query: 'BloomX'},
  });
  console.log('BloomX workflows:');
  console.log(readText(workflowSearch));
} catch (error) {
  console.error('n8n remote MCP connection failed.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.close().catch(() => undefined);
}
