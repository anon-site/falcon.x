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
    
    // Reload data button
    document.getElementById('reloadDataBtn')?.addEventListener('click', reloadDataFromGithub);
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
    
    // Update counters
    setTimeout(() => {
        updateCharCounter('itemFullDesc', 'fullDescCounter');
        updateLineCounter('itemScreenshots', 'screenshotsCounter');
        updateLineCounter('itemFeatures', 'featuresCounter');
        updateCharCounter('itemRequirements', 'requirementsCounter');
    }, 100);
    
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

// Validate URL
function isValidURL(url) {
    if (!url) return true; // Empty is ok
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
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
    
    // Validate URLs
    const urlFields = ['icon', 'originalLink', 'modifiedLink', 'website'];
    for (const field of urlFields) {
        if (item[field] && !isValidURL(item[field])) {
            alert(`⚠️ Invalid URL in ${field}: ${item[field]}`);
            return;
        }
    }
    
    // Validate screenshots URLs
    for (const screenshot of item.screenshots) {
        if (!isValidURL(screenshot)) {
            alert(`⚠️ Invalid screenshot URL: ${screenshot}`);
            return;
        }
    }
    
    // Add FRP specific fields
    if (type === 'frpApps') {
        item.frpType = document.getElementById('itemFrpType').value;
        item.directLink = document.getElementById('itemDirectLink').value;
        
        // Validate FRP specific fields
        if (item.frpType === 'direct' && !item.directLink) {
            alert('⚠️ Direct Link is required for Direct type!');
            return;
        }
        if (item.frpType === 'download' && !item.originalLink) {
            alert('⚠️ Download Link is required for Download type!');
            return;
        }
        if (item.directLink && !isValidURL(item.directLink)) {
            alert(`⚠️ Invalid Direct Link: ${item.directLink}`);
            return;
        }
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

// Update character counter
function updateCharCounter(textareaId, counterId) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    if (textarea && counter) {
        const length = textarea.value.length;
        counter.textContent = `${length} character${length !== 1 ? 's' : ''}`;
    }
}

// Update line counter
function updateLineCounter(textareaId, counterId) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    if (textarea && counter) {
        const lines = textarea.value.split('\n').filter(line => line.trim()).length;
        counter.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
    }
}

