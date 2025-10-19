// ===== DOM Elements =====
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileOverlay = document.getElementById('mobileOverlay');
const desktopThemeToggle = document.getElementById('desktopThemeToggle');
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    loadNavigationFromStorage(); // Load custom navigation first
    initializeTheme();
    initializeSidebar();
    initializeNavigation();
    initializeStatCounters();
    initializeSearch();
    initializeFilters();
    loadSoftwareData();
    initializeCustomCursor();
    initializeSettings();
    initializeStorageListener();
});

// ===== Storage Change Listener =====
function initializeStorageListener() {
    // Store the last known update timestamp
    let lastKnownUpdate = localStorage.getItem('falcon-x-last-update') || '0';
    
    // Listen for storage changes from other tabs/windows (like admin panel)
    window.addEventListener('storage', (e) => {
        // Check if the changed key is one of our app data keys
        if (e.key && (e.key.startsWith('falcon-x-') || e.key === null)) {
            console.log('🔄 Storage changed, reloading data...');
            loadSoftwareData();
            
            // Update modal if it's open
            if (currentAppId) {
                refreshModalData();
            }
            
            showToast('Data updated from admin panel!', 'success');
            lastKnownUpdate = localStorage.getItem('falcon-x-last-update') || '0';
        }
    });
    
    // Check for updates periodically (every 2 seconds)
    setInterval(() => {
        const currentUpdate = localStorage.getItem('falcon-x-last-update') || '0';
        if (currentUpdate !== lastKnownUpdate && currentUpdate !== '0') {
            console.log('🔄 Data updated, reloading...');
            
            // Add visual feedback - fade effect on containers
            const containers = [
                document.getElementById('windowsSoftware'),
                document.getElementById('androidApps'),
                document.getElementById('frpTools'),
                document.getElementById('frpApps')
            ];
            
            containers.forEach(container => {
                if (container) {
                    container.style.opacity = '0.5';
                    container.style.transition = 'opacity 0.3s';
                }
            });
            
            // Reload data
            setTimeout(() => {
                loadSoftwareData();
                containers.forEach(container => {
                    if (container) {
                        container.style.opacity = '1';
                    }
                });
                
                // Update modal if it's open
                if (currentAppId) {
                    refreshModalData();
                }
            }, 300);
            
            lastKnownUpdate = currentUpdate;
            showToast('✨ Data refreshed automatically!', 'success');
        }
    }, 2000);
    
    // Also check for changes on focus (when returning to the tab)
    window.addEventListener('focus', () => {
        const currentUpdate = localStorage.getItem('falcon-x-last-update') || '0';
        if (currentUpdate !== lastKnownUpdate && currentUpdate !== '0') {
            console.log('🔄 Data updated on focus, reloading...');
            loadSoftwareData();
            
            // Update modal if it's open
            if (currentAppId) {
                refreshModalData();
            }
            
            lastKnownUpdate = currentUpdate;
        }
    });
}

// ===== Theme Management =====
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    
    const toggleTheme = () => {
        const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };
    
    desktopThemeToggle?.addEventListener('click', toggleTheme);
}

function applyTheme(theme) {
    const logoImage = document.querySelector('.logo-image');
    const mobileLogo = document.querySelector('.mobile-logo');
    const heroLogo = document.querySelector('.hero-logo');
    
    // Helper function to animate logo change
    const animateLogoChange = (element, newSrc) => {
        if (!element) return;
        
        // Add fade-out effect
        element.classList.add('fade-out');
        
        // Change image and add fade-in effect after fade-out
        setTimeout(() => {
            element.src = newSrc;
            element.classList.remove('fade-out');
            element.classList.add('fade-in');
            
            // Remove fade-in class after animation completes
            setTimeout(() => {
                element.classList.remove('fade-in');
            }, 600);
        }, 300);
    };
    
    // Helper function for hero logo with longer animation
    const animateHeroLogo = (element, newSrc) => {
        if (!element) return;
        
        element.classList.add('fade-out');
        
        setTimeout(() => {
            element.src = newSrc;
            element.classList.remove('fade-out');
            element.classList.add('fade-in');
            
            setTimeout(() => {
                element.classList.remove('fade-in');
            }, 800);
        }, 400);
    };
    
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (desktopThemeToggle) {
            desktopThemeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        // تغيير الصور للوضع الساطع مع التأثيرات
        animateLogoChange(logoImage, 'images/6e89058a-eeee-45f5-9585-d26b3fb6fefc copy.png');
        animateLogoChange(mobileLogo, 'images/6e89058a-eeee-45f5-9585-d26b3fb6fefc copy.png');
        animateHeroLogo(heroLogo, 'images/X.png');
    } else {
        document.body.classList.remove('light-theme');
        if (desktopThemeToggle) {
            desktopThemeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
        // تغيير الصور للوضع الليلي مع التأثيرات
        animateLogoChange(logoImage, 'images/6e89058a-eeee1-45f5-9585-d26b3fb6fefc copy.png');
        animateLogoChange(mobileLogo, 'images/6e89058a-eeee1-45f5-9585-d26b3fb6fefc copy.png');
        animateHeroLogo(heroLogo, 'images/X2.png');
    }
}

// ===== Sidebar Management =====
function initializeSidebar() {
    // Mobile menu button
    mobileMenuBtn?.addEventListener('click', toggleSidebar);
    
    // Mobile overlay
    mobileOverlay?.addEventListener('click', closeSidebar);
    
    // Close sidebar on mobile when clicking a menu item
    if (window.innerWidth <= 768) {
        menuItems.forEach(item => {
            item.addEventListener('click', closeSidebar);
        });
    }
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
}

function toggleSidebar() {
    sidebar?.classList.toggle('active');
    mobileOverlay?.classList.toggle('active');
    document.body.style.overflow = sidebar?.classList.contains('active') ? 'hidden' : '';
}

function closeSidebar() {
    sidebar?.classList.remove('active');
    mobileOverlay?.classList.remove('active');
    document.body.style.overflow = '';
}

// ===== Load Navigation from localStorage =====
function loadNavigationFromStorage() {
    try {
        const savedNavigation = localStorage.getItem('navigation');
        if (!savedNavigation) {
            console.log('ℹ️ No custom navigation found, using default');
            return;
        }
        
        const navItems = JSON.parse(savedNavigation);
        const sidebarMenu = document.querySelector('.sidebar-menu');
        
        if (!sidebarMenu) return;
        
        // Clear current menu
        sidebarMenu.innerHTML = '';
        
        // Sort by order and filter active items
        const activeItems = navItems.filter(item => item.active).sort((a, b) => a.order - b.order);
        
        // Add each navigation item
        activeItems.forEach(item => {
            const menuItem = document.createElement('a');
            menuItem.href = item.link;
            menuItem.className = 'menu-item';
            menuItem.dataset.page = item.link.replace('#', '');
            
            menuItem.innerHTML = `
                <i class="${item.icon}"></i>
                <span class="menu-text">${item.title}</span>
            `;
            
            sidebarMenu.appendChild(menuItem);
        });
        
        console.log('✅ Navigation loaded from localStorage:', activeItems.length, 'items');
    } catch (error) {
        console.error('❌ Error loading navigation:', error);
    }
}

// ===== Navigation Management =====
function initializeNavigation() {
    // Re-query menu items after they may have been dynamically loaded
    const dynamicMenuItems = document.querySelectorAll('.menu-item');
    
    // Handle menu item clicks
    dynamicMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.dataset.page;
            navigateToPage(targetPage);
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
        const page = e.state?.page || 'home';
        showPage(page);
        updateActiveMenuItem(page);
    });
    
    // Set initial page based on URL hash
    const initialPage = window.location.hash.slice(1) || 'home';
    navigateToPage(initialPage, false);
}

