import { BsiItem } from '../types/bsi';

const DB_NAME = 'BSI_TOP10_AVATAR_CACHE_DB';
const DB_VERSION = 1;
const STORE_NAME = 'avatars';

/**
 * Normalizes text key for avatar cache matching (lowercase, trimmed, space collapsed)
 */
export function normalizeAvatarKey(name: string): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Opens or initializes IndexedDB for avatar caching
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Save an avatar image (base64 or data URL) to IndexedDB cache by object name
 */
export async function saveAvatarToCache(name: string, imageData: string): Promise<void> {
  const key = normalizeAvatarKey(name);
  if (!key || !imageData) return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put({
      key,
      name,
      imageData,
      updatedAt: Date.now(),
    });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save avatar to IndexedDB cache:', err);
    // Fallback to localStorage for small strings if needed
    try {
      localStorage.setItem(`BSI_AVATAR_${key}`, imageData);
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Retrieve an avatar image from IndexedDB cache by object name
 */
export async function getAvatarFromCache(name: string): Promise<string | null> {
  const key = normalizeAvatarKey(name);
  if (!key) return null;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    const result = await new Promise<any>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (result && result.imageData) {
      return result.imageData;
    }
  } catch (err) {
    // Fallback check localStorage
    try {
      const local = localStorage.getItem(`BSI_AVATAR_${key}`);
      if (local) return local;
    } catch (e) {
      // ignore
    }
  }

  return null;
}

/**
 * Automatically match and populate cached avatars for a list of BsiItems
 */
export async function autoMatchCachedAvatars(items: BsiItem[]): Promise<BsiItem[]> {
  if (!Array.isArray(items) || items.length === 0) return items;

  const updatedItems = await Promise.all(
    items.map(async (item) => {
      // If item already has a cropped or uploaded image, keep it and ensure it's saved in cache
      if (item.croppedImageData) {
        await saveAvatarToCache(item.name, item.croppedImageData);
        if (item.brandName) {
          await saveAvatarToCache(item.brandName, item.croppedImageData);
        }
        return item;
      }

      // Check cache by item name
      let cached = await getAvatarFromCache(item.name);

      // If not found by item name, check cache by brandName
      if (!cached && item.brandName) {
        cached = await getAvatarFromCache(item.brandName);
      }

      if (cached) {
        return {
          ...item,
          croppedImageData: cached,
        };
      }

      return item;
    })
  );

  return updatedItems;
}
