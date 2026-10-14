// wave/static-gate: the static file server. No rules, no saves, no sim.
// A request may only read a file inside the built app folder (packages/app/dist).
// A path with "..", an absolute path, or a path that resolves outside that folder is refused
// before any file is touched. A missing page inside the folder still gets index.html.
import nodeFs from "node:fs";
import path from "node:path";
import { safeDecode, BAD_ADDRESS } from "./guard.mjs";

export const OUTSIDE_APP = "That file is not part of the app.";

export const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const isAbsolute = (p) => path.posix.isAbsolute(p) || path.win32.isAbsolute(p) || /^[a-zA-Z]:/.test(p);
const inside = (root, file) => {
  const rel = path.relative(root, file);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};

/**
 * Map a URL path to a file inside dist, by string checks only (no disk access).
 * Returns { file }, { bad: true } for an undecodable address, or { refused: true }.
 */
export function staticPath(dist, urlPath) {
  const decoded = safeDecode(String(urlPath).split("?")[0]);
  if (decoded === null) return { bad: true };
  if (!decoded.startsWith("/") || decoded.includes("\0")) return { refused: true };
  let rel = decoded.slice(1);
  if (rel === "") rel = "index.html";
  if (isAbsolute(rel)) return { refused: true };
  if (rel.split(/[\\/]/).some((seg) => seg === "..")) return { refused: true };
  const root = path.resolve(dist);
  const file = path.resolve(root, rel);
  if (!inside(root, file)) return { refused: true };
  return { file };
}

/**
 * serve(urlPath, res, json) answers a GET for the built app. Returns false when there is
 * no built app, so the caller can answer 404. fs is injectable so tests can watch every read.
 */
export function createStaticServer({ dist, fs = nodeFs }) {
  const root = path.resolve(dist);
  return function serve(urlPath, res, json) {
    const hit = staticPath(root, urlPath);
    if (hit.bad) {
      json(res, 400, { error: BAD_ADDRESS });
      return true;
    }
    if (hit.refused) {
      json(res, 403, { error: OUTSIDE_APP });
      return true;
    }
    if (!fs.existsSync(root)) return false;
    let file = hit.file;
    if (fs.existsSync(file)) {
      // A symlink inside dist must not lead out of it.
      if (!inside(fs.realpathSync(root), fs.realpathSync(file))) {
        json(res, 403, { error: OUTSIDE_APP });
        return true;
      }
      if (fs.statSync(file).isDirectory()) file = null;
    } else {
      file = null;
    }
    if (file === null) {
      const fallback = path.join(root, "index.html");
      if (!fs.existsSync(fallback)) return false;
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      res.end(fs.readFileSync(fallback));
      return true;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(fs.readFileSync(file));
    return true;
  };
}
