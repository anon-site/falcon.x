// GitHub Sync Manager
class GitHubSync {
    constructor() {
        this.apiBase = 'https://api.github.com';
        this.rawBase = 'https://raw.githubusercontent.com';
        this.syncInterval = 30 * 60 * 1000; // 30 minutes
        this.lastSync = null;
        this.syncInProgress = false;
        
        // Initialize sync on load
        this.init();
    }

    init() {
        // Auto-sync on page load
        this.autoSync();
        
        // Set up periodic sync
        setInterval(() => this.autoSync(), this.syncInterval);
        
        // Sync on window focus (when user returns to the tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkAndSync();
            }
        });
    }

    async autoSync() {
        const settings = db.getSettings();
        
        // Check if GitHub settings are configured
        if (!settings.githubUsername || !settings.githubRepo) {
            console.log('GitHub sync: Not configured');
            return;
        }

        // Check if enough time has passed since last sync
        if (this.lastSync) {
            const timeSinceSync = Date.now() - this.lastSync;
            if (timeSinceSync < 5 * 60 * 1000) { // 5 minutes minimum
                console.log('GitHub sync: Too soon since last sync');
                return;
            }
        }

        await this.syncFromGitHub();
    }

    async checkAndSync() {
        const settings = db.getSettings();
        
        if (!settings.githubUsername || !settings.githubRepo) {
            return;
        }

        // Check if data has been updated on GitHub
        const hasUpdate = await this.checkForUpdates();
        if (hasUpdate) {
            await this.syncFromGitHub();
        }
    }

    async checkForUpdates() {
        try {
            const settings = db.getSettings();
            const url = `${this.apiBase}/repos/${settings.githubUsername}/${settings.githubRepo}/commits?path=data.json&per_page=1`;
            
            const response = await fetch(url);
            if (!response.ok) return false;

            const commits = await response.json();
            if (commits.length === 0) return false;

            const latestCommitDate = new Date(commits[0].commit.committer.date).getTime();
            const localData = db.getData();
            
            // Get the most recent modification date from local data
            let latestLocalDate = 0;
            const allItems = [
                ...localData.windowsPrograms || [],
                ...localData.windowsGames || [],
                ...localData.androidApps || [],
                ...localData.androidGames || [],
                ...localData.phoneTools || [],
                ...localData.frpApps || []
            ];

            allItems.forEach(item => {
                if (item.lastModified) {
                    const itemDate = new Date(item.lastModified).getTime();
                    if (itemDate > latestLocalDate) {
                        latestLocalDate = itemDate;
                    }
                }
            });

            return latestCommitDate > latestLocalDate;
        } catch (error) {
            console.error('Error checking for updates:', error);
            return false;
        }
    }

    async syncFromGitHub() {
        if (this.syncInProgress) {
            console.log('Sync already in progress');
            return;
        }

        this.syncInProgress = true;
        this.showSyncStatus('جاري التحديث من GitHub...', 'info');

        try {
            const settings = db.getSettings();
            const dataUrl = `${this.rawBase}/${settings.githubUsername}/${settings.githubRepo}/main/data.json`;

            const response = await fetch(dataUrl, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const githubData = await response.json();
            
            // Merge with local data (preserve local settings)
            const localData = db.getData();
            const mergedData = this.mergeData(localData, githubData);
            
            db.saveData(mergedData);
            this.lastSync = Date.now();
            
            this.showSyncStatus('✓ تم التحديث بنجاح', 'success');
            
            // Reload current page to show updated data
            if (typeof loadAllData === 'function') {
                loadAllData();
            }

            return true;
        } catch (error) {
            console.error('GitHub sync error:', error);
            this.showSyncStatus('⚠ فشل التحديث - سيتم المحاولة لاحقاً', 'error');
            return false;
        } finally {
            this.syncInProgress = false;
            // Hide status after 3 seconds
            setTimeout(() => this.hideSyncStatus(), 3000);
        }
    }

    mergeData(localData, githubData) {
        // Preserve local-only settings (like tokens)
        const preservedSettings = {
            githubToken: localData.settings?.githubToken || '',
            groqApiKey: localData.settings?.groqApiKey || ''
        };

        // Use GitHub data but keep preserved settings
        return {
            ...githubData,
            settings: {
                ...githubData.settings,
                ...preservedSettings
            }
        };
    }

    async uploadToGitHub() {
        const settings = db.getSettings();
        
        if (!settings.githubToken || !settings.githubUsername || !settings.githubRepo) {
            alert('يرجى تكوين إعدادات GitHub أولاً');
            return false;
        }

        this.showSyncStatus('جاري الرفع إلى GitHub...', 'info');

        try {
            // Get current file SHA
            const getUrl = `${this.apiBase}/repos/${settings.githubUsername}/${settings.githubRepo}/contents/data.json`;
            const getResponse = await fetch(getUrl, {
                headers: {
                    'Authorization': `token ${settings.githubToken}`
                }
            });

            let sha = '';
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }

            // Prepare data for upload (exclude sensitive info)
            const exportData = db.exportData(false);
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(exportData, null, 2))));

            // Upload file
            const putUrl = `${this.apiBase}/repos/${settings.githubUsername}/${settings.githubRepo}/contents/data.json`;
            const putResponse = await fetch(putUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${settings.githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update data.json - ${new Date().toISOString()}`,
                    content: content,
                    sha: sha,
                    branch: 'main'
                })
            });

            if (!putResponse.ok) {
                throw new Error(`Upload failed: ${putResponse.status}`);
            }

            this.showSyncStatus('✓ تم الرفع بنجاح إلى GitHub', 'success');
            setTimeout(() => this.hideSyncStatus(), 3000);
            return true;

        } catch (error) {
            console.error('Upload error:', error);
            this.showSyncStatus('⚠ فشل الرفع إلى GitHub', 'error');
            setTimeout(() => this.hideSyncStatus(), 3000);
            return false;
        }
    }

    showSyncStatus(message, type) {
        let statusBar = document.getElementById('sync-status-bar');
        
        if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.id = 'sync-status-bar';
            statusBar.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            document.body.appendChild(statusBar);
        }

        // Set colors based on type
        const colors = {
            info: { bg: '#3b82f6', text: '#fff' },
            success: { bg: '#10b981', text: '#fff' },
            error: { bg: '#ef4444', text: '#fff' }
        };

        const color = colors[type] || colors.info;
        statusBar.style.backgroundColor = color.bg;
        statusBar.style.color = color.text;

        // Add icon based on type
        const icons = {
            info: '<i class="fas fa-sync fa-spin"></i>',
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>'
        };

        statusBar.innerHTML = `${icons[type]} <span>${message}</span>`;
        statusBar.style.display = 'flex';
    }

    hideSyncStatus() {
        const statusBar = document.getElementById('sync-status-bar');
        if (statusBar) {
            statusBar.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                statusBar.style.display = 'none';
            }, 300);
        }
    }

    // Manual sync trigger
    async manualSync() {
        return await this.syncFromGitHub();
    }

    // Get last sync time
    getLastSyncTime() {
        if (!this.lastSync) return 'لم يتم التحديث بعد';
        
        const now = Date.now();
        const diff = now - this.lastSync;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `منذ ${hours} ساعة`;
        
        const days = Math.floor(hours / 24);
        return `منذ ${days} يوم`;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize GitHub Sync
const githubSync = new GitHubSync();
