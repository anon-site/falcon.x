// Admin App
class AdminApp {
    constructor() {
        this.dataManager = new DataManager();
        this.hasUnsavedChanges = false;
        this.githubConfig = this.loadGitHubConfig();
        this.currentEditId = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.loadCategoriesDropdown();
        this.applyLanguage();
        
        // Auto-load repositories if token exists
        if (this.githubConfig.token) {
            this.loadRepositories(true); // silent mode
        }
    }
    
    loadGitHubConfig() {
        const config = localStorage.getItem('github_config');
        return config ? JSON.parse(config) : { token: '', username: '', repo: '' };
    }
    
    saveGitHubConfig() {
        localStorage.setItem('github_config', JSON.stringify(this.githubConfig));
    }
    
    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });
        
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        
        sidebarToggle?.addEventListener('click', () => {
            sidebar.classList.toggle('active');
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
        
        // Language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = window.languageManager.currentLang;
            languageSelect.addEventListener('change', (e) => {
                window.languageManager.switchLanguage(e.target.value);
                this.applyLanguage();
            });
        }
        
        // Save button
        const saveBtn = document.getElementById('saveChanges');
        saveBtn?.addEventListener('click', () => {
            this.saveToGitHub();
        });
        
        // App form
        const appForm = document.getElementById('appForm');
        appForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveApp();
        });
        
        const resetBtn = document.getElementById('resetForm');
        resetBtn?.addEventListener('click', () => {
            this.resetForm();
        });
        
        // Tab change updates categories
        const appTab = document.getElementById('appTab');
        appTab?.addEventListener('change', () => {
            this.loadCategoriesDropdown();
        });
        
        // Category modal
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        const categoryModal = document.getElementById('categoryModal');
        const closeCategoryModal = document.getElementById('closeCategoryModal');
        const categoryForm = document.getElementById('categoryForm');
        
        addCategoryBtn?.addEventListener('click', () => {
            this.resetCategoryForm();
            const modalTitle = document.getElementById('categoryModalTitle');
            const modalBadge = document.getElementById('modalCategoryBadge');
            if (modalTitle) {
                modalTitle.textContent = window.languageManager.t('add_category');
            }
            if (modalBadge) {
                modalBadge.style.display = 'none';
            }
            categoryModal.classList.add('active');
        });
        
        closeCategoryModal?.addEventListener('click', () => {
            categoryModal.classList.remove('active');
        });
        
        categoryForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });
        
        // Tab modal
        const tabModal = document.getElementById('tabModal');
        const closeTabModal = document.getElementById('closeTabModal');
        const tabForm = document.getElementById('tabForm');
        
        closeTabModal?.addEventListener('click', () => {
            tabModal.classList.remove('active');
        });
        
        tabForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTab();
        });
        
        // Add tab button
        const addTabBtn = document.getElementById('addTabBtn');
        addTabBtn?.addEventListener('click', () => {
            this.showAddTabModal();
        });
        
        // GitHub settings
        const githubToken = document.getElementById('githubToken');
        const testConnectionBtn = document.getElementById('testGithubConnection');
        
        if (githubToken) {
            githubToken.value = this.githubConfig.token || '';
        }
        
        const githubUsername = document.getElementById('githubUsername');
        const githubRepo = document.getElementById('githubRepo');
        
        if (githubUsername) githubUsername.value = this.githubConfig.username || '';
        if (githubRepo && this.githubConfig.repo) githubRepo.value = this.githubConfig.repo;
        
        githubToken?.addEventListener('input', (e) => {
            this.githubConfig.token = e.target.value;
            this.saveGitHubConfig();
            if (e.target.value) {
                this.loadRepositories();
            }
        });
        
        testConnectionBtn?.addEventListener('click', () => {
            this.loadRepositories();
        });
        
        // Repository selection
        githubRepo?.addEventListener('change', (e) => {
            this.githubConfig.repo = e.target.value;
            this.saveGitHubConfig();
        });
        
        // Filters
        const filterTab = document.getElementById('filterTab');
        const filterCategory = document.getElementById('filterCategory');
        const searchApp = document.getElementById('searchApp');
        const filterCategoriesTab = document.getElementById('filterCategoriesTab');
        
        filterTab?.addEventListener('change', () => this.filterApps());
        filterCategory?.addEventListener('change', () => this.filterApps());
        searchApp?.addEventListener('input', () => this.filterApps());
        filterCategoriesTab?.addEventListener('change', () => this.loadCategories());
    }
    
    applyLanguage() {
        this.loadDashboard();
        this.loadManageApps();
        this.loadCategories();
        this.loadTabs();
    }
    
    navigateToSection(sectionId) {
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionId) {
                item.classList.add('active');
            }
        });
        
        // Update sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update topbar title
        const currentSection = document.getElementById('currentSection');
        if (currentSection) {
            const key = sectionId.replace(/-/g, '_');
            currentSection.textContent = window.languageManager.t(key) || sectionId;
        }
        
        // Load section-specific data
        if (sectionId === 'manage-apps') {
            this.loadManageApps();
        } else if (sectionId === 'categories') {
            this.loadCategories();
        } else if (sectionId === 'tabs') {
            this.loadTabs();
        }
    }
    
    markUnsaved() {
        this.hasUnsavedChanges = true;
        const saveIndicator = document.getElementById('saveIndicator');
        const saveBtn = document.getElementById('saveChanges');
        
        if (saveIndicator) saveIndicator.style.display = 'block';
        if (saveBtn) saveBtn.style.display = 'flex';
    }
    
    markSaved() {
        this.hasUnsavedChanges = false;
        const saveIndicator = document.getElementById('saveIndicator');
        const saveBtn = document.getElementById('saveChanges');
        
        if (saveIndicator) {
            saveIndicator.innerHTML = `<span>${window.languageManager.t('saved')}</span>`;
            setTimeout(() => {
                saveIndicator.style.display = 'none';
            }, 2000);
        }
        if (saveBtn) saveBtn.style.display = 'none';
    }
    
    loadDashboard() {
        const allApps = this.dataManager.getAllApps();
        const modifiedApps = allApps.filter(app => app.status === 'modified');
        const windowsApps = allApps.filter(app => app.tab === 'windows-app');
        const androidApps = allApps.filter(app => app.tab === 'android-app');
        
        const totalAppsEl = document.getElementById('totalApps');
        const modifiedAppsEl = document.getElementById('modifiedApps');
        const windowsAppsEl = document.getElementById('windowsApps');
        const androidAppsEl = document.getElementById('androidApps');
        
        if (totalAppsEl) totalAppsEl.textContent = allApps.length;
        if (modifiedAppsEl) modifiedAppsEl.textContent = modifiedApps.length;
        if (windowsAppsEl) windowsAppsEl.textContent = windowsApps.length;
        if (androidAppsEl) androidAppsEl.textContent = androidApps.length;
    }
    
    loadManageApps() {
        const appsTable = document.getElementById('appsTable');
        if (!appsTable) return;
        
        const apps = this.dataManager.getAllApps();
        const lang = window.languageManager.currentLang;
        
        if (apps.length === 0) {
            appsTable.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No apps yet</h3>
                    <p>Add your first app to get started</p>
                </div>
            `;
            return;
        }
        
        const tableHTML = `
            <div class="table-header">
                <span>Icon</span>
                <span>Name</span>
                <span>Tab</span>
                <span>Category</span>
                <span>Status</span>
                <span>Actions</span>
            </div>
            ${apps.map(app => this.createTableRow(app, lang)).join('')}
        `;
        
        appsTable.innerHTML = tableHTML;
        
        // Add event listeners
        appsTable.querySelectorAll('.btn-edit').forEach((btn, index) => {
            btn.addEventListener('click', () => this.editApp(apps[index]));
        });
        
        appsTable.querySelectorAll('.btn-delete').forEach((btn, index) => {
            btn.addEventListener('click', () => this.deleteApp(apps[index].id));
        });
    }
    
    createTableRow(app, lang) {
        const category = this.dataManager.getCategories().find(c => c.id === app.category);
        const categoryName = category ? category.name[lang] : 'N/A';
        const tabName = this.dataManager.data.tabs.find(t => t.id === app.tab)?.name[lang] || app.tab;
        const appName = app.name?.en ? app.name[lang] : app.name;
        const statusBadge = app.status === 'modified' ? 
            '<span class="app-badge badge-modified">Modified</span>' : 
            '<span class="app-badge badge-original">Original</span>';
        
        return `
            <div class="table-row">
                <img src="${app.icon || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect fill=\'%23334155\' width=\'100\' height=\'100\'/%3E%3C/svg%3E'}" 
                     class="table-icon" 
                     alt="${appName}">
                <span>${appName}</span>
                <span>${tabName}</span>
                <span>${categoryName}</span>
                <span>${statusBadge}</span>
                <div class="table-actions">
                    <button class="icon-btn btn-edit" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn danger btn-delete" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    filterApps() {
        const filterTab = document.getElementById('filterTab')?.value;
        const filterCategory = document.getElementById('filterCategory')?.value;
        const searchTerm = document.getElementById('searchApp')?.value.toLowerCase();
        
        let apps = this.dataManager.getAllApps();
        
        if (filterTab && filterTab !== 'all') {
            apps = apps.filter(app => app.tab === filterTab);
        }
        
        if (filterCategory && filterCategory !== 'all') {
            apps = apps.filter(app => app.category === parseInt(filterCategory));
        }
        
        if (searchTerm) {
            apps = apps.filter(app => {
                const nameEn = app.name?.en || app.name || '';
                const nameAr = app.name?.ar || '';
                return nameEn.toLowerCase().includes(searchTerm) || nameAr.includes(searchTerm);
            });
        }
        
        // Render filtered apps
        const appsTable = document.getElementById('appsTable');
        if (!appsTable) return;
        
        const lang = window.languageManager.currentLang;
        
        if (apps.length === 0) {
            appsTable.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                </div>
            `;
            return;
        }
        
        const tableHTML = `
            <div class="table-header">
                <span>Icon</span>
                <span>Name</span>
                <span>Tab</span>
                <span>Category</span>
                <span>Status</span>
                <span>Actions</span>
            </div>
            ${apps.map(app => this.createTableRow(app, lang)).join('')}
        `;
        
        appsTable.innerHTML = tableHTML;
        
        // Re-add event listeners
        appsTable.querySelectorAll('.btn-edit').forEach((btn, index) => {
            btn.addEventListener('click', () => this.editApp(apps[index]));
        });
        
        appsTable.querySelectorAll('.btn-delete').forEach((btn, index) => {
            btn.addEventListener('click', () => this.deleteApp(apps[index].id));
        });
    }
    
    loadCategoriesDropdown() {
        const appTab = document.getElementById('appTab')?.value;
        const appCategory = document.getElementById('appCategory');
        
        if (!appCategory) return;
        
        const categories = this.dataManager.getCategories().filter(c => !appTab || c.tab === appTab);
        const lang = window.languageManager.currentLang;
        
        appCategory.innerHTML = categories.map(cat => 
            `<option value="${cat.id}">${cat.name[lang]}</option>`
        ).join('');
    }
    
    saveApp() {
        const id = document.getElementById('appId').value;
        const app = {
            id: id ? parseInt(id) : Date.now(),
            name: {
                en: document.getElementById('appName').value,
                ar: document.getElementById('appNameAr').value
            },
            tab: document.getElementById('appTab').value,
            category: parseInt(document.getElementById('appCategory').value),
            version: document.getElementById('appVersion').value,
            size: document.getElementById('appSize').value,
            status: document.getElementById('appStatus').value,
            icon: document.getElementById('appIcon').value,
            shortDescription: {
                en: document.getElementById('appShortDesc').value,
                ar: document.getElementById('appShortDescAr').value
            },
            fullDescription: {
                en: document.getElementById('appFullDesc').value,
                ar: document.getElementById('appFullDescAr').value
            },
            features: {
                en: document.getElementById('appFeatures').value.split('\n').filter(f => f.trim()),
                ar: document.getElementById('appFeaturesAr').value.split('\n').filter(f => f.trim())
            },
            screenshots: document.getElementById('appScreenshots').value.split('\n').filter(s => s.trim()),
            downloadOriginal: document.getElementById('appDownloadOriginal').value,
            downloadModified: document.getElementById('appDownloadModified').value
        };
        
        if (id) {
            // Update existing
            const index = this.dataManager.data.apps.findIndex(a => a.id === parseInt(id));
            if (index !== -1) {
                this.dataManager.data.apps[index] = app;
            }
        } else {
            // Add new
            this.dataManager.data.apps.push(app);
        }
        
        this.dataManager.saveData();
        this.markUnsaved();
        this.resetForm();
        this.navigateToSection('manage-apps');
        alert('App saved successfully!');
    }
    
    editApp(app) {
        this.currentEditId = app.id;
        
        document.getElementById('appId').value = app.id;
        document.getElementById('appName').value = app.name?.en || app.name || '';
        document.getElementById('appNameAr').value = app.name?.ar || '';
        document.getElementById('appTab').value = app.tab;
        this.loadCategoriesDropdown();
        document.getElementById('appCategory').value = app.category;
        document.getElementById('appVersion').value = app.version || '';
        document.getElementById('appSize').value = app.size || '';
        document.getElementById('appStatus').value = app.status || 'original';
        document.getElementById('appIcon').value = app.icon || '';
        document.getElementById('appShortDesc').value = app.shortDescription?.en || app.shortDescription || '';
        document.getElementById('appShortDescAr').value = app.shortDescription?.ar || '';
        document.getElementById('appFullDesc').value = app.fullDescription?.en || app.fullDescription || '';
        document.getElementById('appFullDescAr').value = app.fullDescription?.ar || '';
        document.getElementById('appFeatures').value = (app.features?.en || app.features || []).join('\n');
        document.getElementById('appFeaturesAr').value = (app.features?.ar || []).join('\n');
        document.getElementById('appScreenshots').value = (app.screenshots || []).join('\n');
        document.getElementById('appDownloadOriginal').value = app.downloadOriginal || '';
        document.getElementById('appDownloadModified').value = app.downloadModified || '';
        
        this.navigateToSection('add-app');
    }
    
    deleteApp(id) {
        if (!confirm(window.languageManager.t('confirm_delete'))) return;
        
        this.dataManager.data.apps = this.dataManager.data.apps.filter(a => a.id !== id);
        this.dataManager.saveData();
        this.markUnsaved();
        this.loadManageApps();
        this.loadDashboard();
    }
    
    resetForm() {
        document.getElementById('appForm').reset();
        document.getElementById('appId').value = '';
        this.currentEditId = null;
        this.loadCategoriesDropdown();
    }
    
    getTabIcon(tabId) {
        const icons = {
            'windows-app': 'fab fa-windows',
            'android-app': 'fab fa-android',
            'frp-tools': 'fas fa-tools',
            'frp-app': 'fas fa-shield-alt'
        };
        return icons[tabId] || 'fas fa-folder';
    }
    
    loadCategories() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        const filterSelect = document.getElementById('filterCategoriesTab');
        if (!categoriesGrid) return;
        
        const categories = this.dataManager.getCategories();
        const tabs = this.dataManager.data.tabs;
        const lang = window.languageManager.currentLang;
        
        // Populate filter dropdown
        if (filterSelect && filterSelect.children.length === 1) {
            tabs.forEach(tab => {
                const option = document.createElement('option');
                option.value = tab.id;
                option.textContent = tab.name[lang];
                filterSelect.appendChild(option);
            });
        }
        
        // Get selected filter
        const selectedTab = filterSelect?.value || 'all';
        
        // Filter categories
        let filteredCategories = categories;
        if (selectedTab !== 'all') {
            filteredCategories = categories.filter(cat => cat.tab === selectedTab);
        }
        
        // Build card HTML
        let html = '';
        let globalIndex = 0;
        
        filteredCategories.forEach((cat, index) => {
            const allCategories = this.dataManager.data.categories;
            const categoryIndex = allCategories.findIndex(c => c.id === cat.id);
            const sameTabCategories = allCategories.filter(c => c.tab === cat.tab);
            const tabIndex = sameTabCategories.findIndex(c => c.id === cat.id);
            const isFirst = tabIndex === 0;
            const isLast = tabIndex === sameTabCategories.length - 1;
            const appsInCategory = this.dataManager.data.apps.filter(app => app.category === cat.id).length;
            const tabName = tabs.find(t => t.id === cat.tab)?.name[lang] || cat.tab;
            const tabIcon = this.getTabIcon(cat.tab);
            globalIndex++;
            
            html += `
                <div class="category-card">
                    <div class="category-number">${categoryIndex + 1}</div>
                    <div class="category-header">
                        <h3>${cat.name[lang]}</h3>
                    </div>
                    <div class="category-meta">
                        <span class="category-badge tab-badge">
                            <i class="${tabIcon}"></i>
                            ${tabName}
                        </span>
                        <span class="category-badge">
                            <i class="fas fa-box"></i>
                            ${appsInCategory} ${window.languageManager.t('total_apps').toLowerCase()}
                        </span>
                        <span class="category-badge">
                            <i class="fas fa-language"></i>
                            EN: ${cat.name.en}
                        </span>
                        <span class="category-badge">
                            <i class="fas fa-language"></i>
                            AR: ${cat.name.ar}
                        </span>
                    </div>
                    <div class="category-id">ID: ${cat.id}</div>
                    <div class="category-actions">
                        <button class="icon-btn btn-move-cat-up" data-id="${cat.id}" ${isFirst ? 'disabled' : ''} title="Move Up">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="icon-btn btn-move-cat-down" data-id="${cat.id}" ${isLast ? 'disabled' : ''} title="Move Down">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="icon-btn btn-edit-cat" data-id="${cat.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn danger btn-delete-cat" data-id="${cat.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        if (html === '') {
            html = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>${window.languageManager.t('no_categories')}</h3>
                    <p>${window.languageManager.t('add_first_category')}</p>
                </div>
            `;
        }
        
        categoriesGrid.innerHTML = html;
        
        // Add event listeners
        categoriesGrid.querySelectorAll('.btn-edit-cat').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                this.editCategory(id);
            });
        });
        
        categoriesGrid.querySelectorAll('.btn-delete-cat').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                this.deleteCategory(id);
            });
        });
        
        categoriesGrid.querySelectorAll('.btn-move-cat-up').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                this.moveCategoryUp(id);
            });
        });
        
        categoriesGrid.querySelectorAll('.btn-move-cat-down').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                this.moveCategoryDown(id);
            });
        });
    }
    
    saveCategory() {
        const id = document.getElementById('categoryId').value;
        const category = {
            id: id ? parseInt(id) : Date.now(),
            name: {
                en: document.getElementById('categoryNameEn').value,
                ar: document.getElementById('categoryNameAr').value
            },
            tab: document.getElementById('categoryTab').value
        };
        
        if (id) {
            const index = this.dataManager.data.categories.findIndex(c => c.id === parseInt(id));
            if (index !== -1) {
                this.dataManager.data.categories[index] = category;
            }
        } else {
            this.dataManager.data.categories.push(category);
        }
        
        this.dataManager.saveData();
        this.markUnsaved();
        this.resetCategoryForm();
        document.getElementById('categoryModal').classList.remove('active');
        this.loadCategories();
    }
    
    editCategory(id) {
        const categories = this.dataManager.getCategories();
        const category = categories.find(c => c.id === id);
        if (!category) return;
        
        const categoryIndex = categories.findIndex(c => c.id === id);
        const modalTitle = document.getElementById('categoryModalTitle');
        const modalBadge = document.getElementById('modalCategoryBadge');
        
        if (modalTitle) {
            modalTitle.textContent = window.languageManager.t('edit_tab');
        }
        
        if (modalBadge && categoryIndex !== -1) {
            modalBadge.textContent = categoryIndex + 1;
            modalBadge.style.display = 'flex';
        }
        
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryNameEn').value = category.name.en;
        document.getElementById('categoryNameAr').value = category.name.ar;
        document.getElementById('categoryTab').value = category.tab;
        
        document.getElementById('categoryModal').classList.add('active');
    }
    
    moveCategoryUp(catId) {
        const categories = this.dataManager.data.categories;
        const index = categories.findIndex(c => c.id === catId);
        if (index <= 0) return;
        
        // Only swap with previous category if they're in the same tab
        if (categories[index].tab === categories[index - 1].tab) {
            [categories[index - 1], categories[index]] = [categories[index], categories[index - 1]];
            this.dataManager.saveData();
            this.markUnsaved();
            this.loadCategories();
        }
    }
    
    moveCategoryDown(catId) {
        const categories = this.dataManager.data.categories;
        const index = categories.findIndex(c => c.id === catId);
        if (index === -1 || index === categories.length - 1) return;
        
        // Only swap with next category if they're in the same tab
        if (categories[index].tab === categories[index + 1].tab) {
            [categories[index], categories[index + 1]] = [categories[index + 1], categories[index]];
            this.dataManager.saveData();
            this.markUnsaved();
            this.loadCategories();
        }
    }
    
    deleteCategory(id) {
        if (!confirm(window.languageManager.t('confirm_delete'))) return;
        
        this.dataManager.data.categories = this.dataManager.data.categories.filter(c => c.id !== id);
        this.dataManager.saveData();
        this.markUnsaved();
        this.loadCategories();
    }
    
    resetCategoryForm() {
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
    }
    
    loadTabs() {
        const tabsList = document.getElementById('tabsList');
        if (!tabsList) return;
        
        const lang = window.languageManager.currentLang;
        const tabs = this.dataManager.data.tabs;
        
        tabsList.innerHTML = tabs.map((tab, index) => {
            const appsCount = this.dataManager.getAppsByTab(tab.id).length;
            const isFirst = index === 0;
            const isLast = index === tabs.length - 1;
            
            return `
                <div class="tab-item">
                    <div class="tab-number">${index + 1}</div>
                    <div class="tab-info">
                        <h3>${tab.name[lang]}</h3>
                        <p>${appsCount} apps | ID: ${tab.id}</p>
                    </div>
                    <div class="tab-actions">
                        <button class="icon-btn btn-move-up" data-index="${index}" ${isFirst ? 'disabled' : ''} title="Move Up">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="icon-btn btn-move-down" data-index="${index}" ${isLast ? 'disabled' : ''} title="Move Down">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="icon-btn btn-edit-tab" data-index="${index}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn danger btn-delete-tab" data-index="${index}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners
        tabsList.querySelectorAll('.btn-edit-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.editTab(index);
            });
        });
        
        tabsList.querySelectorAll('.btn-delete-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.deleteTab(index);
            });
        });
        
        tabsList.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.moveTabUp(index);
            });
        });
        
        tabsList.querySelectorAll('.btn-move-down').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.moveTabDown(index);
            });
        });
    }
    
    showAddTabModal() {
        this.resetTabForm();
        const modalTitle = document.getElementById('tabModalTitle');
        const modalBadge = document.getElementById('modalTabBadge');
        
        if (modalTitle) {
            modalTitle.textContent = window.languageManager.t('add_tab');
        }
        
        // Hide badge for new tabs
        if (modalBadge) {
            modalBadge.style.display = 'none';
        }
        
        // Enable tab ID input for new tabs
        const tabIdInput = document.getElementById('tabIdInput');
        if (tabIdInput) {
            tabIdInput.disabled = false;
            tabIdInput.required = true;
        }
        
        document.getElementById('tabModal').classList.add('active');
    }
    
    editTab(index) {
        const tab = this.dataManager.data.tabs[index];
        if (!tab) return;
        
        const modalTitle = document.getElementById('tabModalTitle');
        const modalBadge = document.getElementById('modalTabBadge');
        
        if (modalTitle) {
            modalTitle.textContent = window.languageManager.t('edit_tab');
        }
        
        // Show badge with tab number
        if (modalBadge) {
            modalBadge.textContent = index + 1;
            modalBadge.style.display = 'flex';
        }
        
        document.getElementById('tabId').value = tab.id;
        document.getElementById('tabIdInput').value = tab.id;
        document.getElementById('tabNameEn').value = tab.name.en;
        document.getElementById('tabNameAr').value = tab.name.ar;
        
        // Disable tab ID input for existing tabs
        const tabIdInput = document.getElementById('tabIdInput');
        if (tabIdInput) {
            tabIdInput.disabled = true;
            tabIdInput.required = false;
        }
        
        document.getElementById('tabModal').classList.add('active');
    }
    
    saveTab() {
        const oldId = document.getElementById('tabId').value;
        const newId = document.getElementById('tabIdInput').value;
        const nameEn = document.getElementById('tabNameEn').value;
        const nameAr = document.getElementById('tabNameAr').value;
        
        if (!newId || !nameEn || !nameAr) {
            alert('Please fill all fields');
            return;
        }
        
        // Validate tab ID format
        if (!/^[a-z0-9-]+$/.test(newId)) {
            alert('Tab ID must contain only lowercase letters, numbers, and hyphens');
            return;
        }
        
        if (oldId) {
            // Edit existing tab
            const tabIndex = this.dataManager.data.tabs.findIndex(t => t.id === oldId);
            if (tabIndex !== -1) {
                this.dataManager.data.tabs[tabIndex].name = {
                    en: nameEn,
                    ar: nameAr
                };
            }
        } else {
            // Add new tab
            // Check if ID already exists
            if (this.dataManager.data.tabs.find(t => t.id === newId)) {
                alert('Tab ID already exists. Please use a different ID.');
                return;
            }
            
            this.dataManager.data.tabs.push({
                id: newId,
                name: {
                    en: nameEn,
                    ar: nameAr
                }
            });
        }
        
        this.dataManager.saveData();
        this.markUnsaved();
        this.resetTabForm();
        document.getElementById('tabModal').classList.remove('active');
        this.loadTabs();
        this.applyLanguage();
        alert('Tab saved successfully!');
    }
    
    moveTabUp(index) {
        if (index === 0) return; // Already at the top
        
        const tabs = this.dataManager.data.tabs;
        // Swap with previous tab
        [tabs[index - 1], tabs[index]] = [tabs[index], tabs[index - 1]];
        
        this.dataManager.saveData();
        this.markUnsaved();
        this.loadTabs();
    }
    
    moveTabDown(index) {
        const tabs = this.dataManager.data.tabs;
        if (index === tabs.length - 1) return; // Already at the bottom
        
        // Swap with next tab
        [tabs[index], tabs[index + 1]] = [tabs[index + 1], tabs[index]];
        
        this.dataManager.saveData();
        this.markUnsaved();
        this.loadTabs();
    }
    
    deleteTab(index) {
        const tab = this.dataManager.data.tabs[index];
        if (!tab) return;
        
        const appsCount = this.dataManager.getAppsByTab(tab.id).length;
        
        if (appsCount > 0) {
            alert(`Cannot delete tab "${tab.name.en}" because it contains ${appsCount} app(s). Please move or delete the apps first.`);
            return;
        }
        
        if (!confirm(`Are you sure you want to delete tab "${tab.name.en}"?`)) return;
        
        this.dataManager.data.tabs.splice(index, 1);
        this.dataManager.saveData();
        this.markUnsaved();
        this.loadTabs();
        this.applyLanguage();
        alert('Tab deleted successfully!');
    }
    
    resetTabForm() {
        document.getElementById('tabForm').reset();
        document.getElementById('tabId').value = '';
        document.getElementById('tabIdInput').value = '';
        
        // Enable tab ID input
        const tabIdInput = document.getElementById('tabIdInput');
        if (tabIdInput) {
            tabIdInput.disabled = false;
        }
    }
    
    async loadRepositories(silent = false) {
        const token = this.githubConfig.token;
        if (!token) {
            if (!silent) alert('Please enter a GitHub token');
            return;
        }
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.githubConfig.username = data.login;
                
                // Get repos
                const reposResponse = await fetch(data.repos_url, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (reposResponse.ok) {
                    const repos = await reposResponse.json();
                    
                    // Populate repository dropdown
                    const repoSelect = document.getElementById('githubRepo');
                    if (repoSelect) {
                        // Clear existing options except the first one
                        repoSelect.innerHTML = '<option value="" data-translate="select_repository">Select a repository...</option>';
                        
                        // Add all repositories
                        repos.forEach(repo => {
                            const option = document.createElement('option');
                            option.value = repo.name;
                            option.textContent = repo.name;
                            repoSelect.appendChild(option);
                        });
                        
                        // Select previously saved repo if exists
                        if (this.githubConfig.repo && repos.find(r => r.name === this.githubConfig.repo)) {
                            repoSelect.value = this.githubConfig.repo;
                        }
                    }
                }
                
                this.saveGitHubConfig();
                
                document.getElementById('githubUsername').value = this.githubConfig.username;
                
                if (!silent) {
                    alert('Connection successful! Please select a repository.');
                }
            } else {
                if (!silent) alert('Invalid token');
            }
        } catch (error) {
            if (!silent) alert('Connection failed: ' + error.message);
        }
    }
    
    async testGitHubConnection() {
        const token = this.githubConfig.token;
        if (!token) {
            alert('Please enter a GitHub token');
            return;
        }
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.githubConfig.username = data.login;
                
                // Get repos
                const reposResponse = await fetch(data.repos_url, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (reposResponse.ok) {
                    const repos = await reposResponse.json();
                    
                    // Populate repository dropdown
                    const repoSelect = document.getElementById('githubRepo');
                    if (repoSelect) {
                        // Clear existing options except the first one
                        repoSelect.innerHTML = '<option value="" data-translate="select_repository">Select a repository...</option>';
                        
                        // Add all repositories
                        repos.forEach(repo => {
                            const option = document.createElement('option');
                            option.value = repo.name;
                            option.textContent = repo.name;
                            repoSelect.appendChild(option);
                        });
                        
                        // Select previously saved repo if exists
                        if (this.githubConfig.repo && repos.find(r => r.name === this.githubConfig.repo)) {
                            repoSelect.value = this.githubConfig.repo;
                        }
                    }
                }
                
                this.saveGitHubConfig();
                
                document.getElementById('githubUsername').value = this.githubConfig.username;
                
                alert('Connection successful! Please select a repository.');
            } else {
                alert('Invalid token');
            }
        } catch (error) {
            alert('Connection failed: ' + error.message);
        }
    }
    
    async saveToGitHub() {
        if (!this.githubConfig.token || !this.githubConfig.username || !this.githubConfig.repo) {
            alert('Please configure GitHub settings first');
            return;
        }
        
        const data = {
            apps: this.dataManager.data.apps,
            categories: this.dataManager.data.categories,
            tabs: this.dataManager.data.tabs
        };
        
        const content = btoa(JSON.stringify(data, null, 2));
        const url = `https://api.github.com/repos/${this.githubConfig.username}/${this.githubConfig.repo}/contents/data.json`;
        
        try {
            // Get current file SHA if it exists
            let sha = null;
            const getResponse = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }
            
            // Create or update file
            const payload = {
                message: 'Update data from Falcon X Admin',
                content: content,
                ...(sha && { sha })
            };
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                this.markSaved();
                alert('Saved to GitHub successfully!');
            } else {
                const error = await response.json();
                alert('Failed to save: ' + error.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// Data Manager (reuse from app.js)
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

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AdminApp();
    });
} else {
    new AdminApp();
}
