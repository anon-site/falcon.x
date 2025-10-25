// Database Manager
class Database {
    constructor() {
        this.initDatabase();
    }

    initDatabase() {
        if (!localStorage.getItem('falconx_data')) {
            const initialData = {
                windowsPrograms: [
                    {
                        id: 1,
                        name: 'Adobe Photoshop 2024',
                        category: 'Design & Editing',
                        version: '25.0.0',
                        size: '3.2 GB',
                        shortDesc: 'Professional image editing software',
                        fullDesc: 'Adobe Photoshop is the industry-standard raster graphics editor developed and published by Adobe Inc. for Windows and macOS. It offers advanced tools for photo editing, digital art creation, and graphic design.',
                        icon: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Photoshop_CC_icon.svg',
                        screenshots: [
                            'https://via.placeholder.com/800x450/6366f1/ffffff?text=Screenshot+1',
                            'https://via.placeholder.com/800x450/8b5cf6/ffffff?text=Screenshot+2',
                            'https://via.placeholder.com/800x450/ec4899/ffffff?text=Screenshot+3'
                        ],
                        features: [
                            'Advanced layer support',
                            'Non-destructive editing',
                            'AI-powered tools',
                            'Extensive brush library',
                            'Cloud document sync'
                        ],
                        requirements: 'Windows 10 (64-bit) or later, 8GB RAM, 4GB free disk space',
                        originalLink: 'https://adobe.com/photoshop',
                        modifiedLink: 'https://example.com/download/photoshop-mod',
                        website: 'https://adobe.com',
                        status: 'Modified',
                        note: 'Pre-activated version included',
                        noteColor: 'green',
                        lastModified: new Date().toISOString()
                    },
                    {
                        id: 2,
                        name: 'Google Chrome',
                        category: 'Browsers',
                        version: '120.0.6099',
                        size: '150 MB',
                        shortDesc: 'Fast and secure web browser',
                        fullDesc: 'Google Chrome is a cross-platform web browser developed by Google. It is the most popular web browser in the world, known for its speed, simplicity, and security.',
                        icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg',
                        screenshots: [],
                        features: [
                            'Fast browsing',
                            'Built-in security',
                            'Extension support',
                            'Sync across devices'
                        ],
                        requirements: 'Windows 7 or later',
                        originalLink: 'https://google.com/chrome',
                        modifiedLink: '',
                        website: 'https://google.com/chrome',
                        status: 'Original',
                        note: '',
                        noteColor: 'orange',
                        lastModified: new Date().toISOString()
                    }
                ],
                windowsGames: [
                    {
                        id: 1,
                        name: 'Assassin\'s Creed Valhalla',
                        category: 'Action & Adventure',
                        version: '1.7.0',
                        size: '120 GB',
                        shortDesc: 'Epic Viking adventure game',
                        fullDesc: 'Assassin\'s Creed Valhalla is an action role-playing video game. Lead epic raids against Saxon troops and fortresses. Dual-wield powerful weapons and experience England during the Dark Ages.',
                        icon: 'https://via.placeholder.com/150/6366f1/ffffff?text=AC+Valhalla',
                        screenshots: [
                            'https://via.placeholder.com/800x450/6366f1/ffffff?text=Game+Screenshot+1',
                            'https://via.placeholder.com/800x450/8b5cf6/ffffff?text=Game+Screenshot+2'
                        ],
                        features: [
                            'Open world exploration',
                            'Epic Viking raids',
                            'Character customization',
                            'Story-driven gameplay'
                        ],
                        requirements: 'Windows 10, Intel i7-4790 or AMD Ryzen 5 1600, 16GB RAM, GTX 1080 or RX Vega 64',
                        originalLink: 'https://store.ubi.com',
                        modifiedLink: 'https://example.com/ac-valhalla-repack',
                        website: 'https://assassinscreed.com',
                        status: 'Modified',
                        note: 'All DLCs included',
                        noteColor: 'green',
                        lastModified: new Date().toISOString()
                    }
                ],
                androidApps: [
                    {
                        id: 1,
                        name: 'WhatsApp Messenger',
                        category: 'Communication',
                        version: '2.23.24.7',
                        size: '65 MB',
                        shortDesc: 'Free messaging and calling app',
                        fullDesc: 'WhatsApp Messenger is a free messaging app for Android and other smartphones. WhatsApp uses your phone\'s internet connection to send messages and make calls.',
                        icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
                        screenshots: [],
                        features: [
                            'Free messaging',
                            'Voice and video calls',
                            'Group chats',
                            'End-to-end encryption'
                        ],
                        requirements: 'Android 5.0 or later',
                        originalLink: 'https://play.google.com/store/apps/details?id=com.whatsapp',
                        modifiedLink: '',
                        website: 'https://whatsapp.com',
                        status: 'Original',
                        note: '',
                        noteColor: 'orange',
                        lastModified: new Date().toISOString()
                    }
                ],
                androidGames: [
                    {
                        id: 1,
                        name: 'PUBG Mobile',
                        category: 'Battle Royale',
                        version: '3.0.0',
                        size: '2.5 GB',
                        shortDesc: 'Battle royale on mobile',
                        fullDesc: 'PUBG MOBILE is an action-packed battle royale game where 100 players fight to be the last one standing. Explore the map, loot weapons, and survive!',
                        icon: 'https://via.placeholder.com/150/6366f1/ffffff?text=PUBG',
                        screenshots: [],
                        features: [
                            '100 player battles',
                            'Multiple maps',
                            'Various game modes',
                            'Team play support'
                        ],
                        requirements: 'Android 6.0 or later, 2GB RAM minimum',
                        originalLink: 'https://play.google.com',
                        modifiedLink: 'https://example.com/pubg-mod',
                        website: 'https://pubgmobile.com',
                        status: 'Modified',
                        note: 'Unlimited UC and BP',
                        noteColor: 'red',
                        lastModified: new Date().toISOString()
                    }
                ],
                phoneTools: [
                    {
                        id: 1,
                        name: 'SP Flash Tool',
                        category: 'Flashing Tools',
                        version: '5.2036',
                        size: '25 MB',
                        shortDesc: 'MediaTek device flashing tool',
                        fullDesc: 'SP Flash Tool is the official flash tool for MediaTek devices. It allows you to flash stock firmware, custom recovery, and more.',
                        icon: 'https://via.placeholder.com/150/6366f1/ffffff?text=SP+Flash',
                        screenshots: [],
                        features: [
                            'Flash stock ROMs',
                            'Install custom recovery',
                            'Format device',
                            'Backup partitions'
                        ],
                        requirements: 'Windows 7 or later',
                        originalLink: 'https://spflashtool.com',
                        modifiedLink: '',
                        website: 'https://spflashtool.com',
                        status: 'Original',
                        note: '',
                        noteColor: 'orange',
                        lastModified: new Date().toISOString()
                    }
                ],
                frpApps: [
                    {
                        id: 1,
                        name: 'Samsung FRP Tool',
                        category: 'Samsung',
                        version: '2.4',
                        size: '8 MB',
                        shortDesc: 'Bypass Samsung FRP lock',
                        fullDesc: 'Samsung FRP Tool is designed to bypass Google account verification on Samsung devices. Works with most Samsung models.',
                        icon: 'https://via.placeholder.com/150/6366f1/ffffff?text=Samsung+FRP',
                        screenshots: [],
                        features: [
                            'Bypass FRP lock',
                            'Supports all Samsung models',
                            'Easy to use',
                            'Regular updates'
                        ],
                        requirements: 'Windows 10, USB Debugging enabled',
                        originalLink: '',
                        modifiedLink: 'https://example.com/samsung-frp',
                        website: '',
                        status: 'Modified',
                        note: 'Use at your own risk',
                        noteColor: 'red',
                        lastModified: new Date().toISOString()
                    }
                ],
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
        
        // Validate required fields
        if (!item.name || !item.name.trim()) {
            console.error('Item name is required');
            return null;
        }
        
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
            // Validate required fields
            if (!updatedItem.name || !updatedItem.name.trim()) {
                console.error('Item name is required');
                return null;
            }
            
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
        const trimmedCategory = category.trim();
        
        if (!trimmedCategory) {
            console.warn('Cannot add empty category');
            return false;
        }
        
        if (!data.categories[type]) {
            data.categories[type] = [];
        }
        
        if (!data.categories[type].includes(trimmedCategory)) {
            data.categories[type].push(trimmedCategory);
            this.saveData(data);
            return true;
        }
        
        return false; // Category already exists
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

    exportData() {
        return this.getData();
    }
    
    exportDataForGithub() {
        const data = this.getData();
        // Remove sensitive keys before uploading to GitHub
        const safeData = JSON.parse(JSON.stringify(data));
        if (safeData.settings) {
            delete safeData.settings.githubToken;
            delete safeData.settings.groqApiKey;
        }
        return safeData;
    }
    
    validateData(data) {
        // Validate data structure
        if (!data || typeof data !== 'object') return false;
        
        const requiredTypes = ['windowsPrograms', 'windowsGames', 'androidApps', 'androidGames', 'phoneTools', 'frpApps'];
        for (const type of requiredTypes) {
            if (!Array.isArray(data[type])) return false;
        }
        
        if (!data.categories || typeof data.categories !== 'object') return false;
        if (!data.settings || typeof data.settings !== 'object') return false;
        
        return true;
    }
    
    createBackup() {
        const data = this.getData();
        const backup = {
            data: data,
            timestamp: new Date().toISOString(),
            version: '2.4'
        };
        localStorage.setItem('falconx_backup', JSON.stringify(backup));
        return backup;
    }
    
    restoreBackup() {
        const backup = localStorage.getItem('falconx_backup');
        if (backup) {
            const parsed = JSON.parse(backup);
            this.saveData(parsed.data);
            return true;
        }
        return false;
    }
    
    getDataStats() {
        const data = this.getData();
        return {
            windowsPrograms: data.windowsPrograms?.length || 0,
            windowsGames: data.windowsGames?.length || 0,
            androidApps: data.androidApps?.length || 0,
            androidGames: data.androidGames?.length || 0,
            phoneTools: data.phoneTools?.length || 0,
            frpApps: data.frpApps?.length || 0,
            totalItems: (data.windowsPrograms?.length || 0) + 
                       (data.windowsGames?.length || 0) + 
                       (data.androidApps?.length || 0) + 
                       (data.androidGames?.length || 0) + 
                       (data.phoneTools?.length || 0) + 
                       (data.frpApps?.length || 0)
        };
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
