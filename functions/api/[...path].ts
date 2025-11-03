/**
 * Cloudflare Pages API Function
 * Serverless function for handling API requests in Cloudflare Pages
 */

import { SatsNetClient } from '../../dist/index.js';

// Initialize client with environment-specific configuration
const client = new SatsNetClient({
  baseUrl: 'https://apiprd.ordx.market',
  network: 'mainnet',
  timeout: 10000,
  retries: 3,
});

export async function onRequest(context: {
  request: Request;
  env: Record<string, unknown>;
  params: { path: string[] };
}) {
  const { request, env, params } = context;
  const path = params.path.join('/');

  try {
    // Handle different API endpoints
    const response = await handleApiRequest(path, request, env);

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': getCacheHeader(path),
      },
    });
  } catch (error) {
    console.error('API Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      }),
      {
        status: error instanceof Error && 'status' in error ? (error as { status: number }).status : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

async function handleApiRequest(
  path: string,
  request: Request,
  env: Record<string, unknown>
): Promise<{ data: unknown }> {
  const url = new URL(request.url);
  const method = request.method;

  // Handle OPTIONS requests for CORS
  if (method === 'OPTIONS') {
    return { data: { status: 'ok' } };
  }

  // Parse query parameters
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // Route the request to appropriate API method
  switch (path) {
    case 'health':
      return { data: await client.healthCheck() };

    case 'bestheight':
      return { data: await client.getBestHeight() };

    default:
      if (path.startsWith('utxo/address/')) {
        const address = path.split('/')[3];
        const value = url.searchParams.get('value');

        if (value) {
          return { data: await client.getUtxosByValue(address, parseInt(value)) };
        } else {
          return { data: await client.getPlainUtxos(address) };
        }
      }

      if (path.startsWith('allutxos/address/')) {
        const address = path.split('/')[3];
        return { data: await client.getUtxos(address) };
      }

      if (path.startsWith('exotic/address/')) {
        const address = path.split('/')[3];
        return { data: await client.getRareUtxos(address) };
      }

      if (path.startsWith('utxo/range/')) {
        const utxo = path.split('/')[3];
        return { data: await client.getUtxo(utxo) };
      }

      if (path.startsWith('btc/rawtx/')) {
        const txid = path.split('/')[3];
        return { data: { hex: await client.getTransactionHex(txid) } };
      }

      if (path.startsWith('v3/address/summary/')) {
        const address = path.split('/')[4];
        return { data: await client.getAddressSummary(address) };
      }

      if (path.startsWith('v3/tick/info/')) {
        const ticker = path.split('/')[4];
        return { data: await client.getTickerInfo(ticker) };
      }

      if (path.startsWith('v3/tick/holders/')) {
        const ticker = path.split('/')[4];
        const start = parseInt(params.start || '0');
        const limit = parseInt(params.limit || '10');
        return { data: await client.getTickerHolders(ticker, start, limit) };
      }

      if (path.startsWith('v3/address/asset/')) {
        const parts = path.split('/');
        const address = parts[4];
        const ticker = parts[5];
        const start = parseInt(params.start || '0');
        const limit = parseInt(params.limit || '10');
        return { data: await client.getAddressAssetHolders(address, ticker, start, limit) };
      }

      if (path.startsWith('ns/name/')) {
        const name = path.split('/')[3];
        return { data: await client.getNameInfo(name) };
      }

      if (path.startsWith('ns/address/')) {
        const parts = path.split('/');
        const address = parts[3];

        if (parts.length > 4) {
          const sub = parts[4];
          const page = parseInt(params.page || '1');
          const pagesize = parseInt(params.pagesize || '10');
          return { data: await client.getNameSubUtxos(address, sub, page, pagesize) };
        } else {
          const start = parseInt(params.start || '0');
          const limit = parseInt(params.limit || '100');
          return { data: await client.getNameListByAddress(address, start, limit) };
        }
      }

      throw new Error(`Endpoint not found: ${path}`);
  }
}

function getCacheHeader(path: string): string {
  // Different cache durations for different endpoints
  if (path.includes('health')) {
    return 'no-cache';
  }

  if (path.includes('bestheight')) {
    return 'public, max-age=60'; // 1 minute
  }

  if (path.includes('utxo') || path.includes('address')) {
    return 'public, max-age=300'; // 5 minutes
  }

  return 'public, max-age=600'; // 10 minutes default
}