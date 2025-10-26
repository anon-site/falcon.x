// Database Manager
class Database {
    constructor() {
        this.initDatabase();
    }

    initDatabase() {
        if (!localStorage.getItem('falconx_data')) {
            const initialData = {
                windowsPrograms: [],
                windowsGames: [],
                androidApps: [],
                androidGames: [],
                phoneTools: [],
                frpApps: [],
                categories: {
                    windowsPrograms: ['Design & Editing', 'Browsers', 'Office Suite', 'Development', 'Security', 'Media Players', 'Utilities'],
                    windowsGames: ['Action & Adventure', 'Strategy', 'RPG', 'Sports', 'Racing', 'Simulation'],
                    androidApps: ['Communication', 'Social Media', 'Productivity', 'Photography', 'Entertainment', 'Education'],
                    androidGames: ['Battle Royale', 'Puzzle', 'Action', 'Strategy', 'Casual', 'Sports'],
                    phoneTools: ['Flashing Tools', 'Backup Tools', 'Recovery Tools', 'Unlock Tools', 'Root Tools'],
                    frpApps: ['Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei', 'Realme', 'OnePlus', 'Nokia', 'LG', 'Motorola']
                },
                settings: {
                    githubToken: '',
                    githubUsername: '',
                    githubRepo: ''
                }
            };
            localStorage.setItem('falconx_data', JSON.stringify(initialData));
        }

        // Cleanup any previously seeded demo data on load
        try {
            const data = this.getData();
            const defaultNames = new Set([
                'Adobe Photoshop 2024',
                'Google Chrome',
                "Assassin's Creed Valhalla",
                'WhatsApp Messenger',
                'PUBG Mobile',
                'SP Flash Tool',
                'Samsung FRP Tool'
            ]);
            let changed = false;
            ['windowsPrograms','windowsGames','androidApps','androidGames','phoneTools','frpApps'].forEach(type => {
                if (Array.isArray(data[type])) {
                    const filtered = data[type].filter(item => !defaultNames.has(item?.name));
                    if (filtered.length !== data[type].length) {
                        data[type] = filtered;
                        changed = true;
                    }
                }
            });
            if (changed) this.saveData(data);
        } catch (e) {
            console.warn('Cleanup default data failed', e);
        }

        // Trigger remote sync on first load if needed
        try { setTimeout(() => this.syncFromRemoteIfNeeded(), 0); } catch (_) {}
    }

    getData() {
        return JSON.parse(localStorage.getItem('falconx_data'));
    }

    saveData(data) {
        localStorage.setItem('falconx_data', JSON.stringify(data));
    }

    getItems(type) {
        const data = this.getData();
        return data[type] || [];
    }

    addItem(type, item) {
        const data = this.getData();
        if (!data[type]) data[type] = [];
        
        const newItem = {
            ...item,
            id: Date.now(),
            lastModified: new Date().toISOString()
        };
        
        data[type].push(newItem);
        this.saveData(data);
        return newItem;
    }

    updateItem(type, id, updatedItem) {
        const data = this.getData();
        const index = data[type].findIndex(item => item.id == id);
        
        if (index !== -1) {
            data[type][index] = {
                ...updatedItem,
                id: parseInt(id),
                lastModified: new Date().toISOString()
            };
            this.saveData(data);
            return data[type][index];
        }
        return null;
    }

    deleteItem(type, id) {
        const data = this.getData();
        data[type] = data[type].filter(item => item.id != id);
        this.saveData(data);
    }

    getCategories(type) {
        const data = this.getData();
        return data.categories[type] || [];
    }

    addCategory(type, category) {
        const data = this.getData();
        if (!data.categories[type].includes(category)) {
            data.categories[type].push(category);
            this.saveData(data);
        }
    }

    deleteCategory(type, category) {
        const data = this.getData();
        data.categories[type] = data.categories[type].filter(cat => cat !== category);
        this.saveData(data);
    }

    getSettings() {
        const data = this.getData();
        return data.settings || {};
    }

    saveSettings(settings) {
        const data = this.getData();
        data.settings = { ...data.settings, ...settings };
        this.saveData(data);
    }

    exportData(includeSecrets = false) {
        const data = this.getData();
        
        // If exporting to GitHub, exclude sensitive information
        if (!includeSecrets && data.settings) {
            const exportData = JSON.parse(JSON.stringify(data)); // Deep clone
            
            // Remove sensitive keys
            if (exportData.settings) {
                delete exportData.settings.githubToken;
                delete exportData.settings.groqApiKey;
            }
            
            return exportData;
        }
        
        return data;
    }

    importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            this.saveData(data);
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    async fetchJsonWithTimeout(url, timeoutMs = 5000) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
            clearTimeout(id);
            if (!res.ok) return null;
            const text = await res.text();
            if (!text || !text.trim()) return null;
            return JSON.parse(text);
        } catch (_) {
            return null;
        }
    }

    async syncFromRemoteIfNeeded() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const force = urlParams.get('sync') === '1';
            const alreadySynced = localStorage.getItem('falconx_synced') === '1' && !force;
            if (alreadySynced) return;

            const data = this.getData() || {};
            const types = ['windowsPrograms','windowsGames','androidApps','androidGames','phoneTools','frpApps'];
            const totalCount = types.reduce((sum, t) => sum + (Array.isArray(data[t]) ? data[t].length : 0), 0);
            const isEmpty = totalCount === 0;

            if (!force && !isEmpty) return;

            // Try same-origin first (GitHub Pages or any static host)
            let remote = await this.fetchJsonWithTimeout('data.json', 4000);

            // Fallback to raw.githubusercontent if settings available
            if (!remote) {
                const settings = this.getSettings() || {};
                if (settings.githubUsername && settings.githubRepo) {
                    const rawUrl = `https://raw.githubusercontent.com/${settings.githubUsername}/${settings.githubRepo}/main/data.json`;
                    remote = await this.fetchJsonWithTimeout(rawUrl, 6000);
                }
            }

            if (remote && typeof remote === 'object') {
                // Preserve local secrets/settings (e.g., tokens) if any exist locally
                const localSettings = this.getSettings() || {};
                remote.settings = { ...remote.settings, ...localSettings };

                this.saveData(remote);
                localStorage.setItem('falconx_synced', '1');

                // Refresh UI to reflect new data immediately
                if (document.readyState !== 'loading') {
                    try { location.reload(); } catch (_) {}
                }
            }
        } catch (e) {
            console.warn('Remote sync skipped:', e);
        }
    }
}

// Initialize database
const db = new Database();
