// Global state
let unsavedChanges = false;
let currentEditingItem = null;
let currentEditingType = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initAdmin();
    loadDashboard();
    loadAllTables();
    loadCategories();
    loadGithubSettings();
    restoreLastSection();
});

// Initialize admin
function initAdmin() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    
    sidebarToggle?.addEventListener('click', () => {
        adminSidebar.classList.toggle('active');
    });
    
    // Navigation
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
            
            // Close sidebar on mobile
            if (window.innerWidth <= 1024) {
                adminSidebar.classList.remove('active');
            }
        });
    });
    
    // Save changes button
    document.getElementById('saveChangesBtn')?.addEventListener('click', saveToGithub);
}

// Switch section
function switchSection(sectionName) {
    // Save current section to sessionStorage (clears on close)
    sessionStorage.setItem('adminCurrentSection', sectionName);
    
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        if (item.dataset.section === sectionName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    document.querySelectorAll('.admin-section').forEach(section => {
        if (section.id === `${sectionName}-section`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
}

// Restore last visited section
function restoreLastSection() {
    const lastSection = sessionStorage.getItem('adminCurrentSection') || 'dashboard';
    switchSection(lastSection);
}

// Mark unsaved changes
function markUnsaved() {
    unsavedChanges = true;
    document.getElementById('unsavedIndicator').style.display = 'flex';
}

function markSaved() {
    unsavedChanges = false;
    document.getElementById('unsavedIndicator').style.display = 'none';
}

// Load dashboard
function loadDashboard() {
    document.getElementById('winProgramsCount').textContent = db.getItems('windowsPrograms').length;
    document.getElementById('winGamesCount').textContent = db.getItems('windowsGames').length;
    document.getElementById('androidAppsCount').textContent = db.getItems('androidApps').length;
    document.getElementById('androidGamesCount').textContent = db.getItems('androidGames').length;
    document.getElementById('phoneToolsCount').textContent = db.getItems('phoneTools').length;
    document.getElementById('frpAppsCount').textContent = db.getItems('frpApps').length;
}

// Load all tables
function loadAllTables() {
    loadTable('windowsPrograms', 'windowsProgramsTable');
    loadTable('windowsGames', 'windowsGamesTable');
    loadTable('androidApps', 'androidAppsTable');
    loadTable('androidGames', 'androidGamesTable');
    loadTable('phoneTools', 'phoneToolsTable');
    loadTable('frpApps', 'frpAppsTable');
}

// Load table
function loadTable(type, tableId) {
    const items = db.getItems(type);
    const tbody = document.querySelector(`#${tableId} tbody`);
    
    if (!tbody) return;
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No items found</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => {
        const date = new Date(item.lastModified);
        const formattedDate = date.toLocaleDateString();
        
        // For FRP Apps, show frpType instead of status
        let statusDisplay, statusClass;
        if (type === 'frpApps') {
            const frpType = item.frpType || 'direct';
            statusDisplay = frpType.charAt(0).toUpperCase() + frpType.slice(1);
            statusClass = frpType === 'direct' ? 'status-original' : 'status-modified';
        } else {
            statusDisplay = item.status;
            statusClass = item.status === 'Original' ? 'status-original' : 'status-modified';
        }
        
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.category || '-'}</td>
                <td>${item.version || '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusDisplay}</span></td>
                <td>${formattedDate}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon" onclick="editItem('${type}', ${item.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon danger" onclick="deleteItem('${type}', ${item.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Open item form
function openItemForm(type) {
    currentEditingItem = null;
    currentEditingType = type;
    
    document.getElementById('formModalTitle').textContent = 'Add New Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemType').value = type;
    
    // Load categories for this type
    loadFormCategories(type);
    
    // Toggle fields visibility based on type
    toggleFormFields(type);
    
    document.getElementById('itemFormModal').classList.add('active');
}

// Load form categories
function loadFormCategories(type) {
    const categories = db.getCategories(type);
    const select = document.getElementById('itemCategory');
    
    select.innerHTML = '<option value="">Select Category</option>' + 
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Edit item
function editItem(type, id) {
    const items = db.getItems(type);
    const item = items.find(i => i.id == id);
    
    if (!item) return;
    
    currentEditingItem = item;
    currentEditingType = type;
    
    document.getElementById('formModalTitle').textContent = 'Edit Item';
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemType').value = type;
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemVersion').value = item.version || '';
    document.getElementById('itemSize').value = item.size || '';
    document.getElementById('itemShortDesc').value = item.shortDesc || '';
    document.getElementById('itemFullDesc').value = item.fullDesc || '';
    document.getElementById('itemIcon').value = item.icon || '';
    document.getElementById('itemStatus').value = item.status || 'Original';
    document.getElementById('itemScreenshots').value = (item.screenshots || []).join('\n');
    document.getElementById('itemFeatures').value = (item.features || []).join('\n');
    document.getElementById('itemRequirements').value = item.requirements || '';
    document.getElementById('itemOriginalLink').value = item.originalLink || '';
    document.getElementById('itemModifiedLink').value = item.modifiedLink || '';
    document.getElementById('itemWebsite').value = item.website || '';
    document.getElementById('itemNote').value = item.note || '';
    
    // Handle FRP-specific fields
    if (type === 'frpApps') {
        document.getElementById('frpType').value = item.frpType || 'direct';
        document.getElementById('itemDirectLink').value = item.directLink || '';
        document.getElementById('itemDownloadLink').value = item.downloadLink || '';
    }
    
    // Load categories and set selected
    loadFormCategories(type);
    document.getElementById('itemCategory').value = item.category || '';
    
    // Set note color
    document.querySelectorAll('input[name="noteColor"]').forEach(radio => {
        radio.checked = radio.value === (item.noteColor || 'orange');
    });
    
    // Toggle fields visibility based on type
    toggleFormFields(type);
    
    document.getElementById('itemFormModal').classList.add('active');
    
    // Auto-resize textareas after loading data
    setTimeout(() => {
        document.querySelectorAll('textarea[oninput*="autoResize"]').forEach(textarea => {
            autoResize(textarea);
        });
    }, 100);
}

// Toggle form fields visibility based on item type
function toggleFormFields(type) {
    const isFrpApp = type === 'frpApps';
    
    // Get form sections
    const statusGroup = document.getElementById('itemStatus').closest('.form-group');
    const fullDescSection = document.getElementById('itemFullDesc').closest('.form-row');
    const screenshotsSection = document.getElementById('itemScreenshots').closest('.form-row');
    const featuresSection = document.querySelector('.form-section:has(#itemFeatures)');
    const websiteGroup = document.getElementById('itemWebsite').closest('.form-row');
    const notesSection = document.querySelector('.form-section:has(#itemNote)');
    
    // Get FRP-specific elements
    const frpTypeGroup = document.getElementById('frpTypeGroup');
    const versionGroup = document.getElementById('versionGroup');
    const sizeGroup = document.getElementById('sizeGroup');
    
    // Get download link groups
    const originalLinkGroup = document.getElementById('originalLinkGroup');
    const modifiedLinkGroup = document.getElementById('modifiedLinkGroup');
    const directLinkGroup = document.getElementById('directLinkGroup');
    const downloadLinkGroup = document.getElementById('downloadLinkGroup');
    
    // Hide/show based on type
    if (statusGroup) statusGroup.style.display = isFrpApp ? 'none' : '';
    if (fullDescSection) fullDescSection.style.display = isFrpApp ? 'none' : '';
    if (screenshotsSection) screenshotsSection.style.display = isFrpApp ? 'none' : '';
    if (featuresSection) featuresSection.style.display = isFrpApp ? 'none' : '';
    if (websiteGroup) websiteGroup.style.display = isFrpApp ? 'none' : '';
    if (notesSection) notesSection.style.display = isFrpApp ? 'none' : '';
    
    // FRP specific fields
    if (frpTypeGroup) frpTypeGroup.style.display = isFrpApp ? '' : 'none';
    
    if (isFrpApp) {
        // Hide original/modified links for FRP
        if (originalLinkGroup) originalLinkGroup.style.display = 'none';
        if (modifiedLinkGroup) modifiedLinkGroup.style.display = 'none';
        
        // Set default FRP type and toggle fields
        document.getElementById('frpType').value = 'direct';
        toggleFrpFields();
    } else {
        // Show original/modified links for non-FRP
        if (originalLinkGroup) originalLinkGroup.style.display = '';
        if (modifiedLinkGroup) modifiedLinkGroup.style.display = '';
        if (directLinkGroup) directLinkGroup.style.display = 'none';
        if (downloadLinkGroup) downloadLinkGroup.style.display = 'none';
        if (versionGroup) versionGroup.style.display = '';
        if (sizeGroup) sizeGroup.style.display = '';
    }
}

// Toggle FRP fields based on selected type
function toggleFrpFields() {
    const frpType = document.getElementById('frpType').value;
    const isDirect = frpType === 'direct';
    
    const versionGroup = document.getElementById('versionGroup');
    const sizeGroup = document.getElementById('sizeGroup');
    const directLinkGroup = document.getElementById('directLinkGroup');
    const downloadLinkGroup = document.getElementById('downloadLinkGroup');
    
    // Toggle based on FRP type
    if (versionGroup) versionGroup.style.display = isDirect ? 'none' : '';
    if (sizeGroup) sizeGroup.style.display = isDirect ? 'none' : '';
    if (directLinkGroup) directLinkGroup.style.display = isDirect ? '' : 'none';
    if (downloadLinkGroup) downloadLinkGroup.style.display = isDirect ? 'none' : '';
}

// Delete item
async function deleteItem(type, id) {
    const confirmed = await customConfirm('هل أنت متأكد من حذف هذا العنصر؟', 'تأكيد الحذف');
    if (!confirmed) return;
    
    db.deleteItem(type, id);
    loadTable(type, `${type}Table`);
    loadDashboard();
    markUnsaved();
}

// Save item
function saveItem(e) {
    e.preventDefault();
    
    const type = document.getElementById('itemType').value;
    const id = document.getElementById('itemId').value;
    
    const item = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        version: document.getElementById('itemVersion').value,
        size: document.getElementById('itemSize').value,
        shortDesc: document.getElementById('itemShortDesc').value,
        fullDesc: document.getElementById('itemFullDesc').value,
        icon: document.getElementById('itemIcon').value,
        status: document.getElementById('itemStatus').value,
        screenshots: document.getElementById('itemScreenshots').value.split('\n').filter(s => s.trim()),
        features: document.getElementById('itemFeatures').value.split('\n').filter(f => f.trim()),
        requirements: document.getElementById('itemRequirements').value,
        originalLink: document.getElementById('itemOriginalLink').value,
        modifiedLink: document.getElementById('itemModifiedLink').value,
        website: document.getElementById('itemWebsite').value,
        note: document.getElementById('itemNote').value,
        noteColor: document.querySelector('input[name="noteColor"]:checked')?.value || 'orange'
    };
    
    // Handle FRP-specific fields
    if (type === 'frpApps') {
        item.frpType = document.getElementById('frpType').value;
        item.directLink = document.getElementById('itemDirectLink').value;
        item.downloadLink = document.getElementById('itemDownloadLink').value;
    }
    
    if (id) {
        db.updateItem(type, id, item);
    } else {
        db.addItem(type, item);
    }
    
    closeItemForm();
    loadTable(type, `${type}Table`);
    loadDashboard();
    markUnsaved();
}

// Close item form
function closeItemForm() {
    document.getElementById('itemFormModal').classList.remove('active');
    currentEditingItem = null;
    currentEditingType = null;
}

// Load categories management
function loadCategories() {
    loadCategoryList('windowsPrograms', 'winProgramsCategoriesList');
    loadCategoryList('windowsGames', 'winGamesCategoriesList');
    loadCategoryList('androidApps', 'androidAppsCategoriesList');
    loadCategoryList('androidGames', 'androidGamesCategoriesList');
    loadCategoryList('phoneTools', 'phoneToolsCategoriesList');
    loadCategoryList('frpApps', 'frpAppsCategoriesList');
}

// Load category list
function loadCategoryList(type, listId) {
    const categories = db.getCategories(type);
    const list = document.getElementById(listId);
    
    if (!list) return;
    
    if (categories.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary);">No categories</p>';
        return;
    }
    
    list.innerHTML = categories.map((cat, index) => `
        <div class="category-item" data-category="${cat}">
            <input type="text" class="category-edit-input" value="${cat}" data-original="${cat}" onblur="updateCategory('${type}', this)" />
            <div class="category-actions">
                <button class="edit-category" onclick="editCategoryInput(this)" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-category" onclick="removeCategory('${type}', '${cat}')" title="Delete">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Edit category input
function editCategoryInput(btn) {
    const item = btn.closest('.category-item');
    const input = item.querySelector('.category-edit-input');
    input.focus();
    input.select();
}

// Update category
function updateCategory(type, input) {
    const oldValue = input.dataset.original;
    const newValue = input.value.trim();
    
    if (!newValue) {
        customAlert('error', 'اسم الفئة لا يمكن أن يكون فارغاً');
        input.value = oldValue;
        return;
    }
    
    if (newValue === oldValue) return;
    
    // Check if new name already exists
    const categories = db.getCategories(type);
    if (categories.includes(newValue)) {
        customAlert('warning', 'هذه الفئة موجودة بالفعل');
        input.value = oldValue;
        return;
    }
    
    // Update category
    db.deleteCategory(type, oldValue);
    db.addCategory(type, newValue);
    
    // Update all items with this category
    const items = db.getItems(type);
    items.forEach(item => {
        if (item.category === oldValue) {
            db.updateItem(type, item.id, { ...item, category: newValue });
        }
    });
    
    input.dataset.original = newValue;
    loadCategories();
    loadAllTables();
    markUnsaved();
}

// Filter categories
function filterCategories(listId, searchTerm) {
    const list = document.getElementById(listId);
    const items = list.querySelectorAll('.category-item');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
        const category = item.dataset.category.toLowerCase();
        if (category.includes(term)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Add category
function addCategory(type) {
    let inputId;
    switch(type) {
        case 'windowsPrograms': inputId = 'newWinProgramsCategory'; break;
        case 'windowsGames': inputId = 'newWinGamesCategory'; break;
        case 'androidApps': inputId = 'newAndroidAppsCategory'; break;
        case 'androidGames': inputId = 'newAndroidGamesCategory'; break;
        case 'phoneTools': inputId = 'newPhoneToolsCategory'; break;
        case 'frpApps': inputId = 'newFrpAppsCategory'; break;
        default: return;
    }
    
    const input = document.getElementById(inputId);
    const category = input.value.trim();
    
    if (!category) {
        customAlert('error', 'الرجاء إدخال اسم الفئة');
        return;
    }
    
    db.addCategory(type, category);
    input.value = '';
    loadCategoryList(type, `${inputId.replace('new', '').replace('Category', 'CategoriesList')}`);
    markUnsaved();
}

// Remove category
async function removeCategory(type, category) {
    const confirmed = await customConfirm(`حذف الفئة "${category}"؟`);
    if (!confirmed) return;
    
    db.deleteCategory(type, category);
    loadCategories();
    markUnsaved();
}

// Load Account Info
function loadAccountInfo() {
    const loginData = localStorage.getItem('falconx_github_settings');
    if (!loginData) return;
    
    const data = JSON.parse(loginData);
    const settings = db.getSettings();
    
    // Display current info
    document.getElementById('currentUsername').textContent = data.githubUsername || '-';
    document.getElementById('currentRepo').textContent = data.githubRepo || '-';
    
    // Display login time
    if (data.loginTime) {
        const loginTime = new Date(data.loginTime);
        document.getElementById('loginTime').textContent = loginTime.toLocaleString();
        
        // Calculate session expiry
        const expiryTime = new Date(loginTime.getTime() + 24 * 60 * 60 * 1000);
        document.getElementById('sessionExpiry').textContent = expiryTime.toLocaleString();
    }
    
    // Load Groq API Key
    document.getElementById('groqApiKey').value = settings.groqApiKey || '';
}

// Load GitHub Settings (legacy name for compatibility)
function loadGithubSettings() {
    loadAccountInfo();
}

// Save Groq API Key
function saveGroqApiKey() {
    const apiKey = document.getElementById('groqApiKey').value;
    
    if (!apiKey) {
        customAlert('error', 'الرجاء إدخال مفتاح Groq API');
        return;
    }
    
    const settings = db.getSettings();
    settings.groqApiKey = apiKey;
    db.saveSettings(settings);
    customAlert('success', 'تم حفظ مفتاح API بنجاح!');
}

// Auto-fill item data using Groq AI
async function autoFillItemData() {
    const itemName = document.getElementById('itemName').value.trim();
    const itemType = document.getElementById('itemType').value;
    
    if (!itemName) {
        customAlert('error', 'الرجاء إدخال اسم العنصر أولاً');
        return;
    }
    
    const settings = db.getSettings();
    const apiKey = settings.groqApiKey;
    
    if (!apiKey) {
        const confirmed = await customConfirm('مفتاح Groq API غير موجود. هل تريد إعداده الآن؟', 'مفتاح API مفقود');
        if (confirmed) {
            switchSection('account-info');
        }
        return;
    }
    
    const btn = document.getElementById('autoFillBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    try {
        // Get available categories for this type
        const categories = db.getCategories(itemType);
        const categoriesList = categories.join(', ');
        
        // Determine item category for better context
        let itemCategory = 'software';
        if (itemType.includes('Games')) itemCategory = 'game';
        if (itemType.includes('Tools')) itemCategory = 'tool';
        if (itemType === 'frpApps') itemCategory = 'FRP bypass tool';
        
        const prompt = `You are a software information expert. Provide accurate and concise information about "${itemName}" (${itemCategory}).

Available categories: ${categoriesList}

Return ONLY a valid JSON object with these fields:
{
  "category": "choose the most appropriate category from the list above",
  "version": "latest stable version number",
  "size": "approximate file size (e.g., 50 MB, 1.2 GB)",
  "shortDesc": "brief one-line description (max 100 chars)",
  "fullDesc": "detailed description (2-3 sentences)",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4"],
  "requirements": [
    "OS: Operating system requirement",
    "Processor: CPU requirement",
    "Memory: RAM requirement",
    "Storage: Disk space requirement",
    "Graphics: GPU requirement (if applicable)",
    "Additional: Other requirements"
  ],
  "website": "official website URL"
}

IMPORTANT:
- Choose category from the provided list ONLY
- Format requirements as an array, each item on separate line
- Return ONLY the JSON object, no additional text or markdown formatting`;
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1200
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Parse JSON response
        let jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from AI');
        }
        
        const itemData = JSON.parse(jsonMatch[0]);
        
        // Fill form fields
        if (itemData.category && categories.includes(itemData.category)) {
            document.getElementById('itemCategory').value = itemData.category;
        }
        if (itemData.version) document.getElementById('itemVersion').value = itemData.version;
        if (itemData.size) document.getElementById('itemSize').value = itemData.size;
        if (itemData.shortDesc) document.getElementById('itemShortDesc').value = itemData.shortDesc;
        if (itemData.fullDesc) document.getElementById('itemFullDesc').value = itemData.fullDesc;
        if (itemData.features && Array.isArray(itemData.features)) {
            document.getElementById('itemFeatures').value = itemData.features.join('\n');
        }
        if (itemData.requirements) {
            // Format requirements professionally - each item on a new line
            const reqText = Array.isArray(itemData.requirements) 
                ? itemData.requirements.join('\n')
                : itemData.requirements;
            document.getElementById('itemRequirements').value = reqText;
        }
        if (itemData.website) document.getElementById('itemWebsite').value = itemData.website;
        
        // Auto-resize textareas
        document.querySelectorAll('textarea[oninput*="autoResize"]').forEach(textarea => {
            autoResize(textarea);
        });
        
        customAlert('success', 'تم جلب المعلومات بنجاح! يرجى المراجعة والتعديل حسب الحاجة.');
        
    } catch (error) {
        console.error('Auto-fill error:', error);
        customAlert('error', 'خطأ في جلب البيانات: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Open GitHub repo
function openGithubRepo() {
    const settings = db.getSettings();
    if (settings.githubUsername && settings.githubRepo) {
        window.open(`https://github.com/${settings.githubUsername}/${settings.githubRepo}`, '_blank');
    }
}

// Load from GitHub
async function loadFromGithub() {
    const settings = db.getSettings();
    
    if (!settings.githubToken || !settings.githubUsername || !settings.githubRepo) {
        customAlert('error', 'الرجاء إعداد إعدادات الحساب أولاً');
        switchSection('account-info');
        return;
    }
    
    const confirmed = await customConfirm('سيتم استبدال جميع البيانات الحالية بالبيانات من المشروع. هل تريد المتابعة؟', 'تحميل من المشروع');
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${settings.githubUsername}/${settings.githubRepo}/contents/data.json`,
            {
                headers: {
                    'Authorization': `token ${settings.githubToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('File not found on GitHub or access denied');
        }
        
        const fileData = await response.json();
        const content = atob(fileData.content);
        const data = JSON.parse(content);
        
        db.importData(data);
        loadDashboard();
        loadAllTables();
        loadCategories();
        customAlert('success', 'تم تحميل البيانات بنجاح!');
        setTimeout(() => location.reload(), 1500);
        
    } catch (error) {
        customAlert('error', 'خطأ في التحميل: ' + error.message);
    }
}

// Save to GitHub
async function saveToGithub() {
    const settings = db.getSettings();
    
    if (!settings.githubToken || !settings.githubUsername || !settings.githubRepo) {
        customAlert('error', 'الرجاء إعداد إعدادات الحساب أولاً');
        switchSection('account-info');
        return;
    }
    
    // Show loading indicator
    const saveBtn = document.getElementById('saveChangesBtn');
    const originalBtnHtml = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    
    // Attempt save with retry on SHA mismatch
    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    
    while (attempt < maxRetries && !success) {
        try {
            attempt++;
            if (attempt > 1) {
                console.log(`Retry attempt ${attempt}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
            }
            
            const data = db.exportData(false); // Exclude secrets
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
            
            // Get fresh SHA
            let sha = null;
            const getResponse = await fetch(
                `https://api.github.com/repos/${settings.githubUsername}/${settings.githubRepo}/contents/data.json`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${settings.githubToken}`,
                        'Accept': 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }
            );
            
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }
            
            // Create or update file
            const body = {
                message: 'Update data from admin panel',
                content: content,
                branch: 'main'
            };
            
            if (sha) {
                body.sha = sha;
            }
            
            const saveResponse = await fetch(
                `https://api.github.com/repos/${settings.githubUsername}/${settings.githubRepo}/contents/data.json`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${settings.githubToken}`,
                        'Accept': 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                }
            );
            
            if (!saveResponse.ok) {
                const errorData = await saveResponse.json();
                
                // If SHA mismatch and we have retries left, continue loop
                if (errorData.message && errorData.message.includes('does not match') && attempt < maxRetries) {
                    console.log('SHA mismatch, retrying...');
                    continue;
                }
                
                throw new Error(errorData.message || 'فشل الحفظ');
            }
            
            // Success!
            success = true;
            markSaved();
            customAlert('success', 'تم حفظ البيانات على GitHub بنجاح! ✓');
            
        } catch (error) {
            if (attempt >= maxRetries) {
                console.error('Save error:', error);
                customAlert('error', 'خطأ في الحفظ: ' + error.message);
            }
        }
    }
    
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalBtnHtml;
}

// Export data
function exportData() {
    const data = db.exportData(true); // Include secrets for local export
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `falconx-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// Import data
function importData(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            customConfirm('سيتم استبدال جميع البيانات الحالية. هل تريد المتابعة؟', 'استيراد البيانات').then(confirmed => {
                if (confirmed) {
                    db.importData(data);
                    loadDashboard();
                    loadAllTables();
                    loadCategories();
                    customAlert('success', 'تم استيراد البيانات بنجاح!');
                    setTimeout(() => location.reload(), 1500);
                }
            });
        } catch (error) {
            customAlert('error', 'خطأ في الاستيراد: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Auto resize textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Initialize textareas with auto-resize
document.addEventListener('DOMContentLoaded', function() {
    // Apply auto-resize to all textareas on page load
    document.querySelectorAll('textarea[oninput*="autoResize"]').forEach(textarea => {
        autoResize(textarea);
    });
});

// Logout function
async function logout() {
    if (unsavedChanges) {
        const confirmed = await customConfirm('لديك تغييرات غير محفوظة. هل أنت متأكد من تسجيل الخروج؟', 'تسجيل الخروج');
        if (!confirmed) {
            return;
        }
    }
    
    localStorage.removeItem('falconx_github_settings');
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});
