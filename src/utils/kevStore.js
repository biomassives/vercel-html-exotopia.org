/**
 * Utility service to manage CISA KEV data locally inside IndexedDB.
 * Leverages native browser APIs for maximum efficiency and portability.
 */

const DB_NAME = 'CisaKevDatabase';
const DB_VERSION = 1;

// Helper to open the database connection cleanly using Promises
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for dataset metadata (version, release dates, etc.)
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
      
      // Store for individual vulnerabilities using cveID as the primary key
      if (!db.objectStoreNames.contains('vulnerabilities')) {
        const itemStore = db.createObjectStore('vulnerabilities', { keyPath: 'cveID' });
        // Useful indexes for sorting/filtering in your Quasar UI
        itemStore.createIndex('by_vendor', 'vendorProject', { unique: false });
        itemStore.createIndex('by_date', 'dateAdded', { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export const kevStore = {
  /**
   * Retrieves the stored metadata to verify local sync state.
   */
  async getLocalMeta() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('meta', 'readonly');
      const store = transaction.objectStore('meta');
      const request = store.get('catalog_info');

      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Clears old data and saves the freshly fetched catalog atomically.
   * @param {Object} rawJsonData - The complete JSON payload from CISA
   */
  async saveCatalog(rawJsonData) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      // Use readwrite across both stores to perform a clean atomic overwrite
      const transaction = db.transaction(['meta', 'vulnerabilities'], 'readwrite');
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);

      const metaStore = transaction.objectStore('meta');
      const vulnStore = transaction.objectStore('vulnerabilities');

      // 1. Clear existing data to prevent accumulation of stale definitions
      metaStore.clear();
      vulnStore.clear();

      // 2. Save new structural metadata
      metaStore.put({
        key: 'catalog_info',
        value: {
          catalogVersion: rawJsonData.catalogVersion,
          dateReleased: rawJsonData.dateReleased,
          count: rawJsonData.count,
          lastSynced: new Date().toISOString()
        }
      });

      // 3. Batch insert vulnerabilities sequentially inside the transaction loop
      const list = rawJsonData.vulnerabilities || [];
      for (let i = 0; i < list.length; i++) {
        vulnStore.put(list[i]);
      }
    });
  },

  /**
   * Reads all stored vulnerabilities back out into memory.
   * Ideal for population into q-table or Pinia states.
   */
  async getAllVulnerabilities() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('vulnerabilities', 'readonly');
      const store = transaction.objectStore('vulnerabilities');
      const request = store.getAll(); // Highly optimized native block read

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
};