function navigateToPage(pageId, pushState = true) {
    showPage(pageId);
    updateActiveMenuItem(pageId);
    
    if (pushState) {
        history.pushState({ page: pageId }, '', `#${pageId}`);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Show FRP warning only for FRP Tools page
    if (pageId === 'frp') {
        showFrpWarning();
    }
}

function showPage(pageId) {
    pages.forEach(page => {
        if (page.id === pageId) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
}

function updateActiveMenuItem(pageId) {
    menuItems.forEach(item => {
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ===== Statistics Counter Animation =====
function initializeStatCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                animateCounter(entry.target);
                entry.target.classList.add('counted');
            }
        });
    }, observerOptions);
    
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element) {
    const target = parseFloat(element.dataset.target);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target % 1 === 0 ? target.toLocaleString() : target.toFixed(1);
        }
    };
    
    updateCounter();
}

// ===== Search Functionality =====
function initializeSearch() {
    const searchInputs = {
        windows: document.getElementById('windowsSearch'),
        android: document.getElementById('androidSearch'),
        frp: document.getElementById('frpSearch'),
        'frp-apps': document.getElementById('frpAppsSearch')
    };
    
    Object.entries(searchInputs).forEach(([type, input]) => {
        input?.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterSoftware(type, searchTerm);
        });
    });
}

function filterSoftware(type, searchTerm) {
    const container = document.getElementById(
        type === 'windows' ? 'windowsSoftware' :
        type === 'android' ? 'androidApps' :
        type === 'frp' ? 'frpTools' :
        'frpApps'
    );
    
    if (!container) return;
    
    const cards = container.querySelectorAll('.software-card');
    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.software-description')?.textContent.toLowerCase() || '';
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// ===== Filter Functionality =====
function initializeFilters() {
    const filterSections = document.querySelectorAll('.filter-buttons');
    
    filterSections.forEach(section => {
        const buttons = section.querySelectorAll('.filter-btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active state
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Apply filter
                const category = button.dataset.category;
                const page = section.closest('.page');
                applyFilter(page, category);
            });
        });
    });
}

