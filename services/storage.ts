import { ProcessedDocument, ChatMessage } from '../types';

const DB_NAME = 'DocuMindDB';
const DB_VERSION = 1;
const STORE_NAME = 'user_sessions';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
  });
};

export const saveSession = async (userId: string, document: ProcessedDocument | null, messages: ChatMessage[]): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const sessionData = {
        userId,
        document,
        messages,
        lastUpdated: Date.now()
      };

      const request = store.put(sessionData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save session to IndexedDB:", error);
  }
};

export const getSession = async (userId: string): Promise<{ document: ProcessedDocument | null; messages: ChatMessage[] } | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(userId);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            document: result.document,
            messages: result.messages || []
          });
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to get session from IndexedDB:", error);
    return null;
  }
};

export const clearSession = async (userId: string): Promise<void> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(userId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Failed to clear session:", error);
    }
}