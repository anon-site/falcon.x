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
    
    const isFrp = type === 'frpApps';
    
    tbody.innerHTML = items.map(item => {
        const date = new Date(item.lastModified);
        const formattedDate = date.toLocaleDateString();
        
        // For FRP apps, show FRP Type instead of Status
        let statusDisplay = '';
        if (isFrp) {
            const frpType = item.frpType || 'direct';
            const typeClass = frpType === 'direct' ? 'status-direct' : 'status-download';
            const typeLabel = frpType === 'direct' ? 'Direct' : 'Download';
            statusDisplay = `<span class="status-badge ${typeClass}">${typeLabel}</span>`;
        } else {
            const statusClass = item.status === 'Original' ? 'status-original' : 'status-modified';
            statusDisplay = `<span class="status-badge ${statusClass}">${item.status}</span>`;
        }
        
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.category || '-'}</td>
                <td>${item.version || '-'}</td>
                <td>${statusDisplay}</td>
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
    
    // Show/hide FRP fields
    toggleFrpFieldsVisibility(type);
    
    const modal = document.getElementById('itemFormModal');
    modal.classList.add('active');
    
    // Reset scroll to top
    setTimeout(() => {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
        // Also try scrolling the form itself
        const form = document.getElementById('itemForm');
        if (form) {
            form.scrollTop = 0;
        }
    }, 100);
}

// Toggle FRP fields visibility based on type
function toggleFrpFieldsVisibility(type) {
    const isFrp = type === 'frpApps';
    document.getElementById('frpTypeGroup').style.display = isFrp ? 'block' : 'none';
    
    if (isFrp) {
        // Hide unnecessary fields for FRP
        document.getElementById('fullDescRow').style.display = 'none';
        document.getElementById('screenshotsRow').style.display = 'none';
        document.getElementById('featuresSection').style.display = 'none';
        document.getElementById('notesSection').style.display = 'none';
        document.getElementById('regularDownloadLinksRow').style.display = 'none';
        toggleFrpFields();
    } else {
        // Show all fields for non-FRP items
        document.getElementById('fullDescRow').style.display = 'flex';
        document.getElementById('screenshotsRow').style.display = 'flex';
        document.getElementById('featuresSection').style.display = 'block';
        document.getElementById('notesSection').style.display = 'block';
        document.getElementById('versionGroup').style.display = 'block';
        document.getElementById('sizeGroup').style.display = 'block';
        document.getElementById('statusGroup').style.display = 'block';
        document.getElementById('directLinkRow').style.display = 'none';
        document.getElementById('downloadLinkRow').style.display = 'none';
        document.getElementById('regularDownloadLinksRow').style.display = 'flex';
        document.getElementById('websiteRow').style.display = 'flex';
        
        // Reset section title
        const sectionTitle = document.getElementById('linksSectionTitle');
        sectionTitle.innerHTML = '<i class="fas fa-download"></i> Download Links';
    }
}