function applyFilter(page, category) {
    if (!page) return;
    
    const cards = page.querySelectorAll('.software-card');
    cards.forEach(card => {
        const cardCategory = card.dataset.category || 'all';
        if (category === 'all' || cardCategory === category) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}


// ===== Load Software Data =====
async function loadSoftwareData() {
    try {
        // Load Windows software - check localStorage first, then fallback to data.js
        const windowsContainer = document.getElementById('windowsSoftware');
        if (windowsContainer) {
            const windowsData = getDataFromStorage('windows-apps', windowsSoftware);
            windowsContainer.innerHTML = windowsData.map(app => createSoftwareCard(app)).join('');
        }
        
        // Load Android apps
        const androidContainer = document.getElementById('androidApps');
        if (androidContainer) {
            const androidData = getDataFromStorage('android-apps', androidApps);
            androidContainer.innerHTML = androidData.map(app => createSoftwareCard(app)).join('');
        }
        
        // Load FRP tools
        const frpContainer = document.getElementById('frpTools');
        if (frpContainer) {
            const frpData = getDataFromStorage('frp-tools-apps', frpTools);
            frpContainer.innerHTML = frpData.map(app => createSoftwareCard(app)).join('');
        }
        
        // Load FRP apps - use simple card without modal
        const frpAppsContainer = document.getElementById('frpApps');
        if (frpAppsContainer) {
            const frpAppsData = getDataFromStorage('frp-apps-apps', frpApps);
            frpAppsContainer.innerHTML = frpAppsData.map(app => createFrpAppSimpleCard(app)).join('');
        }
    } catch (error) {
        console.error('Error loading software data:', error);
    }
}

// ===== Get Data from data.js =====
function getDataFromStorage(storageKey, fallbackData) {
    try {
        // Map storage keys to localStorage keys used by admin panel
        const localStorageKeyMap = {
            'windows-apps': 'falcon-x-windows-apps',
            'android-apps': 'falcon-x-android-apps',
            'frp-tools-apps': 'falcon-x-frp-tools',
            'frp-apps-apps': 'falcon-x-frp-apps'
        };
        
        const localStorageKey = localStorageKeyMap[storageKey];
        if (localStorageKey) {
            const stored = localStorage.getItem(localStorageKey);
            if (stored) {
                const parsedData = JSON.parse(stored);
                console.log(`✅ Loaded ${parsedData.length} items from localStorage (${storageKey})`);
                return parsedData;
            }
        }
    } catch (error) {
        console.error('Error reading from localStorage:', error);
    }
    
    // Fallback to data.js
    console.log(`📂 Using fallback data.js for ${storageKey}`);
    return fallbackData || [];
}

// ===== Refresh Data from Admin Panel =====
function refreshData() {
    // Show loading toast
    showToast('Refreshing page to apply latest updates...', 'info');
    
    // Clear cache and reload the page
    setTimeout(() => {
        window.location.reload(true);
    }, 500);
}

// ===== Create Software Card =====
function createSoftwareCard(software) {
    // Check if icon is a URL or Font Awesome class
    const isImageUrl = software.icon && (software.icon.startsWith('http') || software.icon.startsWith('/') || software.icon.includes('.png') || software.icon.includes('.jpg') || software.icon.includes('.svg') || software.icon.includes('.gif'));
    
    const iconHtml = isImageUrl 
        ? `<img src="${software.icon}" alt="${software.name}" style="width: 100%; height: 100%; object-fit: contain;">` 
        : `<i class="${software.icon || 'fas fa-cube'}"></i>`;
    
    // Modified badge
    const modifiedBadge = software.isModified 
        ? '<span class="modified-badge modified" style="background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.65rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem; margin-left: 0.5rem;"><i class="fas fa-star" style="font-size: 0.6rem;"></i>Modified</span>'
        : '<span class="modified-badge unmodified" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.65rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem; margin-left: 0.5rem;"><i class="fas fa-check-circle" style="font-size: 0.6rem;"></i>Original</span>';
    
    return `
        <div class="software-card" data-category="${software.category}" onclick="showAppDetails('${software.id}')" style="cursor: pointer;">
            <div class="software-header">
                <div class="software-icon">
                    ${iconHtml}
                </div>
                <div class="software-info">
                    <h3>${software.name}</h3>
                    <div style="display: flex; align-items: center; flex-wrap: wrap;">
                        <span class="software-version">v${software.version}</span>
                        ${modifiedBadge}
                    </div>
                </div>
            </div>
            <p class="software-description">${software.description}</p>
            <div class="software-meta">
                <span class="software-size"><i class="fas fa-hdd"></i> ${software.size}</span>
            </div>
        </div>
    `;
}

// ===== Create Simple FRP App Card (No Modal) =====
function createFrpAppSimpleCard(app) {
    // Check if icon is a URL or Font Awesome class
    const isImageUrl = app.icon && (app.icon.startsWith('http') || app.icon.startsWith('/') || app.icon.includes('.png') || app.icon.includes('.jpg') || app.icon.includes('.svg') || app.icon.includes('.gif'));
    
    const iconHtml = isImageUrl 
        ? `<img src="${app.icon}" alt="${app.name}" style="width: 100%; height: 100%; object-fit: contain;">` 
        : `<i class="${app.icon || 'fas fa-mobile-alt'}"></i>`;
    
    // Modified badge
    const modifiedBadge = app.isModified 
        ? '<span class="modified-badge modified" style="background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.65rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem; margin-left: 0.5rem;"><i class="fas fa-star" style="font-size: 0.6rem;"></i>Modified</span>'
        : '<span class="modified-badge unmodified" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.65rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem; margin-left: 0.5rem;"><i class="fas fa-check-circle" style="font-size: 0.6rem;"></i>Original</span>';
    
    // Check if links are valid
    const hasDownloadLink = app.downloadLink && app.downloadLink !== '#' && app.downloadLink !== 'undefined' && app.downloadLink.trim() !== '';
    const hasOriginalLink = app.originalDownloadLink && app.originalDownloadLink !== '#' && app.originalDownloadLink !== 'undefined' && app.originalDownloadLink.trim() !== '';
    
    return `
        <div class="software-card" data-category="${app.category}" style="cursor: default; padding: 1.25rem;">
            <div class="software-header" style="margin-bottom: 0.75rem;">
                <div class="software-icon" style="width: 42px; height: 42px; font-size: 1.1rem;">
                    ${iconHtml}
                </div>
                <div class="software-info">
                    <h3 style="font-size: 1rem; margin-bottom: 0.2rem;">${app.name}</h3>
                    <div style="display: flex; align-items: center; flex-wrap: wrap;">
                        <span class="software-version" style="font-size: 0.8rem;">v${app.version || '1.0'}</span>
                        ${modifiedBadge}
                    </div>
                </div>
            </div>
            <p class="software-description" style="font-size: 0.85rem; line-height: 1.4; margin-bottom: 0.75rem;">${app.description}</p>
            <div class="software-meta" style="padding-top: 0.75rem;">
                <span class="software-size" style="font-size: 0.8rem;"><i class="fas fa-hdd"></i> ${app.size || 'N/A'}</span>
            </div>
            <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; justify-content: center;">
                ${hasDownloadLink 
                    ? `<button class="btn btn-primary" onclick="window.open('${app.downloadLink}', '_blank'); event.stopPropagation();" style="padding: 0.65rem 1.5rem; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(102, 126, 234, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.3)';">
                        <i class="fas fa-external-link-alt" style="margin-right: 0.5rem;"></i>Open Modified
                    </button>`
                    : ''}
                ${hasOriginalLink 
                    ? `<button class="btn" onclick="window.open('${app.originalDownloadLink}', '_blank'); event.stopPropagation();" style="padding: 0.65rem 1.5rem; background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(16, 185, 129, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(16, 185, 129, 0.3)';">
                        <i class="fas fa-certificate" style="margin-right: 0.5rem;"></i>Open Original
                    </button>`
                    : ''}
                ${!hasDownloadLink && !hasOriginalLink 
                    ? `<button class="btn" onclick="event.stopPropagation();" style="padding: 0.65rem 1.5rem; background: linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2)); border: 2px solid rgba(156, 163, 175, 0.3); color: rgba(156, 163, 175, 0.8); border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: not-allowed; backdrop-filter: blur(10px);">
                        <i class="fas fa-clock" style="margin-right: 0.5rem; opacity: 0.6;"></i>Coming Soon
                    </button>`
                    : ''}
            </div>
        </div>
    `;
}

// ===== Handle Download Click =====
function handleDownloadClick(event, softwareId, downloadUrl, appName, hasValidLink) {
    // منع فتح نافذة التفاصيل
    event.stopPropagation();
    event.preventDefault();
    
    if (hasValidLink && downloadUrl && downloadUrl !== '#' && downloadUrl !== 'undefined') {
        window.open(downloadUrl, '_blank');
        showToast(`Downloading ${appName}...`, 'success');
    } else {
        showToast('Download link will be available soon!', 'warning');
    }
}

// ===== Download Software =====
function downloadSoftware(softwareId) {
    // Find the software in all arrays (check localStorage first, then data.js)
    let software = null;
    
    // Helper function to search in array
    const findInArray = (arr, id) => {
        if (!arr) return null;
        // Try to find by both numeric and string ID
        return arr.find(app => app.id == id || app.id === id);
    };
    
    // Check localStorage data first
    const windowsLS = localStorage.getItem('falcon-x-windows-apps');
    if (windowsLS) {
        const windows = JSON.parse(windowsLS);
        software = findInArray(windows, softwareId);
    }
    
    if (!software) {
        const androidLS = localStorage.getItem('falcon-x-android-apps');
        if (androidLS) {
            const android = JSON.parse(androidLS);
            software = findInArray(android, softwareId);
        }
    }
    
    if (!software) {
        const frpToolsLS = localStorage.getItem('falcon-x-frp-tools');
        if (frpToolsLS) {
            const frpT = JSON.parse(frpToolsLS);
            software = findInArray(frpT, softwareId);
        }
    }
    
    if (!software) {
        const frpAppsLS = localStorage.getItem('falcon-x-frp-apps');
        if (frpAppsLS) {
            const frpA = JSON.parse(frpAppsLS);
            software = findInArray(frpA, softwareId);
        }
    }
    
    // Fallback to data.js arrays
    if (!software && typeof windowsSoftware !== 'undefined') {
        software = findInArray(windowsSoftware, softwareId);
    }
    
    if (!software && typeof androidApps !== 'undefined') {
        software = findInArray(androidApps, softwareId);
    }
    
    if (!software && typeof frpTools !== 'undefined') {
        software = findInArray(frpTools, softwareId);
    }
    
    if (!software && typeof frpApps !== 'undefined') {
        software = findInArray(frpApps, softwareId);
    }
    
    if (software) {
        const downloadUrl = software.downloadLink || software.downloadUrl;
        if (downloadUrl && downloadUrl !== '#') {
            // Open download link in new tab
            window.open(downloadUrl, '_blank');
            showToast(`Downloading ${software.name}...`, 'success');
        } else {
            // Show message for unavailable downloads
            showToast('Download link will be available soon!', 'warning');
        }
    } else {
        showToast('Download link not found!', 'error');
        console.error('Software not found with ID:', softwareId);
    }
}

// ===== Toast Notification =====
function showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'warning' ? 'fa-exclamation-triangle' : 
                 'fa-times-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide and remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// ===== Custom Cursor =====
let cursorSpeed = 1;

function initializeCustomCursor() {
    // Don't initialize on mobile devices
    if (window.innerWidth <= 768) return;
    
    // Load saved cursor settings
    const savedCursorStyle = localStorage.getItem('cursor-style') || 'neon';
    const savedCursorSpeed = localStorage.getItem('cursor-speed') || '0.2';
    cursorSpeed = parseFloat(savedCursorSpeed);
    applyCursorStyle(savedCursorStyle);
    
    // Create cursor element
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.id = 'customCursor';
    document.body.appendChild(cursor);
    
    // Ensure cursor is always visible
    cursor.style.opacity = '1';
    cursor.style.display = 'block';
    
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    
    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Smooth cursor animation
    function animateCursor() {
        // Check if cursor should be visible
        const isDefaultCursor = document.body.classList.contains('cursor-default');
        if (isDefaultCursor) {
            cursor.style.display = 'none';
            requestAnimationFrame(animateCursor);
            return;
        }
        
        cursorX += (mouseX - cursorX) * cursorSpeed;
        cursorY += (mouseY - cursorY) * cursorSpeed;
        
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        // Ensure cursor stays visible
        if (cursor.style.display !== 'block') {
            cursor.style.display = 'block';
            cursor.style.opacity = '1';
            cursor.style.visibility = 'visible';
        }
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    
    // Add hover effect for interactive elements
    const linkElements = 'a, .menu-item, .feature-link, .social-link';
    const buttonElements = 'button, .btn, .filter-btn, .download-btn, .cursor-option, .speed-btn, .color-preset, .reset-settings-btn, .software-card';
    const textElements = 'input, textarea, select';
    
    document.addEventListener('mouseover', (e) => {
        // Check for text input fields
        if (e.target.closest(textElements)) {
            cursor.classList.add('text');
            cursor.classList.remove('hover', 'link');
        }
        // Check for links
        else if (e.target.closest(linkElements)) {
            cursor.classList.add('link');
            cursor.classList.remove('hover', 'text');
        }
        // Check for buttons
        else if (e.target.closest(buttonElements)) {
            cursor.classList.add('hover');
            cursor.classList.remove('link', 'text');
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        const target = e.target;
        const relatedTarget = e.relatedTarget;
        
        // Check if we're leaving an interactive element
        if (target.closest(linkElements + ',' + buttonElements + ',' + textElements)) {
            // Only remove classes if we're not entering another interactive element
            if (!relatedTarget || !relatedTarget.closest(linkElements + ',' + buttonElements + ',' + textElements)) {
                cursor.classList.remove('hover', 'link', 'text');
            }
        }
    });
    
    // Add click effect
    document.addEventListener('mousedown', () => {
        cursor.classList.add('click');
    });
    
    document.addEventListener('mouseup', () => {
        cursor.classList.remove('click');
    });
    
    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.display = 'none';
    });
    
    document.addEventListener('mouseenter', () => {
        cursor.style.display = 'block';
        cursor.style.opacity = '1';
    });
    
    // Ensure cursor stays visible in modals and settings
    const ensureCursorVisible = () => {
        const cursor = document.getElementById('customCursor');
        if (cursor && cursor.style.display !== 'none') {
            cursor.style.opacity = '1';
            cursor.style.visibility = 'visible';
        }
    };
    
    // Monitor for modal and settings opening
    const settingsModal = document.getElementById('settingsModal');
    const appDetailsModal = document.getElementById('appDetailsModal');
    
    if (settingsModal) {
        const observer = new MutationObserver(() => {
            ensureCursorVisible();
            // Re-apply cursor classes when modal opens
            if (settingsModal.classList.contains('active')) {
                const savedStyle = localStorage.getItem('cursor-style') || 'neon';
                setTimeout(() => applyCursorStyle(savedStyle), 100);
            }
        });
        observer.observe(settingsModal, { attributes: true, attributeFilter: ['class'] });
    }
    
    if (appDetailsModal) {
        const observer = new MutationObserver(ensureCursorVisible);
        observer.observe(appDetailsModal, { attributes: true, attributeFilter: ['class'] });
    }
}

function applyCursorStyle(style) {
    // Remove all cursor classes
    const cursorClasses = [
        'cursor-default', 'cursor-modern', 'cursor-neon', 'cursor-pointer',
        'cursor-crosshair', 'cursor-dot', 'cursor-ring', 'cursor-diamond'
    ];
    
    cursorClasses.forEach(cls => document.body.classList.remove(cls));
    document.body.classList.add(`cursor-${style}`);
    
    // Force cursor visibility for non-default styles
    const cursor = document.getElementById('customCursor');
    if (cursor) {
        if (style === 'default') {
            cursor.style.display = 'none';
            cursor.style.opacity = '0';
        } else {
            cursor.style.display = 'block';
            cursor.style.opacity = '1';
            cursor.style.visibility = 'visible';
        }
    }
}

function updateCursorSpeed(speed) {
    cursorSpeed = speed;
}


// ===== Settings Management =====
function initializeSettings() {
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    
    // Load saved settings
    loadSettings();
    
    // Open settings modal
    settingsToggle?.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });
    
    // Close settings modal
    closeSettings?.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });
    
    // Close on backdrop click
    settingsModal?.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });
    
    // Cursor style options
    const cursorOptions = document.querySelectorAll('.cursor-option');
    cursorOptions.forEach(option => {
        option.addEventListener('click', () => {
            cursorOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            const cursorStyle = option.dataset.cursor;
            applyCursorStyle(cursorStyle);
            localStorage.setItem('cursor-style', cursorStyle);
        });
    });
    
    // Cursor speed options
    const speedBtns = document.querySelectorAll('.speed-btn');
    speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            speedBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const speed = parseFloat(btn.dataset.speed);
            updateCursorSpeed(speed);
            localStorage.setItem('cursor-speed', speed.toString());
        });
    });
    
    // Color presets
    const colorPresets = document.querySelectorAll('.color-preset');
    colorPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            colorPresets.forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            const color = preset.dataset.color;
            applyColorScheme(color);
            localStorage.setItem('color-scheme', color);
        });
    });
    
    // Reset settings button
    const resetSettingsBtn = document.getElementById('resetSettings');
    resetSettingsBtn?.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            resetToDefaultSettings();
            showToast('Settings reset to default!', 'success');
        }
    });
}

