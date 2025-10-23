// Global state
let currentTab = 'home';
let currentItems = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
    initTabs();
    loadAllContent();
});

// Sidebar functionality
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');

    menuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    closeSidebar?.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // Submenu toggles
    document.querySelectorAll('.has-submenu').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const submenuId = item.dataset.submenu;
            const submenu = document.getElementById(`${submenuId}-submenu`);
            
            // Close all other submenus
            document.querySelectorAll('.has-submenu').forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherSubmenuId = otherItem.dataset.submenu;
                    const otherSubmenu = document.getElementById(`${otherSubmenuId}-submenu`);
                    if (otherSubmenu) {
                        otherSubmenu.classList.remove('active');
                    }
                }
            });
            
            // Toggle current submenu
            item.classList.toggle('active');
            submenu.classList.toggle('active');
        });
    });

    // Navigation items
    document.querySelectorAll('[data-tab]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            switchTab(tab);
            
            // Close all dropdowns when clicking non-dropdown nav items
            if (!item.classList.contains('has-submenu')) {
                document.querySelectorAll('.has-submenu').forEach(submenuItem => {
                    submenuItem.classList.remove('active');
                });
                document.querySelectorAll('.submenu').forEach(submenu => {
                    submenu.classList.remove('active');
                });
            }
            
            // Close sidebar on mobile
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
            }
        });
    });
}

