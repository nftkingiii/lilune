import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, isAbsolute, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const root = resolve(fileURLToPath(new URL("./dist", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const revision =
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT_SHA ||
  process.env.LILUNE_REVISION ||
  "local";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};
const kuruOrigin = "https://exchange.kuru.io";
const kuruEndpoints = new Set(["klines", "trades"]);
const kuruIntervals = new Set(["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]);

function kuruTarget(requestUrl) {
  const parsed = new URL(requestUrl, "http://localhost");
  const match = parsed.pathname.match(/^\/api\/kuru\/(klines|trades)$/);
  if (!match || !kuruEndpoints.has(match[1])) return null;
  const target = new URL(`/api/v3/${match[1]}`, kuruOrigin);
  const symbol = parsed.searchParams.get("symbol") || "";
  if (!/^[A-Za-z0-9]+_[A-Za-z0-9]+$/.test(symbol) || symbol.length > 32) return null;
  target.searchParams.set("symbol", symbol);
  const limit = parsed.searchParams.get("limit");
  if (limit !== null && /^(?:[1-9]\d{0,2}|1000)$/.test(limit)) target.searchParams.set("limit", limit);
  else if (limit !== null) return null;
  if (match[1] === "klines") {
    const interval = parsed.searchParams.get("interval") || "1h";
    if (!kuruIntervals.has(interval)) return null;
    target.searchParams.set("interval", interval);
  }
  return target;
}

function safePath(urlPath) {
  const requested = normalize(decodeURIComponent(urlPath.split("?")[0]));
  const candidate = resolve(join(root, requested === "/" ? "index.html" : requested));
  const relativePath = relative(root, candidate);
  return !relativePath || (relativePath !== ".." && !relativePath.startsWith(`..${normalize("/")}`) && !isAbsolute(relativePath))
    ? candidate
    : null;
}

function headers(type) {
  return {
    "Cache-Control": type === "text/html; charset=utf-8" ? "no-cache" : "public, max-age=31536000, immutable",
    "Content-Type": type,
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
  };
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  if (request.url?.split("?")[0] === "/healthz") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ ok: true, revision }));
    return;
  }

  if (request.url?.startsWith("/api/kuru/")) {
    const target = kuruTarget(request.url);
    if (!target) {
      response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Invalid Kuru market-data request." }));
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const upstream = await fetch(target, { signal: controller.signal });
      const body = Buffer.from(await upstream.arrayBuffer());
      response.writeHead(upstream.status, {
        "Cache-Control": "no-store",
        "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(body);
    } catch {
      response.writeHead(502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      response.end(JSON.stringify({ error: "Kuru market data is temporarily unavailable." }));
    } finally {
      clearTimeout(timeout);
    }
    return;
  }

  let filePath = null;
  try {
    filePath = safePath(request.url || "/");
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  if (!filePath) {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  try {
    const file = await stat(filePath);
    if (!file.isFile()) throw new Error("not a file");
  } catch {
    filePath = join(root, "index.html");
  }

  const type = contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
  response.writeHead(200, headers(type));
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Lilune listening on ${port} (${revision})`);
});
