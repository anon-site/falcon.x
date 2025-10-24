// Database Manager - GitHub Based
class Database {
    constructor() {
        this.data = null;
        this.loading = false;
        this.defaultData = {
            windowsPrograms: [],
            windowsGames: [],
            androidApps: [],
            androidGames: [],
            phoneTools: [],
            frpApps: [],
            categories: {
                windowsPrograms: ['Design & Editing', 'Browsers', 'Office Suite', 'Development', 'Security', 'Media Players', 'Utilities'],
                windowsGames: ['Action & Adventure', 'Strategy', 'RPG', 'Sports', 'Racing', 'Simulation'],
                androidApps: ['Communication', 'Social Media', 'Productivity', 'Photography', 'Entertainment', 'Education', 'Booster Games'],
                androidGames: ['Battle Royale', 'Puzzle', 'Action', 'Strategy', 'Casual', 'Sports'],
                phoneTools: ['Flashing Tools', 'Backup Tools', 'Recovery Tools', 'Unlock Tools', 'Root Tools'],
                frpApps: ['Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei', 'Realme', 'OnePlus', 'Nokia', 'LG', 'Motorola']
            }
        };
    }

    // Load data from GitHub
    async loadFromGitHub() {
        if (this.loading) return;
        this.loading = true;

        try {
            const settings = this.getSettings();
            
            // Default public repository for visitors
            const username = settings.githubUsername || 'anon-site';
            const repo = settings.githubRepo || 'falconx';
            
            // Only use default empty data if explicitly disabled
            if (!username || !repo) {
                console.log('No GitHub settings, using default data');
                this.data = JSON.parse(JSON.stringify(this.defaultData));
                this.loading = false;
                return;
            }

            // Add timestamp to break cache
            const timestamp = new Date().getTime();
            const response = await fetch(
                `https://raw.githubusercontent.com/${username}/${repo}/main/data.json?t=${timestamp}`,
                { 
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );

            if (response.ok) {
                this.data = await response.json();
                console.log('Data loaded from GitHub successfully');
            } else {
                console.log('Could not load from GitHub, using default data');
                this.data = JSON.parse(JSON.stringify(this.defaultData));
            }
        } catch (error) {
            console.error('Error loading from GitHub:', error);
            this.data = JSON.parse(JSON.stringify(this.defaultData));
        }

        this.loading = false;
    }

    // Get current data (with fallback)
    getData() {
        if (!this.data) {
            return JSON.parse(JSON.stringify(this.defaultData));
        }
        return this.data;
    }

    // Update in-memory data (admin panel only)
    saveData(data) {
        this.data = data;
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

    // Settings stored in localStorage only
    getSettings() {
        const settings = localStorage.getItem('falconx_settings');
        return settings ? JSON.parse(settings) : {
            githubToken: '',
            githubUsername: '',
            githubRepo: ''
        };
    }

    saveSettings(settings) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem('falconx_settings', JSON.stringify(updated));
    }

    exportData() {
        return this.getData();
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
}

// Initialize database
const db = new Database();

// Load data from GitHub on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        // Show loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        
        await db.loadFromGitHub();
        
        // Reload content if on main site
        if (typeof loadAllContent === 'function') {
            loadAllContent();
        }
        
        // Reload admin if on admin panel
        if (typeof loadDashboard === 'function') {
            loadDashboard();
            loadAllTables();
        }
        
        // Hide loading screen after data loaded
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 500);
    });
}
