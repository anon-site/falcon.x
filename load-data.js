// Auto-load data from GitHub on page load for all devices
(function() {
    const GITHUB_DATA_URL = 'https://raw.githubusercontent.com/anon-site/falcon.x/main/data.json';
    const CACHE_KEY = 'falconx_data';
    const CACHE_TIMESTAMP_KEY = 'falconx_data_timestamp';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    async function loadDataFromGithub() {
        try {
            // Check if we have recent cached data
            const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
            const now = Date.now();
            
            if (cachedTimestamp && (now - parseInt(cachedTimestamp)) < CACHE_DURATION) {
                console.log('✅ Using cached data (less than 5 minutes old)');
                return;
            }

            console.log('🔄 Loading data from GitHub...');
            
            const response = await fetch(GITHUB_DATA_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Validate data structure
            if (!data.windowsPrograms || !data.androidApps) {
                throw new Error('Invalid data structure');
            }
            
            // Get current settings (githubToken, groqApiKey)
            const currentData = localStorage.getItem(CACHE_KEY);
            let currentSettings = {};
            
            if (currentData) {
                try {
                    const parsed = JSON.parse(currentData);
                    currentSettings = parsed.settings || {};
                } catch (e) {
                    console.warn('Could not parse current settings');
                }
            }
            
            // Merge settings (preserve local tokens)
            data.settings = {
                ...data.settings,
                githubToken: currentSettings.githubToken || data.settings?.githubToken || '',
                groqApiKey: currentSettings.groqApiKey || data.settings?.groqApiKey || ''
            };
            
            // Save to localStorage
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
            
            console.log('✅ Data loaded from GitHub successfully');
            
            // Reload page if main.js is already loaded
            if (window.db && typeof window.loadAllContent === 'function') {
                window.loadAllContent();
            }
            
        } catch (error) {
            console.warn('⚠️ Could not load from GitHub:', error.message);
            console.log('Using local data instead');
        }
    }

    // Load data immediately when script runs
    loadDataFromGithub();
})();
