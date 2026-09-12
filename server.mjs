import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, isAbsolute, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const root = resolve(fileURLToPath(new URL("./dist", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const revision = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "local";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

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
