// Data Manager
class DataManager {
    constructor() {
        this.data = {
            apps: [],
            categories: [],
            tabs: [
                { id: 'windows-app', name: { en: 'Windows App', ar: 'تطبيقات ويندوز' } },
                { id: 'android-app', name: { en: 'Android App', ar: 'تطبيقات أندرويد' } },
                { id: 'frp-tools', name: { en: 'FRP & Tools', ar: 'FRP وأدوات' } },
                { id: 'frp-app', name: { en: 'FRP App', ar: 'تطبيقات FRP' } }
            ]
        };
        this.loadData();
    }
    
    loadData() {
        const storedData = localStorage.getItem('falconx_data');
        if (storedData) {
            const parsed = JSON.parse(storedData);
            this.data.apps = parsed.apps || [];
            this.data.categories = parsed.categories || this.getDefaultCategories();
            this.data.tabs = parsed.tabs || this.data.tabs;
        } else {
            this.data.categories = this.getDefaultCategories();
        }
    }
    
    getDefaultCategories() {
        return [
            { id: 1, name: { en: 'Productivity', ar: 'الإنتاجية' }, tab: 'windows-app' },
            { id: 2, name: { en: 'Multimedia', ar: 'الوسائط المتعددة' }, tab: 'windows-app' },
            { id: 3, name: { en: 'Social Media', ar: 'وسائل التواصل' }, tab: 'android-app' },
            { id: 4, name: { en: 'Games', ar: 'الألعاب' }, tab: 'android-app' },
            { id: 5, name: { en: 'FRP Tools', ar: 'أدوات FRP' }, tab: 'frp-tools' },
            { id: 6, name: { en: 'FRP Bypass', ar: 'تخطي FRP' }, tab: 'frp-app' }
        ];
    }
    
    saveData() {
        localStorage.setItem('falconx_data', JSON.stringify(this.data));
    }
    
    getAppsByTab(tabId) {
        return this.data.apps.filter(app => app.tab === tabId);
    }
    
    getAllApps() {
        return this.data.apps;
    }
    
    getCategories() {
        return this.data.categories;
    }
}

