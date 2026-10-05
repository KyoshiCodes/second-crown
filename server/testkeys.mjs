// Test support only. A friend who keeps every hold key it is given and sends it on each later join,
// as a player who was handed the key would. Tests of the key itself call join() directly.

import { joinRealmId } from "./join.mjs";

/** join(body) that sends the kept key for that id and keeps a key it is handed. The key is left off the view. */
export function keyedJoin(join, ring = new Map(), session = "guest_test") {
  return async (body) => {
    const realmId = joinRealmId(body?.realm);
    const { key, ...view } = await join(body, realmId ? ring.get(realmId) : undefined, session);
    if (typeof key === "string") ring.set(view.realmId, key);
    return view;
  };
}
