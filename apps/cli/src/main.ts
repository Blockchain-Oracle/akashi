import { readFile } from "node:fs/promises";

import { Akashi } from "./client.js";
import { readConfig } from "./config.js";
import { DEFAULT_DISCOVER_LIMIT, VERSION } from "./constants.js";
import { serveMcp } from "./mcp.js";

const HELP = `akashi ${VERSION} — every tool your agent needs, paid per call over x402 on Pocket Network

  akashi discover "<what you need>" [--limit N]   rank tools for a job (free)
  akashi inspect <provider/endpoint>              a tool's input schema, price, example (free)
  akashi run <provider/endpoint> --input '<json>' run it, paying in USDC (Base Sepolia)
  akashi run <provider/endpoint> --file input.json
  akashi catalog                                  every tool as JSON (free)
  akashi wallet                                   the paying address and limits
  akashi mcp                                      local MCP server over stdio (Claude Code, Cursor, Codex…)

Environment: AKASHI_PRIVATE_KEY (Base Sepolia key with test USDC, only for run/mcp), AKASHI_API_URL,
AKASHI_MAX_ATOMIC_PER_CALL (default 10000 = $0.01), AKASHI_MAX_TOTAL_ATOMIC (default 100000 = $0.10).`;

function flag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

/** Positional words: everything that is neither a --flag nor a flag's value. */
function words(args: string[]): string[] {
  return args.filter((arg, i) => !arg.startsWith("--") && !(i > 0 && args[i - 1]?.startsWith("--")));
}

const print = (value: unknown) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  const config = readConfig();
  const akashi = new Akashi(config);
  switch (command) {
    case "discover": {
      const query = words(rest).join(" ");
      if (!query) throw new Error('usage: akashi discover "<what you need>"');
      print(await akashi.discover(query, Number(flag(rest, "--limit") ?? DEFAULT_DISCOVER_LIMIT)));
      return;
    }
    case "inspect":
      if (!rest[0]) throw new Error("usage: akashi inspect <provider/endpoint>");
      print(await akashi.inspect(rest[0]));
      return;
    case "run": {
      const id = rest[0];
      if (!id) throw new Error("usage: akashi run <provider/endpoint> --input '<json>'");
      const file = flag(rest, "--file");
      const raw = file ? await readFile(file, "utf8") : (flag(rest, "--input") ?? "{}");
      const result = await akashi.run(id, JSON.parse(raw));
      print(result);
      if (result.status >= 400) process.exitCode = 1;
      return;
    }
    case "catalog":
      print(await akashi.catalog());
      return;
    case "wallet":
      print({
        address: akashi.address ?? null,
        network: "Base Sepolia (eip155:84532)",
        maxAtomicPerCall: config.maxAtomicPerCall.toString(),
        maxTotalAtomic: config.maxTotalAtomic.toString(),
        api: config.apiUrl,
      });
      return;
    case "mcp":
      await serveMcp(akashi);
      return;
    case "--version":
    case "version":
      process.stdout.write(`${VERSION}\n`);
      return;
    default:
      process.stdout.write(`${HELP}\n`);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`akashi: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
