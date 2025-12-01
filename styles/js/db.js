const DB_NAME = "CrimeReportDB";
const DB_VERSION = 1;
const STORE_NAME = "reports";

const db = {
  db: null,

  init: function () {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log("IndexedDB initialized successfully");
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error("IndexedDB initialization failed:", event.target.error);
        reject(event.target.error);
      };
    });
  },

  addReport: function (report) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Ensure report has timestamp and default status if not present
      if (!report.timestamp) report.timestamp = Date.now();
      if (!report.status) report.status = "pending";

      const request = store.add(report);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  getAllReports: function () {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  getReportsByStatus: function (status) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("status");
      const request = index.getAll(status);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  updateReportStatus: function (id, newStatus) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // First get the item
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (!data) {
          reject("Report not found");
          return;
        }

        data.status = newStatus;
        const updateRequest = store.put(data);

        updateRequest.onsuccess = () => resolve(updateRequest.result);
        updateRequest.onerror = (event) => reject(event.target.error);
      };

      getRequest.onerror = (event) => reject(event.target.error);
    });
  },

  deleteReport: function (id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  },
};

// Auto-initialize when loaded
db.init().catch((err) => console.error("Failed to auto-init DB:", err));
