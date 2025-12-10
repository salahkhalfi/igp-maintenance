/**
 * Gestionnaire de Synchronisation Hors-Ligne (Background Sync)
 * Permet d'effectuer des actions (POST/PUT/DELETE) sans réseau.
 * Les requêtes sont stockées dans IndexedDB et rejouées au retour de la connexion.
 */

const DB_NAME = 'maintenance_offline_db';
const STORE_NAME = 'request_queue';
const DB_VERSION = 1;

const OfflineSync = {
    db: null,
    isSyncing: false,

    async init() {
        if (this.db) return Promise.resolve(this.db);

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = (event) => {
                console.error("OfflineDB error", event);
                reject(event);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("✅ OfflineDB ready");
                this.setupListeners();
                
                // Try initial sync if online
                if (navigator.onLine) {
                    setTimeout(() => this.sync(), 2000); // Wait a bit for app to settle
                }
                resolve(this.db);
            };
        });
    },

    setupListeners() {
        window.addEventListener('online', () => {
            console.log("🌐 Connexion rétablie, lancement de la synchronisation...");
            if (window.showToast) window.showToast('Connexion rétablie - Synchronisation...', 'info');
            this.sync();
        });

        window.addEventListener('offline', () => {
            if (window.showToast) window.showToast('Mode Hors-Ligne activé', 'warning');
        });
    },

    /**
     * Ajoute une requête échouée à la file d'attente
     */
    async queueRequest(axiosConfig) {
        if (!this.db) await this.init();
        
        // Extract serializable data
        const requestData = {
            url: axiosConfig.url,
            method: axiosConfig.method,
            data: axiosConfig.data,
            headers: axiosConfig.headers,
            timestamp: Date.now(),
            retryCount: 0
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(requestData);
            
            request.onsuccess = () => {
                console.log("💾 Requête sauvegardée hors-ligne", requestData);
                
                // Trigger visual feedback
                if (window.showToast) {
                    window.showToast('Hors-ligne : Action sauvegardée et en attente', 'warning');
                }
                
                // Return a "fake" successful response so the UI doesn't crash
                // Mock structure matching typical API responses (ticket, message, etc.)
                resolve({ 
                    data: { 
                        offline: true, 
                        success: true, 
                        message: "Sauvegardé hors-ligne (sera synchronisé)",
                        // Mock objects to prevent UI crashes on property access
                        ticket: { id: 0, title: "Ticket (Hors-ligne)", status: "pending" },
                        message: { id: 0, content: "Message (Hors-ligne)" },
                        id: 0
                    },
                    status: 200,
                    statusText: 'Offline OK',
                    config: axiosConfig,
                    headers: {},
                    request: {}
                });
            };
            
            request.onerror = (e) => {
                console.error("Erreur sauvegarde IDB", e);
                reject(e);
            };
        });
    },

    /**
     * Synchronise la file d'attente avec le serveur
     */
    async sync() {
        if (!this.db) await this.init();
        if (!navigator.onLine || this.isSyncing) return;

        this.isSyncing = true;
        
        try {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = async () => {
                const items = request.result;
                if (items.length === 0) {
                    this.isSyncing = false;
                    return;
                }

                console.log(`🔄 Synchronisation de ${items.length} éléments...`);
                
                // Process sequentially to maintain order
                let successCount = 0;
                let failCount = 0;

                for (const item of items) {
                    try {
                        // Re-authenticate header check (in case token changed)
                        const token = localStorage.getItem('auth_token');
                        const headers = item.headers || {};
                        if (token) {
                            headers['Authorization'] = 'Bearer ' + token;
                        }

                        console.log(`Envoi: ${item.method} ${item.url}`);
                        await axios({
                            url: item.url,
                            method: item.method,
                            data: item.data,
                            headers: headers
                        });
                        
                        // Success: remove from DB
                        await this.removeItem(item.id);
                        successCount++;
                    } catch (error) {
                        console.error("Sync failed for item", item, error);
                        
                        // Si erreur client (4xx) ou serveur fatal (500), on supprime pour ne pas bloquer
                        // Si erreur réseau (undefined ou code 0), on garde
                        if (error.response && error.response.status >= 400) {
                             await this.removeItem(item.id); // Bad request, drop it
                             failCount++;
                        } else {
                            // Network error likely, keep it
                        }
                    }
                }
                
                if (successCount > 0) {
                    if (window.showToast) window.showToast(`${successCount} actions synchronisées avec succès`, 'success');
                    // Refresh view if possible
                    if (window.location.reload && confirm("Données synchronisées. Recharger la page pour voir les changements ?")) {
                        window.location.reload();
                    }
                }
                
                if (failCount > 0) {
                     if (window.showToast) window.showToast(`${failCount} actions ont échoué et ont été annulées`, 'error');
                }

                this.isSyncing = false;
            };
        } catch (e) {
            console.error("Sync error", e);
            this.isSyncing = false;
        }
    },

    removeItem(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e);
        });
    }
};

// Expose globally
window.OfflineSync = OfflineSync;

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    OfflineSync.init();
});
