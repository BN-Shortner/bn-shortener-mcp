#!/usr/bin/env node
// BN Shortener MCP server over stdio, for MCP clients that only start local servers. It forwards every JSON-RPC
// message to the hosted server (https://b1.lc/mcp) with your API key, so the tools are always the current ones.
//   BN_API_KEY=bn_live_...  npx -y @bn-shortner/shortener-mcp
// Clients that support remote servers can connect to https://b1.lc/mcp directly (sign in with OAuth, no key).
'use strict';
const readline = require('node:readline');

const VERSION = '1.0.0';
const URL_ = process.env.BN_MCP_URL || 'https://b1.lc/mcp';
const KEY = process.env.BN_API_KEY || '';
const TIMEOUT_MS = Number(process.env.BN_MCP_TIMEOUT_MS || 120000);

const write = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const log = (...a) => process.stderr.write(`[bn-mcp] ${a.join(' ')}\n`);
const errorFor = (msg, code, message) => (msg && msg.id !== undefined && msg.method ? { jsonrpc: '2.0', id: msg.id, error: { code, message } } : null);

async function forward(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }
  if (!KEY) {
    const e = errorFor(msg, -32001, 'Set BN_API_KEY to a BN Shortener API key (dashboard: API Portal, API keys).');
    if (e) write(e);
    return;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(URL_, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${KEY}`,
                 'User-Agent': `bn-shortener-mcp/${VERSION}` },
      body: line,
    });
    const text = await resp.text();
    if (resp.status === 202 || !text) return; // notification accepted
    if (resp.status === 401) {
      const e = errorFor(msg, -32001, 'BN Shortener refused the API key (BN_API_KEY): it is wrong, revoked or expired.');
      if (e) write(e);
      return;
    }
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      const e = errorFor(msg, -32603, `BN Shortener answered HTTP ${resp.status}`);
      if (e) write(e);
      return;
    }
    if (body && (body.jsonrpc || Array.isArray(body))) {
      write(body);
    } else {
      const e = errorFor(msg, -32603, (body && (body.detail || body.title || body.error_description)) || `HTTP ${resp.status}`);
      if (e) write(e);
    }
  } catch (err) {
    const e = errorFor(msg, -32603, `Could not reach ${URL_}: ${err && err.name === 'AbortError' ? 'timed out' : err.message}`);
    if (e) write(e);
  } finally {
    clearTimeout(timer);
  }
}

if (!KEY) log('BN_API_KEY is not set: every request will fail. Create a key in the dashboard (API Portal, API keys).');
const rl = readline.createInterface({ input: process.stdin, terminal: false });
let chain = Promise.resolve(); // answer in order
rl.on('line', (line) => {
  if (line.trim()) chain = chain.then(() => forward(line));
});
rl.on('close', () => chain.then(() => process.exit(0)));
