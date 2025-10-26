// Database Manager
class Database {
    constructor() {
        this.initDatabase();
    }

    initDatabase() {
        if (!localStorage.getItem('falconx_data')) {
            // البيانات الافتراضية فارغة - سيتم جلب البيانات من GitHub
            const initialData = {
                windowsPrograms: [],
                windowsGames: [],
                androidApps: [],
                androidGames: [],
                phoneTools: [],
                frpApps: [],
                categories: {
                    windowsPrograms: ['Design & Editing', 'Browsers', 'Office Suite', 'Development', 'Security', 'Media Players', 'Utilities'],
                    windowsGames: ['Action & Adventure', 'Strategy', 'RPG', 'Sports', 'Racing', 'Simulation', 'Arcade'],
                    androidApps: ['Communication', 'Social Media', 'Productivity', 'Photography', 'Entertainment', 'Education', 'Games Booster', 'Tools'],
                    androidGames: ['Battle Royale', 'Puzzle', 'Action', 'Strategy', 'Casual', 'Sports', 'Arcade'],
                    phoneTools: ['Flashing Tools', 'Backup Tools', 'Recovery Tools', 'Unlock Tools', 'Root Tools'],
                    frpApps: ['Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Huawei', 'Realme', 'OnePlus', 'Nokia', 'LG', 'Motorola']
                },
                settings: {
                    githubToken: '',
                    githubUsername: 'anon-site',
                    githubRepo: 'falcon.x'
                }
            };
            localStorage.setItem('falconx_data', JSON.stringify(initialData));
        }
        
        // تحديث البيانات تلقائياً من GitHub في كل زيارة
        this.autoUpdateFromGithub();
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
    
    // تحديث تلقائي من GitHub
    async autoUpdateFromGithub() {
        try {
            const settings = this.getSettings();
            const githubUsername = settings.githubUsername || 'anon-site';
            const githubRepo = settings.githubRepo || 'falcon.x';
            
            // جلب البيانات من data.json على GitHub
            const response = await fetch(
                `https://raw.githubusercontent.com/${githubUsername}/${githubRepo}/main/data.json`,
                {
                    cache: 'no-cache' // تجاهل الكاش للحصول على أحدث إصدار
                }
            );
            
            if (!response.ok) {
                console.log('No data.json found on GitHub, using local data');
                return;
            }
            
            const data = await response.json();
            
            // الاحتفاظ بإعدادات المستخدم المحلية
            const localSettings = this.getSettings();
            data.settings = { ...data.settings, ...localSettings };
            
            // تحديث البيانات المحلية
            this.saveData(data);
            console.log('✓ Data updated from GitHub successfully');
            
        } catch (error) {
            console.log('Auto-update failed:', error.message);
        }
    }
}

// Initialize database
const db = new Database();
