// ============================================
// FALCON X - MAIN JAVASCRIPT
// Frontend Functionality
// ============================================

// ==================== GLOBAL STATE ====================
let appData = {
    items: [],
    categories: {
        'windows-programs': [],
        'windows-games': [],
        'android-apps': [],
        'android-games': [],
        'phone-tools': [],
        'frp-apps': []
    },
    currentTab: 'all',
    currentCategory: 'all',
    currentSection: null
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initEventListeners();
    loadData();
});

function initApp() {
    // Set initial active states
    const hash = window.location.hash.slice(1) || 'home';
    
    if (hash !== 'home' && hash !== 'about') {
        showContentSection();
        if (hash !== 'content-section') {
            appData.currentSection = hash;
            loadSectionData(hash);
        }
    }
}

function initEventListeners() {
    // Sidebar toggle
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            closeModal();
        });
    }
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item[data-section], .dropdown-content a[data-section], .nav-item[href^="#"]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section') || item.getAttribute('href').substring(1);
            
            if (section) {
                if (section === 'home') {
                    showHeroSection();
                } else if (section === 'about') {
                    showAboutSection();
                } else if (section) {
                    handleNavigation(section);
                }
            }
            
            // Close sidebar on mobile
            closeSidebarMenu();
        });
    });
    
    // Home and About navigation
    const homeLink = document.querySelector('a[href="#home"]');
    const aboutLink = document.querySelector('a[href="#about"]');
    
    // Function to close sidebar
    const closeSidebarMenu = () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        if (window.innerWidth <= 768) {
            sidebar?.classList.remove('active');
            overlay?.classList.remove('active');
        }
    };
    
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            showHeroSection();
            closeSidebarMenu();
        });
    }
    
    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeSidebarMenu();
            showAboutSection();
        });
    }
    
    // Dropdown toggles
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const dropdown = toggle.closest('.nav-dropdown');
            dropdown.classList.toggle('active');
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Modal close
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
}

// ==================== DATA LOADING ====================
async function loadData() {
    try {
        // Load all data from JSON files
        const [items, categories] = await Promise.all([
            fetch('data/items.json').then(r => r.ok ? r.json() : { 'windows-programs': [], 'windows-games': [], 'android-apps': [], 'android-games': [], 'phone-tools': [], 'frp-apps': [] }),
            fetch('data/categories.json').then(r => r.ok ? r.json() : { 'windows-programs': [], 'windows-games': [], 'android-apps': [], 'android-games': [], 'phone-tools': [], 'frp-apps': [] })
        ]);
        
        appData.items = items;
        appData.categories = categories;
        
        // Update total items count
        const totalItems = Object.values(items).reduce((sum, arr) => sum + arr.length, 0);
        const totalItemsEl = document.getElementById('totalItems');
        if (totalItemsEl) {
            totalItemsEl.textContent = totalItems;
        }
        
        // If we're on a specific section, load its data
        if (appData.currentSection) {
            loadSectionData(appData.currentSection);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        appData.items = {
            'windows-programs': [],
            'windows-games': [],
            'android-apps': [],
            'android-games': [],
            'phone-tools': [],
            'frp-apps': []
        };
        appData.categories = {
            'windows-programs': [],
            'windows-games': [],
            'android-apps': [],
            'android-games': [],
            'phone-tools': [],
            'frp-apps': []
        };
    }
}

// ==================== NAVIGATION ====================
function handleNavigation(section) {
    appData.currentSection = section;
    appData.currentCategory = 'all';
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.nav-item[data-section="${section}"], .dropdown-content a[data-section="${section}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    showContentSection();
    loadSectionData(section);
    
    window.location.hash = section;
}

function showHeroSection() {
    document.getElementById('home')?.style.setProperty('display', 'flex');
    document.querySelector('.content-section')?.style.setProperty('display', 'none');
    document.querySelector('.about-section')?.style.setProperty('display', 'none');
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('a[href="#home"]')?.closest('.nav-item')?.classList.add('active');
    
    window.location.hash = 'home';
}

function showAboutSection() {
    document.getElementById('home')?.style.setProperty('display', 'none');
    document.querySelector('.content-section')?.style.setProperty('display', 'none');
    document.querySelector('.about-section')?.style.setProperty('display', 'block');
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('a[href="#about"]')?.closest('.nav-item')?.classList.add('active');
    
    window.location.hash = 'about';
}

function showContentSection() {
    document.getElementById('home')?.style.setProperty('display', 'none');
    document.querySelector('.content-section')?.style.setProperty('display', 'block');
    document.querySelector('.about-section')?.style.setProperty('display', 'none');
}

// ==================== SECTION DATA LOADING ====================
function loadSectionData(section) {
    const items = appData.items[section] || [];
    const categories = appData.categories[section] || [];
    
    // Update tabs
    updateTabs(section);
    
    // Update category filter
    updateCategoryFilter(categories);
    
    // Display items
    displayItems(items);
}

function updateTabs(section) {
    const tabsContainer = document.getElementById('tabs');
    if (!tabsContainer) return;
    
    const tabLabels = {
        'windows-programs': 'Windows Programs',
        'windows-games': 'Windows Games',
        'android-apps': 'Android Apps',
        'android-games': 'Android Games',
        'phone-tools': 'Phone Tools',
        'frp-apps': 'FRP Apps'
    };
    
    const icons = {
        'windows-programs': 'fab fa-windows',
        'windows-games': 'fas fa-gamepad',
        'android-apps': 'fab fa-android',
        'android-games': 'fas fa-mobile-alt',
        'phone-tools': 'fas fa-tools',
        'frp-apps': 'fas fa-unlock-alt'
    };
    
    tabsContainer.innerHTML = `
        <button class="tab-btn active" data-tab="all">
            <i class="fas fa-th"></i>
            All Items
        </button>
        <button class="tab-btn" data-tab="${section}">
            <i class="${icons[section]}"></i>
            ${tabLabels[section]}
        </button>
    `;
    
    // Add tab click listeners
    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appData.currentTab = btn.getAttribute('data-tab');
        });
    });
}

