// ============================================
// FALCON X - ADMIN PANEL JAVASCRIPT
// Complete Admin Functionality with GitHub Integration
// ============================================

// ==================== GLOBAL STATE ====================
let adminData = {
    items: {
        'windows-programs': [],
        'windows-games': [],
        'android-apps': [],
        'android-games': [],
        'phone-tools': [],
        'frp-apps': []
    },
    categories: {
        'windows-programs': [],
        'windows-games': [],
        'android-apps': [],
        'android-games': [],
        'phone-tools': [],
        'frp-apps': []
    },
    currentSection: 'dashboard',
    currentItemType: null,
    hasUnsavedChanges: false,
    githubSettings: {
        token: '',
        username: '',
        repo: ''
    }
};

//==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
    initEventListeners();
    loadAdminData();
    loadGitHubSettings();
});

function initAdmin() {
    // Load last section from localStorage
    const lastSection = localStorage.getItem('adminLastSection') || 'dashboard';
    if (lastSection !== 'dashboard') {
        switchSection(lastSection);
    }
}

function initEventListeners() {
    // Sidebar toggle (mobile)
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('overlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.add('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            closeModal();
            closeCategoryModal();
        });
    }
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            switchSection(section);
            
            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    });
    
    // Save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveToGitHub);
    }
    
    // Add new item button
    const addNewBtn = document.getElementById('addNewBtn');
    if (addNewBtn) {
        addNewBtn.addEventListener('click', () => openItemModal());
    }
    
    // Add category button
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => openCategoryModal());
    }
    
    // Modal close buttons
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Item form
    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', handleItemSubmit);
    }
    
    // Category form
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }
    
    // GitHub test button
    const testGithubBtn = document.getElementById('testGithubBtn');
    if (testGithubBtn) {
        testGithubBtn.addEventListener('click', testGitHubConnection);
    }
    
    // GitHub token input
    const githubToken = document.getElementById('githubToken');
    if (githubToken) {
        githubToken.addEventListener('input', handleGitHubTokenInput);
    }
    
    // GitHub repo input
    const githubRepo = document.getElementById('githubRepo');
    if (githubRepo) {
        githubRepo.addEventListener('input', () => {
            saveGitHubSettings();
        });
    }
    
    // Open repo button
    const openRepoBtn = document.getElementById('openRepoBtn');
    if (openRepoBtn) {
        openRepoBtn.addEventListener('click', openRepository);
    }
}

// ==================== SECTION MANAGEMENT ====================
function switchSection(section) {
    adminData.currentSection = section;
    localStorage.setItem('adminLastSection', section);
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Show target section
    if (section === 'dashboard') {
        document.getElementById('dashboard').classList.add('active');
        updateDashboardStats();
    } else if (section === 'categories') {
        document.getElementById('categories').classList.add('active');
        loadCategoriesManagement();
    } else if (section === 'github-settings') {
        document.getElementById('github-settings').classList.add('active');
    } else {
        // Content management sections
        adminData.currentItemType = section;
        document.getElementById('content-section').classList.add('active');
        loadContentSection(section);
    }
}

// ==================== DATA LOADING ====================
async function loadAdminData() {
    try {
        const [items, categories] = await Promise.all([
            fetch('../data/items.json').then(r => r.ok ? r.json() : {}),
            fetch('../data/categories.json').then(r => r.ok ? r.json() : {})
        ]);
        
        adminData.items = items;
        adminData.categories = categories;
        
        // Initialize empty arrays if needed
        const types = ['windows-programs', 'windows-games', 'android-apps', 'android-games', 'phone-tools', 'frp-apps'];
        types.forEach(type => {
            if (!adminData.items[type]) adminData.items[type] = [];
            if (!adminData.categories[type]) adminData.categories[type] = [];
        });
        
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data', 'error');
    }
}

// ==================== DASHBOARD ====================
function updateDashboardStats() {
    const stats = {
        'statsWindowsPrograms': adminData.items['windows-programs']?.length || 0,
        'statsWindowsGames': adminData.items['windows-games']?.length || 0,
        'statsAndroidApps': adminData.items['android-apps']?.length || 0,
        'statsAndroidGames': adminData.items['android-games']?.length || 0,
        'statsPhoneTools': adminData.items['phone-tools']?.length || 0,
        'statsFrpApps': adminData.items['frp-apps']?.length || 0
    };
    
    Object.entries(stats).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
    
    // Total categories
    const totalCategories = Object.values(adminData.categories).reduce((sum, arr) => sum + arr.length, 0);
    const totalCategoriesEl = document.getElementById('statsTotalCategories');
    if (totalCategoriesEl) totalCategoriesEl.textContent = totalCategories;
    
    // Total items
    const totalItems = Object.values(stats).reduce((sum, val) => sum + val, 0);
    const totalItemsEl = document.getElementById('statsTotalItems');
    if (totalItemsEl) totalItemsEl.textContent = totalItems;
}