// Tab system
function initTabs() {
    switchTab('home');
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update active states
    document.querySelectorAll('.nav-item, .submenu-item').forEach(item => {
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === tabName) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Load all content
function loadAllContent() {
    loadContent('windowsPrograms', 'windowsProgramsGrid', 'winProgramsCategory', 'winProgramsSearch');
    loadContent('windowsGames', 'windowsGamesGrid', 'winGamesCategory', 'winGamesSearch');
    loadContent('androidApps', 'androidAppsGrid', 'androidAppsCategory', 'androidAppsSearch');
    loadContent('androidGames', 'androidGamesGrid', 'androidGamesCategory', 'androidGamesSearch');
    loadContent('phoneTools', 'phoneToolsGrid', 'phoneToolsCategory', 'phoneToolsSearch');
    loadContent('frpApps', 'frpAppsGrid', 'frpAppsCategory', 'frpAppsSearch');
}

// Load content for specific section
function loadContent(dataType, gridId, categorySelectId, searchInputId) {
    const items = db.getItems(dataType);
    const categories = db.getCategories(dataType);
    
    // Populate category filter
    const categorySelect = document.getElementById(categorySelectId);
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
        
        categorySelect.addEventListener('change', () => filterItems(dataType, gridId, categorySelectId, searchInputId));
    }
    
    // Search functionality
    const searchInput = document.getElementById(searchInputId);
    if (searchInput) {
        searchInput.addEventListener('input', () => filterItems(dataType, gridId, categorySelectId, searchInputId));
    }
    
    // Display items
    displayItems(items, gridId);
}

// Filter items
function filterItems(dataType, gridId, categorySelectId, searchInputId) {
    const items = db.getItems(dataType);
    const selectedCategory = document.getElementById(categorySelectId)?.value || '';
    const searchTerm = document.getElementById(searchInputId)?.value.toLowerCase() || '';
    
    const filtered = items.filter(item => {
        const matchesCategory = !selectedCategory || item.category === selectedCategory;
        const matchesSearch = !searchTerm || 
            item.name.toLowerCase().includes(searchTerm) ||
            item.shortDesc.toLowerCase().includes(searchTerm);
        
        return matchesCategory && matchesSearch;
    });
    
    displayItems(filtered, gridId);
}

// Display items in grid
function displayItems(items, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    if (items.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">No items found</p>';
        return;
    }
    
    grid.innerHTML = items.map(item => createItemCard(item)).join('');
    
    // Add click handlers
    grid.querySelectorAll('.item-card').forEach((card, index) => {
        card.addEventListener('click', () => openItemModal(items[index]));
    });
}

// Create item card HTML
function createItemCard(item) {
    const iconHtml = item.icon 
        ? `<img src="${item.icon}" alt="${item.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-cube\\'></i>'">`
        : `<i class="fas fa-cube"></i>`;
    
    const statusClass = item.status === 'Original' ? 'status-original' : 'status-modified';
    
    return `
        <div class="item-card">
            <div class="card-header">
                <div class="card-icon">
                    ${iconHtml}
                </div>
                <div class="card-title">
                    <h3>${item.name}</h3>
                </div>
            </div>
            <div class="card-meta">
                ${item.version ? `<span class="meta-item"><i class="fas fa-tag"></i> ${item.version}</span>` : ''}
                ${item.size ? `<span class="meta-item"><i class="fas fa-hdd"></i> ${item.size}</span>` : ''}
                ${item.category ? `<span class="meta-item"><i class="fas fa-folder"></i> ${item.category}</span>` : ''}
                <span class="status-badge ${statusClass}">${item.status}</span>
            </div>
            <div class="card-description">
                ${item.shortDesc || item.fullDesc || 'No description available'}
            </div>
        </div>
    `;
}

// Open item modal
function openItemModal(item) {
    const modal = document.getElementById('itemModal');
    const modalBody = document.getElementById('modalBody');
    
    const iconHtml = item.icon 
        ? `<img src="${item.icon}" alt="${item.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-cube\\'></i>'">`
        : `<i class="fas fa-cube"></i>`;
    
    const statusClass = item.status === 'Original' ? 'status-original' : 'status-modified';
    
    let html = `
        <div class="modal-header-section">
            <div class="modal-icon">
                ${iconHtml}
            </div>
            <div class="modal-title-section">
                <h2>${item.name}</h2>
                <div class="modal-meta">
                    ${item.version ? `<span class="meta-item"><i class="fas fa-tag"></i> Version ${item.version}</span>` : ''}
                    ${item.size ? `<span class="meta-item"><i class="fas fa-hdd"></i> ${item.size}</span>` : ''}
                    ${item.category ? `<span class="meta-item"><i class="fas fa-folder"></i> ${item.category}</span>` : ''}
                    <span class="status-badge ${statusClass}">${item.status}</span>
                </div>
            </div>
        </div>
        <div class="modal-body">
    `;
    
    // Note alert
    if (item.note && item.note.trim()) {
        html += `
            <div class="note-alert ${item.noteColor}">
                <i class="fas fa-exclamation-circle"></i> ${item.note}
            </div>
        `;
    }
    
    // Description
    if (item.fullDesc || item.shortDesc) {
        html += `
            <div class="modal-section">
                <h3><i class="fas fa-info-circle"></i> Description</h3>
                <p>${item.fullDesc || item.shortDesc}</p>
            </div>
        `;
    }
    
    // Features
    if (item.features && item.features.length > 0) {
        html += `
            <div class="modal-section">
                <h3><i class="fas fa-star"></i> Features</h3>
                <ul>
                    ${item.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Requirements
    if (item.requirements) {
        html += `
            <div class="modal-section">
                <h3><i class="fas fa-server"></i> System Requirements</h3>
                <p>${item.requirements}</p>
            </div>
        `;
    }
    
    // Screenshots
    if (item.screenshots && item.screenshots.length > 0) {
        html += `
            <div class="modal-section">
                <h3><i class="fas fa-images"></i> Screenshots</h3>
                <div class="screenshots">
                    ${item.screenshots.map(s => `<img src="${s}" alt="Screenshot" class="screenshot">`).join('')}
                </div>
            </div>
        `;
    }
    
    // Download buttons
    html += `
        <div class="modal-section">
            <h3><i class="fas fa-download"></i> Download</h3>
            <div class="download-buttons">
    `;
    
    if (item.originalLink) {
        html += `<a href="${item.originalLink}" target="_blank" class="btn btn-primary download-btn"><i class="fas fa-download"></i> Original Download</a>`;
    }
    
    if (item.modifiedLink) {
        html += `<a href="${item.modifiedLink}" target="_blank" class="btn btn-secondary download-btn"><i class="fas fa-download"></i> Modified Download</a>`;
    }
    
    if (item.website) {
        html += `<a href="${item.website}" target="_blank" class="btn btn-secondary download-btn"><i class="fas fa-globe"></i> Official Website</a>`;
    }
    
    html += `
            </div>
        </div>
    </div>
    `;
    
    // Footer
    if (item.lastModified) {
        const date = new Date(item.lastModified);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        html += `
            <div class="modal-footer">
                <span><i class="fas fa-clock"></i> Last updated: ${formattedDate}</span>
            </div>
        `;
    }
    
    modalBody.innerHTML = html;
    modal.classList.add('active');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('itemModal');
    modal.classList.remove('active');
}

// Close modal on outside click
document.getElementById('itemModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'itemModal') {
        closeModal();
    }
});

// Hero button functions
function scrollToContent() {
    switchTab('windows-programs');
}

function showAbout() {
    switchTab('about');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});
