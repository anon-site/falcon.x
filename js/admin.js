// Check authentication
function checkAuth() {
    const session = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession');
    
    if (!session) {
        window.location.href = 'admin-login.html';
        return false;
    }
    
    const sessionData = JSON.parse(session);
    document.getElementById('adminUsername').textContent = sessionData.username;
    return true;
}

// Logout
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('adminSession');
        sessionStorage.removeItem('adminSession');
        window.location.href = 'admin-login.html';
    }
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    sidebar.classList.toggle('collapsed');
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    // Update page title
    const titles = {
        'dashboard': 'الرئيسية',
        'apps-management': 'إدارة البرامج والتطبيقات',
        'navigation-management': 'إدارة التبويبات',
        'site-settings': 'إعدادات الموقع',
        'colors-management': 'الألوان والتصميم',
        'images-management': 'إدارة الصور'
    };
    
    document.querySelector('.page-title').textContent = titles[sectionId] || 'لوحة التحكم';
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============ GitHub Integration ============

function testGitHubConnection() {
    const statusDiv = document.getElementById('githubStatus');
    statusDiv.style.display = 'block';
    statusDiv.style.background = '#1e2746';
    statusDiv.style.color = '#fff';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاتصال بـ GitHub...';
    
    githubAPI.testConnection().then(result => {
        if (result.success) {
            statusDiv.style.background = '#10b981';
            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> ' + result.message;
        } else {
            statusDiv.style.background = '#ef4444';
            statusDiv.innerHTML = '<i class="fas fa-times-circle"></i> ' + result.message;
        }
    });
}

function syncToGitHub() {
    if (!githubAPI.isConfigured()) {
        showToast('الرجاء إعداد GitHub أولاً', 'error');
        showSection('github-settings');
        return;
    }
    
    const statusDiv = document.getElementById('githubStatus');
    statusDiv.style.display = 'block';
    statusDiv.style.background = '#1e2746';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المزامنة مع GitHub...';
    
    const windowsApps = getAllApps('windows');
    const androidApps = getAllApps('android');
    const frpTools = getAllApps('frp-tools');
    const frpApps = getAllApps('frp-apps');
    
    githubAPI.saveAllDataToGitHub(windowsApps, androidApps, frpTools, frpApps)
        .then(() => {
            statusDiv.style.background = '#10b981';
            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> تم حفظ البيانات على GitHub بنجاح!';
            showToast('تم حفظ البيانات على GitHub', 'success');
        })
        .catch(error => {
            statusDiv.style.background = '#ef4444';
            statusDiv.innerHTML = '<i class="fas fa-times-circle"></i> خطأ: ' + error.message;
            showToast('فشل الحفظ على GitHub', 'error');
        });
}

// Load GitHub settings
function loadGitHubSettings() {
    const config = githubAPI.config;
    if (config.token) {
        document.getElementById('githubToken').value = config.token;
        document.getElementById('githubRepo').value = config.repo;
        document.getElementById('githubBranch').value = config.branch || 'main';
    }
}

