// Check authentication
function checkAuth() {
    const session = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession');
    
    if (!session) {
        window.location.href = 'admin-login.html';
        return false;
    }
    
    const sessionData = JSON.parse(session);
    // Use username from session, or fallback to repo owner, or default to 'Admin'
    const username = sessionData.username || (sessionData.repo && sessionData.repo.owner) || 'Admin';
    document.getElementById('adminUsername').textContent = username;
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

// Clear cache and reload
async function clearCacheAndReload() {
    if (!confirm('سيتم مسح ذاكرة التخزين وجلب أحدث البيانات من GitHub. هل تريد المتابعة؟')) {
        return;
    }

    const toastId = 'refresh-toast';
    const toastMessage = document.createElement('div');
    toastMessage.id = toastId;
    toastMessage.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> جاري تحديث البيانات من GitHub...';
    showToast(toastMessage, 'info', 0);

    try {
        // Clear relevant caches
        localStorage.removeItem('navigation');
        localStorage.removeItem('falcon-x-software-data');
        
        // Check if GitHub is configured
        if (typeof githubAPI !== 'undefined' && githubAPI.isConfigured()) {
            console.log('🔄 جاري جلب أحدث البيانات من GitHub...');
            
            // Fetch data from GitHub
            const data = await githubAPI.loadDataFromGitHub();
            
            if (data) {
                // Save to localStorage for main.js to use
                localStorage.setItem('falcon-x-software-data', JSON.stringify(data));
                showToast('✅ تم تحديث البيانات بنجاح من GitHub', 'success');
            } else {
                showToast('⚠️ فشل جلب البيانات من GitHub، سيتم استخدام البيانات المحلية', 'warning');
            }
        } else {
            showToast('ℹ️ لم يتم إعداد GitHub، سيتم استخدام البيانات المحلية', 'info');
        }
    } catch (error) {
        console.error('❌ خطأ أثناء تحديث البيانات:', error);
        showToast('❌ حدث خطأ أثناء تحديث البيانات', 'error');
    } finally {
        // Remove the loading toast
        const toast = document.getElementById(toastId);
        if (toast) toast.remove();
        
        // Reload the page to apply changes
        window.location.reload(true);
    }
}

// ============ GitHub Integration ============

function testGitHubConnection() {
    const statusDiv = document.getElementById('githubStatus');
    const token = document.getElementById('githubToken').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    const branch = document.getElementById('githubBranch').value.trim() || 'main';
    
    // Validate inputs first
    if (!token) {
        statusDiv.style.display = 'block';
        statusDiv.style.background = '#ef4444';
        statusDiv.innerHTML = '<i class="fas fa-times-circle"></i> الرجاء إدخال Token أولاً';
        showToast('الرجاء إدخال Token', 'error');
        return;
    }
    
    if (!repo || !repo.includes('/')) {
        statusDiv.style.display = 'block';
        statusDiv.style.background = '#ef4444';
        statusDiv.innerHTML = '<i class="fas fa-times-circle"></i> الرجاء اختيار Repository من القائمة';
        showToast('الرجاء اختيار Repository', 'error');
        return;
    }
    
    statusDiv.style.display = 'block';
    statusDiv.style.background = '#1e2746';
    statusDiv.style.color = '#fff';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاتصال بـ GitHub...';
    
    // Temporarily update config for testing
    const originalConfig = { ...githubAPI.config };
    githubAPI.config = { token, repo, branch };
    
    githubAPI.testConnection().then(result => {
        if (result.success) {
            statusDiv.style.background = '#10b981';
            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> الاتصال ناجح! Repository: ' + repo;
            showToast('تم الاتصال بنجاح مع GitHub', 'success');
        } else {
            statusDiv.style.background = '#ef4444';
            statusDiv.innerHTML = '<i class="fas fa-times-circle"></i> ' + result.message;
            showToast('فشل الاتصال: ' + result.message, 'error');
        }
        // Restore original config (user needs to save settings to persist)
        githubAPI.config = originalConfig;
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
    const windowsGames = getAllApps('windows-games');
    const androidApps = getAllApps('android');
    const androidGames = getAllApps('android-games');
    const frpTools = getAllApps('frp-tools');
    const frpApps = getAllApps('frp-apps');
    
    // Get settings from localStorage
    const siteSettings = JSON.parse(localStorage.getItem('siteSettings')) || getDefaultSettings();
    const colors = JSON.parse(localStorage.getItem('siteColors')) || getDefaultColors();
    const navigation = JSON.parse(localStorage.getItem('navigation')) || getDefaultNavigation();
    const images = JSON.parse(localStorage.getItem('siteImages')) || {};
    
    // Save both data.js and settings.json
    Promise.all([
        githubAPI.saveAllDataToGitHub(windowsApps, windowsGames, androidApps, androidGames, frpTools, frpApps),
        githubAPI.saveSettingsToGitHub(siteSettings, colors, navigation, images)
    ])
        .then(() => {
            statusDiv.style.background = '#10b981';
            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> ✓ تم حفظ جميع البيانات والإعدادات على GitHub بنجاح!';
            showToast('✓ تم مزامنة جميع البيانات والإعدادات مع GitHub بنجاح!', 'success');
            updateSyncStatus('ready', 'محفوظ ومزامن بنجاح ✓');
        })
        .catch(error => {
            statusDiv.style.background = '#ef4444';
            statusDiv.innerHTML = '<i class="fas fa-times-circle"></i> خطأ: ' + error.message;
            showToast('فشل الحفظ على GitHub', 'error');
        });
}

// Manual save to GitHub - called from header button
function manualSaveToGitHub() {
    if (!githubAPI.isConfigured()) {
        if (confirm('لم يتم إعداد GitHub بعد. هل تريد الذهاب إلى صفحة الإعدادات؟')) {
            showSection('github-settings');
        }
        return;
    }
    
    if (confirm('هل تريد حفظ جميع التغييرات على GitHub الآن؟')) {
        updateSyncStatus('saving', 'جاري الحفظ على GitHub...');
        
        const windowsApps = getAllApps('windows');
        const windowsGames = getAllApps('windows-games');
        const androidApps = getAllApps('android');
        const androidGames = getAllApps('android-games');
        const frpTools = getAllApps('frp-tools');
        const frpApps = getAllApps('frp-apps');
        
        // Get settings from localStorage
        const siteSettings = JSON.parse(localStorage.getItem('siteSettings')) || getDefaultSettings();
        const colors = JSON.parse(localStorage.getItem('siteColors')) || getDefaultColors();
        const navigation = JSON.parse(localStorage.getItem('navigation')) || getDefaultNavigation();
        const images = JSON.parse(localStorage.getItem('siteImages')) || {};
        
        // Save both data.js and settings.json
        Promise.all([
            githubAPI.saveAllDataToGitHub(windowsApps, windowsGames, androidApps, androidGames, frpTools, frpApps),
            githubAPI.saveSettingsToGitHub(siteSettings, colors, navigation, images)
        ])
            .then(() => {
                updateSyncStatus('ready', 'محفوظ ومزامن بنجاح ✓');
                showToast('✓ تم مزامنة جميع التغييرات والإعدادات مع GitHub بنجاح!', 'success');
            })
            .catch(error => {
                updateSyncStatus('modified', 'فشل الحفظ');
                showToast('خطأ: ' + error.message, 'error');
            });
    }
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
            option.value = repo.name; // repo.name already contains owner/repo format
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

// Save GitHub settings - will be initialized in DOMContentLoaded
function initGitHubSettingsForm() {
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
}

// ============ Apps Management ============

const CATEGORIES = {
    windows: ['Anti Virus', 'Convert', 'Designe', 'Desktop', 'Driver', 'Browser', 'Download App', 'Wifi', 'Multiplayer', 'Utilities', 'Programming', 'VPN'],
    'windows-games': ['Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Sports', 'Racing', 'Puzzle', 'Horror'],
    android: ['Anti Virus', 'Convert', 'Designe', 'Desktop', 'Driver', 'Browser', 'Download App', 'Wifi', 'Multiplayer', 'Utilities', 'Programming', 'VPN'],
    'android-games': ['Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Sports', 'Racing', 'Puzzle', 'Casual'],
    'frp-tools': ['Samsung', 'Xiaomi', 'Huawei', 'Oppo', 'Realme', 'Moto', 'Universal', 'iPhone'],
    'frp-apps': ['Samsung', 'Xiaomi', 'Huawei', 'Oppo', 'Realme', 'Moto', 'Universal']
};

// In-memory storage for apps
let appsData = {
    windows: [],
    'windows-games': [],
    android: [],
    'android-games': [],
    'frp-tools': [],
    'frp-apps': []
};

let currentAppType = 'windows';
let editingAppId = null;

// ============ localStorage Sync Functions ============

// Update sync status indicator
function updateSyncStatus(status, message) {
    const syncStatus = document.getElementById('syncStatus');
    if (!syncStatus) return;
    
    const icon = syncStatus.querySelector('i');
    const text = syncStatus.querySelector('span');
    
    if (status === 'saving') {
        icon.className = 'fas fa-sync fa-spin';
        icon.style.color = '#3b82f6';
        text.textContent = message || 'جاري الحفظ...';
        syncStatus.style.background = '#1e3a8a';
    } else if (status === 'saved') {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#10b981';
        text.textContent = message || 'تم الحفظ محلياً';
        syncStatus.style.background = '#1e2746';
        // تلقائياً عرض "تغييرات غير محفوظة" بعد الحفظ المحلي
        setTimeout(() => updateSyncStatus('modified'), 500);
    } else if (status === 'modified') {
        icon.className = 'fas fa-exclamation-circle';
        icon.style.color = '#f59e0b';
        text.textContent = message || 'تغييرات غير محفوظة على GitHub';
        syncStatus.style.background = '#78350f';
    } else if (status === 'error') {
        icon.className = 'fas fa-times-circle';
        icon.style.color = '#ef4444';
        text.textContent = message || 'خطأ في الحفظ';
        syncStatus.style.background = '#7f1d1d';
    } else if (status === 'ready') {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#10b981';
        text.textContent = message || 'محفوظ ومزامن بنجاح ✓';
        syncStatus.style.background = '#065f46';
    }
}

// Save all data to localStorage
function saveToLocalStorage() {
    try {
        updateSyncStatus('saving');
        
        // حفظ البيانات في localStorage
        localStorage.setItem('falcon-x-windows-apps', JSON.stringify(appsData.windows));
        localStorage.setItem('falcon-x-windows-games', JSON.stringify(appsData['windows-games']));
        localStorage.setItem('falcon-x-android-apps', JSON.stringify(appsData.android));
        localStorage.setItem('falcon-x-android-games', JSON.stringify(appsData['android-games']));
        localStorage.setItem('falcon-x-frp-tools', JSON.stringify(appsData['frp-tools']));
        localStorage.setItem('falcon-x-frp-apps', JSON.stringify(appsData['frp-apps']));
        
        // Set a timestamp to track last update
        localStorage.setItem('falcon-x-last-update', Date.now().toString());
        
        console.log('✅ Data saved to localStorage successfully');
        
        // عرض حالة الحفظ المحلي بنجاح ثم التحول لحالة التغييرات غير المحفوظة على GitHub
        updateSyncStatus('saved');
        return true;
    } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
        updateSyncStatus('error', 'فشل الحفظ المحلي');
        showToast('خطأ في الحفظ المحلي', 'error');
        return false;
    }
}

// Load data from localStorage
function loadFromLocalStorage() {
    try {
        const windows = localStorage.getItem('falcon-x-windows-apps');
        const windowsGames = localStorage.getItem('falcon-x-windows-games');
        const android = localStorage.getItem('falcon-x-android-apps');
        const androidGames = localStorage.getItem('falcon-x-android-games');
        const frpTools = localStorage.getItem('falcon-x-frp-tools');
        const frpApps = localStorage.getItem('falcon-x-frp-apps');
        
        // Load data as-is without modifying lastUpdated
        if (windows) appsData.windows = JSON.parse(windows);
        if (windowsGames) appsData['windows-games'] = JSON.parse(windowsGames);
        if (android) appsData.android = JSON.parse(android);
        if (androidGames) appsData['android-games'] = JSON.parse(androidGames);
        if (frpTools) appsData['frp-tools'] = JSON.parse(frpTools);
        if (frpApps) appsData['frp-apps'] = JSON.parse(frpApps);
        
        console.log('✅ Data loaded from localStorage');
        return true;
    } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        return false;
    }
}

// Get all apps of a type
function getAllApps(type) {
    return appsData[type] || [];
}

// Switch tabs
function switchTab(type) {
    currentAppType = type;
    
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach((btn, index) => {
        btn.classList.remove('active');
        // Check button text to match type
        const typeIndex = ['windows', 'windows-games', 'android', 'android-games', 'frp-tools', 'frp-apps'];
        if (typeIndex[index] === type) {
            btn.classList.add('active');
        }
    });
    
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
    
    console.log(`📖 Loading apps for ${type}:`, apps.length, 'items');
    
    if (apps.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>لا توجد عناصر بعد</p></div>';
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>';
    // Add extra column for FRP Apps link type
    if (type === 'frp-apps') {
        html += '<th>الاسم</th><th>نوع الرابط</th><th>الفئة</th><th>الإصدار</th><th>الحجم</th><th>الحالة</th><th>آخر تحديث</th><th>الإجراءات</th>';
    } else {
        html += '<th>الاسم</th><th>الفئة</th><th>الإصدار</th><th>الحجم</th><th>الحالة</th><th>آخر تحديث</th><th>الإجراءات</th>';
    }
    html += '</tr></thead><tbody>';
    
    apps.forEach(app => {
        const modifiedBadge = app.isModified ? '<span class="badge" style="background: #f59e0b;">معدل</span>' : '<span class="badge" style="background: #10b981;">غير معدل</span>';
        
        // Link type badge for FRP Apps
        const linkTypeBadge = type === 'frp-apps' && app.linkType 
            ? (app.linkType === 'direct' 
                ? '<span class="badge" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white;">مباشر</span>' 
                : '<span class="badge" style="background: linear-gradient(135deg, #f59e0b, #ea580c); color: white;">تحميل</span>')
            : '<span class="badge" style="background: #6b7280;">غير محدد</span>';
        
        // Format last updated date professionally
        let lastUpdatedText = '<span style="color: #6b7280;">غير محدد</span>';
        if (app.lastUpdated) {
            const date = new Date(app.lastUpdated);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            
            // Format date: dd/mm/yyyy HH:MM
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
            
            // Create tooltip with relative time
            let relativeTime = '';
            if (diffDays > 0) {
                relativeTime = `قبل ${diffDays} يوم`;
            } else if (diffHours > 0) {
                relativeTime = `قبل ${diffHours} ساعة`;
            } else if (diffMinutes > 5) {
                relativeTime = `قبل ${diffMinutes} دقيقة`;
            } else {
                relativeTime = 'الآن';
            }
            
            // Color based on recency
            let color = '#10b981'; // green for recent
            if (diffDays > 30) {
                color = '#ef4444'; // red for old
            } else if (diffDays > 7) {
                color = '#f59e0b'; // orange for medium
            }
            
            lastUpdatedText = `<span style="color: ${color};" title="${relativeTime}">${formattedDate}</span>`;
        }
        
        // Build table row with conditional link type column
        if (type === 'frp-apps') {
            html += `<tr>
                <td><strong>${app.name}</strong></td>
                <td>${linkTypeBadge}</td>
                <td><span class="badge">${app.category}</span></td>
                <td>${app.version}</td>
                <td>${app.size}</td>
                <td>${modifiedBadge}</td>
                <td style="font-size: 0.8rem; white-space: nowrap;"><i class="fas fa-clock" style="margin-left: 0.3rem; color: #6b7280;"></i>${lastUpdatedText}</td>
                <td class="actions">
                    <button class="btn-icon btn-edit" onclick="editApp('${type}', ${app.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteApp('${type}', ${app.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        } else {
            html += `<tr>
                <td><strong>${app.name}</strong></td>
                <td><span class="badge">${app.category}</span></td>
                <td>${app.version}</td>
                <td>${app.size}</td>
                <td>${modifiedBadge}</td>
                <td style="font-size: 0.8rem; white-space: nowrap;"><i class="fas fa-clock" style="margin-left: 0.3rem; color: #6b7280;"></i>${lastUpdatedText}</td>
                <td class="actions">
                    <button class="btn-icon btn-edit" onclick="editApp('${type}', ${app.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteApp('${type}', ${app.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }
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
        'windows-games': 'لعبة Windows',
        android: 'تطبيق Android',
        'android-games': 'لعبة Android',
        'frp-tools': 'أداة FRP',
        'frp-apps': 'تطبيق FRP'
    };
    
    document.getElementById('modalTitle').textContent = appId 
        ? `تعديل ${titles[type]}` 
        : `إضافة ${titles[type]} جديد`;
    
    // Hide/Show fields based on type
    const isFrpApps = type === 'frp-apps';
    const isWindows = type === 'windows';
    
    // Show/Hide link type selector for FRP Apps only
    const linkTypeGroup = document.getElementById('appLinkTypeGroup');
    if (linkTypeGroup) {
        linkTypeGroup.style.display = isFrpApps ? 'block' : 'none';
    }
    
    // System requirements now available for all types (no restriction)
    
    // Hide unnecessary fields for FRP Apps
    const fieldsToHide = [
        'appFullDescription',
        'appScreenshots', 'appFeatures'
    ];
    
    fieldsToHide.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const inputGroup = field ? field.closest('.input-group') : null;
        
        if (inputGroup) {
            inputGroup.style.display = isFrpApps ? 'none' : 'block';
        }
    });
    
    // Hide entire Media tab for FRP Apps
    const mediaTabBtn = document.querySelector('[data-tab="media"]');
    if (mediaTabBtn) {
        mediaTabBtn.style.display = isFrpApps ? 'none' : 'flex';
    }
    
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
            document.getElementById('appDescription').value = app.description;
            document.getElementById('appFullDescription').value = app.fullDescription || '';
            document.getElementById('appIcon').value = app.icon || '';
            // Swap the values: downloadLink in DB is now Original, originalDownloadLink is Modified
            document.getElementById('appDownloadLink').value = app.originalDownloadLink || ''; // Original
            document.getElementById('appOriginalDownloadLink').value = app.downloadLink || ''; // Modified
            document.getElementById('appModified').value = app.isModified ? 'true' : 'false';
            
            // Load additional download links (swapped)
            if (document.getElementById('appDownloadLink2')) {
                document.getElementById('appDownloadLink2').value = app.downloadLink3 || ''; // Original 2
            }
            if (document.getElementById('appDownloadLink3')) {
                document.getElementById('appDownloadLink3').value = app.downloadLink2 || ''; // Modified 2
            }
            
            // Load tutorial link
            if (document.getElementById('appTutorialLink')) {
                document.getElementById('appTutorialLink').value = app.tutorialLink || '';
            }
            
            // Load password
            if (document.getElementById('appPassword')) {
                document.getElementById('appPassword').value = app.password || '';
            }
            
            // Load system requirements (Windows only)
            if (document.getElementById('appSystemRequirements')) {
                document.getElementById('appSystemRequirements').value = app.systemRequirements || '';
            }
            
            // Load link type for FRP Apps
            if (type === 'frp-apps' && app.linkType) {
                document.getElementById('appLinkType').value = app.linkType;
                toggleFrpAppFields(); // Apply the field visibility
            }
            
            // Load screenshots (array to newline-separated text)
            if (app.screenshots && Array.isArray(app.screenshots)) {
                document.getElementById('appScreenshots').value = app.screenshots.join('\n');
            } else {
                document.getElementById('appScreenshots').value = '';
            }
            
            // Load features (array to newline-separated text)
            if (app.features && Array.isArray(app.features)) {
                document.getElementById('appFeatures').value = app.features.join('\n');
            } else {
                document.getElementById('appFeatures').value = '';
            }
        }
    } else {
        form.reset();
        document.getElementById('appId').value = '';
        document.getElementById('appType').value = type;
        
        // Set default values for FRP Apps
        if (isFrpApps) {
            document.getElementById('appVersion').value = '1.0';
            document.getElementById('appSize').value = '5 MB';
            document.getElementById('appModified').value = 'false';
            document.getElementById('appOriginalDownloadLink').value = '';
            document.getElementById('appScreenshots').value = '';
            document.getElementById('appFeatures').value = '';
            document.getElementById('appFullDescription').value = '';
            document.getElementById('appLinkType').value = 'download'; // Default to download
            toggleFrpAppFields(); // Apply default field visibility
        } else {
            document.getElementById('appModified').value = 'false';
            document.getElementById('appOriginalDownloadLink').value = '';
            document.getElementById('appScreenshots').value = '';
            document.getElementById('appFeatures').value = '';
        }
    }
    
    modal.style.display = 'flex';
}

// Toggle FRP App fields based on link type
function toggleFrpAppFields() {
    const linkType = document.getElementById('appLinkType').value;
    const versionField = document.getElementById('appVersion');
    const sizeField = document.getElementById('appSize');
    
    // Find the parent input-group elements
    const versionGroup = versionField ? versionField.closest('.input-group') : null;
    const sizeGroup = sizeField ? sizeField.closest('.input-group') : null;
    
    if (linkType === 'direct') {
        // Hide version and size for direct links
        if (versionGroup) versionGroup.style.display = 'none';
        if (sizeGroup) sizeGroup.style.display = 'none';
    } else {
        // Show version and size for download links
        if (versionGroup) versionGroup.style.display = 'block';
        if (sizeGroup) sizeGroup.style.display = 'block';
    }
}

// Close app modal
function closeAppModal() {
    document.getElementById('appModal').style.display = 'none';
    const form = document.getElementById('appForm');
    form.reset();
    // Clear hidden fields explicitly
    document.getElementById('appId').value = '';
    document.getElementById('appType').value = '';
    editingAppId = null;
    
    // Reset to first tab
    const firstTabBtn = document.querySelector('.form-tab-btn[data-tab="basic-info"]');
    const firstPane = document.querySelector('.form-tab-pane[data-pane="basic-info"]');
    
    document.querySelectorAll('.form-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-tab-pane').forEach(pane => pane.classList.remove('active'));
    
    if (firstTabBtn) firstTabBtn.classList.add('active');
    if (firstPane) firstPane.classList.add('active');
}

// Initialize Form Tabs
function initFormTabs() {
    const tabButtons = document.querySelectorAll('.form-tab-btn');
    const tabPanes = document.querySelectorAll('.form-tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding pane
            const targetPane = document.querySelector(`[data-pane="${targetTab}"]`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

// Save app - will be initialized in DOMContentLoaded
let appFormHandler = null; // Store the handler to prevent duplicates

function initAppForm() {
    const form = document.getElementById('appForm');
    
    // Remove previous event listener if exists
    if (appFormHandler) {
        form.removeEventListener('submit', appFormHandler);
    }
    
    // Define the handler
    appFormHandler = function(e) {
        e.preventDefault();
        
        const type = document.getElementById('appType').value;
        const appId = document.getElementById('appId').value;
        const isEditing = appId !== '' && appId !== '0';
        
        // Get the modified status from the form
        const modifiedValue = document.getElementById('appModified').value;
        
        // Process screenshots (convert newline-separated text to array)
        const screenshotsText = document.getElementById('appScreenshots').value.trim();
        const screenshots = screenshotsText ? screenshotsText.split('\n').map(s => s.trim()).filter(s => s) : [];
        
        // Process features (convert newline-separated text to array)
        const featuresText = document.getElementById('appFeatures').value.trim();
        const features = featuresText ? featuresText.split('\n').map(f => f.trim()).filter(f => f) : [];
        
        // Get link type for FRP Apps
        const linkTypeElement = document.getElementById('appLinkType');
        const linkType = linkTypeElement && type === 'frp-apps' ? linkTypeElement.value : '';
        
        // Get additional fields
        const downloadLink2El = document.getElementById('appDownloadLink2');
        const downloadLink3El = document.getElementById('appDownloadLink3');
        const tutorialLinkEl = document.getElementById('appTutorialLink');
        const passwordEl = document.getElementById('appPassword');
        const systemReqEl = document.getElementById('appSystemRequirements');
        
        // Always update lastUpdated timestamp when saving (adding or editing)
        const currentTimestamp = new Date().toISOString();
        
        // Swap the values when saving:
        // Form field "appDownloadLink" (Original) -> save to "originalDownloadLink"
        // Form field "appOriginalDownloadLink" (Modified) -> save to "downloadLink"
        const appData = {
            id: isEditing ? parseInt(appId) : Date.now(),
            name: document.getElementById('appName').value || 'Untitled',
            category: document.getElementById('appCategory').value || 'general',
            version: document.getElementById('appVersion').value || '1.0',
            size: document.getElementById('appSize').value || 'N/A',
            description: document.getElementById('appDescription').value || 'No description provided',
            fullDescription: document.getElementById('appFullDescription').value.trim() || '',
            icon: document.getElementById('appIcon').value || 'fas fa-cube',
            downloadLink: document.getElementById('appOriginalDownloadLink').value.trim() || '#', // Modified version
            originalDownloadLink: document.getElementById('appDownloadLink').value.trim() || '', // Original version
            isModified: modifiedValue === 'true',
            screenshots: screenshots,
            features: features,
            linkType: linkType, // Add link type for FRP Apps
            lastUpdated: currentTimestamp, // Always update to current time
            // New fields - also swap these
            downloadLink2: downloadLink3El ? downloadLink3El.value.trim() : '', // Modified 2
            downloadLink3: downloadLink2El ? downloadLink2El.value.trim() : '', // Original 2
            tutorialLink: tutorialLinkEl ? tutorialLinkEl.value.trim() : '',
            password: passwordEl ? passwordEl.value.trim() : '',
            systemRequirements: systemReqEl ? systemReqEl.value.trim() : ''
        };
        
        // Get a fresh copy of apps array
        let apps = [...(appsData[type] || [])];
        
        if (isEditing) {
            const index = apps.findIndex(a => a.id === parseInt(appId));
            if (index !== -1) {
                console.log(`🔄 Updating app at index ${index}:`, appData.name);
                apps[index] = appData;
            } else {
                console.warn('⚠️ App not found for editing, adding as new:', appId);
                apps.push(appData);
            }
        } else {
            console.log(`➕ Adding new app:`, appData.name);
            apps.push(appData);
        }
        
        // Update the data
        appsData[type] = apps;
        
        console.log(`📊 Total ${type} apps:`, apps.length);
        
        // Save to localStorage immediately
        saveToLocalStorage();
        
        closeAppModal();
        loadApps(type);
        updateDashboardStats();
        showToast(isEditing ? '✓ تم التحديث بنجاح! اضغط زر "حفظ" لمزامنة التغييرات مع GitHub' : '✓ تمت الإضافة بنجاح! اضغط زر "حفظ" لمزامنة التغييرات مع GitHub', 'success');
    };
    
    // Add the event listener
    form.addEventListener('submit', appFormHandler);
}

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
        
        // Save to localStorage immediately
        saveToLocalStorage();
        
        loadApps(type);
        updateDashboardStats();
        showToast('✓ تم الحذف بنجاح! اضغط زر "حفظ" لمزامنة التغييرات مع GitHub', 'success');
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
        html += '<th>الاسم</th><th>الفئة</th><th>الإصدار</th><th>الحجم</th><th>الحالة</th><th>الإجراءات</th>';
        html += '</tr></thead><tbody>';
        
        filtered.forEach(app => {
            const modifiedBadge = app.isModified ? '<span class="badge" style="background: #f59e0b;">معدل</span>' : '<span class="badge" style="background: #10b981;">غير معدل</span>';
            html += `<tr>
                <td><strong>${app.name}</strong></td>
                <td><span class="badge">${app.category}</span></td>
                <td>${app.version}</td>
                <td>${app.size}</td>
                <td>${modifiedBadge}</td>
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

// Load navigation from GitHub settings.json
async function loadNavigationFromGitHub() {
    try {
        const settings = await githubAPI.getSettingsFromGitHub();
        
        if (settings && settings.navigation && Array.isArray(settings.navigation)) {
            localStorage.setItem('navigation', JSON.stringify(settings.navigation));
            console.log('✅ Navigation loaded from GitHub:', settings.navigation.length, 'items');
            return true;
        }
        
        console.log('ℹ️ No navigation found in settings.json');
        return false;
    } catch (error) {
        console.log('ℹ️ Could not load navigation from GitHub:', error.message);
        return false;
    }
}

async function loadNavigation() {
    // Clear cache and load from GitHub first
    localStorage.removeItem('navigation');
    await loadNavigationFromGitHub();
    
    const navItems = JSON.parse(localStorage.getItem('navigation')) || getDefaultNavigation();
    const container = document.getElementById('navigation-list');
    
    if (navItems.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>لا توجد تبويبات بعد</p></div>';
        return;
    }
    
    let html = `
        <div class="nav-table-container" style="background: var(--bg-secondary); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color);">
            <table class="nav-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: rgba(102, 126, 234, 0.1); border-bottom: 2px solid var(--border-color);">
                        <th style="padding: 15px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary); width: 80px;">الترتيب</th>
                        <th style="padding: 15px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary); width: 60px;">الأيقونة</th>
                        <th style="padding: 15px; text-align: right; font-size: 13px; font-weight: 600; color: var(--text-secondary);">العنوان</th>
                        <th style="padding: 15px; text-align: right; font-size: 13px; font-weight: 600; color: var(--text-secondary);">الرابط</th>
                        <th style="padding: 15px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary); width: 100px;">الحالة</th>
                        <th style="padding: 15px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-secondary); width: 220px;">الإجراءات</th>
                    </tr>
                </thead>
                <tbody id="sortable-navigation">
    `;
    
    navItems.sort((a, b) => a.order - b.order).forEach((item, index) => {
        const statusBadge = item.active 
            ? '<span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 12px; font-size: 11px; font-weight: 600;"><i class="fas fa-check-circle" style="font-size: 10px;"></i>مفعل</span>'
            : '<span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; background: linear-gradient(135deg, #6b7280, #4b5563); color: white; border-radius: 12px; font-size: 11px; font-weight: 600;"><i class="fas fa-times-circle" style="font-size: 10px;"></i>معطل</span>';
        
        const isFirst = index === 0;
        const isLast = index === navItems.length - 1;
        
        html += `
            <tr class="nav-row ${item.active ? '' : 'inactive'}" 
                data-id="${item.id}" 
                style="border-bottom: 1px solid var(--border-color); transition: all 0.2s ease;">
                <td style="padding: 12px 15px; text-align: center;">
                    <div style="display: inline-flex; gap: 4px; align-items: center;">
                        <button onclick="moveNavItem(${item.id}, 'up')" ${isFirst ? 'disabled' : ''} style="background: ${isFirst ? '#4b5563' : 'var(--info-color)'}; color: white; border: none; padding: 6px 8px; border-radius: 6px; cursor: ${isFirst ? 'not-allowed' : 'pointer'}; transition: all 0.2s; font-size: 12px;" title="صعود">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; border-radius: 8px; font-size: 13px; font-weight: 600; padding: 0 8px;">${item.order}</span>
                        <button onclick="moveNavItem(${item.id}, 'down')" ${isLast ? 'disabled' : ''} style="background: ${isLast ? '#4b5563' : 'var(--info-color)'}; color: white; border: none; padding: 6px 8px; border-radius: 6px; cursor: ${isLast ? 'not-allowed' : 'pointer'}; transition: all 0.2s; font-size: 12px;" title="نزول">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                    </div>
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <div style="width: 38px; height: 38px; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; color: white;">
                        <i class="${item.icon}"></i>
                    </div>
                </td>
                <td style="padding: 12px 15px;">
                    <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${item.title}</span>
                </td>
                <td style="padding: 12px 15px;">
                    <code style="font-size: 12px; color: var(--text-muted); background: rgba(102, 126, 234, 0.1); padding: 4px 8px; border-radius: 6px;">${item.link}</code>
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    ${statusBadge}
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <div style="display: inline-flex; gap: 6px;">
                        <button class="btn-icon" onclick="toggleNavItem(${item.id})" title="${item.active ? 'تعطيل' : 'تفعيل'}" style="background: ${item.active ? '#f59e0b' : '#10b981'}; color: white; border: none; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 13px;">
                            <i class="fas fa-${item.active ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button class="btn-icon btn-edit" onclick="editNavItem(${item.id})" title="تعديل" style="background: var(--info-color); color: white; border: none; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 13px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteNavItem(${item.id})" title="حذف" style="background: var(--danger-color); color: white; border: none; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 13px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <style>
            .nav-row:hover {
                background: rgba(102, 126, 234, 0.05) !important;
            }
            .nav-row.inactive {
                opacity: 0.6;
            }
            .nav-row:active,
            .nav-row.dragging {
                opacity: 0.5;
            }
            .btn-icon:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
        </style>
    `;
    container.innerHTML = html;
}

// Move navigation item up or down
function moveNavItem(id, direction) {
    let navItems = JSON.parse(localStorage.getItem('navigation')) || getDefaultNavigation();
    
    // Sort by order first
    navItems.sort((a, b) => a.order - b.order);
    
    // Find current index
    const currentIndex = navItems.findIndex(item => item.id === id);
    
    if (currentIndex === -1) return;
    
    // Calculate new index
    let newIndex;
    if (direction === 'up') {
        if (currentIndex === 0) return; // Already at top
        newIndex = currentIndex - 1;
    } else {
        if (currentIndex === navItems.length - 1) return; // Already at bottom
        newIndex = currentIndex + 1;
    }
    
    // Swap items
    const temp = navItems[currentIndex];
    navItems[currentIndex] = navItems[newIndex];
    navItems[newIndex] = temp;
    
    // Update order numbers
    navItems.forEach((item, index) => {
        item.order = index + 1;
    });
    
    // Save and reload
    localStorage.setItem('navigation', JSON.stringify(navItems));
    updateSyncStatus('modified', 'تغييرات غير محفوظة');
    loadNavigation();
    showToast('تم تغيير الترتيب - اضغط "حفظ" للمزامنة', 'success');
}

// Toggle navigation item active status
function toggleNavItem(id) {
    let navItems = JSON.parse(localStorage.getItem('navigation')) || getDefaultNavigation();
    const item = navItems.find(n => n.id === id);
    
    if (item) {
        item.active = !item.active;
        localStorage.setItem('navigation', JSON.stringify(navItems));
        updateSyncStatus('modified', 'تغييرات غير محفوظة');
        loadNavigation();
        showToast(`تم ${item.active ? 'تفعيل' : 'تعطيل'} التبويب - اضغط "حفظ" للمزامنة`, 'success');
    }
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
        
        // Auto-fill functionality when adding new tab
        const titleInput = document.getElementById('navTitle');
        const iconInput = document.getElementById('navIcon');
        const linkInput = document.getElementById('navLink');
        const orderInput = document.getElementById('navOrder');
        
        // Get next order number
        const navItems = JSON.parse(localStorage.getItem('navigation')) || getDefaultNavigation();
        const nextOrder = Math.max(...navItems.map(item => item.order || 0), 0) + 1;
        orderInput.value = nextOrder;
        
        // Auto-fill on title input
        titleInput.addEventListener('input', function autoFillFields() {
            const title = this.value.trim();
            
            if (!title) {
                iconInput.value = '';
                linkInput.value = '';
                return;
            }
            
            // Auto-generate icon based on title keywords
            const iconMap = {
                'home': 'fas fa-home',
                'windows': 'fab fa-windows',
                'android': 'fab fa-android',
                'frp': 'fas fa-unlock-alt',
                'tools': 'fas fa-tools',
                'apps': 'fas fa-mobile-alt',
                'about': 'fas fa-info-circle',
                'contact': 'fas fa-envelope',
                'settings': 'fas fa-cog',
                'user': 'fas fa-user',
                'profile': 'fas fa-user-circle',
                'download': 'fas fa-download',
                'upload': 'fas fa-upload',
                'store': 'fas fa-store',
                'shop': 'fas fa-shopping-cart',
                'game': 'fas fa-gamepad',
                'music': 'fas fa-music',
                'video': 'fas fa-video',
                'photo': 'fas fa-image',
                'image': 'fas fa-images',
                'file': 'fas fa-file',
                'folder': 'fas fa-folder',
                'search': 'fas fa-search',
                'help': 'fas fa-question-circle',
                'support': 'fas fa-life-ring',
                'blog': 'fas fa-blog',
                'news': 'fas fa-newspaper',
                'star': 'fas fa-star',
                'heart': 'fas fa-heart',
                'favorite': 'fas fa-heart',
                'bookmark': 'fas fa-bookmark',
                'tag': 'fas fa-tag',
                'category': 'fas fa-th-large',
                'menu': 'fas fa-bars',
                'list': 'fas fa-list',
                'grid': 'fas fa-th',
                'dashboard': 'fas fa-tachometer-alt',
                'chart': 'fas fa-chart-bar',
                'report': 'fas fa-chart-line',
                'calendar': 'fas fa-calendar',
                'clock': 'fas fa-clock',
                'bell': 'fas fa-bell',
                'notification': 'fas fa-bell',
                'message': 'fas fa-comment',
                'chat': 'fas fa-comments',
                'mail': 'fas fa-envelope',
                'email': 'fas fa-envelope',
                'phone': 'fas fa-phone',
                'map': 'fas fa-map-marker-alt',
                'location': 'fas fa-map-marker-alt',
                'globe': 'fas fa-globe',
                'world': 'fas fa-globe-americas',
                'language': 'fas fa-language',
                'translate': 'fas fa-language',
                'lock': 'fas fa-lock',
                'unlock': 'fas fa-unlock',
                'key': 'fas fa-key',
                'shield': 'fas fa-shield-alt',
                'security': 'fas fa-shield-alt',
                'check': 'fas fa-check',
                'times': 'fas fa-times',
                'plus': 'fas fa-plus',
                'minus': 'fas fa-minus',
                'edit': 'fas fa-edit',
                'trash': 'fas fa-trash',
                'delete': 'fas fa-trash-alt',
                'save': 'fas fa-save',
                'print': 'fas fa-print',
                'share': 'fas fa-share-alt',
                'link': 'fas fa-link',
                'external': 'fas fa-external-link-alt'
            };
            
            // Find matching icon
            let selectedIcon = 'fas fa-cube'; // default
            const lowerTitle = title.toLowerCase();
            
            for (const [keyword, icon] of Object.entries(iconMap)) {
                if (lowerTitle.includes(keyword)) {
                    selectedIcon = icon;
                    break;
                }
            }
            
            iconInput.value = selectedIcon;
            
            // Auto-generate link from title
            // Convert to lowercase, replace spaces with hyphens, remove special chars
            const link = '#' + title.toLowerCase()
                .replace(/\s+/g, '-')           // Replace spaces with hyphens
                .replace(/[^a-z0-9\-]/g, '')    // Remove special characters
                .replace(/\-+/g, '-')           // Replace multiple hyphens with single
                .replace(/^\-|\-$/g, '');       // Remove leading/trailing hyphens
            
            linkInput.value = link;
        });
    }
    
    modal.style.display = 'flex';
}

function closeNavModal() {
    document.getElementById('navModal').style.display = 'none';
    document.getElementById('navForm').reset();
}

function initNavForm() {
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
    updateSyncStatus('modified', 'تغييرات غير محفوظة');
    
    closeNavModal();
    loadNavigation();
    showToast(isEditing ? 'تم التحديث محلياً - اضغط "حفظ على GitHub" لحفظ التغييرات' : 'تمت الإضافة محلياً - اضغط "حفظ على GitHub" لحفظ التغييرات', 'success');
    });
}

function editNavItem(id) {
    openNavModal(id);
}

function deleteNavItem(id) {
    if (confirm('هل أنت متأكد من حذف هذا التبويب؟')) {
        let navItems = JSON.parse(localStorage.getItem('navigation')) || getDefaultNavigation();
        navItems = navItems.filter(item => item.id !== id);
        localStorage.setItem('navigation', JSON.stringify(navItems));
        updateSyncStatus('modified', 'تغييرات غير محفوظة');
        
        loadNavigation();
        showToast('تم الحذف محلياً - اضغط "حفظ على GitHub" لحفظ التغييرات', 'success');
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

function initSiteSettingsForm() {
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
        updateSyncStatus('modified', 'تغييرات غير محفوظة');
        showToast('تم حفظ الإعدادات محلياً - اضغط "حفظ على GitHub" لحفظ التغييرات', 'success');
    });
}

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

function initColorsForm() {
    document.getElementById('colorsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const colors = {
            primary: document.getElementById('primaryColor').value,
            secondary: document.getElementById('secondaryColor').value,
            accent: document.getElementById('accentColor').value,
            background: document.getElementById('backgroundColor').value
        };
        
        localStorage.setItem('siteColors', JSON.stringify(colors));
        updateSyncStatus('modified', 'تغييرات غير محفوظة');
        showToast('تم حفظ الألوان محلياً - اضغط "حفظ على GitHub" لحفظ التغييرات', 'success');
    });
}

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

// ============ Load Settings from GitHub ============

async function loadSettingsFromGitHub() {
    if (!githubAPI.isConfigured()) {
        console.log('GitHub not configured, using localStorage settings');
        return false;
    }
    
    try {
        const settings = await githubAPI.getSettingsFromGitHub();
        
        if (settings) {
            // Save to localStorage
            if (settings.siteSettings) {
                localStorage.setItem('siteSettings', JSON.stringify(settings.siteSettings));
            }
            if (settings.colors) {
                localStorage.setItem('siteColors', JSON.stringify(settings.colors));
            }
            if (settings.navigation) {
                localStorage.setItem('navigation', JSON.stringify(settings.navigation));
            }
            if (settings.images) {
                localStorage.setItem('siteImages', JSON.stringify(settings.images));
            }
            
            console.log('✅ Settings loaded from GitHub');
            return true;
        }
    } catch (error) {
        console.error('Error loading settings from GitHub:', error);
        return false;
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
        
        // Save to localStorage
        saveToLocalStorage();
        
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
            id: item.id || (Date.now() + Math.random()),
            name: item.name,
            category: item.category,
            version: item.version,
            size: item.size,
            description: item.description,
            fullDescription: item.fullDescription || '',
            icon: item.icon || 'https://via.placeholder.com/64',
            downloadLink: item.downloadUrl || item.downloadLink,
            originalDownloadLink: item.originalDownloadLink || '',
            isModified: item.isModified === true ? true : false,
            downloadLink2: item.downloadLink2 || '',
            downloadLink3: item.downloadLink3 || '',
            tutorialLink: item.tutorialLink || '',
            password: item.password || '',
            systemRequirements: item.systemRequirements || '',
            screenshots: item.screenshots || [],
            features: item.features || [],
            lastUpdated: item.lastUpdated || new Date().toISOString()
        }));
    }
    
    // Import Android Apps
    if (typeof androidApps !== 'undefined' && appsData.android.length === 0) {
        appsData.android = androidApps.map(item => ({
            id: item.id || (Date.now() + Math.random()),
            name: item.name,
            category: item.category,
            version: item.version,
            size: item.size,
            description: item.description,
            fullDescription: item.fullDescription || '',
            icon: item.icon || 'https://via.placeholder.com/64',
            downloadLink: item.downloadUrl || item.downloadLink,
            originalDownloadLink: item.originalDownloadLink || '',
            isModified: item.isModified === true ? true : false,
            downloadLink2: item.downloadLink2 || '',
            downloadLink3: item.downloadLink3 || '',
            tutorialLink: item.tutorialLink || '',
            password: item.password || '',
            systemRequirements: item.systemRequirements || '',
            screenshots: item.screenshots || [],
            features: item.features || [],
            lastUpdated: item.lastUpdated || new Date().toISOString()
        }));
    }
    
    // Import FRP Tools
    if (typeof frpTools !== 'undefined' && appsData['frp-tools'].length === 0) {
        appsData['frp-tools'] = frpTools.map(item => ({
            id: item.id || (Date.now() + Math.random()),
            name: item.name,
            category: item.category,
            version: item.version,
            size: item.size,
            description: item.description,
            fullDescription: item.fullDescription || '',
            icon: item.icon || 'https://via.placeholder.com/64',
            downloadLink: item.downloadUrl || item.downloadLink,
            originalDownloadLink: item.originalDownloadLink || '',
            isModified: item.isModified === true ? true : false,
            downloadLink2: item.downloadLink2 || '',
            downloadLink3: item.downloadLink3 || '',
            tutorialLink: item.tutorialLink || '',
            password: item.password || '',
            systemRequirements: item.systemRequirements || '',
            screenshots: item.screenshots || [],
            features: item.features || [],
            lastUpdated: item.lastUpdated || new Date().toISOString()
        }));
    }
    
    // Import Windows Games
    if (typeof windowsGames !== 'undefined' && (!appsData['windows-games'] || appsData['windows-games'].length === 0)) {
        appsData['windows-games'] = windowsGames.map(item => ({
            id: item.id || (Date.now() + Math.random()),
            name: item.name,
            category: item.category || 'Games',
            version: item.version,
            size: item.size || '',
            description: item.description || '',
            fullDescription: item.fullDescription || '',
            icon: item.icon || 'fas fa-gamepad',
            downloadLink: item.downloadUrl || item.downloadLink || '',
            originalDownloadLink: item.originalDownloadLink || '',
            isModified: item.isModified === true ? true : false,
            screenshots: item.screenshots || [],
            lastUpdated: item.lastUpdated || new Date().toISOString()
        }));
    }
    
    // Import Android Games
    if (typeof androidGames !== 'undefined' && (!appsData['android-games'] || appsData['android-games'].length === 0)) {
        appsData['android-games'] = androidGames.map(item => ({
            id: item.id || (Date.now() + Math.random()),
            name: item.name,
            category: item.category || 'Games',
            version: item.version,
            size: item.size || '',
            description: item.description || '',
            fullDescription: item.fullDescription || '',
            icon: item.icon || 'fas fa-gamepad',
            downloadLink: item.downloadUrl || item.downloadLink || '',
            originalDownloadLink: item.originalDownloadLink || '',
            isModified: item.isModified === true ? true : false,
            screenshots: item.screenshots || [],
            lastUpdated: item.lastUpdated || new Date().toISOString()
        }));
    }
    
    // Import FRP Apps
    if (typeof frpApps !== 'undefined' && appsData['frp-apps'].length === 0) {
        appsData['frp-apps'] = frpApps.map(item => ({
            id: item.id || (Date.now() + Math.random()),
            name: item.name,
            category: item.category,
            version: item.version,
            size: item.size,
            description: item.description,
            fullDescription: item.fullDescription || '',
            icon: item.icon || 'https://via.placeholder.com/64',
            downloadLink: item.downloadUrl || item.downloadLink,
            originalDownloadLink: item.originalDownloadLink || '',
            isModified: item.isModified === true ? true : false,
            linkType: item.linkType || 'download',
            downloadLink2: item.downloadLink2 || '',
            downloadLink3: item.downloadLink3 || '',
            tutorialLink: item.tutorialLink || '',
            password: item.password || '',
            systemRequirements: item.systemRequirements || '',
            screenshots: item.screenshots || [],
            features: item.features || [],
            lastUpdated: item.lastUpdated || new Date().toISOString()
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
            
            // Save to localStorage
            saveToLocalStorage();
            
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
    const windowsGames = appsData['windows-games'] || [];
    const androidGames = appsData['android-games'] || [];
    const frpToolsData = appsData['frp-tools'] || [];
    const frpAppsData = appsData['frp-apps'] || [];
    
    // Helper to escape strings
    const escapeStr = (str) => {
        if (!str) return '';
        return str.replace(/\\/g, '\\\\')
                  .replace(/'/g, "\\'")
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '');
    };
    
    let output = '// ===== Windows Software Data =====\nconst windowsSoftware = [\n';
    windows.forEach((item, index) => {
        output += `    {\n`;
        output += `        id: ${item.id},\n`;
        output += `        name: '${escapeStr(item.name)}',\n`;
        output += `        version: '${escapeStr(item.version)}',\n`;
        output += `        category: '${item.category}',\n`;
        output += `        icon: '${item.icon}',\n`;
        output += `        description: '${escapeStr(item.description)}',\n`;
        if (item.fullDescription) {
            output += `        fullDescription: '${escapeStr(item.fullDescription)}',\n`;
        }
        output += `        size: '${item.size}',\n`;
        output += `        downloadLink: '${item.downloadLink}',\n`;
        if (item.originalDownloadLink) {
            output += `        originalDownloadLink: '${escapeStr(item.originalDownloadLink)}',\n`;
        }
        output += `        isModified: ${item.isModified === true ? 'true' : 'false'}`;
        if (item.downloadLink2 && item.downloadLink2.trim() !== '') {
            output += `,\n        downloadLink2: '${escapeStr(item.downloadLink2)}'`;
        }
        if (item.downloadLink3 && item.downloadLink3.trim() !== '') {
            output += `,\n        downloadLink3: '${escapeStr(item.downloadLink3)}'`;
        }
        if (item.tutorialLink && item.tutorialLink.trim() !== '') {
            output += `,\n        tutorialLink: '${escapeStr(item.tutorialLink)}'`;
        }
        if (item.password && item.password.trim() !== '') {
            output += `,\n        password: '${escapeStr(item.password)}'`;
        }
        if (item.systemRequirements && item.systemRequirements.trim() !== '') {
            output += `,\n        systemRequirements: '${escapeStr(item.systemRequirements)}'`;
        }
        if (item.screenshots && item.screenshots.length > 0) {
            output += `,\n        screenshots: [${item.screenshots.map(s => `'${escapeStr(s)}'`).join(', ')}]`;
        }
        if (item.features && item.features.length > 0) {
            output += `,\n        features: [${item.features.map(f => `'${escapeStr(f)}'`).join(', ')}]`;
        }
        if (item.lastUpdated) {
            output += `,\n        lastUpdated: '${item.lastUpdated}'`;
        }
        output += `\n    }${index < windows.length - 1 ? ',' : ''}\n`;
    });
    output += '];\n\n';
    
    output += '// ===== Android Applications Data =====\nconst androidApps = [\n';
    android.forEach((item, index) => {
        output += `    {\n`;
        output += `        id: ${item.id},\n`;
        output += `        name: '${escapeStr(item.name)}',\n`;
        output += `        version: '${escapeStr(item.version)}',\n`;
        output += `        category: '${item.category}',\n`;
        output += `        icon: '${item.icon}',\n`;
        output += `        description: '${escapeStr(item.description)}',\n`;
        if (item.fullDescription) {
            output += `        fullDescription: '${escapeStr(item.fullDescription)}',\n`;
        }
        output += `        size: '${item.size}',\n`;
        output += `        downloadLink: '${item.downloadLink}',\n`;
        if (item.originalDownloadLink) {
            output += `        originalDownloadLink: '${escapeStr(item.originalDownloadLink)}',\n`;
        }
        output += `        isModified: ${item.isModified === true ? 'true' : 'false'}`;
        if (item.downloadLink2 && item.downloadLink2.trim() !== '') {
            output += `,\n        downloadLink2: '${escapeStr(item.downloadLink2)}'`;
        }
        if (item.downloadLink3 && item.downloadLink3.trim() !== '') {
            output += `,\n        downloadLink3: '${escapeStr(item.downloadLink3)}'`;
        }
        if (item.tutorialLink && item.tutorialLink.trim() !== '') {
            output += `,\n        tutorialLink: '${escapeStr(item.tutorialLink)}'`;
        }
        if (item.password && item.password.trim() !== '') {
            output += `,\n        password: '${escapeStr(item.password)}'`;
        }
        if (item.systemRequirements && item.systemRequirements.trim() !== '') {
            output += `,\n        systemRequirements: '${escapeStr(item.systemRequirements)}'`;
        }
        if (item.screenshots && item.screenshots.length > 0) {
            output += `,\n        screenshots: [${item.screenshots.map(s => `'${escapeStr(s)}'`).join(', ')}]`;
        }
        if (item.features && item.features.length > 0) {
            output += `,\n        features: [${item.features.map(f => `'${escapeStr(f)}'`).join(', ')}]`;
        }
        if (item.lastUpdated) {
            output += `,\n        lastUpdated: '${item.lastUpdated}'`;
        }
        output += `\n    }${index < android.length - 1 ? ',' : ''}\n`;
    });
    output += '];\n\n';
    
    output += '// ===== Windows Games Data =====\nconst windowsGames = [\n';
    windowsGames.forEach((item, index) => {
        output += `    {\n`;
        output += `        id: ${item.id},\n`;
        output += `        name: '${escapeStr(item.name)}',\n`;
        output += `        version: '${escapeStr(item.version)}',\n`;
        output += `        category: '${item.category || 'Games'}',\n`;
        output += `        icon: '${item.icon || 'fas fa-gamepad'}'`;
        
        if (item.description) {
            output += `,\n        description: '${escapeStr(item.description)}'`;
        }
        if (item.fullDescription) {
            output += `,\n        fullDescription: '${escapeStr(item.fullDescription)}'`;
        }
        if (item.size) {
            output += `,\n        size: '${item.size}'`;
        }
        if (item.downloadLink) {
            output += `,\n        downloadLink: '${item.downloadLink}'`;
        }
        if (item.originalDownloadLink) {
            output += `,\n        originalDownloadLink: '${escapeStr(item.originalDownloadLink)}'`;
        }
        if (item.screenshots && item.screenshots.length > 0) {
            output += `,\n        screenshots: [${item.screenshots.map(s => `'${escapeStr(s)}'`).join(', ')}]`;
        }
        if (item.lastUpdated) {
            output += `,\n        lastUpdated: '${item.lastUpdated}'`;
        }
        output += `\n    }${index < windowsGames.length - 1 ? ',' : ''}\n`;
    });
    output += '];\n\n';
    
    output += '// ===== Android Games Data =====\nconst androidGames = [\n';
    androidGames.forEach((item, index) => {
        output += `    {\n`;
        output += `        id: ${item.id},\n`;
        output += `        name: '${escapeStr(item.name)}',\n`;
        output += `        version: '${escapeStr(item.version)}',\n`;
        output += `        category: '${item.category || 'Games'}',\n`;
        output += `        icon: '${item.icon || 'fas fa-gamepad'}'`;
        
        if (item.description) {
            output += `,\n        description: '${escapeStr(item.description)}'`;
        }
        if (item.fullDescription) {
            output += `,\n        fullDescription: '${escapeStr(item.fullDescription)}'`;
        }
        if (item.size) {
            output += `,\n        size: '${item.size}'`;
        }
        if (item.downloadLink) {
            output += `,\n        downloadLink: '${item.downloadLink}'`;
        }
        if (item.originalDownloadLink) {
            output += `,\n        originalDownloadLink: '${escapeStr(item.originalDownloadLink)}'`;
        }
        if (item.screenshots && item.screenshots.length > 0) {
            output += `,\n        screenshots: [${item.screenshots.map(s => `'${escapeStr(s)}'`).join(', ')}]`;
        }
        if (item.lastUpdated) {
            output += `,\n        lastUpdated: '${item.lastUpdated}'`;
        }
        output += `\n    }${index < androidGames.length - 1 ? ',' : ''}\n`;
    });
    output += '];\n\n';
    
    output += '// ===== FRP Tools Data =====\nconst frpTools = [\n';
    frpToolsData.forEach((item, index) => {
        output += `    {\n`;
        output += `        id: ${item.id},\n`;
        output += `        name: '${escapeStr(item.name)}',\n`;
        output += `        version: '${escapeStr(item.version)}',\n`;
        output += `        category: '${item.category}',\n`;
        output += `        icon: '${item.icon}',\n`;
        output += `        description: '${escapeStr(item.description)}',\n`;
        if (item.fullDescription) {
            output += `        fullDescription: '${escapeStr(item.fullDescription)}',\n`;
        }
        output += `        size: '${item.size}',\n`;
        output += `        downloadLink: '${item.downloadLink}',\n`;
        if (item.originalDownloadLink) {
            output += `        originalDownloadLink: '${escapeStr(item.originalDownloadLink)}',\n`;
        }
        output += `        isModified: ${item.isModified === true ? 'true' : 'false'}`;
        if (item.downloadLink2 && item.downloadLink2.trim() !== '') {
            output += `,\n        downloadLink2: '${escapeStr(item.downloadLink2)}'`;
        }
        if (item.downloadLink3 && item.downloadLink3.trim() !== '') {
            output += `,\n        downloadLink3: '${escapeStr(item.downloadLink3)}'`;
        }
        if (item.tutorialLink && item.tutorialLink.trim() !== '') {
            output += `,\n        tutorialLink: '${escapeStr(item.tutorialLink)}'`;
        }
        if (item.password && item.password.trim() !== '') {
            output += `,\n        password: '${escapeStr(item.password)}'`;
        }
        if (item.systemRequirements && item.systemRequirements.trim() !== '') {
            output += `,\n        systemRequirements: '${escapeStr(item.systemRequirements)}'`;
        }
        if (item.screenshots && item.screenshots.length > 0) {
            output += `,\n        screenshots: [${item.screenshots.map(s => `'${escapeStr(s)}'`).join(', ')}]`;
        }
        if (item.features && item.features.length > 0) {
            output += `,\n        features: [${item.features.map(f => `'${escapeStr(f)}'`).join(', ')}]`;
        }
        if (item.lastUpdated) {
            output += `,\n        lastUpdated: '${item.lastUpdated}'`;
        }
        output += `\n    }${index < frpToolsData.length - 1 ? ',' : ''}\n`;
    });
    output += '];\n\n';
    
    output += '// ===== FRP Applications Data =====\nconst frpApps = [\n';
    frpAppsData.forEach((item, index) => {
        output += `    {\n`;
        output += `        id: ${item.id},\n`;
        output += `        name: '${escapeStr(item.name)}',\n`;
        output += `        version: '${escapeStr(item.version)}',\n`;
        output += `        category: '${item.category}',\n`;
        output += `        icon: '${item.icon}',\n`;
        output += `        description: '${escapeStr(item.description)}',\n`;
        if (item.fullDescription) {
            output += `        fullDescription: '${escapeStr(item.fullDescription)}',\n`;
        }
        output += `        size: '${item.size}',\n`;
        output += `        downloadLink: '${item.downloadLink}',\n`;
        if (item.originalDownloadLink) {
            output += `        originalDownloadLink: '${escapeStr(item.originalDownloadLink)}',\n`;
        }
        output += `        isModified: ${item.isModified === true ? 'true' : 'false'}`;
        if (item.linkType) {
            output += `,\n        linkType: '${item.linkType}'`;
        }
        if (item.downloadLink2 && item.downloadLink2.trim() !== '') {
            output += `,\n        downloadLink2: '${escapeStr(item.downloadLink2)}'`;
        }
        if (item.downloadLink3 && item.downloadLink3.trim() !== '') {
            output += `,\n        downloadLink3: '${escapeStr(item.downloadLink3)}'`;
        }
        if (item.tutorialLink && item.tutorialLink.trim() !== '') {
            output += `,\n        tutorialLink: '${escapeStr(item.tutorialLink)}'`;
        }
        if (item.password && item.password.trim() !== '') {
            output += `,\n        password: '${escapeStr(item.password)}'`;
        }
        if (item.systemRequirements && item.systemRequirements.trim() !== '') {
            output += `,\n        systemRequirements: '${escapeStr(item.systemRequirements)}'`;
        }
        if (item.screenshots && item.screenshots.length > 0) {
            output += `,\n        screenshots: [${item.screenshots.map(s => `'${escapeStr(s)}'`).join(', ')}]`;
        }
        if (item.features && item.features.length > 0) {
            output += `,\n        features: [${item.features.map(f => `'${escapeStr(f)}'`).join(', ')}]`;
        }
        if (item.lastUpdated) {
            output += `,\n        lastUpdated: '${item.lastUpdated}'`;
        }
        output += `\n    }${index < frpAppsData.length - 1 ? ',' : ''}\n`;
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
    const windowsGames = appsData['windows-games'] || [];
    const androidApps = appsData.android || [];
    const androidGames = appsData['android-games'] || [];
    const frpTools = appsData['frp-tools'] || [];
    const frpApps = appsData['frp-apps'] || [];
    
    // تحديث العدادات
    document.getElementById('windowsCount').textContent = windowsApps.length;
    document.getElementById('windowsGamesCount').textContent = windowsGames.length;
    document.getElementById('androidCount').textContent = androidApps.length;
    document.getElementById('androidGamesCount').textContent = androidGames.length;
    document.getElementById('frpToolsCount').textContent = frpTools.length;
    document.getElementById('frpAppsCount').textContent = frpApps.length;
    
    console.log('📊 تم تحديث إحصائيات لوحة التحكم:', {
        'برامج Windows': windowsApps.length,
        'ألعاب Windows': windowsGames.length,
        'تطبيقات Android': androidApps.length,
        'ألعاب Android': androidGames.length,
        'أدوات FRP': frpTools.length,
        'تطبيقات FRP': frpApps.length
    });
}

// ============ Initialize ============

window.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    // Initialize dashboard stats
    updateDashboardStats();
    
    // Try to load settings from GitHub first
    if (githubAPI.isConfigured()) {
        console.log('🔄 Loading settings from GitHub...');
        await loadSettingsFromGitHub();
    }
    
    // Try to load from localStorage first
    const hasLocalData = loadFromLocalStorage();
    
    // If no localStorage data, import from data.js
    if (!hasLocalData || 
        (appsData.windows.length === 0 && 
         appsData.android.length === 0 && 
         appsData['frp-tools'].length === 0 && 
         appsData['frp-apps'].length === 0)) {
        console.log('📥 Importing from data.js...');
        importFromDataJS();
        // Save imported data to localStorage
        saveToLocalStorage();
    } else {
        console.log('✅ Using data from localStorage');
    }
    
    // Initialize event listeners
    initFormTabs();
    initGitHubSettingsForm();
    initAppForm();
    initNavForm();
    initSiteSettingsForm();
    initColorsForm();
    
    // Load GitHub settings
    loadGitHubSettings();
    
    loadApps('windows');
    loadNavigation();
    loadSiteSettings();
    loadColors();
    updateDashboardStats();
    
    // Modals will only close via X button or Cancel button
    // Outside click is disabled
});
