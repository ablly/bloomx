import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const EXPECTED_TOOLS = [
  'bloomx_seller_application',
  'bloomx_support_ticket',
  'bloomx_payment_success',
  'bloomx_monthly_settlement',
  'bloomx_api_health',
];

const strict = process.argv.includes('--strict');
const mcpUrl = process.env.MAKE_MCP_URL?.trim();
const mcpKey = process.env.MAKE_MCP_KEY?.trim();

if (!mcpUrl || !mcpKey) {
  console.error('Missing MAKE_MCP_URL or MAKE_MCP_KEY.');
  console.error('Example:');
  console.error('$env:MAKE_MCP_URL="https://eu1.make.com/mcp/server/..."');
  console.error('$env:MAKE_MCP_KEY="<make-mcp-key>"');
  console.error('npm run make:mcp:doctor');
  process.exit(1);
}

const client = new Client({
  name: 'bloomx-make-mcp-doctor',
  version: '1.0.0',
});

const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
  requestInit: {
    headers: {
      Authorization: `Bearer ${mcpKey}`,
    },
  },
});

try {
  await client.connect(transport);
  const response = await client.listTools();
  const tools = response.tools ?? [];
  const toolNames = tools.map((tool) => tool.name);
  const missing = EXPECTED_TOOLS.filter((name) => !toolNames.includes(name));

  console.log('Make MCP connection: OK');
  console.log(`Exposed tool count: ${tools.length}`);

  if (tools.length > 0) {
    console.log('Tools:');
    for (const tool of tools) {
      const summary = tool.description ? ` - ${tool.description}` : '';
      console.log(`- ${tool.name}${summary}`);
    }
  }

  if (missing.length > 0) {
    console.log('');
    console.log('BloomX workflow tools still need to be added in Make MCP Toolbox:');
    for (const name of missing) {
      console.log(`- ${name}`);
    }
    console.log('');
    console.log('Open the Make MCP Toolbox, click "+ Add", and expose the five BloomX scenarios listed in make/toolflows.bloomx.json.');
  } else {
    console.log('');
    console.log('All expected BloomX MCP workflow tools are available.');
  }

  if (strict && missing.length > 0) {
    process.exitCode = 2;
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Make MCP connection failed.');
  console.error(message);
  process.exitCode = 1;
} finally {
  await client.close().catch(() => undefined);
}