// ==================== CONTENT SECTION ====================
function loadContentSection(type) {
    const titles = {
        'windows-programs': 'Windows Programs',
        'windows-games': 'Windows Games',
        'android-apps': 'Android Apps',
        'android-games': 'Android Games',
        'phone-tools': 'Phone Tools',
        'frp-apps': 'FRP Apps'
    };
    
    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) {
        sectionTitle.textContent = `Manage ${titles[type]}`;
    }
    
    loadItemsTable(type);
}

function loadItemsTable(type) {
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) return;
    
    const items = adminData.items[type] || [];
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem;">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No Items Found</h3>
                        <p>Click "Add New" to create your first item.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = items.map((item, index) => `
        <tr>
            <td><img src="${item.iconUrl || '../images/placeholder.png'}" class="table-icon" onerror="this.src='../images/placeholder.png'"></td>
            <td><strong>${item.name}</strong></td>
            <td>${item.category || '-'}</td>
            <td>${item.version || '-'}</td>
            <td>${item.size || '-'}</td>
            <td>
                <span class="status-badge ${item.status === 'modified' ? 'modified' : 'original'}">
                    ${item.status === 'modified' ? 'Modified' : 'Original'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit" onclick="editItem('${type}', ${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteItem('${type}', ${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==================== ITEM MODAL ====================
function openItemModal(type = null, index = null) {
    const modal = document.getElementById('itemModal');
    const overlay = document.getElementById('overlay');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('itemForm');
    
    if (!modal || !form) return;
    
    // Reset form
    form.reset();
    document.getElementById('itemId').value = index !== null ? index : '';
    document.getElementById('itemType').value = type || adminData.currentItemType;
    
    // Load categories for select
    const categorySelect = document.getElementById('itemCategory');
    const currentType = type || adminData.currentItemType;
    const categories = adminData.categories[currentType] || [];
    
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(cat => {
        categorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });
    
    // If editing, load item data
    if (type && index !== null) {
        modalTitle.textContent = 'Edit Item';
        const item = adminData.items[type][index];
        
        document.getElementById('itemName').value = item.name || '';
        document.getElementById('itemCategory').value = item.category || '';
        document.getElementById('itemVersion').value = item.version || '';
        document.getElementById('itemSize').value = item.size || '';
        document.getElementById('itemShortDesc').value = item.shortDesc || '';
        document.getElementById('itemFullDesc').value = item.fullDesc || '';
        document.getElementById('itemIconUrl').value = item.iconUrl || '';
        document.getElementById('itemScreenshots').value = (item.screenshots || []).join('\n');
        document.getElementById('itemFeatures').value = (item.features || []).join('\n');
        document.getElementById('itemRequirements').value = (item.requirements || []).join('\n');
        document.getElementById('itemOriginalLink').value = item.originalLink || '';
        document.getElementById('itemModifiedLink').value = item.modifiedLink || '';
        document.getElementById('itemWebsite').value = item.website || '';
        document.getElementById('itemStatus').value = item.status || 'original';
        document.getElementById('itemNote').value = item.note || '';
        
        // Set note color
        if (item.noteColor) {
            document.querySelector(`input[name="noteColor"][value="${item.noteColor}"]`).checked = true;
        }
    } else {
        modalTitle.textContent = 'Add New Item';
    }
    
    modal.classList.add('active');
    overlay.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('itemModal');
    const overlay = document.getElementById('overlay');
    
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function handleItemSubmit(e) {
    e.preventDefault();
    
    const index = document.getElementById('itemId').value;
    const type = document.getElementById('itemType').value;
    
    const item = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        version: document.getElementById('itemVersion').value,
        size: document.getElementById('itemSize').value,
        shortDesc: document.getElementById('itemShortDesc').value,
        fullDesc: document.getElementById('itemFullDesc').value,
        iconUrl: document.getElementById('itemIconUrl').value,
        screenshots: document.getElementById('itemScreenshots').value.split('\n').filter(s => s.trim()),
        features: document.getElementById('itemFeatures').value.split('\n').filter(f => f.trim()),
        requirements: document.getElementById('itemRequirements').value.split('\n').filter(r => r.trim()),
        originalLink: document.getElementById('itemOriginalLink').value,
        modifiedLink: document.getElementById('itemModifiedLink').value,
        website: document.getElementById('itemWebsite').value,
        status: document.getElementById('itemStatus').value,
        note: document.getElementById('itemNote').value,
        noteColor: document.querySelector('input[name="noteColor"]:checked').value
    };
    
    if (index === '') {
        // Add new item
        if (!adminData.items[type]) adminData.items[type] = [];
        adminData.items[type].push(item);
        showNotification('Item added successfully', 'success');
    } else {
        // Update existing item
        adminData.items[type][parseInt(index)] = item;
        showNotification('Item updated successfully', 'success');
    }
    
    markAsUnsaved();
    closeModal();
    loadItemsTable(type);
    updateDashboardStats();
}

function editItem(type, index) {
    openItemModal(type, index);
}

function deleteItem(type, index) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    adminData.items[type].splice(index, 1);
    markAsUnsaved();
    loadItemsTable(type);
    updateDashboardStats();
    showNotification('Item deleted successfully', 'success');
}

// ==================== CATEGORIES MANAGEMENT ====================
function loadCategoriesManagement() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    
    const types = {
        'windows-programs': 'Windows Programs',
        'windows-games': 'Windows Games',
        'android-apps': 'Android Apps',
        'android-games': 'Android Games',
        'phone-tools': 'Phone Tools',
        'frp-apps': 'FRP Apps'
    };
    
    let html = '';
    
    Object.entries(types).forEach(([key, label]) => {
        const categories = adminData.categories[key] || [];
        
        html += `
            <div class="category-card">
                <div class="category-header">
                    <div>
                        <span class="category-type">${label}</span>
                        <div class="category-name">${categories.length} Categories</div>
                    </div>
                    <button class="btn btn-primary" onclick="openCategoryModal('${key}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div style="margin-top: 1rem;">
                    ${categories.map((cat, index) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid var(--border-color);">
                            <span>${cat.name}</span>
                            <div class="category-actions">
                                <button class="action-btn edit" onclick="openCategoryModal('${key}', ${index})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="deleteCategory('${key}', ${index})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

function openCategoryModal(type = null, index = null) {
    const modal = document.getElementById('categoryModal');
    const overlay = document.getElementById('overlay');
    const modalTitle = document.getElementById('categoryModalTitle');
    const form = document.getElementById('categoryForm');
    
    if (!modal || !form) return;
    
    form.reset();
    document.getElementById('categoryId').value = index !== null ? index : '';
    document.getElementById('categoryType').value = type;
    
    if (type && index !== null) {
        modalTitle.textContent = 'Edit Category';
        const category = adminData.categories[type][index];
        document.getElementById('categoryName').value = category.name;
    } else {
        modalTitle.textContent = 'Add Category';
    }
    
    modal.classList.add('active');
    overlay.classList.add('active');
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    const overlay = document.getElementById('overlay');
    
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function handleCategorySubmit(e) {
    e.preventDefault();
    
    const index = document.getElementById('categoryId').value;
    const type = document.getElementById('categoryType').value;
    const name = document.getElementById('categoryName').value;
    
    const category = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name
    };
    
    if (index === '') {
        if (!adminData.categories[type]) adminData.categories[type] = [];
        adminData.categories[type].push(category);
        showNotification('Category added successfully', 'success');
    } else {
        adminData.categories[type][parseInt(index)] = category;
        showNotification('Category updated successfully', 'success');
    }
    
    markAsUnsaved();
    closeCategoryModal();
    loadCategoriesManagement();
    updateDashboardStats();
}

function deleteCategory(type, index) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    adminData.categories[type].splice(index, 1);
    markAsUnsaved();
    loadCategoriesManagement();
    updateDashboardStats();
    showNotification('Category deleted successfully', 'success');
}

// ==================== UNSAVED CHANGES ====================
function markAsUnsaved() {
    adminData.hasUnsavedChanges = true;
    document.getElementById('unsavedIndicator').style.display = 'flex';
    document.getElementById('saveBtn').style.display = 'flex';
}

function markAsSaved() {
    adminData.hasUnsavedChanges = false;
    document.getElementById('unsavedIndicator').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'none';
}

// ==================== GITHUB INTEGRATION ====================
function loadGitHubSettings() {
    const stored = localStorage.getItem('falconx_github_settings');
    if (stored) {
        adminData.githubSettings = JSON.parse(stored);
        document.getElementById('githubToken').value = adminData.githubSettings.token || '';
        document.getElementById('githubUsername').value = adminData.githubSettings.username || '';
        document.getElementById('githubRepo').value = adminData.githubSettings.repo || '';
        
        if (adminData.githubSettings.username && adminData.githubSettings.repo) {
            document.getElementById('openRepoBtn').style.display = 'inline-flex';
        }
    }
}

function saveGitHubSettings() {
    adminData.githubSettings = {
        token: document.getElementById('githubToken').value,
        username: document.getElementById('githubUsername').value,
        repo: document.getElementById('githubRepo').value
    };
    
    localStorage.setItem('falconx_github_settings', JSON.stringify(adminData.githubSettings));
}

async function handleGitHubTokenInput() {
    const token = document.getElementById('githubToken').value;
    if (!token) return;
    
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('githubUsername').value = data.login;
            adminData.githubSettings.username = data.login;
            saveGitHubSettings();
        }
    } catch (error) {
        console.error('Error fetching GitHub user:', error);
    }
}

