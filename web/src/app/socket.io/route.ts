import type { NextRequest } from "next/server";

const API_ORIGIN = "http://127.0.0.1:4000";

/** Socket.IO polling — Next rewrite 404 beradi, shu route orqali API ga uzatamiz */
async function proxySocketIo(req: NextRequest) {
  const search = req.nextUrl.search;
  const target = `${API_ORIGIN}/socket.io/${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key === "host" || key === "connection") return;
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("transfer-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxySocketIo;
export const POST = proxySocketIo;