// AI Auto-Fill with Groq
async function autoFillWithAI() {
    const settings = db.getSettings();
    const apiKey = settings.groqApiKey;
    
    if (!apiKey) {
        alert('⚠️ Please add your Groq API Key in GitHub Settings first!');
        switchSection('github-settings');
        return;
    }
    
    const name = document.getElementById('itemName').value.trim();
    if (!name) {
        alert('⚠️ Please enter the software/app name first!');
        document.getElementById('itemName').focus();
        return;
    }
    
    const type = document.getElementById('itemType').value;
    const isFrp = type === 'frpApps';
    
    // Show loading state
    const btn = event.target.closest('.btn-ai-fill');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    try {
        const softwareType = type.includes('windows') ? 'Windows software' : 
                           type.includes('android') ? 'Android app' : 
                           type === 'phoneTools' ? 'Phone tool' : 'software';
        
        const prompt = `You are a software information expert. Provide detailed and accurate information about "${name}" (${softwareType}) in JSON format.

Respond with this exact JSON structure:
{
  "shortDesc": "Brief one-line description (max 100 chars)",
  "fullDesc": "Detailed professional description (2-3 paragraphs explaining purpose, features, and benefits)",
  "category": "Most appropriate category from the available options",
  "version": "Latest stable version number (e.g., 2024.1, 14.5.2, leave empty if unknown)",
  "size": "Approximate download size (e.g., 150 MB, 45 MB, 2.5 GB)",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6"],
  "requirements": "System requirements formatted as:\nOS: ...\nProcessor: ...\nRAM: ...\nStorage: ...\nAdditional: ...",
  "iconUrl": "Direct URL to official PNG logo/icon (preferably 512x512 or higher, from official website or trusted CDN like icons8, imgur, or official site)",
  "screenshots": ["URL to screenshot 1", "URL to screenshot 2", "URL to screenshot 3"],
  "officialWebsite": "Official website URL (https://...)"
}

IMPORTANT RULES:
1. Provide REAL and ACCURATE URLs only
2. For iconUrl: Use official website favicon, or trusted sources like icons8.com, or imgur
3. For screenshots: Use real screenshots from official sources when possible
4. For officialWebsite: Provide the actual official website URL
5. Requirements must be formatted with line breaks (\\n)
6. Return ONLY valid JSON, no additional text
7. Ensure all information is factually correct`;
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.3,
                max_tokens: 2000
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format');
        }
        
        const aiData = JSON.parse(jsonMatch[0]);
        
        // Fill basic fields
        document.getElementById('itemShortDesc').value = aiData.shortDesc || '';
        document.getElementById('itemVersion').value = aiData.version || '';
        document.getElementById('itemSize').value = aiData.size || '';
        
        // Fill icon URL
        if (aiData.iconUrl) {
            document.getElementById('itemIcon').value = aiData.iconUrl;
        }
        
        // Fill official website
        if (aiData.officialWebsite && !isFrp) {
            document.getElementById('itemWebsite').value = aiData.officialWebsite;
        }
        
        // Fill screenshots
        if (aiData.screenshots && Array.isArray(aiData.screenshots) && !isFrp) {
            const validScreenshots = aiData.screenshots.filter(url => url && url.startsWith('http'));
            if (validScreenshots.length > 0) {
                document.getElementById('itemScreenshots').value = validScreenshots.join('\n');
                updateLineCounter('itemScreenshots', 'screenshotsCounter');
            }
        }
        
        // Fill detailed fields (skip for FRP apps)
        if (!isFrp) {
            document.getElementById('itemFullDesc').value = aiData.fullDesc || '';
            updateCharCounter('itemFullDesc', 'fullDescCounter');
            
            if (aiData.features && Array.isArray(aiData.features)) {
                document.getElementById('itemFeatures').value = aiData.features.join('\n');
                updateLineCounter('itemFeatures', 'featuresCounter');
            }
            
            // Format requirements with proper line breaks
            if (aiData.requirements) {
                document.getElementById('itemRequirements').value = aiData.requirements.replace(/\\n/g, '\n');
                updateCharCounter('itemRequirements', 'requirementsCounter');
            }
        }
        
        // Set category - try exact match first, then partial match
        const categorySelect = document.getElementById('itemCategory');
        const options = Array.from(categorySelect.options);
        let matchingOption = options.find(opt => 
            opt.value.toLowerCase() === aiData.category.toLowerCase()
        );
        
        // If no exact match, try partial match
        if (!matchingOption) {
            matchingOption = options.find(opt => 
                opt.value.toLowerCase().includes(aiData.category.toLowerCase()) ||
                aiData.category.toLowerCase().includes(opt.value.toLowerCase())
            );
        }
        
        if (matchingOption) {
            categorySelect.value = matchingOption.value;
        }
        
        alert('✅ AI Auto-Fill completed!\n\n📝 Filled:\n- Description & Features\n- Screenshots & Icon\n- Requirements\n- Official Website\n- Version & Size\n\nPlease review and edit as needed.');
        
    } catch (error) {
        console.error('AI Auto-Fill error:', error);
        alert('❌ Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
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
        <div class="category-item" style="display: flex;">
            <input type="text" class="category-name" value="${sanitizeCategoryName(cat)}" data-original="${sanitizeCategoryName(cat)}" onchange="updateCategory('${type}', '${sanitizeCategoryName(cat)}', this.value)">
            <button class="delete-category" onclick="removeCategory('${type}', '${sanitizeCategoryName(cat)}')" title="Delete">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // Clear any search and show all items
    const searchInput = list.parentElement.querySelector('.category-search');
    if (searchInput) {
        searchInput.value = '';
    }
}

// Sanitize category name for HTML attributes
function sanitizeCategoryName(name) {
    return name.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
}

// Unsanitize category name
function unsanitizeCategoryName(name) {
    return name.replace(/&apos;/g, "'").replace(/&quot;/g, '"');
}

// Update category
function updateCategory(type, oldName, newName) {
    oldName = unsanitizeCategoryName(oldName);
    newName = newName.trim();
    
    if (!newName) {
        alert('Category name cannot be empty!');
        loadCategories();
        return;
    }
    
    if (oldName === newName) return;
    
    const categories = db.getCategories(type);
    if (categories.includes(newName) && newName !== oldName) {
        alert('This category already exists!');
        loadCategories();
        return;
    }
    
    // Remove old and add new
    db.deleteCategory(type, oldName);
    db.addCategory(type, newName);
    
    // Update all items with this category
    const items = db.getItems(type);
    items.forEach(item => {
        if (item.category === oldName) {
            db.updateItem(type, item.id, { ...item, category: newName });
        }
    });
    
    loadCategories();
    loadAllTables();
    markUnsaved();
}

// Add category
function addCategory(type) {
    let inputId, listId;
    switch(type) {
        case 'windowsPrograms': 
            inputId = 'newWinProgramsCategory'; 
            listId = 'winProgramsCategoriesList';
            break;
        case 'windowsGames': 
            inputId = 'newWinGamesCategory'; 
            listId = 'winGamesCategoriesList';
            break;
        case 'androidApps': 
            inputId = 'newAndroidAppsCategory'; 
            listId = 'androidAppsCategoriesList';
            break;
        case 'androidGames': 
            inputId = 'newAndroidGamesCategory'; 
            listId = 'androidGamesCategoriesList';
            break;
        case 'phoneTools': 
            inputId = 'newPhoneToolsCategory'; 
            listId = 'phoneToolsCategoriesList';
            break;
        case 'frpApps': 
            inputId = 'newFrpAppsCategory'; 
            listId = 'frpAppsCategoriesList';
            break;
        default: return;
    }
    
    const input = document.getElementById(inputId);
    const category = input.value.trim();
    
    if (!category) {
        alert('Please enter a category name');
        return;
    }
    
    const categories = db.getCategories(type);
    if (categories.includes(category)) {
        alert('This category already exists!');
        return;
    }
    
    db.addCategory(type, category);
    input.value = '';
    loadCategoryList(type, listId);
    markUnsaved();
}

// Remove category
function removeCategory(type, category) {
    if (!confirm(`Delete category "${category}"?`)) return;
    
    db.deleteCategory(type, category);
    loadCategories();
    markUnsaved();
}

// Filter categories
function filterCategories(listId, searchTerm) {
    const list = document.getElementById(listId);
    if (!list) return;
    
    const items = list.querySelectorAll('.category-item');
    const term = searchTerm.toLowerCase().trim();
    let visibleCount = 0;
    
    items.forEach(item => {
        const input = item.querySelector('.category-name');
        const categoryName = input ? input.value.toLowerCase() : '';
        
        if (!term || categoryName.includes(term)) {
            item.style.display = 'flex';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show/hide "no results" message
    let noResultsMsg = list.querySelector('.no-results-message');
    if (visibleCount === 0 && term) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('p');
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.style.color = 'var(--text-secondary)';
            noResultsMsg.style.textAlign = 'center';
            noResultsMsg.style.padding = '1rem';
            noResultsMsg.innerHTML = '<i class="fas fa-search"></i> No categories found';
            list.appendChild(noResultsMsg);
        }
        noResultsMsg.style.display = 'block';
    } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

// GitHub Settings
function loadGithubSettings() {
    const settings = db.getSettings();
    document.getElementById('githubToken').value = settings.githubToken || '';
    document.getElementById('groqApiKey').value = settings.groqApiKey || '';
    
    if (settings.githubUsername && settings.githubRepo) {
        document.getElementById('githubUsername').value = settings.githubUsername;
        
        // Load repository select with saved repo
        const repoSelect = document.getElementById('githubRepo');
        repoSelect.innerHTML = '<option value="">Select a repository...</option>';
        
        // Add the saved repository as an option
        const savedRepoOption = document.createElement('option');
        savedRepoOption.value = settings.githubRepo;
        savedRepoOption.textContent = settings.githubRepo;
        savedRepoOption.selected = true;
        repoSelect.appendChild(savedRepoOption);
        
        document.getElementById('githubInfo').style.display = 'block';
        
        // Show info message
        console.log('✅ GitHub settings loaded:', settings.githubUsername, '/', settings.githubRepo);
    }
}

// Validate GitHub token
async function validateGithubToken() {
    const tokenInput = document.getElementById('githubToken');
    const token = tokenInput.value.trim();
    
    if (!token) {
        alert('Please enter a GitHub token');
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating...';
    
    try {
        // Validate token
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!userResponse.ok) {
            throw new Error('Invalid token or insufficient permissions');
        }
        
        const userData = await userResponse.json();
        
        // Fetch all repositories
        const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!reposResponse.ok) {
            throw new Error('Failed to fetch repositories');
        }
        
        const repos = await reposResponse.json();
        
        // Update UI
        document.getElementById('githubUsername').value = userData.login;
        
        const repoSelect = document.getElementById('githubRepo');
        repoSelect.innerHTML = '<option value="">Select a repository...</option>';
        
        if (repos && repos.length > 0) {
            repos.forEach(repo => {
                const option = document.createElement('option');
                option.value = repo.name;
                option.textContent = `${repo.name}${repo.private ? ' 🔒' : ''}`;
                repoSelect.appendChild(option);
            });
            
            document.getElementById('githubInfo').style.display = 'block';
            alert(`✅ Token validated! Found ${repos.length} repositories.`);
        } else {
            document.getElementById('githubInfo').style.display = 'block';
            alert('⚠️ No repositories found. Please create a repository on GitHub first.');
        }
        
    } catch (error) {
        alert('❌ Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Validate Token';
    }
}

// Save GitHub settings
function saveGithubSettings() {
    const githubToken = document.getElementById('githubToken').value.trim();
    const githubUsername = document.getElementById('githubUsername').value.trim();
    const githubRepo = document.getElementById('githubRepo').value.trim();
    const groqApiKey = document.getElementById('groqApiKey').value.trim();
    
    // Validation
    if (!githubToken) {
        alert('⚠️ Please enter a GitHub Token!');
        document.getElementById('githubToken').focus();
        return;
    }
    
    if (!githubUsername) {
        alert('⚠️ Please validate your GitHub Token first!\n\nClick "Validate Token" to load your username and repositories.');
        return;
    }
    
    if (!githubRepo) {
        alert('⚠️ Please select a repository!\n\nAfter validating your token, select the repository where data.json is stored.');
        document.getElementById('githubRepo').focus();
        return;
    }
    
    const settings = {
        githubToken: githubToken,
        githubUsername: githubUsername,
        githubRepo: githubRepo,
        groqApiKey: groqApiKey
    };
    
    db.saveSettings(settings);
    
    alert(`✅ Settings saved successfully!

📋 Configuration:
- Username: ${githubUsername}
- Repository: ${githubRepo}
- Groq API: ${groqApiKey ? 'Configured ✅' : 'Not set'}

💡 You can now use "Save to GitHub" button to save your data!`);
}

// Open GitHub repo
function openGithubRepo() {
    const settings = db.getSettings();
    if (settings.githubUsername && settings.githubRepo) {
        window.open(`https://github.com/${settings.githubUsername}/${settings.githubRepo}`, '_blank');
    }
}

// Test GitHub connection
async function testGithubConnection() {
    const settings = db.getSettings();
    
    if (!settings.githubToken || !settings.githubUsername || !settings.githubRepo) {
        alert('⚠️ Please configure and save GitHub settings first!');
        return;
    }
    
    const btn = document.getElementById('testConnectionBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    }
    
    try {
        // Test 1: Check repository access
        const repoResponse = await fetch(
            `https://api.github.com/repos/${settings.githubUsername}/${settings.githubRepo}`,
            {
                headers: {
                    'Authorization': `Bearer ${settings.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!repoResponse.ok) {
            throw new Error('Cannot access repository. Check if repository exists and token has correct permissions.');
        }
        
        const repoData = await repoResponse.json();
        
        // Test 2: Check if data.json exists
        const fileResponse = await fetch(
            `https://api.github.com/repos/${settings.githubUsername}/${settings.githubRepo}/contents/data.json`,
            {
                headers: {
                    'Authorization': `Bearer ${settings.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        let dataJsonStatus = '';
        if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            const fileSize = Math.round(fileData.size / 1024);
            dataJsonStatus = `✅ data.json found (${fileSize} KB)`;
        } else if (fileResponse.status === 404) {
            dataJsonStatus = '⚠️ data.json not found (will be created on first save)';
        } else {
            dataJsonStatus = '❌ Error accessing data.json';
        }
        
        // Test 3: Check API rate limit
        const rateLimitResponse = await fetch('https://api.github.com/rate_limit', {
            headers: {
                'Authorization': `Bearer ${settings.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        let rateLimitInfo = '';
        if (rateLimitResponse.ok) {
            const rateLimitData = await rateLimitResponse.json();
            const remaining = rateLimitData.rate.remaining;
            const limit = rateLimitData.rate.limit;
            rateLimitInfo = `API Limit: ${remaining}/${limit} remaining`;
        }
        
        // Show success message with details
        const message = `✅ Connection test successful!

📋 Repository Info:
- Name: ${repoData.full_name}
- Private: ${repoData.private ? 'Yes 🔒' : 'No'}
- Default Branch: ${repoData.default_branch}

📄 File Status:
${dataJsonStatus}

📊 ${rateLimitInfo}

✅ You're ready to save data to GitHub!`;
        
        alert(message);
        
    } catch (error) {
        console.error('Connection test error:', error);
        alert('❌ Connection test failed!\n\n' + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plug"></i> Test Connection';
        }
    }
}

// Reload data from GitHub
async function reloadDataFromGithub() {
    if (unsavedChanges) {
        if (!confirm('⚠️ You have unsaved changes! Reloading will discard them.\n\nContinue?')) {
            return;
        }
    }
    
    const btn = document.getElementById('reloadDataBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reloading...';
    }
    
    try {
        // Force reload from GitHub
        await db.loadFromGitHub();
        
        // Reload all UI components
        loadDashboard();
        loadAllTables();
        loadCategories();
        
        // Mark as saved (no unsaved changes after reload)
        markSaved();
        
        alert('✅ Data reloaded successfully from GitHub!');
    } catch (error) {
        console.error('Reload error:', error);
        alert('❌ Error reloading data: ' + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Reload';
        }
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
    
    const btn = document.getElementById('saveChangesBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    const data = db.exportData();
    const content = btoa(JSON.stringify(data, null, 2));
    
    try {
        // Check if file exists
        const checkResponse = await fetch(
            `https://api.github.com/repos/${settings.githubUsername}/${settings.githubRepo}/contents/data.json`,
            {
                headers: {
                    'Authorization': `Bearer ${settings.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        // Handle rate limiting
        if (checkResponse.status === 403) {
            const rateLimitRemaining = checkResponse.headers.get('X-RateLimit-Remaining');
            const rateLimitReset = checkResponse.headers.get('X-RateLimit-Reset');
            if (rateLimitRemaining === '0') {
                const resetDate = new Date(rateLimitReset * 1000);
                throw new Error(`GitHub API rate limit exceeded. Try again after ${resetDate.toLocaleTimeString()}`);
            }
        }
        
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
                    'Authorization': `Bearer ${settings.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update data - ${new Date().toISOString()}`,
                    content: content,
                    sha: sha
                })
            }
        );
        
        // Handle rate limiting on update
        if (response.status === 403) {
            const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
            const rateLimitReset = response.headers.get('X-RateLimit-Reset');
            if (rateLimitRemaining === '0') {
                const resetDate = new Date(rateLimitReset * 1000);
                throw new Error(`GitHub API rate limit exceeded. Try again after ${resetDate.toLocaleTimeString()}`);
            }
        }
        
        if (response.ok) {
            markSaved();
            
            // Show detailed success message
            const message = `✅ Data saved to GitHub successfully!

🔄 To see changes on the main site:
1. Wait 1-2 minutes for GitHub cache to update
2. Open your website in a new private/incognito window
3. Or force refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

📝 Note: Changes are already saved to GitHub!
Visitors will see updates within 1-5 minutes.`;
            
            alert(message);
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || response.statusText);
        }
    } catch (error) {
        console.error('GitHub save error:', error);
        alert('❌ Error: ' + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Save to GitHub';
        }
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
            if (confirm('⚠️ This will replace all current data. Continue?\n\n💡 Remember to "Save to GitHub" after importing!')) {
                db.importData(data);
                
                // Mark as unsaved
                markUnsaved();
                
                // Reload UI without page refresh
                loadDashboard();
                loadAllTables();
                loadCategories();
                
                alert('✅ Data imported successfully!\n\n⚠️ Don\'t forget to click "Save to GitHub" to save permanently!');
                
                // Reset file input
                event.target.value = '';
            }
        } catch (error) {
            alert('❌ Error importing data: ' + error.message);
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
