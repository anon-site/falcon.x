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
    initSaveButton();
});

// Initialize save button status
function initSaveButton() {
    // Hide save section on load
    const saveSection = document.querySelector('.save-section');
    if (saveSection) {
        saveSection.classList.remove('has-changes');
    }
    
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (indicator && statusText) {
        indicator.classList.add('saved');
        statusText.textContent = 'All Saved';
    }
}

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

// Track number of changes
let changesCount = 0;

// Mark unsaved changes
function markUnsaved() {
    unsavedChanges = true;
    changesCount++;
    
    // Show save section
    const saveSection = document.querySelector('.save-section');
    if (saveSection) {
        saveSection.classList.add('has-changes');
    }
    
    // Update status indicator
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const changesCountEl = document.getElementById('changesCount');
    
    indicator.classList.remove('saved');
    indicator.classList.add('unsaved');
    indicator.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
    
    statusText.textContent = 'Unsaved Changes';
    statusText.classList.add('unsaved');
    
    changesCountEl.textContent = `${changesCount} change${changesCount > 1 ? 's' : ''}`;
    changesCountEl.style.display = 'inline-block';
    
    // Pulse the save button
    const saveBtn = document.getElementById('saveChangesBtn');
    saveBtn.style.animation = 'pulse 0.5s';
    setTimeout(() => {
        saveBtn.style.animation = '';
    }, 500);
}

function markSaved() {
    unsavedChanges = false;
    changesCount = 0;
    
    // Hide save section
    const saveSection = document.querySelector('.save-section');
    if (saveSection) {
        saveSection.classList.remove('has-changes');
    }
    
    // Update status indicator
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const changesCountEl = document.getElementById('changesCount');
    
    indicator.classList.remove('unsaved');
    indicator.classList.add('saved');
    indicator.innerHTML = '<i class="fas fa-check-circle"></i>';
    
    statusText.textContent = 'All Saved';
    statusText.classList.remove('unsaved');
    
    changesCountEl.style.display = 'none';
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
function deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    db.deleteItem(type, id);
    loadTable(type, `${type}Table`);
    loadDashboard();
    markUnsaved();
    
    showTempMessage('✅ Item deleted locally. Remember to save to GitHub!');
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
    
    let result;
    if (id) {
        result = db.updateItem(type, id, item);
    } else {
        result = db.addItem(type, item);
    }
    
    if (result === null) {
        alert('❌ Error: Item name is required!');
        return;
    }
    
    closeItemForm();
    loadTable(type, `${type}Table`);
    loadDashboard();
    markUnsaved();
    
    // Auto-save to localStorage (already done by db, but let's verify)
    console.log('✅ Item saved locally. Remember to "Save to GitHub"!');
    
    // Show temporary success message
    showTempMessage('✅ Item saved locally. Don\'t forget to save to GitHub!');
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
        alert('Category name cannot be empty');
        input.value = oldValue;
        return;
    }
    
    if (newValue === oldValue) return;
    
    // Check if new name already exists
    const categories = db.getCategories(type);
    if (categories.includes(newValue)) {
        alert('Category already exists');
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
        alert('Please enter a category name');
        return;
    }
    
    const result = db.addCategory(type, category);
    
    if (result === false) {
        alert('Category already exists or invalid');
        return;
    }
    
    input.value = '';
    loadCategoryList(type, `${inputId.replace('new', '').replace('Category', 'CategoriesList')}`);
    
    // Update the category dropdown in the item form if it's open and matches the current type
    const itemFormModal = document.getElementById('itemFormModal');
    const currentItemType = document.getElementById('itemType').value;
    if (itemFormModal.classList.contains('active') && currentItemType === type) {
        loadFormCategories(type);
    }
    
    markUnsaved();
}

// Remove category
function removeCategory(type, category) {
    if (!confirm(`Delete category "${category}"?`)) return;
    
    db.deleteCategory(type, category);
    loadCategories();
    markUnsaved();
}

// GitHub Settings
function loadGithubSettings() {
    const settings = db.getSettings();
    document.getElementById('githubToken').value = settings.githubToken || '';
    document.getElementById('groqApiKey').value = settings.groqApiKey || '';
    
    if (settings.githubUsername && settings.githubRepo) {
        document.getElementById('githubUsername').value = settings.githubUsername;
        // If token exists, re-validate to populate repos
        if (settings.githubToken) {
            validateGithubToken().then(() => {
                document.getElementById('githubRepo').value = settings.githubRepo;
            });
        }
    }
}

