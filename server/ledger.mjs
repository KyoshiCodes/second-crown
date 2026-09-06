import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Decimal from "break_infinity.js";

const ITEMS = ["iron", "banners", "relics"];
export class LedgerError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function check(condition, status, message) {
  if (!condition) throw new LedgerError(status, message);
}
function amount(value, zero = false) {
  check(typeof value === "string" && /^(0|[1-9]\d{0,9})$/.test(value), 400, "Use whole-number decimal strings.");
  const n = new Decimal(value);
  check(n.lte("1000000000") && (zero ? n.gte(0) : n.gt(0)), 400, "Amount is outside the practice limit.");
  return n.toString();
}
function add(a, b) { return new Decimal(a).add(b).toString(); }
function subtract(a, b) {
  check(new Decimal(a).gte(b), 409, "Insufficient practice balance.");
  return new Decimal(a).sub(b).toString();
}
function fields(body, keys) {
  check(body && typeof body === "object" && !Array.isArray(body), 400, "Expected an object.");
  check(Object.keys(body).every((key) => ["action", "requestId", ...keys].includes(key)), 400, "Unknown request field.");
}
const fresh = () => ({ version: 1, accounts: {}, listings: [], challenges: [], receipts: {} });

export function createLedger(dataDir) {
  const filename = path.join(dataDir, "ledger.json");
  function read() {
    if (!fs.existsSync(filename)) return fresh();
    const db = JSON.parse(fs.readFileSync(filename, "utf8"));
    check(db.version === 1 && db.accounts && !Array.isArray(db.accounts) &&
      Array.isArray(db.listings) && Array.isArray(db.challenges) && db.receipts &&
      !Array.isArray(db.receipts), 503, "Unsupported ledger file.");
    const balance = (n) => typeof n === "string" && /^(0|[1-9]\d*)$/.test(n) && new Decimal(n).lte("1000000000");
    check(Object.values(db.accounts).every((a) => a && ["gold", ...ITEMS].every((key) => balance(a[key]))),
      503, "Invalid ledger balances.");
    return db;
  }
  function commit(db) {
    fs.mkdirSync(dataDir, { recursive: true });
    const temp = filename + "." + crypto.randomUUID() + ".tmp";
    try {
      const fd = fs.openSync(temp, "wx", 0o600);
      try { fs.writeFileSync(fd, JSON.stringify(db)); fs.fsyncSync(fd); }
      finally { fs.closeSync(fd); }
      fs.renameSync(temp, filename);
    } finally {
      if (fs.existsSync(temp)) fs.unlinkSync(temp);
    }
  }
  function account(db, id) {
    check(Object.hasOwn(db.accounts, id), 409, "Enroll in the practice exchange first.");
    return db.accounts[id];
  }
  function snapshot(id, power, readSave) {
    const raw = readSave(id);
    check(typeof raw === "string", 409, "Both players need a cloud save first.");
    let save;
    try { save = JSON.parse(raw); } catch { throw new LedgerError(409, "Cloud save cannot be snapshotted."); }
    check(Number.isSafeInteger(save?.meta?.tick) && save.meta.tick >= 0, 409, "Cloud save needs a valid tick.");
    return { power: amount(power, true), tick: save.meta.tick,
      saveHash: crypto.createHash("sha256").update(raw).digest("hex"), verified: false };
  }
  return {
    view(kind, user) {
      const db = read();
      if (kind === "auction") return { mode: "practice", userId: user.id,
        account: Object.hasOwn(db.accounts, user.id) ? db.accounts[user.id] : null,
        listings: [...new Map([...db.listings.filter((l) => l.sellerId === user.id && l.status === "open"),
          ...db.listings.slice(-100).reverse()].map((l) => [l.id, l])).values()] };
      return { mode: "unrated", userId: user.id,
        challenges: db.challenges.filter((c) => c.challengerId === user.id || c.opponentId === user.id).slice(-100).reverse() };
    },
    transact(kind, user, body, { readSave, findUser }) {
      fields(body, kind === "auction" ? ["item", "quantity", "price", "listingId"] : ["opponentId", "power", "challengeId"]);
      check(typeof body.requestId === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(body.requestId), 400, "A request ID is required.");
      const signature = JSON.stringify([kind, Object.keys(body).sort().map((k) => [k, body[k]])]);
      const receiptKey = user.id + ":" + body.requestId;
      const db = read();
      if (Object.hasOwn(db.receipts, receiptKey)) {
        const receipt = db.receipts[receiptKey];
        check(receipt.signature === signature, 409, "Request ID already used for another operation.");
        return receipt.result;
      }
      check(Object.keys(db.receipts).length < 10000, 503, "Practice ledger is at capacity.");
      let record;
      if (kind === "auction") {
        if (body.action === "enroll") {
          fields(body, []);
          check(!Object.hasOwn(db.accounts, user.id), 409, "Already enrolled.");
          db.accounts[user.id] = { gold: "100", iron: "5", banners: "0", relics: "0" };
          record = { enrolled: true };
        } else if (body.action === "list") {
          fields(body, ["item", "quantity", "price"]);
          check(ITEMS.includes(body.item), 400, "Unknown practice item.");
          const quantity = amount(body.quantity), price = amount(body.price);
          const seller = account(db, user.id);
          check(db.listings.filter((l) => l.sellerId === user.id && l.status === "open").length < 10,
            409, "Cancel or sell an open listing first (limit 10).");
          check(db.listings.length < 2000, 503, "Practice listing capacity reached.");
          seller[body.item] = subtract(seller[body.item], quantity);
          record = { id: crypto.randomUUID(), sellerId: user.id, sellerName: user.name,
            item: body.item, quantity, price, status: "open" };
          db.listings.push(record);
        } else if (body.action === "buy" || body.action === "cancel") {
          fields(body, ["listingId"]);
          const listing = db.listings.find((l) => l.id === body.listingId);
          check(listing, 404, "Listing not found.");
          check(listing.status === "open", 409, "Listing is already closed.");
          const seller = account(db, listing.sellerId);
          if (body.action === "cancel") {
            check(listing.sellerId === user.id, 403, "Only the seller can cancel.");
            seller[listing.item] = add(seller[listing.item], listing.quantity);
            listing.status = "cancelled";
          } else {
            check(listing.sellerId !== user.id, 409, "You cannot buy your own listing.");
            const buyer = account(db, user.id);
            buyer.gold = subtract(buyer.gold, listing.price);
            seller.gold = add(seller.gold, listing.price);
            buyer[listing.item] = add(buyer[listing.item], listing.quantity);
            listing.status = "sold";
            listing.buyerId = user.id;
          }
          record = listing;
        } else throw new LedgerError(400, "Unknown auction action.");
      } else if (body.action === "challenge") {
        fields(body, ["opponentId", "power"]);
        check(typeof body.opponentId === "string" && body.opponentId !== user.id &&
          findUser(body.opponentId)?.kind === "discord", 400, "Choose another Discord player.");
        check(db.challenges.length < 2000, 503, "Challenge capacity reached.");
        const pending = db.challenges.filter((c) => c.status !== "cancelled");
        const contains = (c, id) => c.challengerId === id || c.opponentId === id;
        check(!pending.some((c) => contains(c, user.id) && contains(c, body.opponentId)), 409, "This pair already has a pending challenge.");
        check([user.id, body.opponentId].every((id) => pending.filter((c) => contains(c, id)).length < 10), 409, "Player has too many pending challenges.");
        snapshot(body.opponentId, "0", readSave);
        record = { id: crypto.randomUUID(), challengerId: user.id, challengerName: user.name,
          opponentId: body.opponentId, opponentName: findUser(body.opponentId).name,
          challenger: snapshot(user.id, body.power, readSave), opponent: null, status: "open" };
        db.challenges.push(record);
      } else if (body.action === "accept" || body.action === "cancel") {
        fields(body, body.action === "accept" ? ["challengeId", "power"] : ["challengeId"]);
        const challenge = db.challenges.find((c) => c.id === body.challengeId);
        check(challenge, 404, "Challenge not found.");
        check(challenge.challengerId === user.id || challenge.opponentId === user.id, 403, "Not your challenge.");
        check(challenge.status !== "cancelled", 409, "Challenge is closed.");
        if (body.action === "accept") {
          check(challenge.opponentId === user.id, 403, "Only the opponent can accept.");
          check(challenge.status === "open", 409, "Snapshots are already locked.");
          challenge.opponent = snapshot(user.id, body.power, readSave);
          challenge.status = "locked";
        } else challenge.status = "cancelled";
        record = challenge;
      } else throw new LedgerError(400, "Unknown PvP action.");
      const result = structuredClone({ ok: true, record });
      db.receipts[receiptKey] = { signature, result };
      commit(db);
      return result;
    },
  };
}

function limitedBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let oversized = false;
    req.on("data", (chunk) => {
      if (oversized) return;
      size += chunk.length;
      if (size > 16384) {
        oversized = true;
        chunks.length = 0;
        reject(new LedgerError(413, "Ledger request is too large."));
      } else chunks.push(chunk);
    });
    req.on("end", () => {
      if (oversized) return;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(new LedgerError(400, "Invalid JSON.")); }
    });
    req.on("error", reject);
  });
}
export function createLedgerHandler(dataDir, dependencies) {
  const ledger = createLedger(dataDir);
  return async (req, res, kind, user, json) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      check(user, 401, "Sign in first.");
      check(user.kind === "discord", 403, "The practice ledger requires Discord sign-in.");
      if (req.method === "GET") return json(res, 200, ledger.view(kind, user));
      check(req.method === "POST", 405, "Use GET or POST.");
      const body = await limitedBody(req);
      return json(res, 200, ledger.transact(kind, user, body, dependencies));
    } catch (error) {
      return json(res, error instanceof LedgerError ? error.status : 503,
        { error: error instanceof LedgerError ? error.message : "Ledger unavailable; retry with the same request ID." });
    }
  };
}