// App Manager
class App {
    constructor() {
        this.dataManager = new DataManager();
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.init();
    }
    
    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
        this.loadApps();
        this.updateStats();
        this.checkFRPWarning();
    }
    
    setupEventListeners() {
        // Sidebar toggle for mobile
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!item.href || item.href.includes('#')) {
                    e.preventDefault();
                    const section = item.getAttribute('data-section');
                    if (section) {
                        this.navigateToSection(section);
                        if (window.innerWidth <= 768) {
                            sidebar.classList.remove('active');
                        }
                    }
                }
            });
        });
        
        // Settings modal
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');
        
        settingsBtn?.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
        
        closeSettings?.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
        
        settingsModal?.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('active');
            }
        });
        
        // Language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = window.languageManager.currentLang;
            languageSelect.addEventListener('change', (e) => {
                window.languageManager.switchLanguage(e.target.value);
                this.loadApps(); // Reload apps with new language
            });
        }
        
        // Theme selector
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                this.applyTheme(theme);
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Mark active theme
        const activeThemeBtn = document.querySelector(`.theme-btn[data-theme="${this.currentTheme}"]`);
        if (activeThemeBtn) {
            activeThemeBtn.classList.add('active');
        }
        
        // App modal close
        const appModal = document.getElementById('appModal');
        const closeAppModal = document.getElementById('closeAppModal');
        
        closeAppModal?.addEventListener('click', () => {
            appModal.classList.remove('active');
        });
        
        appModal?.addEventListener('click', (e) => {
            if (e.target === appModal) {
                appModal.classList.remove('active');
            }
        });
    }
    
    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
    }
    
    navigateToSection(sectionId) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });
        
        // Update active section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }
    
    loadApps() {
        // Load tabs from dataManager
        const tabs = this.dataManager.data.tabs.map(t => t.id);
        
        tabs.forEach(tabId => {
            const apps = this.dataManager.getAppsByTab(tabId);
            const gridId = `${this.camelCase(tabId)}Grid`;
            const grid = document.getElementById(gridId);
            
            if (grid) {
                this.renderApps(grid, apps);
            }
        });
    }
    
    camelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }
    
    renderApps(container, apps) {
        if (apps.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No apps available</h3>
                    <p>Check back soon for updates</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = apps.map(app => this.createAppCard(app)).join('');
        
        // Add click handlers
        container.querySelectorAll('.app-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.showAppDetail(apps[index]);
            });
        });
    }
    
    createAppCard(app) {
        const lang = window.languageManager.currentLang;
        const categoryName = this.getCategoryName(app.category, lang);
        const appName = app.name?.en ? app.name[lang] : app.name;
        const appShortDesc = app.shortDescription?.en ? app.shortDescription[lang] : app.shortDescription;
        const badgeClass = app.status === 'modified' ? 'badge-modified' : 'badge-original';
        const badgeText = app.status === 'modified' ? 'Modified' : 'Original';
        
        return `
            <div class="app-card">
                <div class="app-card-header">
                    <img src="${app.icon || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect fill=\'%23334155\' width=\'100\' height=\'100\'/%3E%3C/svg%3E'}" 
                         alt="${appName}" 
                         class="app-icon"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'%3E%3Crect fill=\\'%23334155\\' width=\\'100\\' height=\\'100\\'/%3E%3C/svg%3E'">
                    <div class="app-info">
                        <h3>${appName}</h3>
                        <div class="app-version">${app.version || 'v1.0'}</div>
                    </div>
                </div>
                <p class="app-description">${appShortDesc || ''}</p>
                <div class="app-meta">
                    <span class="app-size"><i class="fas fa-download"></i> ${app.size || 'N/A'}</span>
                    <span class="app-badge ${badgeClass}">${badgeText}</span>
                </div>
            </div>
        `;
    }
    
    getCategoryName(categoryId, lang) {
        const category = this.dataManager.getCategories().find(c => c.id === categoryId);
        return category ? category.name[lang] : '';
    }
    
    showAppDetail(app) {
        const modal = document.getElementById('appModal');
        const modalTitle = document.getElementById('appModalTitle');
        const modalBody = document.getElementById('appModalBody');
        const lang = window.languageManager.currentLang;
        
        const appName = app.name?.en ? app.name[lang] : app.name;
        const appShortDesc = app.shortDescription?.en ? app.shortDescription[lang] : app.shortDescription;
        const appFullDesc = app.fullDescription?.en ? app.fullDescription[lang] : app.fullDescription;
        const appFeatures = app.features?.en ? app.features[lang] : app.features || [];
        
        modalTitle.textContent = appName;
        
        const screenshots = app.screenshots || [];
        
        const downloadButtons = [];
        if (app.downloadOriginal) {
            downloadButtons.push(`
                <a href="${app.downloadOriginal}" class="btn btn-primary" target="_blank">
                    <i class="fas fa-download"></i>
                    ${window.languageManager.t('download_original')}
                </a>
            `);
        }
        if (app.downloadModified) {
            downloadButtons.push(`
                <a href="${app.downloadModified}" class="btn btn-secondary" target="_blank">
                    <i class="fas fa-download"></i>
                    ${window.languageManager.t('download_modified')}
                </a>
            `);
        }
        
        modalBody.innerHTML = `
            <div class="app-detail-header">
                <img src="${app.icon || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect fill=\'%23334155\' width=\'100\' height=\'100\'/%3E%3C/svg%3E'}" 
                     alt="${appName}" 
                     class="app-detail-icon"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'%3E%3Crect fill=\\'%23334155\\' width=\\'100\\' height=\\'100\\'/%3E%3C/svg%3E'">
                <div class="app-detail-info">
                    <h3>${appName}</h3>
                    <div class="app-detail-meta">
                        <span><i class="fas fa-tag"></i> ${window.languageManager.t('version')}: ${app.version || 'N/A'}</span>
                        <span><i class="fas fa-hdd"></i> ${window.languageManager.t('size')}: ${app.size || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <h4>${window.languageManager.t('description')}</h4>
            <p>${appFullDesc || appShortDesc || ''}</p>
            
            ${appFeatures.length > 0 ? `
                <div class="app-features">
                    <h4>${window.languageManager.t('features')}</h4>
                    <ul>
                        ${appFeatures.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${screenshots.length > 0 ? `
                <div>
                    <h4>${window.languageManager.t('screenshots')}</h4>
                    <div class="app-screenshots">
                        ${screenshots.map(s => `<img src="${s}" alt="Screenshot">`).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${downloadButtons.length > 0 ? `
                <div class="download-buttons">
                    ${downloadButtons.join('')}
                </div>
            ` : ''}
        `;
        
        modal.classList.add('active');
    }
    
    updateStats() {
        const allApps = this.dataManager.getAllApps();
        const modifiedApps = allApps.filter(app => app.status === 'modified');
        const frpTools = allApps.filter(app => app.tab === 'frp-tools' || app.tab === 'frp-app');
        
        const totalAppsEl = document.getElementById('totalApps');
        const modifiedAppsEl = document.getElementById('modifiedApps');
        const totalToolsEl = document.getElementById('totalTools');
        
        if (totalAppsEl) totalAppsEl.textContent = allApps.length;
        if (modifiedAppsEl) modifiedAppsEl.textContent = modifiedApps.length;
        if (totalToolsEl) totalToolsEl.textContent = frpTools.length;
    }
    
    checkFRPWarning() {
        const frpToolsLink = document.querySelector('.nav-item[data-section="frp-tools"]');
        
        if (frpToolsLink) {
            frpToolsLink.addEventListener('click', (e) => {
                const dontShowAgain = localStorage.getItem('frp_warning_dismissed');
                
                if (!dontShowAgain) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showFRPWarning();
                }
            });
        }
    }
    
    showFRPWarning() {
        const modal = document.getElementById('frpWarningModal');
        const acceptBtn = document.getElementById('acceptWarning');
        const dontShowCheckbox = document.getElementById('dontShowAgain');
        
        modal.classList.add('active');
        
        const handleAccept = () => {
            if (dontShowCheckbox.checked) {
                localStorage.setItem('frp_warning_dismissed', 'true');
            }
            modal.classList.remove('active');
            this.navigateToSection('frp-tools');
            acceptBtn.removeEventListener('click', handleAccept);
        };
        
        acceptBtn.addEventListener('click', handleAccept);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new App();
    });
} else {
    new App();
}