// Toggle FRP fields based on selected type
function toggleFrpFields() {
    const frpType = document.getElementById('itemFrpType').value;
    const isDirect = frpType === 'direct';
    
    // Toggle version and size fields
    document.getElementById('versionGroup').style.display = isDirect ? 'none' : 'block';
    document.getElementById('sizeGroup').style.display = isDirect ? 'none' : 'block';
    document.getElementById('statusGroup').style.display = isDirect ? 'none' : 'block';
    
    // Update section title
    const sectionTitle = document.getElementById('linksSectionTitle');
    sectionTitle.innerHTML = isDirect ? '<i class="fas fa-external-link-alt"></i> Direct Link' : '<i class="fas fa-download"></i> Download Link';
    
    // Toggle link fields for FRP (hide website for FRP)
    document.getElementById('directLinkRow').style.display = isDirect ? 'flex' : 'none';
    document.getElementById('downloadLinkRow').style.display = isDirect ? 'none' : 'flex';
    document.getElementById('websiteRow').style.display = 'none';
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
    
    // FRP specific fields
    if (type === 'frpApps') {
        document.getElementById('itemFrpType').value = item.frpType || 'direct';
        document.getElementById('itemDirectLink').value = item.directLink || '';
    }
    
    // Load categories and set selected
    loadFormCategories(type);
    document.getElementById('itemCategory').value = item.category || '';
    
    // Set note color
    document.querySelectorAll('input[name="noteColor"]').forEach(radio => {
        radio.checked = radio.value === (item.noteColor || 'orange');
    });
    
    // Show/hide FRP fields
    toggleFrpFieldsVisibility(type);
    
    const modal = document.getElementById('itemFormModal');
    modal.classList.add('active');
    
    // Reset scroll to top
    setTimeout(() => {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
        // Also try scrolling the form itself
        const form = document.getElementById('itemForm');
        if (form) {
            form.scrollTop = 0;
        }
    }, 100);
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
    
    // Add FRP specific fields
    if (type === 'frpApps') {
        item.frpType = document.getElementById('itemFrpType').value;
        item.directLink = document.getElementById('itemDirectLink').value;
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
    
    list.innerHTML = categories.map(cat => `
        <div class="category-item">
            <span>${cat}</span>
            <button class="delete-category" onclick="removeCategory('${type}', '${cat}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
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
    
    if (settings.githubUsername && settings.githubRepo) {
        document.getElementById('githubUsername').value = settings.githubUsername;
        document.getElementById('githubRepo').value = settings.githubRepo;
        document.getElementById('githubInfo').style.display = 'block';
    }
}

// Validate GitHub token
async function validateGithubToken() {
    const token = document.getElementById('githubToken').value;
    
    if (!token) {
        alert('Please enter a GitHub token');
        return;
    }
    
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        
        if (!response.ok) {
            alert('Invalid token or network error');
            return;
        }
        
        const userData = await response.json();
        
        // Get repositories
        const reposResponse = await fetch('https://api.github.com/user/repos', {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        
        const repos = await reposResponse.json();
        
        // Assume first repo or create logic to select
        const repo = repos[0];
        
        document.getElementById('githubUsername').value = userData.login;
        document.getElementById('githubRepo').value = repo ? repo.name : '';
        document.getElementById('githubInfo').style.display = 'block';
        
        alert('Token validated successfully!');
    } catch (error) {
        alert('Error validating token: ' + error.message);
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

// Open GitHub repo
function openGithubRepo() {
    const settings = db.getSettings();
    if (settings.githubUsername && settings.githubRepo) {
        window.open(`https://github.com/${settings.githubUsername}/${settings.githubRepo}`, '_blank');
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
            alert('Data saved to GitHub successfully!');
        } else {
            alert('Error saving to GitHub: ' + response.statusText);
        }
    } catch (error) {
        alert('Error: ' + error.message);
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

// Search table
function searchTable(type, tableId) {
    const searchId = `search${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const searchTerm = document.getElementById(searchId).value.toLowerCase();
    const items = db.getItems(type);
    
    const filtered = items.filter(item => {
        return item.name.toLowerCase().includes(searchTerm) ||
               (item.category && item.category.toLowerCase().includes(searchTerm)) ||
               (item.version && item.version.toLowerCase().includes(searchTerm));
    });
    
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No results found</td></tr>';
        return;
    }
    
    const isFrp = type === 'frpApps';
    
    tbody.innerHTML = filtered.map(item => {
        const date = new Date(item.lastModified);
        const formattedDate = date.toLocaleDateString();
        
        let statusDisplay = '';
        if (isFrp) {
            const frpType = item.frpType || 'direct';
            const typeClass = frpType === 'direct' ? 'status-direct' : 'status-download';
            const typeLabel = frpType === 'direct' ? 'Direct' : 'Download';
            statusDisplay = `<span class="status-badge ${typeClass}">${typeLabel}</span>`;
        } else {
            const statusClass = item.status === 'Original' ? 'status-original' : 'status-modified';
            statusDisplay = `<span class="status-badge ${statusClass}">${item.status}</span>`;
        }
        
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.category || '-'}</td>
                <td>${item.version || '-'}</td>
                <td>${statusDisplay}</td>
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

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});
