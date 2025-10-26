// Global state
let currentTab = 'home';
let currentItems = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAllContent();
    initSidebar();
    initTabs();
    initFeatureBoxes();
    // Restore last tab after a small delay to ensure DOM is ready
    setTimeout(() => restoreLastTab(), 10);
});

// Feature boxes navigation
function initFeatureBoxes() {
    document.querySelectorAll('.feature-box[data-tab]').forEach(box => {
        box.addEventListener('click', () => {
            const tab = box.dataset.tab;
            if (tab) {
                switchTab(tab);
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

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
            // BUT keep submenu open if clicking a submenu-item
            if (!item.classList.contains('has-submenu') && !item.classList.contains('submenu-item')) {
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
    // Don't automatically switch to home - let restoreLastTab handle it
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Save current tab to sessionStorage (clears on close)
    sessionStorage.setItem('currentTab', tabName);
    
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
    
    // Open parent submenu if tab is in a submenu
    openParentSubmenu(tabName);
    
    // Show warning for Phone Tools and FRP Apps
    showWarningIfNeeded(tabName);
}

// Restore last visited tab
function restoreLastTab() {
    const lastTab = sessionStorage.getItem('currentTab') || 'home';
    console.log('Restoring tab:', lastTab);
    switchTab(lastTab);
}

// Open parent submenu for nested tabs
function openParentSubmenu(tabName) {
    const submenuTabs = {
        'windows-programs': 'windows',
        'windows-games': 'windows',
        'android-apps': 'android',
        'android-games': 'android'
    };
    
    const parentSubmenu = submenuTabs[tabName];
    if (parentSubmenu) {
        const parentItem = document.querySelector(`[data-submenu="${parentSubmenu}"]`);
        const submenuElement = document.getElementById(`${parentSubmenu}-submenu`);
        
        if (parentItem && submenuElement) {
            parentItem.classList.add('active');
            submenuElement.classList.add('active');
        }
    }
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
    
    const isFrpApps = gridId === 'frpAppsGrid';
    grid.innerHTML = items.map(item => createItemCard(item, isFrpApps)).join('');
    
    // Add click handlers - skip modal for FRP Apps
    grid.querySelectorAll('.item-card').forEach((card, index) => {
        if (!isFrpApps) {
            card.addEventListener('click', () => openItemModal(items[index]));
        }
    });
}

// Create item card HTML
function createItemCard(item, isFrpApp = false) {
    const iconHtml = item.icon 
        ? `<img src="${item.icon}" alt="${item.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-cube\\'></i>'">`
        : `<i class="fas fa-cube"></i>`;
    
    // For FRP Apps, show type instead of status
    let statusDisplay, statusClass;
    if (isFrpApp) {
        const frpType = item.frpType || 'direct';
        statusDisplay = frpType.charAt(0).toUpperCase() + frpType.slice(1);
        statusClass = frpType === 'direct' ? 'status-original' : 'status-modified';
    } else {
        statusDisplay = item.status;
        statusClass = item.status === 'Original' ? 'status-original' : 'status-modified';
    }
    
    // FRP App action button
    let actionButton = '';
    if (isFrpApp) {
        const frpType = item.frpType || 'direct';
        if (frpType === 'download' && item.downloadLink) {
            actionButton = `
                <a href="${item.downloadLink}" target="_blank" class="frp-download-btn" onclick="event.stopPropagation();">
                    <i class="fas fa-download"></i> Download
                </a>
            `;
        } else if (frpType === 'direct' && item.directLink) {
            actionButton = `
                <a href="${item.directLink}" target="_blank" class="frp-direct-btn" onclick="event.stopPropagation();">
                    <i class="fas fa-external-link-alt"></i> Open Direct Link
                </a>
            `;
        }
    }
    
    return `
        <div class="item-card ${isFrpApp ? 'frp-card' : ''}">
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
                ${item.category ? `<span class="meta-item category-badge"><i class="fas fa-folder"></i> ${item.category}</span>` : ''}
                <span class="status-badge ${statusClass}">${statusDisplay}</span>
            </div>
            <div class="card-description">
                ${item.shortDesc || item.fullDesc || 'No description available'}
            </div>
            ${actionButton ? `<div class="card-action">${actionButton}</div>` : ''}
        </div>
    `;
}

// Open item modal with optional direct opening via URL
function openItemModal(item) {
    const modal = document.getElementById('itemModal');
    const modalBody = document.getElementById('modalBody');
    
    // Update meta tags for social sharing
    updateMetaTags(item);
    
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
                    ${item.category ? `<span class="meta-item category-badge"><i class="fas fa-folder"></i> ${item.category}</span>` : ''}
                    <span class="status-badge ${statusClass}">${item.status}</span>
                </div>
            </div>
        </div>
        <div class="modal-body">
    `;
    
    // 1. Screenshots
    if (item.screenshots && item.screenshots.length > 0) {
        html += `
            <div class="modal-section">
                <h3><i class="fas fa-images"></i> Screenshots</h3>
                <div class="screenshots">
                    ${item.screenshots.map((s, index) => `<img src="${s}" alt="Screenshot" class="screenshot" onclick="openLightbox(${index}, ${JSON.stringify(item.screenshots).replace(/"/g, '&quot;')})">`).join('')}
                </div>
            </div>
        `;
    }
    
    // 2. Description
    if (item.fullDesc || item.shortDesc) {
        html += `
            <div class="modal-section">
                <h3><i class="fas fa-info-circle"></i> Description</h3>
                <div class="description-box">
                    <p class="description-text">${item.fullDesc || item.shortDesc}</p>
                </div>
            </div>
        `;
    }
    
    // 3. Features
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
    
    // 4. System Requirements
    if (item.requirements) {
        const reqLines = item.requirements.split('\n').filter(line => line.trim());
        html += `
            <div class="modal-section">
                <h3><i class="fas fa-server"></i> System Requirements</h3>
                <div class="requirements-list">
                    ${reqLines.map(line => `
                        <div class="requirement-item">
                            <i class="fas fa-check-circle"></i>
                            <span>${line.trim()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // 5. Note alert
    if (item.note && item.note.trim()) {
        html += `
            <div class="note-alert ${item.noteColor}">
                <i class="fas fa-exclamation-circle"></i> ${item.note}
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
            </div>`;
    
    // Add installation note for Android apps and games
    if (currentTab === 'android-apps' || currentTab === 'android-games') {
        html += `
            <div class="installation-note">
                <i class="fas fa-info-circle"></i>
                <span>To install applications in <strong class="format-name">XAPK</strong>, <strong class="format-name">APKS</strong> format, you must use the <strong class="app-name">Zarchiver</strong> or <strong class="app-name">MTManager</strong> application.</span>
            </div>`;
    }
    
    html += `
        </div>
    `;
    
    // Share Section
    html += `
        <div class="modal-section">
            <h3><i class="fas fa-share-alt"></i> Share</h3>
            <button class="btn btn-secondary share-btn" onclick="shareItem(${item.id}, '${currentTab}')">
                <i class="fas fa-share-nodes"></i> Share this ${currentTab.includes('Games') ? 'Game' : currentTab.includes('Tools') ? 'Tool' : currentTab.includes('frp') ? 'App' : 'Program'}
            </button>
        </div>
    `;
    
    // Contact Us Section
    html += `
        <div class="modal-section">
            <h3><i class="fas fa-comments"></i> Contact Us</h3>
            <p class="contact-description">Report an issue, request an app, or suggest an update</p>
            <div class="contact-buttons">
                <a href="https://api.whatsapp.com/send?phone=306972462001&text=" target="_blank" class="btn-contact btn-whatsapp">
                    <i class="fab fa-whatsapp"></i>
                    <span>WhatsApp</span>
                </a>
                <a href="https://t.me/anon_design" target="_blank" class="btn-contact btn-telegram">
                    <i class="fab fa-telegram"></i>
                    <span>Telegram</span>
                </a>
            </div>
        </div>
    `;
    
    // Last Modified & Close Button at bottom inside modal-body
    let formattedDate = 'N/A';
    if (item.lastModified) {
        const date = new Date(item.lastModified);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        formattedDate = `${day}/${month}/${year}`;
    }
    
    html += `
        <div class="modal-bottom-actions">
            <span class="modal-date"><i class="fas fa-calendar-alt"></i> Last Update: ${formattedDate}</span>
            <button class="btn-close-footer" onclick="closeModal()" title="Close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>
    `;
    
    modalBody.innerHTML = html;
    modal.classList.add('active');
    
    // Reset scroll to top
    const modalContent = modal.querySelector('.modal-body');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
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
        // Don't close warning modal with ESC
        const warningModal = document.getElementById('warningModal');
        if (warningModal && warningModal.classList.contains('active')) {
            return;
        }
        
        const lightbox = document.getElementById('lightbox');
        if (lightbox && lightbox.classList.contains('active')) {
            closeLightbox();
        } else {
            closeModal();
        }
    }
});

// Lightbox functionality
let currentLightboxIndex = 0;
let currentLightboxImages = [];

function openLightbox(index, images) {
    currentLightboxIndex = index;
    currentLightboxImages = images;
    
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) {
        createLightbox();
    }
    
    updateLightboxImage();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
}

function nextLightboxImage() {
    currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
    updateLightboxImage();
}

function prevLightboxImage() {
    currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const img = document.getElementById('lightboxImage');
    const counter = document.getElementById('lightboxCounter');
    
    img.src = currentLightboxImages[currentLightboxIndex];
    counter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
    
    // Show/hide navigation arrows
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    
    if (currentLightboxImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
    }
}

function createLightbox() {
    const lightboxHTML = `
        <div id="lightbox" class="lightbox">
            <div class="lightbox-content">
                <button class="lightbox-close" onclick="closeLightbox()">
                    <i class="fas fa-times"></i>
                </button>
                <button class="lightbox-nav lightbox-prev" id="lightboxPrev" onclick="prevLightboxImage()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="lightbox-nav lightbox-next" id="lightboxNext" onclick="nextLightboxImage()">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <img id="lightboxImage" src="" alt="Screenshot">
                <div class="lightbox-counter" id="lightboxCounter">1 / 1</div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    
    // Close on background click
    document.getElementById('lightbox').addEventListener('click', (e) => {
        if (e.target.id === 'lightbox') {
            closeLightbox();
        }
    });
    
// Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox');
        if (lightbox && lightbox.classList.contains('active')) {
            if (e.key === 'ArrowRight') nextLightboxImage();
            if (e.key === 'ArrowLeft') prevLightboxImage();
        }
    });
}

// Warning Modal Functions
function showWarningIfNeeded(tabName) {
    if (tabName === 'phone-tools') {
        const dontShow = localStorage.getItem('hidePhoneToolsWarning');
        if (!dontShow) {
            showWarning('phone-tools');
        }
    } else if (tabName === 'frp-apps') {
        const dontShow = localStorage.getItem('hideFrpAppsWarning');
        if (!dontShow) {
            showWarning('frp-apps');
        }
    }
}

function showWarning(type) {
    const modal = document.getElementById('warningModal');
    const warningBody = document.getElementById('warningBody');
    
    let content = `
        <div class="warning-section">
            <div class="warning-icon-text">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Warning</strong>
            </div>
            <p>These programs are used by specialists only. Please do not use them if you do not have the necessary experience, as improper use of these programs may destroy the phone.</p>
        </div>
        
        <div class="warning-divider"></div>
        
        <div class="warning-section warning-legal">
            <div class="warning-icon-text">
                <i class="fas fa-shield-alt"></i>
                <strong>Legal Warning</strong>
            </div>
            <p>These programs are your responsibility. Use them correctly to avoid legal liability.</p>
        </div>
    `;
    
    if (type === 'phone-tools') {
        content += `
            <div class="warning-divider"></div>
            
            <div class="warning-section warning-note">
                <div class="warning-icon-text">
                    <i class="fas fa-info-circle"></i>
                    <strong>Note</strong>
                </div>
                <p>You must disable antivirus when installing and working with these programs.</p>
            </div>
        `;
    }
    
    warningBody.innerHTML = content;
    modal.classList.add('active');
    
    // Reset checkbox
    document.getElementById('dontShowAgain').checked = false;
}

function closeWarning() {
    const modal = document.getElementById('warningModal');
    const dontShow = document.getElementById('dontShowAgain').checked;
    
    if (dontShow) {
        if (currentTab === 'phone-tools') {
            localStorage.setItem('hidePhoneToolsWarning', 'true');
        } else if (currentTab === 'frp-apps') {
            localStorage.setItem('hideFrpAppsWarning', 'true');
        }
    }
    
    modal.classList.remove('active');
}

// Disable closing warning on outside click - must use button only

// Share item function
function shareItem(itemId, tabName) {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?tab=${tabName}&item=${itemId}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: document.querySelector('.modal-title-section h2').textContent,
            text: document.querySelector('.description-text')?.textContent || 'Check out this amazing software!',
            url: shareUrl
        }).catch(err => console.log('Share canceled'));
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('✅ Link copied to clipboard!\n\nShare it on WhatsApp, Telegram, or any platform.');
        }).catch(() => {
            // Fallback for older browsers
            prompt('Copy this link to share:', shareUrl);
        });
    }
}

// Update meta tags for social media sharing
function updateMetaTags(item) {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?tab=${currentTab}&item=${item.id}`;
    
    // Update Open Graph tags
    updateOrCreateMetaTag('og:title', item.name);
    updateOrCreateMetaTag('og:description', item.shortDesc || item.fullDesc || 'Premium software available on Falcon X');
    updateOrCreateMetaTag('og:image', item.icon || `${baseUrl}/images/og-image.jpg`);
    updateOrCreateMetaTag('og:url', shareUrl);
    
    // Update Twitter Card tags
    updateOrCreateMetaTag('twitter:title', item.name);
    updateOrCreateMetaTag('twitter:description', item.shortDesc || item.fullDesc || 'Premium software available on Falcon X');
    updateOrCreateMetaTag('twitter:image', item.icon || `${baseUrl}/images/og-image.jpg`);
    updateOrCreateMetaTag('twitter:url', shareUrl);
}

function updateOrCreateMetaTag(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`) || 
               document.querySelector(`meta[name="${property}"]`);
    
    if (meta) {
        meta.setAttribute('content', content);
    } else {
        meta = document.createElement('meta');
        const isOg = property.startsWith('og:');
        meta.setAttribute(isOg ? 'property' : 'name', property);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
    }
}

// Check URL parameters on page load to open specific item
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabName = urlParams.get('tab');
    const itemId = urlParams.get('item');
    
    if (tabName && itemId) {
        // Switch to the correct tab
        switchTab(tabName);
        
        // Find and open the item
        setTimeout(() => {
            const items = db.getItems(getDataTypeFromTab(tabName));
            const item = items.find(i => i.id == itemId);
            if (item) {
                openItemModal(item);
            }
        }, 100);
    }
}

// Helper function to convert tab name to data type
function getDataTypeFromTab(tabName) {
    const mapping = {
        'windows-programs': 'windowsPrograms',
        'windows-games': 'windowsGames',
        'android-apps': 'androidApps',
        'android-games': 'androidGames',
        'phone-tools': 'phoneTools',
        'frp-apps': 'frpApps'
    };
    return mapping[tabName] || 'windowsPrograms';
}

// Initialize URL parameter check on load
document.addEventListener('DOMContentLoaded', function() {
    checkUrlParameters();
});
