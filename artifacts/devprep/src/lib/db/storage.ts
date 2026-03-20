const DB_NAME = 'devprep'
const DB_VERSION = 1
const STORE_NAME = 'database'

async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function saveDatabase(data: Uint8Array): Promise<void> {
  const db = await openIDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(data, 'sqlite')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function loadDatabase(): Promise<Uint8Array | null> {
  const db = await openIDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get('sqlite')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

export async function hasStoredDatabase(): Promise<boolean> {
  const data = await loadDatabase()
  return data !== null && data.length > 0
}
