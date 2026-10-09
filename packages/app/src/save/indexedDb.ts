const DB_NAME = "second-crown";
const STORE = "saves";
const KEY = "autosave";
/** A cloud copy from Pull save, waiting for the next reload. The running crown never writes it. */
const PULLED_KEY = "pulled";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(key: string, json: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(json, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function get(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as string) ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function remove(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export const saveToIndexedDb = (json: string) => put(KEY, json);
export const loadFromIndexedDb = () => get(KEY);
export const clearIndexedDbSave = () => remove(KEY);

export const savePulledToIndexedDb = (json: string) => put(PULLED_KEY, json);
export const loadPulledFromIndexedDb = () => get(PULLED_KEY);
export const clearPulledFromIndexedDb = () => remove(PULLED_KEY);
