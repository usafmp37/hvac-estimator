// File System Access API helpers
// Stores the file handle in IndexedDB (localStorage can't hold FileSystemFileHandle objects)

const DB_NAME = 'hvac-estimator-filesync';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'datafile';

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getStoredHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export async function storeHandle(handle: FileSystemFileHandle): Promise<void> {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearStoredHandle(): Promise<void> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
      tx.oncomplete = () => resolve();
    });
  } catch { /* ignore */ }
}

export async function verifyPermission(handle: FileSystemFileHandle): Promise<boolean> {
  const h = handle as any;
  const opts = { mode: 'readwrite' };
  if (await h.queryPermission(opts) === 'granted') return true;
  if (await h.requestPermission(opts) === 'granted') return true;
  return false;
}

export async function writeDataToFile(
  handle: FileSystemFileHandle,
  data: Record<string, unknown>
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export async function readDataFromFile(
  handle: FileSystemFileHandle
): Promise<Record<string, unknown> | null> {
  const file = await handle.getFile();
  const text = await file.text();
  if (!text.trim()) return null;
  return JSON.parse(text) as Record<string, unknown>;
}

export async function pickSaveFile(): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: 'hvac-estimator-data.json',
      types: [{ description: 'HVAC Estimator Data', accept: { 'application/json': ['.json'] } }],
    }) as FileSystemFileHandle;
    await storeHandle(handle);
    return handle;
  } catch { return null; } // user cancelled
}

export const isFileSyncSupported =
  typeof window !== 'undefined' && 'showSaveFilePicker' in window;