// Fetch repositories when token is entered
async function fetchReposFromToken() {
    const token = document.getElementById('githubToken').value.trim();
    const repoSelect = document.getElementById('githubRepo');
    const statusDiv = document.getElementById('githubStatus');
    
    if (!token) {
        showToast('الرجاء إدخال التوكن أولاً', 'error');
        return;
    }
    
    statusDiv.style.display = 'block';
    statusDiv.style.background = '#1e2746';
    statusDiv.style.color = '#fff';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري جلب المستودعات...';
    
    // Temporarily save token to config
    const tempConfig = {
        token: token,
        repo: githubAPI.config.repo || '',
        branch: githubAPI.config.branch || 'main'
    };
    githubAPI.config = tempConfig;
    
    const result = await githubAPI.getUserRepos();
    
    if (result.success) {
        // Convert input to select dropdown
        const currentValue = repoSelect.value;
        repoSelect.innerHTML = '<option value="" style="background: #1e2746; color: #888;">اختر المستودع...</option>';
        
        result.repos.forEach(repo => {
            const option = document.createElement('option');
            option.value = repo.name;
            option.textContent = `${repo.name} - ${repo.description.substring(0, 50)}`;
            option.style.background = '#1e2746';
            option.style.color = '#fff';
            repoSelect.appendChild(option);
        });
        
        // Restore previous value if exists
        if (currentValue && result.repos.find(r => r.name === currentValue)) {
            repoSelect.value = currentValue;
        }
        
        statusDiv.style.background = '#10b981';
        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> تم العثور على ${result.repos.length} مستودع`;
        showToast(`تم جلب ${result.repos.length} مستودع بنجاح`, 'success');
    } else {
        statusDiv.style.background = '#ef4444';
        statusDiv.innerHTML = '<i class="fas fa-times-circle"></i> ' + result.message;
        showToast('فشل جلب المستودعات. تحقق من التوكن', 'error');
    }
}

// Save GitHub settings
document.getElementById('githubSettingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const repoValue = document.getElementById('githubRepo').value;
    
    // Validate repository format
    if (!repoValue || !repoValue.includes('/')) {
        showToast('الرجاء اختيار مستودع من القائمة', 'error');
        return;
    }
    
    const config = {
        token: document.getElementById('githubToken').value,
        repo: repoValue,
        branch: document.getElementById('githubBranch').value || 'main'
    };
    
    githubAPI.saveConfig(config);
    showToast('تم حفظ إعدادات GitHub بنجاح', 'success');
});

// ============ Apps Management ============

const CATEGORIES = {
    windows: ['productivity', 'security', 'multimedia', 'utilities'],
    android: ['tools', 'social', 'games', 'customization'],
    'frp-tools': ['samsung', 'xiaomi', 'oppo', 'universal'],
    'frp-apps': ['samsung', 'xiaomi', 'huawei', 'oppo', 'realme', 'universal']
};

// In-memory storage for apps
let appsData = {
    windows: [],
    android: [],
    'frp-tools': [],
    'frp-apps': []
};

let currentAppType = 'windows';
let editingAppId = null;

// Get all apps of a type
function getAllApps(type) {
    return appsData[type] || [];
}

// Switch tabs
function switchTab(type) {
    currentAppType = type;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${type}-tab`).classList.add('active');
    
    // Load apps
    loadApps(type);
}

