import { pathToFileURL } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { convert, supportedUnits } from './units.ts';

const server = new Server(
  { name: 'mcp-unitconv', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'convert',
      description: 'Convert a value between units of length, mass, time or temperature.',
      inputSchema: {
        type: 'object',
        properties: {
          value: { type: 'number', description: 'Numeric value to convert' },
          from: { type: 'string', description: `Source unit, one of: ${supportedUnits().join(', ')}` },
          to: { type: 'string', description: 'Target unit, same dimension as source' },
        },
        required: ['value', 'from', 'to'],
      },
    },
  ],
}));

interface ConvertArgs {
  value: number;
  from: string;
  to: string;
}

// Tool input arrives as unknown JSON from the client; a raw cast would let a
// malformed request (missing fields, wrong types) throw past the try/catch
// below instead of coming back as a normal tool error.
function parseConvertArgs(args: unknown): ConvertArgs {
  if (typeof args !== 'object' || args === null) {
    throw new Error('arguments must be an object with value, from and to');
  }
  const { value, from, to } = args as Record<string, unknown>;
  if (typeof value !== 'number') throw new Error(`value must be a number, got ${typeof value}`);
  if (typeof from !== 'string') throw new Error(`from must be a string, got ${typeof from}`);
  if (typeof to !== 'string') throw new Error(`to must be a string, got ${typeof to}`);
  return { value, from, to };
}

export async function handleCallTool(
  req: { params: { name: string; arguments?: unknown } },
): Promise<{ content: [{ type: 'text'; text: string }]; isError?: boolean }> {
  if (req.params.name !== 'convert') throw new Error(`Unknown tool: ${req.params.name}`);
  try {
    const { value, from, to } = parseConvertArgs(req.params.arguments);
    const r = convert(value, from, to);
    return { content: [{ type: 'text', text: `${value} ${from} = ${r.value} ${to}` }] };
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true };
  }
}

server.setRequestHandler(CallToolRequestSchema, handleCallTool);

async function main() {
  await server.connect(new StdioServerTransport());
}

// Only connect to stdio when run as the entry script, not when imported (e.g. by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