function loadSettings() {
    // Load cursor style
    const savedCursorStyle = localStorage.getItem('cursor-style') || 'neon';
    document.querySelectorAll('.cursor-option').forEach(option => {
        if (option.dataset.cursor === savedCursorStyle) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Load cursor speed
    const savedCursorSpeed = localStorage.getItem('cursor-speed') || '1';
    document.querySelectorAll('.speed-btn').forEach(btn => {
        if (btn.dataset.speed === savedCursorSpeed) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Load color scheme
    const savedColorScheme = localStorage.getItem('color-scheme') || 'blue';
    if (savedColorScheme !== 'custom') {
        document.querySelectorAll('.color-preset').forEach(preset => {
            if (preset.dataset.color === savedColorScheme) {
                preset.classList.add('active');
            } else {
            preset.classList.remove('active');
        }
    });
    applyColorScheme(savedColorScheme);
    }
}

function applyColorScheme(scheme) {
    // Add pulse animation to logos
    const allLogos = document.querySelectorAll('.hero-logo, .logo-image, .mobile-logo');
    allLogos.forEach(logo => {
        logo.style.animation = 'none';
        setTimeout(() => {
            logo.style.animation = '';
        }, 10);
    });
    
    // Remove all color classes
    document.body.classList.remove('color-blue', 'color-purple', 'color-green', 'color-red', 'color-pink', 'color-yellow', 'color-teal', 'color-orange');
    // Add selected color class
    document.body.classList.add(`color-${scheme}`);
    
    // Change hero logo based on color scheme
    const heroLogo = document.querySelector('.hero-logo');
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    
    // Map color schemes to image files
    const colorImages = {
        'blue': currentTheme === 'light' ? 'X.png' : 'X2.png',
        'purple': '854CF0.png',  // Purple
        'green': '0FA373.png',   // Green
        'red': 'DF2F2F.png',     // Red
        'pink': 'DF3783.png',    // Pink
        'yellow': 'DE8510.png',  // Yellow/Orange
        'teal': '1AA294.png',    // Teal
        'orange': 'ED6113.png'   // Orange
    };
    
    if (heroLogo && colorImages[scheme]) {
        // Animate logo change with fade effect
        heroLogo.classList.add('fade-out');
        setTimeout(() => {
            heroLogo.src = `images/${colorImages[scheme]}`;
            heroLogo.classList.remove('fade-out');
            heroLogo.classList.add('fade-in');
            setTimeout(() => {
                heroLogo.classList.remove('fade-in');
            }, 800);
        }, 400);
    }
    
    // Trigger color transition animation
    allLogos.forEach(logo => {
        logo.style.transition = 'filter 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    });
}

function resetToDefaultSettings() {
    // Clear all settings from localStorage
    localStorage.removeItem('cursor-style');
    localStorage.removeItem('cursor-speed');
    localStorage.removeItem('color-scheme');
    
    // Reset cursor style to neon
    applyCursorStyle('neon');
    document.querySelectorAll('.cursor-option').forEach(option => {
        if (option.dataset.cursor === 'neon') {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Reset cursor speed to smooth
    updateCursorSpeed(0.2);
    document.querySelectorAll('.speed-btn').forEach(btn => {
        if (btn.dataset.speed === '0.2') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Reset color scheme to blue
    applyColorScheme('blue');
    document.querySelectorAll('.color-preset').forEach(preset => {
        if (preset.dataset.color === 'blue') {
            preset.classList.add('active');
        } else {
            preset.classList.remove('active');
        }
    });
    
    // Reset hero logo to default
    const heroLogo = document.querySelector('.hero-logo');
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    if (heroLogo) {
        heroLogo.src = currentTheme === 'light' ? 'images/X.png' : 'images/X2.png';
    }
}

// ===== App Details Modal =====
let currentAppId = null;

// Refresh modal data when localStorage changes
function refreshModalData() {
    if (!currentAppId) return;
    
    const app = findAppById(currentAppId);
    if (!app) return;
    
    // Update modal content without closing it
    const modalIcon = document.getElementById('modalAppIcon');
    const modalName = document.getElementById('modalAppName');
    const modalVersion = document.getElementById('modalAppVersion');
    const modalSize = document.getElementById('modalAppSize');
    const modalBadge = document.getElementById('modalAppBadge');
    const modalDescription = document.getElementById('modalAppDescription');
    const screenshotsSection = document.getElementById('screenshotsSection');
    const screenshotsGallery = document.getElementById('screenshotsGallery');
    const featuresSection = document.getElementById('featuresSection');
    const modalFeatures = document.getElementById('modalAppFeatures');
    
    // Update icon
    const isImageUrl = app.icon && (app.icon.startsWith('http') || app.icon.startsWith('/') || app.icon.includes('.png') || app.icon.includes('.jpg') || app.icon.includes('.svg') || app.icon.includes('.gif'));
    if (isImageUrl) {
        modalIcon.innerHTML = `<img src="${app.icon}" alt="${app.name}">`;
    } else {
        modalIcon.innerHTML = `<i class="${app.icon || 'fas fa-cube'}"></i>`;
    }
    
    // Update info
    modalName.textContent = app.name;
    modalVersion.textContent = `v${app.version}`;
    modalSize.textContent = app.size;
    
    // Update badge
    modalBadge.innerHTML = app.isModified 
        ? '<span style="background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;"><i class="fas fa-star" style="font-size: 0.7rem;"></i>Modified</span>'
        : '<span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;"><i class="fas fa-check-circle" style="font-size: 0.7rem;"></i>Original</span>';
    
    // Update description
    modalDescription.textContent = app.fullDescription || app.description;
    
    // Update screenshots
    if (app.screenshots && app.screenshots.length > 0) {
        screenshotsSection.style.display = 'block';
        screenshotsGallery.innerHTML = app.screenshots.map((screenshot, index) => 
            `<div class="screenshot-item" onclick="openLightbox(${index})">
                <img src="${screenshot}" alt="Screenshot ${index + 1}">
            </div>`
        ).join('');
    } else {
        screenshotsSection.style.display = 'none';
    }
    
    // Update features
    if (app.features && app.features.length > 0) {
        featuresSection.style.display = 'block';
        modalFeatures.innerHTML = app.features.map(feature => `<li>${feature}</li>`).join('');
    } else {
        featuresSection.style.display = 'none';
    }
    
    // Update download buttons
    updateDownloadButtons(app);
    
    console.log('✅ Modal data refreshed for app:', app.name);
}

function showAppDetails(appId) {
    // Find the app from all data sources
    let app = findAppById(appId);
    
    if (!app) {
        showToast('Application not found!', 'error');
        return;
    }
    
    currentAppId = appId;
    
    const modal = document.getElementById('appDetailsModal');
    const modalIcon = document.getElementById('modalAppIcon');
    const modalName = document.getElementById('modalAppName');
    const modalVersion = document.getElementById('modalAppVersion');
    const modalSize = document.getElementById('modalAppSize');
    const modalBadge = document.getElementById('modalAppBadge');
    const modalDescription = document.getElementById('modalAppDescription');
    const screenshotsSection = document.getElementById('screenshotsSection');
    const screenshotsGallery = document.getElementById('screenshotsGallery');
    const featuresSection = document.getElementById('featuresSection');
    const modalFeatures = document.getElementById('modalAppFeatures');
    
    // Set app icon
    const isImageUrl = app.icon && (app.icon.startsWith('http') || app.icon.startsWith('/') || app.icon.includes('.png') || app.icon.includes('.jpg') || app.icon.includes('.svg') || app.icon.includes('.gif'));
    if (isImageUrl) {
        modalIcon.innerHTML = `<img src="${app.icon}" alt="${app.name}">`;
    } else {
        modalIcon.innerHTML = `<i class="${app.icon || 'fas fa-cube'}"></i>`;
    }
    
    // Set app info
    modalName.textContent = app.name;
    modalVersion.textContent = `v${app.version}`;
    modalSize.textContent = app.size;
    
    // Set badge
    modalBadge.innerHTML = app.isModified 
        ? '<span style="background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;"><i class="fas fa-star" style="font-size: 0.7rem;"></i>Modified</span>'
        : '<span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;"><i class="fas fa-check-circle" style="font-size: 0.7rem;"></i>Original</span>';
    
    // Set description (use fullDescription if available, otherwise use description)
    modalDescription.textContent = app.fullDescription || app.description;
    
    // Set screenshots
    if (app.screenshots && app.screenshots.length > 0) {
        screenshotsSection.style.display = 'block';
        screenshotsGallery.innerHTML = app.screenshots.map((screenshot, index) => 
            `<div class="screenshot-item" onclick="openLightbox(${index})">
                <img src="${screenshot}" alt="Screenshot ${index + 1}">
            </div>`
        ).join('');
    } else {
        screenshotsSection.style.display = 'none';
    }
    
    // Set features
    if (app.features && app.features.length > 0) {
        featuresSection.style.display = 'block';
        modalFeatures.innerHTML = app.features.map(feature => `<li>${feature}</li>`).join('');
    } else {
        featuresSection.style.display = 'none';
    }
    
    // Update download buttons based on app type
    updateDownloadButtons(app);
    
    // Reset scroll position to top
    const modalContent = modal.querySelector('.app-modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAppDetails() {
    const modal = document.getElementById('appDetailsModal');
    
    // Reset scroll position when closing
    const modalContent = modal.querySelector('.app-modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentAppId = null;
}

function downloadFromModal() {
    if (currentAppId) {
        downloadSoftware(currentAppId);
    }
}

function findAppById(appId) {
    // Helper function to search in array
    const findInArray = (arr, id) => {
        if (!arr) return null;
        return arr.find(app => app.id == id || app.id === id);
    };
    
    // Check localStorage data first
    const windowsLS = localStorage.getItem('falcon-x-windows-apps');
    if (windowsLS) {
        const app = findInArray(JSON.parse(windowsLS), appId);
        if (app) return app;
    }
    
    const androidLS = localStorage.getItem('falcon-x-android-apps');
    if (androidLS) {
        const app = findInArray(JSON.parse(androidLS), appId);
        if (app) return app;
    }
    
    const frpToolsLS = localStorage.getItem('falcon-x-frp-tools');
    if (frpToolsLS) {
        const app = findInArray(JSON.parse(frpToolsLS), appId);
        if (app) return app;
    }
    
    const frpAppsLS = localStorage.getItem('falcon-x-frp-apps');
    if (frpAppsLS) {
        const app = findInArray(JSON.parse(frpAppsLS), appId);
        if (app) return app;
    }
    
    // Fallback to data.js arrays
    if (typeof windowsSoftware !== 'undefined') {
        const app = findInArray(windowsSoftware, appId);
        if (app) return app;
    }
    
    if (typeof androidApps !== 'undefined') {
        const app = findInArray(androidApps, appId);
        if (app) return app;
    }
    
    if (typeof frpTools !== 'undefined') {
        const app = findInArray(frpTools, appId);
        if (app) return app;
    }
    
    if (typeof frpApps !== 'undefined') {
        const app = findInArray(frpApps, appId);
        if (app) return app;
    }
    
    return null;
}

// ===== Image Lightbox =====
let currentImageIndex = 0;
let currentScreenshots = [];

function openLightbox(index) {
    const app = findAppById(currentAppId);
    if (!app || !app.screenshots) return;
    
    currentScreenshots = app.screenshots;
    currentImageIndex = index;
    
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    
    lightboxImage.src = currentScreenshots[currentImageIndex];
    lightbox.classList.add('active');
}

function closeLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    lightbox.classList.remove('active');
}

function nextImage() {
    if (currentScreenshots.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % currentScreenshots.length;
    const lightboxImage = document.getElementById('lightboxImage');
    lightboxImage.src = currentScreenshots[currentImageIndex];
}

function prevImage() {
    if (currentScreenshots.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + currentScreenshots.length) % currentScreenshots.length;
    const lightboxImage = document.getElementById('lightboxImage');
    lightboxImage.src = currentScreenshots[currentImageIndex];
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox && lightbox.classList.contains('active')) {
        if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === 'ArrowLeft') {
            prevImage();
        } else if (e.key === 'Escape') {
            closeLightbox();
        }
    }
    
    // Close app modal with Escape
    const appModal = document.getElementById('appDetailsModal');
    if (appModal && appModal.classList.contains('active') && e.key === 'Escape') {
        closeAppDetails();
    }
});

// Helper function to download from original link
function downloadOriginal(link) {
    console.log('downloadOriginal called with:', link);
    console.log('Link type:', typeof link);
    console.log('Link check:', {
        exists: !!link,
        notEmpty: link !== '',
        notHash: link !== '#',
        notUndefined: link !== 'undefined'
    });
    
    if (link && link !== '' && link !== '#' && link !== 'undefined') {
        console.log('✅ Opening link:', link);
        window.open(link, '_blank');
    } else {
        console.log('❌ Link not valid');
        showToast('Original download link not available!', 'warning');
    }
}

// Helper function to download modified version
function downloadModified(link) {
    if (link && link !== '#' && link !== 'undefined') {
        window.open(link, '_blank');
    } else {
        showToast('Download link will be available soon!', 'warning');
    }
}

// Store current app links globally for button access
let currentAppLinks = {
    downloadLink: '',
    originalDownloadLink: ''
};

// ===== Update Download Buttons =====
function updateDownloadButtons(app) {
    const modalFooter = document.getElementById('modalFooter');
    if (!modalFooter) return;
    
    let buttonsHTML = '';
    
    // Debug: Log the app data
    console.log('App data:', {
        name: app.name,
        downloadLink: app.downloadLink,
        originalDownloadLink: app.originalDownloadLink,
        isModified: app.isModified
    });
    
    // Store links globally
    currentAppLinks.downloadLink = app.downloadLink || '';
    currentAppLinks.originalDownloadLink = app.originalDownloadLink || '';
    
    const hasValidLink = app.downloadLink && app.downloadLink !== '#' && app.downloadLink !== 'undefined';
    const hasValidOriginalLink = app.originalDownloadLink && app.originalDownloadLink !== '' && app.originalDownloadLink !== '#' && app.originalDownloadLink !== 'undefined';
    
    // Check if we have both modified and original links
    if (app.isModified && hasValidLink && hasValidOriginalLink) {
        // Modified version with original link - Show two buttons
        buttonsHTML = `
            <button class="btn btn-primary btn-large" onclick="downloadModified(currentAppLinks.downloadLink)">
                <i class="fas fa-download"></i> Download Modified
            </button>
            <button class="btn btn-large" onclick="downloadOriginal(currentAppLinks.originalDownloadLink)" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; position: relative; overflow: visible;">
                <i class="fas fa-certificate" style="margin-right: 0.5rem;"></i> Download Original
                <span class="original-badge">100%</span>
            </button>
            <button class="btn btn-secondary btn-large" onclick="closeAppDetails()">
                <i class="fas fa-times"></i> Close
            </button>
        `;
    } else if (!app.isModified && hasValidOriginalLink && !hasValidLink) {
        // Original version with original link only (downloadLink is #)
        buttonsHTML = `
            <button class="btn btn-large" onclick="downloadOriginal(currentAppLinks.originalDownloadLink)" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; position: relative; overflow: visible;">
                <i class="fas fa-certificate" style="margin-right: 0.5rem;"></i> Download Original
                <span class="original-badge">100%</span>
            </button>
            <button class="btn btn-secondary btn-large" onclick="closeAppDetails()">
                <i class="fas fa-times"></i> Close
            </button>
        `;
    } else if (app.isModified && hasValidLink) {
        // Modified version without original link
        buttonsHTML = `
            <button class="btn btn-primary btn-large" onclick="downloadModified(currentAppLinks.downloadLink)">
                <i class="fas fa-download"></i> Download Modified
            </button>
            <button class="btn btn-secondary btn-large" onclick="closeAppDetails()">
                <i class="fas fa-times"></i> Close
            </button>
        `;
    } else if (!app.isModified && hasValidLink) {
        // Original version with valid downloadLink
        buttonsHTML = `
            <button class="btn btn-large" onclick="downloadOriginal(currentAppLinks.downloadLink)" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; position: relative; overflow: visible;">
                <i class="fas fa-certificate" style="margin-right: 0.5rem;"></i> Download Original
                <span class="original-badge">100%</span>
            </button>
            <button class="btn btn-secondary btn-large" onclick="closeAppDetails()">
                <i class="fas fa-times"></i> Close
            </button>
        `;
    } else {
        // No valid link at all
        buttonsHTML = `
            <button class="btn btn-large" onclick="showToast('Download link will be available soon!', 'warning')" style="background: linear-gradient(135deg, #6b7280, #4b5563); color: white; border: none;">
                <i class="fas fa-clock"></i> Coming Soon
            </button>
            <button class="btn btn-secondary btn-large" onclick="closeAppDetails()">
                <i class="fas fa-times"></i> Close
            </button>
        `;
    }
    
    modalFooter.innerHTML = buttonsHTML;
}

// ===== FRP Warning Modal =====
function showFrpWarning() {
    // Check if user has opted to not show the warning again
    const dontShow = localStorage.getItem('frp-warning-dont-show');
    if (dontShow === 'true') {
        return;
    }
    
    const modal = document.getElementById('frpWarningModal');
    if (modal) {
        modal.classList.add('active');
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
}

function closeFrpWarning() {
    const modal = document.getElementById('frpWarningModal');
    const checkbox = document.getElementById('dontShowAgain');
    
    if (checkbox && checkbox.checked) {
        localStorage.setItem('frp-warning-dont-show', 'true');
    }
    
    if (modal) {
        modal.classList.remove('active');
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// ===== Export Functions =====
window.navigateToPage = navigateToPage;
window.downloadSoftware = downloadSoftware;
window.handleDownloadClick = handleDownloadClick;
window.showAppDetails = showAppDetails;
window.closeAppDetails = closeAppDetails;
window.downloadFromModal = downloadFromModal;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.nextImage = nextImage;
window.prevImage = prevImage;
window.closeFrpWarning = closeFrpWarning;
window.downloadOriginal = downloadOriginal;
window.downloadModified = downloadModified;
