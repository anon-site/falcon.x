// Auto-load data from GitHub on page load for all devices
(function() {
    // IMPORTANT: Don't run this on admin page to prevent data loss
    if (window.location.pathname.includes('admin.html') || window.location.pathname.includes('login.html')) {
        console.log('⚠️ Skipping auto-load on admin/login page to prevent data loss');
        return;
    }
    
    const GITHUB_DATA_URL = 'https://raw.githubusercontent.com/anon-site/falcon.x/main/data.json';
    const CACHE_KEY = 'falconx_data';
    const CACHE_TIMESTAMP_KEY = 'falconx_data_timestamp';
    const CACHE_DURATION = 10 * 1000; // 10 seconds - check GitHub more frequently

    async function loadDataFromGithub() {
        try {
            // Check if we have recent cached data
            const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
            const now = Date.now();
            
            if (cachedTimestamp && (now - parseInt(cachedTimestamp)) < CACHE_DURATION) {
                const secondsAgo = Math.floor((now - parseInt(cachedTimestamp)) / 1000);
                console.log(`✅ Using cached data (${secondsAgo} seconds old)`);
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
                    console.warn('Could not parse current settings:', e.message);
                    currentSettings = {};
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
            
            // Clear the cache cleared flag since we loaded new data
            localStorage.removeItem('lastCacheCleared');
            
            // Check if data actually changed
            const dataChanged = currentData !== JSON.stringify(data);
            
            if (dataChanged) {
                console.log('🆕 New data detected from GitHub!');
                
                // Show update notification to user
                showUpdateNotification();
                
                // Reload page if main.js is already loaded
                if (window.db && typeof window.loadAllContent === 'function') {
                    // Re-initialize database with new data
                    if (window.db && typeof window.db.initDatabase === 'function') {
                        window.db.initDatabase();
                    }
                    console.log('🔄 Reloading content with fresh data from GitHub...');
                    window.loadAllContent();
                } else {
                    console.log('✅ Data ready. Will load when page initializes.');
                }
            } else {
                console.log('✅ Data is up to date.');
            }
            
        } catch (error) {
            console.warn('⚠️ Could not load from GitHub:', error.message);
            console.log('Using local data instead');
        }
    }

    // Load data immediately when script runs
    loadDataFromGithub();
    
    // Show update notification
    function showUpdateNotification() {
        // Don't show on first load
        if (!localStorage.getItem('falconx_has_loaded_before')) {
            localStorage.setItem('falconx_has_loaded_before', 'true');
            return;
        }
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.95rem;
            font-weight: 500;
            animation: slideInRight 0.4s ease;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-sync-alt" style="animation: spin 1s linear infinite;"></i>
            <span>New content loaded!</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }
    
    // Expose function to force refresh (useful for testing)
    window.forceRefreshData = function() {
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        console.log('🔄 Cache cleared. Reloading page...');
        location.reload();
    };
    
    // Auto-refresh every 30 seconds if page is visible
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
            loadDataFromGithub();
        }
    }, 30 * 1000); // 30 seconds - faster updates
})();
