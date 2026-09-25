/**
 * Cloudflare Pages Functions
 * 路径 functions/api/query.js 对应接口 /api/query
 * 转发到 https://detail.aiuys.com/api/query 并添加 CORS 头
 */

const UPSTREAM = 'https://detail.aiuys.com';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 预检请求（CORS）
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  // 仅允许 GET
  if (request.method !== 'GET') {
    return jsonResponse(405, { code: 1, message: 'method not allowed' });
  }

  const value = (url.searchParams.get('value') || '').trim();
  if (!value) {
    return jsonResponse(400, { code: 1, message: 'missing value' });
  }

  // 构造转发请求，带上 Referer（接口依赖此头）
  const target = `${UPSTREAM}/api/query?value=${encodeURIComponent(value)}`;

  try {
    const upstreamResp = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: `${UPSTREAM}/`,
        Accept: 'application/json, text/plain, */*',
      },
    });

    const body = await upstreamResp.text();

    return new Response(body, {
      status: upstreamResp.status,
      headers: {
        ...corsHeaders(),
        'Content-Type':
          upstreamResp.headers.get('Content-Type') ||
          'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return jsonResponse(502, {
      code: 1,
      message: 'upstream error: ' + String(error),
    });
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