function updateCategoryFilter(categories) {
    const filterContainer = document.getElementById('categoryFilter');
    if (!filterContainer) return;
    
    filterContainer.innerHTML = '<button class="category-btn active" data-category="all">All Categories</button>';
    
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.setAttribute('data-category', category.id || category.name);
        btn.textContent = category.name;
        filterContainer.appendChild(btn);
    });
    
    // Add category filter listeners
    filterContainer.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterContainer.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appData.currentCategory = btn.getAttribute('data-category');
            filterItems();
        });
    });
}

// ==================== ITEM DISPLAY ====================
function displayItems(items) {
    const grid = document.getElementById('itemsGrid');
    if (!grid) return;
    
    if (!items || items.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-inbox"></i>
                <h3>No Items Found</h3>
                <p>There are no items to display in this section.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = items.map(item => createItemCard(item)).join('');
    
    // Add click listeners to cards
    grid.querySelectorAll('.item-card').forEach((card, index) => {
        card.addEventListener('click', () => openItemModal(items[index]));
    });
}

function createItemCard(item) {
    const statusClass = item.status === 'modified' ? 'modified' : 'original';
    const statusIcon = item.status === 'modified' ? 'fa-star' : 'fa-check-circle';
    const statusText = item.status === 'modified' ? 'Modified' : 'Original';
    
    return `
        <div class="item-card">
            <div class="item-header">
                <img src="${item.iconUrl || 'images/placeholder.png'}" alt="${item.name}" class="item-icon" onerror="this.src='images/placeholder.png'">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-meta">
                        ${item.version ? `<span><i class="fas fa-tag"></i> ${item.version}</span>` : ''}
                        ${item.size ? `<span><i class="fas fa-hdd"></i> ${item.size}</span>` : ''}
                    </div>
                </div>
            </div>
            ${item.shortDesc ? `<div class="item-description">${item.shortDesc}</div>` : ''}
            <div class="item-footer">
                <span class="item-category">${item.category || 'Uncategorized'}</span>
                <span class="item-status ${statusClass}">
                    <i class="fas ${statusIcon}"></i>
                    ${statusText}
                </span>
            </div>
        </div>
    `;
}

// ==================== SEARCH & FILTER ====================
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const items = appData.items[appData.currentSection] || [];
    
    const filtered = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        (item.shortDesc && item.shortDesc.toLowerCase().includes(searchTerm)) ||
        (item.category && item.category.toLowerCase().includes(searchTerm))
    );
    
    displayItems(filtered);
}