// Load apps
function loadApps(type) {
    const apps = appsData[type] || [];
    const container = document.getElementById(`${type}-list`);
    
    if (apps.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>لا توجد عناصر بعد</p></div>';
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>الاسم</th><th>الفئة</th><th>الإصدار</th><th>الحجم</th><th>التقييم</th><th>الإجراءات</th>';
    html += '</tr></thead><tbody>';
    
    apps.forEach(app => {
        html += `<tr>
            <td><strong>${app.name}</strong></td>
            <td><span class="badge">${app.category}</span></td>
            <td>${app.version}</td>
            <td>${app.size}</td>
            <td>${app.rating} ⭐</td>
            <td class="actions">
                <button class="btn-icon btn-edit" onclick="editApp('${type}', ${app.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteApp('${type}', ${app.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Open app modal
function openAppModal(type, appId = null) {
    currentAppType = type;
    editingAppId = appId;
    
    const modal = document.getElementById('appModal');
    const form = document.getElementById('appForm');
    const categorySelect = document.getElementById('appCategory');
    
    // Set modal title
    const titles = {
        windows: 'برنامج Windows',
        android: 'تطبيق Android',
        'frp-tools': 'أداة FRP',
        'frp-apps': 'تطبيق FRP'
    };
    
    document.getElementById('modalTitle').textContent = appId 
        ? `تعديل ${titles[type]}` 
        : `إضافة ${titles[type]} جديد`;
    
    // Populate categories
    categorySelect.innerHTML = '<option value="">اختر الفئة</option>';
    CATEGORIES[type].forEach(cat => {
        categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    
    // Load app data if editing
    if (appId) {
        const apps = appsData[type] || [];
        const app = apps.find(a => a.id === appId);
        
        if (app) {
            document.getElementById('appId').value = app.id;
            document.getElementById('appType').value = type;
            document.getElementById('appName').value = app.name;
            document.getElementById('appCategory').value = app.category;
            document.getElementById('appVersion').value = app.version;
            document.getElementById('appSize').value = app.size;
            document.getElementById('appRating').value = app.rating;
            document.getElementById('appDownloads').value = app.downloads;
            document.getElementById('appDescription').value = app.description;
            document.getElementById('appIcon').value = app.icon || '';
            document.getElementById('appDownloadLink').value = app.downloadLink;
            document.getElementById('appFeatures').value = app.features ? app.features.join('\n') : '';
        }
    } else {
        form.reset();
        document.getElementById('appType').value = type;
    }
    
    modal.style.display = 'flex';
}

// Close app modal
function closeAppModal() {
    document.getElementById('appModal').style.display = 'none';
    document.getElementById('appForm').reset();
    editingAppId = null;
}

// Save app
document.getElementById('appForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = document.getElementById('appType').value;
    const appId = document.getElementById('appId').value;
    const isEditing = appId !== '';
    
    const appData = {
        id: isEditing ? parseInt(appId) : Date.now(),
        name: document.getElementById('appName').value,
        category: document.getElementById('appCategory').value,
        version: document.getElementById('appVersion').value,
        size: document.getElementById('appSize').value,
        rating: parseFloat(document.getElementById('appRating').value),
        downloads: document.getElementById('appDownloads').value,
        description: document.getElementById('appDescription').value,
        icon: document.getElementById('appIcon').value || 'https://via.placeholder.com/64',
        downloadLink: document.getElementById('appDownloadLink').value,
        features: document.getElementById('appFeatures').value.split('\n').filter(f => f.trim())
    };
    
    let apps = appsData[type] || [];
    
    if (isEditing) {
        const index = apps.findIndex(a => a.id === parseInt(appId));
        apps[index] = appData;
    } else {
        apps.push(appData);
    }
    
    appsData[type] = apps;
    
    closeAppModal();
    loadApps(type);
    updateDashboardStats();
    showToast(isEditing ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح', 'success');
    
    // Auto-sync to GitHub if configured
    if (githubAPI.isConfigured()) {
        syncToGitHub();
    }
});

// Edit app
function editApp(type, id) {
    openAppModal(type, id);
}

// Delete app
function deleteApp(type, id) {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
        let apps = appsData[type] || [];
        apps = apps.filter(app => app.id !== id);
        appsData[type] = apps;
        
        loadApps(type);
        updateDashboardStats();
        showToast('تم الحذف بنجاح', 'success');
        
        // Auto-sync to GitHub if configured
        if (githubAPI.isConfigured()) {
            syncToGitHub();
        }
    }
}

// Filter apps
function filterApps(type, searchTerm) {
    const apps = appsData[type] || [];
    const filtered = apps.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Render filtered apps (simplified version)
    const container = document.getElementById(`${type}-list`);
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>لا توجد نتائج</p></div>';
    } else {
        // Reuse loadApps logic with filtered data
        let html = '<table class="data-table"><thead><tr>';
        html += '<th>الاسم</th><th>الفئة</th><th>الإصدار</th><th>الحجم</th><th>التقييم</th><th>الإجراءات</th>';
        html += '</tr></thead><tbody>';
        
        filtered.forEach(app => {
            html += `<tr>
                <td><strong>${app.name}</strong></td>
                <td><span class="badge">${app.category}</span></td>
                <td>${app.version}</td>
                <td>${app.size}</td>
                <td>${app.rating} ⭐</td>
                <td class="actions">
                    <button class="btn-icon btn-edit" onclick="editApp('${type}', ${app.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteApp('${type}', ${app.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
}

// Add new app from dashboard
function addNewApp(type) {
    switchTab(type);
    setTimeout(() => openAppModal(type), 100);
}

// ============ Navigation Management ============

function loadNavigation() {
    const navItems = JSON.parse(localStorage.getItem('navigation')) || getDefaultNavigation();
    const container = document.getElementById('navigation-list');
    
    let html = '<div class="navigation-items">';
    
    navItems.sort((a, b) => a.order - b.order).forEach(item => {
        html += `
            <div class="nav-item-card ${item.active ? 'active' : 'inactive'}">
                <div class="nav-item-icon">
                    <i class="${item.icon}"></i>
                </div>
                <div class="nav-item-info">
                    <h3>${item.title}</h3>
                    <p>${item.link}</p>
                    <span class="badge">${item.active ? 'مفعل' : 'معطل'}</span>
                </div>
                <div class="nav-item-actions">
                    <button class="btn-icon" onclick="editNavItem(${item.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteNavItem(${item.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function getDefaultNavigation() {
    return [
        { id: 1, title: 'Home', icon: 'fas fa-home', link: '#home', order: 1, active: true },
        { id: 2, title: 'Windows Software', icon: 'fab fa-windows', link: '#windows', order: 2, active: true },
        { id: 3, title: 'Android Apps', icon: 'fab fa-android', link: '#android', order: 3, active: true },
        { id: 4, title: 'FRP Tools', icon: 'fas fa-unlock-alt', link: '#frp', order: 4, active: true },
        { id: 5, title: 'FRP Apps', icon: 'fas fa-mobile-alt', link: '#frp-apps', order: 5, active: true },
        { id: 6, title: 'About Us', icon: 'fas fa-info-circle', link: '#about', order: 6, active: true }
    ];
}

function openNavModal(id = null) {
    const modal = document.getElementById('navModal');
    const form = document.getElementById('navForm');
    
    if (id) {
        const navItems = JSON.parse(localStorage.getItem('navigation')) || getDefaultNavigation();
        const item = navItems.find(n => n.id === id);
        
        if (item) {
            document.getElementById('navId').value = item.id;
            document.getElementById('navTitle').value = item.title;
            document.getElementById('navIcon').value = item.icon;
            document.getElementById('navLink').value = item.link;
            document.getElementById('navOrder').value = item.order;
            document.getElementById('navActive').checked = item.active;
        }
        
        document.getElementById('navModalTitle').textContent = 'تعديل تبويب';
    } else {
        form.reset();
        document.getElementById('navModalTitle').textContent = 'إضافة تبويب جديد';
        document.getElementById('navActive').checked = true;
    }
    
    modal.style.display = 'flex';
}

function closeNavModal() {
    document.getElementById('navModal').style.display = 'none';
    document.getElementById('navForm').reset();
}

document.getElementById('navForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('navId').value;
    const isEditing = id !== '';
    
    const navData = {
        id: isEditing ? parseInt(id) : Date.now(),
        title: document.getElementById('navTitle').value,
        icon: document.getElementById('navIcon').value,
        link: document.getElementById('navLink').value,
        order: parseInt(document.getElementById('navOrder').value),
        active: document.getElementById('navActive').checked
    };
    
    let navItems = JSON.parse(localStorage.getItem('navigation')) || getDefaultNavigation();
    
    if (isEditing) {
        const index = navItems.findIndex(n => n.id === parseInt(id));
        navItems[index] = navData;
    } else {
        navItems.push(navData);
    }
    
    localStorage.setItem('navigation', JSON.stringify(navItems));
    
    closeNavModal();
    loadNavigation();
    showToast(isEditing ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح', 'success');
});

function editNavItem(id) {
    openNavModal(id);
}

function deleteNavItem(id) {
    if (confirm('هل أنت متأكد من حذف هذا التبويب؟')) {
        let navItems = JSON.parse(localStorage.getItem('navigation')) || getDefaultNavigation();
        navItems = navItems.filter(item => item.id !== id);
        localStorage.setItem('navigation', JSON.stringify(navItems));
        
        loadNavigation();
        showToast('تم الحذف بنجاح', 'success');
    }
}

// ============ Site Settings ============

function loadSiteSettings() {
    const settings = JSON.parse(localStorage.getItem('siteSettings')) || getDefaultSettings();
    
    document.getElementById('siteTitle').value = settings.title;
    document.getElementById('siteVersion').value = settings.version;
    document.getElementById('siteCopyright').value = settings.copyright;
    document.getElementById('siteDescription').value = settings.description;
    document.getElementById('siteMission').value = settings.mission;
}

function getDefaultSettings() {
    return {
        title: 'Falcon X - Advanced Software Solutions',
        version: 'Version 2.1',
        copyright: '© 2025 Falcon X. All rights reserved.',
        description: 'Advanced Software Solutions for Windows, Android, and FRP',
        mission: 'Falcon X is dedicated to providing high-quality software solutions for Windows and Android platforms.'
    };
}

document.getElementById('siteSettingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const settings = {
        title: document.getElementById('siteTitle').value,
        version: document.getElementById('siteVersion').value,
        copyright: document.getElementById('siteCopyright').value,
        description: document.getElementById('siteDescription').value,
        mission: document.getElementById('siteMission').value
    };
    
    localStorage.setItem('siteSettings', JSON.stringify(settings));
    showToast('تم حفظ الإعدادات بنجاح', 'success');
});

// ============ Colors Management ============

function loadColors() {
    const colors = JSON.parse(localStorage.getItem('siteColors')) || getDefaultColors();
    
    document.getElementById('primaryColor').value = colors.primary;
    document.getElementById('primaryColorHex').value = colors.primary;
    document.getElementById('secondaryColor').value = colors.secondary;
    document.getElementById('secondaryColorHex').value = colors.secondary;
    document.getElementById('accentColor').value = colors.accent;
    document.getElementById('accentColorHex').value = colors.accent;
    document.getElementById('backgroundColor').value = colors.background;
    document.getElementById('backgroundColorHex').value = colors.background;
    
    // Sync color inputs
    syncColorInputs();
}

function getDefaultColors() {
    return {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#f093fb',
        background: '#0a0e27'
    };
}

function syncColorInputs() {
    const colorInputs = [
        { color: 'primaryColor', hex: 'primaryColorHex' },
        { color: 'secondaryColor', hex: 'secondaryColorHex' },
        { color: 'accentColor', hex: 'accentColorHex' },
        { color: 'backgroundColor', hex: 'backgroundColorHex' }
    ];
    
    colorInputs.forEach(({ color, hex }) => {
        document.getElementById(color).addEventListener('input', function() {
            document.getElementById(hex).value = this.value;
        });
        
        document.getElementById(hex).addEventListener('input', function() {
            document.getElementById(color).value = this.value;
        });
    });
}

document.getElementById('colorsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const colors = {
        primary: document.getElementById('primaryColor').value,
        secondary: document.getElementById('secondaryColor').value,
        accent: document.getElementById('accentColor').value,
        background: document.getElementById('backgroundColor').value
    };
    
    localStorage.setItem('siteColors', JSON.stringify(colors));
    showToast('تم حفظ الألوان بنجاح', 'success');
});

function resetColors() {
    if (confirm('هل تريد استعادة الألوان الافتراضية؟')) {
        localStorage.removeItem('siteColors');
        loadColors();
        showToast('تم استعادة الألوان الافتراضية', 'success');
    }
}

// ============ Images Management ============

function previewImage(type, input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const preview = document.getElementById(`${type}Preview`).querySelector('img');
            preview.src = e.target.result;
            
            // Save to localStorage
            const images = JSON.parse(localStorage.getItem('siteImages')) || {};
            images[type] = e.target.result;
            localStorage.setItem('siteImages', JSON.stringify(images));
            
            showToast('تم تحديث الصورة بنجاح', 'success');
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// ============ Import from data.js ============

function reimportFromDataJS() {
    if (confirm('هل تريد إعادة استيراد البيانات من data.js؟ سيتم حذف جميع التعديلات الحالية!')) {
        // Clear in-memory data
        appsData = {
            windows: [],
            android: [],
            'frp-tools': [],
            'frp-apps': []
        };
        
        importFromDataJS();
        
        // Reload current tab
        loadApps(currentAppType);
        updateDashboardStats();
        
        showToast('تم إعادة استيراد البيانات بنجاح', 'success');
    }
}

function importFromDataJS() {
    // Import Windows Software
    if (typeof windowsSoftware !== 'undefined' && appsData.windows.length === 0) {
        appsData.windows = windowsSoftware.map(item => ({
            id: Date.now() + Math.random(),
            name: item.name,
            category: item.category,
            version: item.version,
            size: item.size,
            rating: 4.5,
            downloads: '10K+',
            description: item.description,
            icon: item.icon || 'https://via.placeholder.com/64',
            downloadLink: item.downloadUrl,
            features: []
        }));
    }
    
    // Import Android Apps
    if (typeof androidApps !== 'undefined' && appsData.android.length === 0) {
        appsData.android = androidApps.map(item => ({
            id: Date.now() + Math.random(),
            name: item.name,
            category: item.category,
            version: item.version,
            size: item.size,
            rating: 4.5,
            downloads: '10K+',
            description: item.description,
            icon: item.icon || 'https://via.placeholder.com/64',
            downloadLink: item.downloadUrl,
            features: []
        }));
    }
    
    // Import FRP Tools
    if (typeof frpTools !== 'undefined' && appsData['frp-tools'].length === 0) {
        appsData['frp-tools'] = frpTools.map(item => ({
            id: Date.now() + Math.random(),
            name: item.name,
            category: item.category,
            version: item.version,
            size: item.size,
            rating: 4.5,
            downloads: '5K+',
            description: item.description,
            icon: item.icon || 'https://via.placeholder.com/64',
            downloadLink: item.downloadUrl,
            features: []
        }));
    }
    
    // Import FRP Apps
    if (typeof frpApps !== 'undefined' && appsData['frp-apps'].length === 0) {
        appsData['frp-apps'] = frpApps.map(item => ({
            id: Date.now() + Math.random(),
            name: item.name,
            category: item.category,
            version: item.version,
            size: item.size,
            rating: 4.5,
            downloads: '5K+',
            description: item.description,
            icon: item.icon || 'https://via.placeholder.com/64',
            downloadLink: item.downloadUrl,
            features: []
        }));
    }
}

// ============ Import File Handler ============

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.js')) {
        showToast('الرجاء اختيار ملف .js فقط', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            
            // Execute the file content to get the variables
            const script = document.createElement('script');
            script.textContent = content;
            document.head.appendChild(script);
            
            // Clear existing data
            appsData = {
                windows: [],
                android: [],
                'frp-tools': [],
                'frp-apps': []
            };
            
            // Import the new data
            importFromDataJS();
            
            // Remove the temporary script
            document.head.removeChild(script);
            
            // Reload displays
            loadApps(currentAppType);
            updateDashboardStats();
            
            showToast('تم استيراد البيانات بنجاح من الملف!', 'success');
            
            // Reset file input
            event.target.value = '';
        } catch (error) {
            console.error('Import error:', error);
            showToast('خطأ في استيراد الملف. تأكد من صحة التنسيق', 'error');
        }
    };
    
    reader.onerror = function() {
        showToast('خطأ في قراءة الملف', 'error');
    };
    
    reader.readAsText(file);
}

// ============ Export to data.js Format ============

function exportToDataJS() {
    const windows = appsData.windows || [];
    const android = appsData.android || [];
    const frpToolsData = appsData['frp-tools'] || [];
    const frpAppsData = appsData['frp-apps'] || [];
    
    let output = '// ===== Windows Software Data =====\nconst windowsSoftware = [\n';
    windows.forEach((item, index) => {
        output += `    {\n`;
        output += `        id: 'win-${index + 1}',\n`;
        output += `        name: '${item.name}',\n`;
        output += `        version: '${item.version}',\n`;
        output += `        category: '${item.category}',\n`;
        output += `        icon: '${item.icon}',\n`;
        output += `        description: '${item.description}',\n`;
        output += `        size: '${item.size}',\n`;
        output += `        downloadUrl: '${item.downloadLink}'\n`;
        output += `    }${index < windows.length - 1 ? ',' : ''}\n`;
    });
    output += '];\n\n';
    
    output += '// ===== Android Applications Data =====\nconst androidApps = [\n';
    android.forEach((item, index) => {
        output += `    {\n`;
        output += `        id: 'and-${index + 1}',\n`;
        output += `        name: '${item.name}',\n`;
        output += `        version: '${item.version}',\n`;
        output += `        category: '${item.category}',\n`;
        output += `        icon: '${item.icon}',\n`;
        output += `        description: '${item.description}',\n`;
        output += `        size: '${item.size}',\n`;
        output += `        downloadUrl: '${item.downloadLink}'\n`;
        output += `    }${index < android.length - 1 ? ',' : ''}\n`;
    });
    output += '];\n\n';
    
    output += '// ===== FRP Tools Data =====\nconst frpTools = [\n';
    frpToolsData.forEach((item, index) => {
        output += `    {\n`;
        output += `        id: 'frp-${index + 1}',\n`;
        output += `        name: '${item.name}',\n`;
        output += `        version: '${item.version}',\n`;
        output += `        category: '${item.category}',\n`;
        output += `        icon: '${item.icon}',\n`;
        output += `        description: '${item.description}',\n`;
        output += `        size: '${item.size}',\n`;
        output += `        downloadUrl: '${item.downloadLink}'\n`;
        output += `    }${index < frpToolsData.length - 1 ? ',' : ''}\n`;
    });
    output += '];\n\n';
    
    output += '// ===== FRP Applications Data =====\nconst frpApps = [\n';
    frpAppsData.forEach((item, index) => {
        output += `    {\n`;
        output += `        id: 'frpapp-${index + 1}',\n`;
        output += `        name: '${item.name}',\n`;
        output += `        version: '${item.version}',\n`;
        output += `        category: '${item.category}',\n`;
        output += `        icon: '${item.icon}',\n`;
        output += `        description: '${item.description}',\n`;
        output += `        size: '${item.size}',\n`;
        output += `        downloadUrl: '${item.downloadLink}'\n`;
        output += `    }${index < frpAppsData.length - 1 ? ',' : ''}\n`;
    });
    output += '];';
    
    // Download as file
    const blob = new Blob([output], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('تم تصدير البيانات إلى ملف data.js', 'success');
}

// ============ Dashboard Stats ============

function updateDashboardStats() {
    const windowsApps = appsData.windows || [];
    const androidApps = appsData.android || [];
    const frpTools = appsData['frp-tools'] || [];
    const frpApps = appsData['frp-apps'] || [];
    
    document.getElementById('windowsCount').textContent = windowsApps.length;
    document.getElementById('androidCount').textContent = androidApps.length;
    document.getElementById('frpToolsCount').textContent = frpTools.length;
    document.getElementById('frpAppsCount').textContent = frpApps.length;
}

// ============ Initialize ============

window.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    // Import data from data.js on first load
    importFromDataJS();
    
    // Load GitHub settings
    loadGitHubSettings();
    
    loadApps('windows');
    loadNavigation();
    loadSiteSettings();
    loadColors();
    updateDashboardStats();
    
    // Close modals on outside click
    window.onclick = function(event) {
        const appModal = document.getElementById('appModal');
        const navModal = document.getElementById('navModal');
        
        if (event.target === appModal) {
            closeAppModal();
        }
        if (event.target === navModal) {
            closeNavModal();
        }
    };
});