async function testGitHubConnection() {
    const statusEl = document.getElementById('githubStatus');
    const token = document.getElementById('githubToken').value;
    const repo = document.getElementById('githubRepo').value;
    const username = document.getElementById('githubUsername').value;
    
    if (!token || !repo || !username) {
        statusEl.className = 'github-status error';
        statusEl.textContent = 'Please fill in all fields';
        return;
    }
    
    statusEl.className = 'github-status info';
    statusEl.textContent = 'Testing connection...';
    
    try {
        const response = await fetch(`https://api.github.com/repos/${username}/${repo}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            statusEl.className = 'github-status success';
            statusEl.textContent = 'Connection successful! You can now save data to GitHub.';
            document.getElementById('openRepoBtn').style.display = 'inline-flex';
            saveGitHubSettings();
        } else {
            statusEl.className = 'github-status error';
            statusEl.textContent = 'Connection failed. Please check your credentials.';
        }
    } catch (error) {
        statusEl.className = 'github-status error';
        statusEl.textContent = 'Error connecting to GitHub: ' + error.message;
    }
}

async function saveToGitHub() {
    const { token, username, repo } = adminData.githubSettings;
    
    if (!token || !username || !repo) {
        showNotification('Please configure GitHub settings first', 'error');
        switchSection('github-settings');
        return;
    }
    
    showNotification('Saving to GitHub...', 'info');
    
    try {
        // Save items.json
        await saveFileToGitHub(
            token,
            username,
            repo,
            'data/items.json',
            JSON.stringify(adminData.items, null, 2),
            'Update items data'
        );
        
        // Save categories.json
        await saveFileToGitHub(
            token,
            username,
            repo,
            'data/categories.json',
            JSON.stringify(adminData.categories, null, 2),
            'Update categories data'
        );
        
        markAsSaved();
        showNotification('Successfully saved to GitHub!', 'success');
    } catch (error) {
        showNotification('Error saving to GitHub: ' + error.message, 'error');
    }
}

async function saveFileToGitHub(token, username, repo, path, content, message) {
    // Get current file SHA (if exists)
    let sha = null;
    try {
        const getResponse = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
        }
    } catch (error) {
        // File doesn't exist, will create new
    }
    
    // Create or update file
    const body = {
        message: message,
        content: btoa(unescape(encodeURIComponent(content))),
        ...(sha && { sha })
    };
    
    const response = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save file');
    }
    
    return response.json();
}

function openRepository() {
    const { username, repo } = adminData.githubSettings;
    if (username && repo) {
        window.open(`https://github.com/${username}/${repo}`, '_blank');
    }
}

// ==================== UTILITIES ====================
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function logout() {
    if (adminData.hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. Are you sure you want to logout?')) return;
    }
    window.location.href = '../index.html';
}

// ==================== EXPORT & IMPORT DATA ====================
function exportData() {
    const data = {
        items: adminData.items,
        categories: adminData.categories,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `falcon-x-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.items || !data.categories) {
                throw new Error('Invalid data format');
            }
            
            // Confirm before importing
            if (!confirm('This will replace all current data. Are you sure you want to continue?')) {
                event.target.value = ''; // Reset file input
                return;
            }
            
            // Import data
            adminData.items = data.items;
            adminData.categories = data.categories;
            
            // Mark as unsaved
            markAsUnsaved();
            
            // Refresh views
            updateDashboardStats();
            if (adminData.currentSection === 'categories') {
                loadCategoriesManagement();
            } else if (adminData.currentSection !== 'dashboard' && adminData.currentSection !== 'github-settings') {
                loadItemsTable(adminData.currentItemType);
            }
            
            showNotification('Data imported successfully! Don\'t forget to save to GitHub.', 'success');
            event.target.value = ''; // Reset file input
        } catch (error) {
            showNotification('Error importing data: ' + error.message, 'error');
            event.target.value = ''; // Reset file input
        }
    };
    
    reader.readAsText(file);
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