function filterItems() {
    const items = appData.items[appData.currentSection] || [];
    
    if (appData.currentCategory === 'all') {
        displayItems(items);
    } else {
        const filtered = items.filter(item => 
            (item.category && item.category.toLowerCase() === appData.currentCategory.toLowerCase())
        );
        displayItems(filtered);
    }
}

// ==================== MODAL ====================
function openItemModal(item) {
    const modal = document.getElementById('itemModal');
    const modalBody = document.getElementById('modalBody');
    const overlay = document.getElementById('overlay');
    
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = createModalContent(item);
    modal.classList.add('active');
    overlay.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('itemModal');
    const overlay = document.getElementById('overlay');
    
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function createModalContent(item) {
    const features = item.features && Array.isArray(item.features) ? item.features : [];
    const screenshots = item.screenshots && Array.isArray(item.screenshots) ? item.screenshots : [];
    const requirements = item.requirements && Array.isArray(item.requirements) ? item.requirements : [];
    
    let content = `
        <img src="${item.iconUrl || 'images/placeholder.png'}" alt="${item.name}" class="modal-icon" onerror="this.src='images/placeholder.png'">
        <h2 class="modal-title">${item.name}</h2>
        
        <div class="modal-meta">
            ${item.version ? `
                <div class="meta-item">
                    <span class="meta-label">Version</span>
                    <span class="meta-value">${item.version}</span>
                </div>
            ` : ''}
            ${item.size ? `
                <div class="meta-item">
                    <span class="meta-label">Size</span>
                    <span class="meta-value">${item.size}</span>
                </div>
            ` : ''}
            ${item.category ? `
                <div class="meta-item">
                    <span class="meta-label">Category</span>
                    <span class="meta-value">${item.category}</span>
                </div>
            ` : ''}
            ${item.status ? `
                <div class="meta-item">
                    <span class="meta-label">Status</span>
                    <span class="meta-value">${item.status === 'modified' ? 'Modified' : 'Original'}</span>
                </div>
            ` : ''}
        </div>
    `;
    
    if (item.note && item.noteColor) {
        content += `
            <div class="modal-note ${item.noteColor}">
                <i class="fas fa-info-circle"></i>
                ${item.note}
            </div>
        `;
    }
    
    if (item.fullDesc) {
        content += `
            <div class="modal-section">
                <h3><i class="fas fa-align-left"></i> Description</h3>
                <p class="modal-description">${item.fullDesc}</p>
            </div>
        `;
    }
    
    if (features.length > 0) {
        content += `
            <div class="modal-section">
                <h3><i class="fas fa-star"></i> Features</h3>
                <ul class="features-list">
                    ${features.map(feature => `
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>${feature}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    if (requirements.length > 0) {
        content += `
            <div class="modal-section">
                <h3><i class="fas fa-cogs"></i> System Requirements</h3>
                <ul class="features-list">
                    ${requirements.map(req => `
                        <li>
                            <i class="fas fa-microchip"></i>
                            <span>${req}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    if (screenshots.length > 0) {
        content += `
            <div class="modal-section">
                <h3><i class="fas fa-images"></i> Screenshots</h3>
                <div class="screenshots-grid">
                    ${screenshots.map(screenshot => `
                        <img src="${screenshot}" alt="Screenshot" class="screenshot" onerror="this.style.display='none'">
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    content += `
        <div class="modal-section">
            <h3><i class="fas fa-download"></i> Download</h3>
            <div class="download-buttons">
    `;
    
    if (item.originalLink) {
        content += `
            <a href="${item.originalLink}" target="_blank" rel="noopener noreferrer" class="download-btn primary">
                <i class="fas fa-download"></i>
                Download Original
            </a>
        `;
    }
    
    if (item.modifiedLink) {
        content += `
            <a href="${item.modifiedLink}" target="_blank" rel="noopener noreferrer" class="download-btn secondary">
                <i class="fas fa-download"></i>
                Download Modified
            </a>
        `;
    }
    
    content += `</div></div>`;
    
    if (item.website) {
        content += `
            <a href="${item.website}" target="_blank" rel="noopener noreferrer" class="website-link">
                <i class="fas fa-globe"></i>
                Visit Official Website
            </a>
        `;
    }
    
    return content;
}
