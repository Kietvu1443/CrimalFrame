const DB_NAME = "CrimeReportDB";
const DB_VERSION = 1;
const STORE_NAME = "reports";

const db = {
  db: null,
  initPromise: null,

  init: function () {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
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
        this.initPromise = null; // Reset promise on failure so we can retry
        reject(event.target.error);
      };
    });

    return this.initPromise;
  },

  ensureInit: async function () {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  },

  addReport: async function (report) {
    try {
      await this.ensureInit();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        // Ensure report has timestamp and default status if not present
        if (!report.timestamp) report.timestamp = Date.now();
        if (!report.status) report.status = "pending";

        const request = store.add(report);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      });
    } catch (error) {
      console.error("Error in addReport:", error);
      throw error;
    }
  },

  getAllReports: async function () {
    try {
      await this.ensureInit();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      });
    } catch (error) {
      console.error("Error in getAllReports:", error);
      throw error;
    }
  },

  getReportsByStatus: async function (status) {
    try {
      await this.ensureInit();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("status");
        const request = index.getAll(status);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      });
    } catch (error) {
      console.error("Error in getReportsByStatus:", error);
      throw error;
    }
  },

  updateReportStatus: async function (id, newStatus) {
    try {
      await this.ensureInit();
      return new Promise((resolve, reject) => {
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
    } catch (error) {
      console.error("Error in updateReportStatus:", error);
      throw error;
    }
  },

  deleteReport: async function (id) {
    try {
      await this.ensureInit();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
      });
    } catch (error) {
      console.error("Error in deleteReport:", error);
      throw error;
    }
  },
};

// Auto-initialize when loaded
db.init().catch((err) => console.error("Failed to auto-init DB:", err));