// Validate GitHub token
async function validateGithubToken() {
    const token = document.getElementById('githubToken').value.trim();
    
    if (!token) {
        alert('Please enter a GitHub token');
        return;
    }
    
    const btn = document.getElementById('validateTokenBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating...';
    
    try {
        // Validate token and get user info
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Invalid token or unauthorized');
        }
        
        const userData = await response.json();
        
        // Get user repositories
        const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        
        if (!reposResponse.ok) {
            throw new Error('Failed to fetch repositories');
        }
        
        const repos = await reposResponse.json();
        
        // Populate username
        document.getElementById('githubUsername').value = userData.login;
        
        // Populate repository dropdown
        const repoSelect = document.getElementById('githubRepo');
        repoSelect.innerHTML = '<option value="">Select a repository...</option>' + 
            repos.map(repo => `<option value="${repo.name}">${repo.name}</option>`).join('');
        
        // Show the info section
        document.getElementById('githubInfo').style.display = 'block';
        
        alert('✅ Token validated successfully!\n\nUsername: ' + userData.login + '\nRepositories found: ' + repos.length);
        
    } catch (error) {
        console.error('Validation error:', error);
        alert('❌ Error validating token: ' + error.message);
        document.getElementById('githubInfo').style.display = 'none';
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Save GitHub settings
function saveGithubSettings() {
    const settings = {
        githubToken: document.getElementById('githubToken').value,
        githubUsername: document.getElementById('githubUsername').value,
        githubRepo: document.getElementById('githubRepo').value
    };
    
    db.saveSettings(settings);
    alert('GitHub settings saved!');
}

// Save Groq API Key
function saveGroqApiKey() {
    const apiKey = document.getElementById('groqApiKey').value;
    
    if (!apiKey) {
        alert('Please enter a Groq API key');
        return;
    }
    
    const settings = db.getSettings();
    settings.groqApiKey = apiKey;
    db.saveSettings(settings);
    alert('Groq API key saved successfully!');
}

// Auto-fill item data using Groq AI
async function autoFillItemData() {
    const itemName = document.getElementById('itemName').value.trim();
    const itemType = document.getElementById('itemType').value;
    
    if (!itemName) {
        alert('Please enter an item name first');
        return;
    }
    
    const settings = db.getSettings();
    const apiKey = settings.groqApiKey;
    
    if (!apiKey) {
        if (confirm('Groq API key not found. Would you like to configure it now?')) {
            switchSection('github-settings');
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
        
        const prompt = `You are a software information expert. Provide the MOST RECENT and ACCURATE information about "${itemName}" (${itemCategory}).

Available categories: ${categoriesList}

Return ONLY a valid JSON object with these fields:
{
  "category": "choose the most appropriate category from the list above",
  "version": "LATEST stable version number as of 2025 (e.g., 2025.1, 5.0.2)",
  "size": "typical installer/download size (e.g., 150 MB, 2.5 GB)",
  "shortDesc": "one-line description highlighting main purpose (max 100 chars)",
  "fullDesc": "detailed description covering main features and use cases (2-3 sentences)",
  "features": ["specific feature 1", "specific feature 2", "specific feature 3", "specific feature 4"],
  "requirements": [
    "OS: Specific OS versions (e.g., Windows 10/11 64-bit)",
    "Processor: Minimum CPU (e.g., Intel i5 or AMD Ryzen 5)",
    "Memory: RAM requirement (e.g., 8 GB RAM minimum, 16 GB recommended)",
    "Storage: Disk space needed (e.g., 5 GB available space)",
    "Graphics: GPU if needed (e.g., DirectX 12 compatible)",
    "Additional: Other requirements (e.g., Internet connection for activation)"
  ],
  "website": "official website URL (must be accurate)"
}

CRITICAL RULES:
- Provide CURRENT 2025 version numbers when possible
- Be SPECIFIC, avoid generic descriptions
- Choose category from the provided list ONLY
- Provide realistic file sizes based on actual software
- Include specific, not generic, features
- Return ONLY the JSON object, no markdown code blocks or additional text`;
        
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
        
        // Show success message with important notice
        alert('✅ Information fetched successfully!\n\n⚠️ IMPORTANT:\n- Please review ALL fields carefully\n- Version number may need updating\n- File size is approximate\n- Verify official website link\n\nAI-generated data should be verified before saving.');
        
    } catch (error) {
        console.error('Auto-fill error:', error);
        alert('❌ Error fetching data: ' + error.message + '\n\nPlease fill the information manually or try again.');
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
        alert('❌ Please configure GitHub settings first');
        switchSection('github-settings');
        return;
    }
    
    // Get current data stats
    const currentStats = db.getDataStats();
    
    const confirmMsg = `Load from GitHub?\n\nCurrent local data:\n- Total items: ${currentStats.totalItems}\n\nThis will replace all current data.\n\nA backup will be created automatically.\n\nContinue?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Create backup before loading
    db.createBackup();
    console.log('✅ Backup created before loading');
    
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
            if (response.status === 404) {
                throw new Error('data.json not found in repository. Please save data first.');
            }
            throw new Error('Access denied or repository not found');
        }
        
        const fileData = await response.json();
        const content = atob(fileData.content);
        const data = JSON.parse(content);
        
        // Validate loaded data
        if (!db.validateData(data)) {
            throw new Error('Invalid data structure in GitHub file');
        }
        
        // Restore sensitive settings
        const currentSettings = db.getSettings();
        data.settings = {
            ...data.settings,
            githubToken: currentSettings.githubToken,
            groqApiKey: currentSettings.groqApiKey
        };
        
        db.importData(data);
        
        const newStats = db.getDataStats();
        alert(`✅ Data loaded successfully!\n\nTotal items: ${newStats.totalItems}\n\nPage will reload...`);
        
        loadDashboard();
        loadAllTables();
        loadCategories();
        
        setTimeout(() => location.reload(), 1000);
        
    } catch (error) {
        console.error('Load error:', error);
        alert('❌ Error loading from GitHub: ' + error.message + '\n\nYour local data is safe. Backup was created.');
        
        // Offer to restore backup
        if (confirm('Restore from backup?')) {
            if (db.restoreBackup()) {
                alert('✅ Backup restored');
                location.reload();
            }
        }
    }
}

// Save to GitHub
async function saveToGithub() {
    const settings = db.getSettings();
    const saveBtn = document.getElementById('saveChangesBtn');
    
    if (!settings.githubToken || !settings.githubUsername || !settings.githubRepo) {
        alert('❌ Please configure GitHub settings first');
        switchSection('github-settings');
        return;
    }
    
    // Validate data before saving
    const fullData = db.getData();
    if (!db.validateData(fullData)) {
        alert('❌ Data validation failed. Please check your data integrity.');
        return;
    }
    
    // Create backup before saving
    db.createBackup();
    console.log('✅ Backup created');
    
    console.log('Saving to GitHub:', settings.githubUsername + '/' + settings.githubRepo);
    
    const data = db.exportDataForGithub(); // Remove sensitive keys
    const jsonStr = JSON.stringify(data, null, 2);
    const sizeKB = (jsonStr.length / 1024).toFixed(2);
    console.log('Data size:', sizeKB + ' KB');
    
    // Check file size (GitHub API limit is 1MB)
    if (jsonStr.length > 1000000) {
        alert('❌ Data is too large (' + sizeKB + ' KB). GitHub API limit is ~1MB.\n\nPlease export data manually instead.');
        return;
    }
    
    const stats = db.getDataStats();
    const confirmMsg = `Save to GitHub?\n\nTotal items: ${stats.totalItems}\nData size: ${sizeKB} KB\n\nContinue?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Add loading state ONLY after confirmation
    saveBtn.classList.add('saving');
    const originalContent = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner"></i><span>Saving...</span>';
    
    const content = btoa(jsonStr);
    
    try {
        // Check if file exists
        const checkResponse = await fetch(
            `https://api.github.com/repos/${settings.githubUsername}/${settings.githubRepo}/contents/data.json`,
            {
                headers: {
                    'Authorization': `token ${settings.githubToken}`
                }
            }
        );
        
        let sha = null;
        if (checkResponse.ok) {
            const fileData = await checkResponse.json();
            sha = fileData.sha;
        }
        
        // Create or update file
        const response = await fetch(
            `https://api.github.com/repos/${settings.githubUsername}/${settings.githubRepo}/contents/data.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${settings.githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update data - ${new Date().toISOString()}`,
                    content: content,
                    sha: sha
                })
            }
        );
        
        if (response.ok) {
            // Remove loading state
            saveBtn.classList.remove('saving');
            saveBtn.innerHTML = originalContent;
            
            markSaved();
            
            // Clear visitor cache timestamp to force immediate update
            const cacheTimestampKey = 'falconx_data_timestamp';
            localStorage.removeItem(cacheTimestampKey);
            
            alert('✅ Data saved to GitHub successfully!\n\n🔄 Visitors will see updates within 30 seconds.');
        } else {
            const errorData = await response.json();
            throw new Error(`${response.status} - ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        // Remove loading state on error
        saveBtn.classList.remove('saving');
        saveBtn.innerHTML = originalContent;
        
        console.error('GitHub Save Error:', error);
        alert('❌ Error saving to GitHub: ' + error.message + '\n\nCheck console for details.');
    }
}

// Export data
function exportData() {
    try {
        const data = db.exportData();
        
        // Validate data before export
        if (!data || !db.validateData(data)) {
            alert('❌ Error: Invalid data structure. Cannot export.');
            return;
        }
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `falconx-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log('✅ Data exported successfully');
    } catch (error) {
        console.error('Export error:', error);
        alert('❌ Error exporting data: ' + error.message);
    }
}

// Import data
function importData(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10000000) {
        alert('❌ File is too large. Maximum size is 10MB.');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!db.validateData(data)) {
                throw new Error('Invalid data structure in imported file');
            }
            
            // Get stats
            const currentStats = db.getDataStats();
            const newItemsCount = (data.windowsPrograms?.length || 0) + 
                                 (data.windowsGames?.length || 0) + 
                                 (data.androidApps?.length || 0) + 
                                 (data.androidGames?.length || 0) + 
                                 (data.phoneTools?.length || 0) + 
                                 (data.frpApps?.length || 0);
            
            const confirmMsg = `Import data from file?\n\nCurrent: ${currentStats.totalItems} items\nNew: ${newItemsCount} items\n\nThis will replace all current data.\nBackup will be created.\n\nContinue?`;
            
            if (confirm(confirmMsg)) {
                // Create backup
                db.createBackup();
                
                // Preserve current settings
                const currentSettings = db.getSettings();
                
                // Ensure data.settings exists
                if (!data.settings) {
                    data.settings = {};
                }
                
                data.settings = {
                    ...data.settings,
                    githubToken: currentSettings.githubToken || data.settings.githubToken || '',
                    groqApiKey: currentSettings.groqApiKey || data.settings.groqApiKey || '',
                    githubUsername: currentSettings.githubUsername || data.settings.githubUsername || '',
                    githubRepo: currentSettings.githubRepo || data.settings.githubRepo || ''
                };
                
                const importResult = db.importData(data);
                
                if (!importResult) {
                    throw new Error('Failed to import data to localStorage');
                }
                
                loadDashboard();
                loadAllTables();
                loadCategories();
                alert(`✅ Data imported successfully!\n\nTotal items: ${newItemsCount}\n\nPage will reload...`);
                setTimeout(() => location.reload(), 1000);
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('❌ Error importing data: ' + error.message + '\n\nPlease check the file format.');
        }
        
        // Reset file input
        event.target.value = '';
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

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error caught:', e.error);
    // Optionally show user-friendly error message
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// Search table function
function searchTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = tbody.getElementsByTagName('tr');
    const term = searchTerm.toLowerCase().trim();
    
    let visibleCount = 0;
    
    // Loop through all table rows
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        // Check if row contains "No items found" message
        if (cells.length === 1 && cells[0].getAttribute('colspan')) {
            continue;
        }
        
        // Search in Name, Category, and Version columns (first 3 columns)
        for (let j = 0; j < Math.min(3, cells.length); j++) {
            const cellText = cells[j].textContent || cells[j].innerText;
            if (cellText.toLowerCase().indexOf(term) > -1) {
                found = true;
                break;
            }
        }
        
        // Show/hide row based on search
        if (found || term === '') {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    }
    
    // Show "No results found" message if no matches
    if (visibleCount === 0 && rows.length > 0 && term !== '') {
        // Check if "no results" row already exists
        let noResultsRow = tbody.querySelector('.no-results-row');
        if (!noResultsRow) {
            noResultsRow = tbody.insertRow(0);
            noResultsRow.className = 'no-results-row';
            const cell = noResultsRow.insertCell(0);
            cell.colSpan = 6;
            cell.style.textAlign = 'center';
            cell.style.color = 'var(--text-secondary)';
            cell.style.padding = '2rem';
            cell.innerHTML = '<i class="fas fa-search"></i> No results found for "' + searchTerm + '"';
        } else {
            noResultsRow.cells[0].innerHTML = '<i class="fas fa-search"></i> No results found for "' + searchTerm + '"';
            noResultsRow.style.display = '';
        }
    } else {
        // Remove "no results" row if it exists
        const noResultsRow = tbody.querySelector('.no-results-row');
        if (noResultsRow) {
            noResultsRow.style.display = 'none';
        }
    }
}

// Show temporary success message
function showTempMessage(message) {
    // Create or get existing message element
    let messageEl = document.getElementById('tempMessage');
    
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'tempMessage';
        messageEl.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 0.95rem;
            font-weight: 500;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        document.body.appendChild(messageEl);
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    messageEl.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    messageEl.style.display = 'block';
    messageEl.style.animation = 'slideIn 0.3s ease';
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 300);
    }, 3000);
}
