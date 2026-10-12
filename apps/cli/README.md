# Akashi CLI and MCP server

Find, inspect, and run Akashi's agent tools from a terminal or an MCP client. Discovery and inspection are free. Runs use Base Sepolia test USDC over x402 and return a receipt. Node.js 20 or later is required.

## Install

```sh
npm install -g akashi
akashi --version
```

Or run it without a global install: `npx -y akashi --version`.

## CLI

```sh
akashi discover "weather in Lagos"
akashi inspect openweather/current
akashi catalog
```

To pay for a run, set `AKASHI_PRIVATE_KEY` in your environment to a Base Sepolia wallet funded with test USDC, then run:

```sh
akashi run openweather/current --input '{"city":"Lagos"}'
```

The default spend caps are $0.01 per call and $0.10 per process. Set `AKASHI_MAX_ATOMIC_PER_CALL` and `AKASHI_MAX_TOTAL_ATOMIC` to change them; one USDC has 1,000,000 atomic units. The key is only needed for paid runs.

## MCP

`akashi mcp` starts a local MCP server over stdio. Configure your MCP client to launch `akashi` with the argument `mcp`, and provide `AKASHI_PRIVATE_KEY` through the client's environment or secret settings if you want paid runs. It exposes `akashi_discover`, `akashi_inspect`, and `akashi_run`.

For a client that accepts a remote MCP URL, connect to `https://api.useakashi.xyz/mcp` instead. That server uses Streamable HTTP and capped demo credit for paid runs; it does not use your local wallet.

See the [CLI guide](https://docs.useakashi.xyz/docs/cli) and [MCP setup](https://docs.useakashi.xyz/docs/quickstart/mcp). Source: [Blockchain-Oracle/akashi](https://github.com/Blockchain-Oracle/akashi).
