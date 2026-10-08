// wave/realtime-guard: crash guard for the HTTP server. No rules, no saves, no sim.
// A bad address answers 400; a route that throws or rejects answers 500. Neither ends the process.

export const BAD_ADDRESS = "That address is not readable.";
export const ROUTE_FAILED = "The server hit a snag. Try again.";

/** decodeURIComponent that returns null instead of throwing on a bad percent-escape. */
export function safeDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
}

/**
 * Wraps an async (req, res) route. A throw or rejection is answered with 500 when nothing was sent yet,
 * or ends the half-sent response. It never becomes an unhandled rejection.
 */
export function guardRoute(route, log = (e) => console.error("route failed:", e)) {
  return (req, res) => {
    let done;
    try {
      done = Promise.resolve(route(req, res));
    } catch (e) {
      done = Promise.reject(e);
    }
    return done.catch((e) => {
      try { log(e); } catch { /* a broken logger must not crash either */ }
      try {
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: ROUTE_FAILED }));
        } else if (!res.writableEnded) {
          res.destroy();
        }
      } catch {
        res.destroy();
      }
    });
  };
}
