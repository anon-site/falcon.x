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
function deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
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
    
    db.addCategory(type, category);
    input.value = '';
    loadCategoryList(type, `${inputId.replace('new', '').replace('Category', 'CategoriesList')}`);
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
        
        alert('✅ Information fetched successfully! Please review and adjust as needed.');
        
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
        alert('Please configure GitHub settings first');
        switchSection('github-settings');
        return;
    }
    
    if (!confirm('This will replace all current data with data from GitHub. Continue?')) {
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
        alert('✅ Data loaded from GitHub successfully!');
        location.reload();
        
    } catch (error) {
        alert('❌ Error loading from GitHub: ' + error.message);
    }
}

// Save to GitHub
async function saveToGithub() {
    const settings = db.getSettings();
    
    if (!settings.githubToken || !settings.githubUsername || !settings.githubRepo) {
        alert('Please configure GitHub settings first');
        switchSection('github-settings');
        return;
    }
    
    const data = db.exportData();
    const content = btoa(JSON.stringify(data, null, 2));
    
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
            markSaved();
            alert('✅ Data saved to GitHub successfully!');
        } else {
            throw new Error(response.statusText);
        }
    } catch (error) {
        alert('❌ Error saving to GitHub: ' + error.message);
    }
}

// Export data
function exportData() {
    const data = db.exportData();
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
            if (confirm('This will replace all current data. Continue?')) {
                db.importData(data);
                loadDashboard();
                loadAllTables();
                loadCategories();
                alert('Data imported successfully!');
                location.reload();
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
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

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});
