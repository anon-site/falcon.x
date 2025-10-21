// ===== Performance Utilities =====
// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Detect low-end devices
function isLowEndDevice() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return true;
    }
    
    // Check hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
        return true;
    }
    
    // Check device memory (if available)
    if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
        return true;
    }
    
    return false;
}

// ===== DOM Elements =====
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileOverlay = document.getElementById('mobileOverlay');
const desktopThemeToggle = document.getElementById('desktopThemeToggle');
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', async () => {
    // Apply performance mode if low-end device detected
    if (isLowEndDevice() && !localStorage.getItem('performance-mode-notified')) {
        console.log('Low-end device detected, enabling performance mode');
        document.body.classList.add('performance-mode');
        localStorage.setItem('performance-mode', 'true');
        localStorage.setItem('performance-mode-notified', 'true');
        
        // Show notification after everything loads
        setTimeout(() => {
            showToast('⚡ Performance mode enabled automatically for better experience', 'success');
        }, 2000);
    }
    
    // Check saved performance mode
    if (localStorage.getItem('performance-mode') === 'true') {
        document.body.classList.add('performance-mode');
    }
    
    await loadNavigationFromStorage(); // Load custom navigation first (wait for it)
    initializeTheme();
    initializeSidebar();
    initializeNavigation(); // Now navigation items are loaded
    initializeStatCounters();
    initializeSearch();
    initializeFilters();
    loadSoftwareData();
    initializeSettings();
    initializeStorageListener();
    checkSharedAppLink(); // Check if URL contains shared app link
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
    
    // Check for updates periodically - adjust interval based on performance mode
    const updateInterval = document.body.classList.contains('performance-mode') ? 60000 : 30000;
    
    setInterval(() => {
        const currentUpdate = localStorage.getItem('falcon-x-last-update') || '0';
        if (currentUpdate !== lastKnownUpdate && currentUpdate !== '0') {
            console.log('🔄 Data updated, reloading...');
            
            // Skip visual effects in performance mode
            if (!document.body.classList.contains('performance-mode')) {
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
                
                // Reload data with delay
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
            } else {
                // Instant reload in performance mode
                loadSoftwareData();
                if (currentAppId) {
                    refreshModalData();
                }
            }
            
            lastKnownUpdate = currentUpdate;
            showToast('✨ Data refreshed automatically!', 'success');
        }
    }, updateInterval);
    
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

// ===== Load Navigation from localStorage or GitHub =====
async function loadNavigationFromStorage() {
    try {
        // Always clear navigation cache first to force reload from GitHub
        localStorage.removeItem('navigation');
        
        // First, try to load from GitHub if available
        const githubNavigation = await loadNavigationFromGitHub();
        
        // If GitHub has navigation, save it to localStorage and render it
        if (githubNavigation && githubNavigation.length > 0) {
            localStorage.setItem('navigation', JSON.stringify(githubNavigation));
            console.log('✅ Navigation loaded from GitHub:', githubNavigation.length, 'items');
            renderNavigation(githubNavigation);
        } else {
            // If no GitHub navigation, keep the default HTML navigation
            console.log('ℹ️ No custom navigation from GitHub, keeping default HTML navigation');
        }
    } catch (error) {
        console.error('❌ Error loading navigation:', error);
        console.log('ℹ️ Keeping default HTML navigation due to error');
    }
}

// Render navigation items
function renderNavigation(navItems) {
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
    
    console.log('✅ Navigation rendered:', activeItems.length, 'items');
}

// Load navigation from GitHub settings.json
async function loadNavigationFromGitHub() {
    try {
        // Try to load settings.json from GitHub
        const response = await fetch('js/settings.json');
        
        if (!response.ok) {
            console.log('ℹ️ settings.json not found, using default navigation');
            return null;
        }
        
        const settings = await response.json();
        
        if (settings.navigation && Array.isArray(settings.navigation)) {
            return settings.navigation;
        }
        
        return null;
    } catch (error) {
        console.log('ℹ️ Could not load navigation from GitHub:', error.message);
        return null;
    }
}

// ===== Navigation Management =====
function initializeNavigation() {
    // Re-query menu items after they may have been dynamically loaded
    const dynamicMenuItems = document.querySelectorAll('.menu-item');
    
    console.log('🔗 Initializing navigation, found', dynamicMenuItems.length, 'menu items');
    
    // Initialize dropdown menus
    initializeDropdowns();
    
    // Use event delegation on the sidebar instead of individual items
    const sidebarMenu = document.querySelector('.sidebar-menu');
    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            const submenuItem = e.target.closest('.submenu-item');
            
            if (submenuItem) {
                e.preventDefault();
                const targetPage = submenuItem.dataset.page;
                navigateToPage(targetPage);
                
                // Close sidebar on mobile after clicking menu item
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            } else if (menuItem) {
                // Check if it's a dropdown toggle
                const dropdown = menuItem.dataset.dropdown;
                if (dropdown) {
                    e.preventDefault();
                    toggleDropdown(dropdown);
                } else {
                    e.preventDefault();
                    
                    // إغلاق جميع القوائم المنسدلة عند الضغط على أي زر عادي
                    document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
                        dropdown.classList.remove('active');
                    });
                    
                    const targetPage = menuItem.dataset.page;
                    navigateToPage(targetPage);
                    
                    // Close sidebar on mobile after clicking menu item
                    if (window.innerWidth <= 768) {
                        closeSidebar();
                    }
                }
            }
        });
    }
    
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

// ===== Dropdown Menu Functions =====
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.menu-dropdown');
    console.log('📂 Initializing', dropdowns.length, 'dropdown menus');
}

function toggleDropdown(dropdownId) {
    const dropdown = document.querySelector(`[data-dropdown="${dropdownId}"]`)?.parentElement;
    if (!dropdown) return;
    
    const isCurrentlyActive = dropdown.classList.contains('active');
    
    // إغلاق جميع القوائم المنسدلة الأخرى
    document.querySelectorAll('.menu-dropdown').forEach(item => {
        if (item !== dropdown) {
            item.classList.remove('active');
        }
    });
    
    // Toggle active class للقائمة الحالية
    if (isCurrentlyActive) {
        dropdown.classList.remove('active');
    } else {
        dropdown.classList.add('active');
    }
    
    console.log('🔽 Toggled dropdown:', dropdownId, dropdown.classList.contains('active') ? 'open' : 'closed');
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
    // Re-query menu items and submenu items
    const currentMenuItems = document.querySelectorAll('.menu-item');
    const currentSubmenuItems = document.querySelectorAll('.submenu-item');
    
    // Remove active from all items
    currentMenuItems.forEach(item => item.classList.remove('active'));
    currentSubmenuItems.forEach(item => item.classList.remove('active'));
    
    // Add active to current item
    currentMenuItems.forEach(item => {
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });
    
    currentSubmenuItems.forEach(item => {
        if (item.dataset.page === pageId) {
            item.classList.add('active');
            // Also open the parent dropdown
            const parentDropdown = item.closest('.menu-dropdown');
            if (parentDropdown) {
                parentDropdown.classList.add('active');
            }
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
    // Skip animation in performance mode
    if (document.body.classList.contains('performance-mode')) {
        const target = parseFloat(element.dataset.target);
        element.textContent = target % 1 === 0 ? target.toLocaleString() : target.toFixed(1);
        return;
    }
    
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
        'windows-programs': document.getElementById('windowsProgramsSearch'),
        'windows-games': document.getElementById('windowsGamesSearch'),
        'android-apps': document.getElementById('androidAppsSearch'),
        'android-games': document.getElementById('androidGamesSearch'),
        frp: document.getElementById('frpSearch'),
        'frp-apps': document.getElementById('frpAppsSearch')
    };
    
    Object.entries(searchInputs).forEach(([type, input]) => {
        if (!input) return;
        
        // Use debounce for better performance
        const debouncedFilter = debounce((searchTerm) => {
            filterSoftware(type, searchTerm);
        }, 300);
        
        input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            debouncedFilter(searchTerm);
        });
    });
}

function filterSoftware(type, searchTerm) {
    const containerMap = {
        'windows-programs': 'windowsPrograms',
        'windows-games': 'windowsGames',
        'android-apps': 'androidApps',
        'android-games': 'androidGames',
        'frp': 'frpTools',
        'frp-apps': 'frpApps'
    };
    
    const container = document.getElementById(containerMap[type]);
    
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
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    try {
        console.log('🔄 Loading software data...');
        
        // Try to load from GitHub first if configured
        let githubData = null;
        if (typeof githubAPI !== 'undefined' && githubAPI.isConfigured()) {
            // Show loading indicator when fetching from GitHub
            if (loadingIndicator) {
                loadingIndicator.classList.add('show');
            }
            try {
                console.log('🐙 Attempting to load data from GitHub...');
                githubData = await githubAPI.loadDataFromGitHub();
                
                if (githubData) {
                    console.log('✅ Successfully loaded data from GitHub, caching locally...');
                    // Cache the GitHub data to localStorage for faster future loads
                    localStorage.setItem('falcon-x-windows-apps', JSON.stringify(githubData.windowsSoftware || []));
                    localStorage.setItem('falcon-x-windows-games', JSON.stringify(githubData.windowsGames || []));
                    localStorage.setItem('falcon-x-android-apps', JSON.stringify(githubData.androidApps || []));
                    localStorage.setItem('falcon-x-android-games', JSON.stringify(githubData.androidGames || []));
                    localStorage.setItem('falcon-x-frp-tools', JSON.stringify(githubData.frpTools || []));
                    localStorage.setItem('falcon-x-frp-apps', JSON.stringify(githubData.frpApps || []));
                    localStorage.setItem('falcon-x-last-update', Date.now().toString());
                    
                    showToast('✨ Data loaded from GitHub!', 'success');
                }
            } catch (error) {
                console.warn('⚠️ Failed to load from GitHub, using local data:', error);
            }
        } else {
            console.log('📋 GitHub not configured, using local data');
        }
        
        // Load Windows Programs - priority: GitHub > localStorage > data.js
        const windowsProgramsContainer = document.getElementById('windowsPrograms');
        if (windowsProgramsContainer) {
            const windowsData = githubData ? githubData.windowsSoftware : getDataFromStorage('windows-apps', windowsSoftware);
            windowsProgramsContainer.innerHTML = windowsData.map(app => createSoftwareCard(app)).join('');
            // Update latest Windows (top 3 by lastUpdated)
            const latestWinEl = document.getElementById('latestWindows');
            if (latestWinEl) {
                const latest3 = [...windowsData]
                    .sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0))
                    .slice(0, 3)
                    .map(app => createSoftwareCard(app))
                    .join('');
                latestWinEl.innerHTML = latest3 || '<p style="color: var(--text-secondary);">No recent items.</p>';
            }
        }
        
        // Load Windows Games
        const windowsGamesContainer = document.getElementById('windowsGames');
        if (windowsGamesContainer) {
            const windowsGamesData = githubData ? githubData.windowsGames : getDataFromStorage('windows-games', windowsGames);
            windowsGamesContainer.innerHTML = windowsGamesData.map(app => createSoftwareCard(app)).join('');
        }
        
        // Load Android Apps
        const androidAppsContainer = document.getElementById('androidApps');
        if (androidAppsContainer) {
            const androidData = githubData ? githubData.androidApps : getDataFromStorage('android-apps', androidApps);
            androidAppsContainer.innerHTML = androidData.map(app => createSoftwareCard(app)).join('');
            // Update latest Android (top 3 by lastUpdated)
            const latestAndEl = document.getElementById('latestAndroid');
            if (latestAndEl) {
                const latest3 = [...androidData]
                    .sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0))
                    .slice(0, 3)
                    .map(app => createSoftwareCard(app))
                    .join('');
                latestAndEl.innerHTML = latest3 || '<p style="color: var(--text-secondary);">No recent items.</p>';
            }
        }
        
        // Load Android Games
        const androidGamesContainer = document.getElementById('androidGames');
        if (androidGamesContainer) {
            const androidGamesData = githubData ? githubData.androidGames : getDataFromStorage('android-games', androidGames);
            androidGamesContainer.innerHTML = androidGamesData.map(app => createSoftwareCard(app)).join('');
        }
        
        // Load FRP tools
        const frpContainer = document.getElementById('frpTools');
        if (frpContainer) {
            const frpData = githubData ? githubData.frpTools : getDataFromStorage('frp-tools-apps', frpTools);
            frpContainer.innerHTML = frpData.map(app => createSoftwareCard(app)).join('');
        }
        
        // Load FRP apps - use simple card without modal
        const frpAppsContainer = document.getElementById('frpApps');
        if (frpAppsContainer) {
            const frpAppsData = githubData ? githubData.frpApps : getDataFromStorage('frp-apps-apps', frpApps);
            frpAppsContainer.innerHTML = frpAppsData.map(app => createFrpAppSimpleCard(app)).join('');
        }
        
        console.log('✅ Software data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading software data:', error);
        showToast('Error loading data', 'error');
    } finally {
        // Hide loading indicator when done
        if (loadingIndicator) {
            loadingIndicator.classList.remove('show');
        }
    }
}

// ===== Get Data from data.js =====
function getDataFromStorage(storageKey, fallbackData) {
    try {
        // Map storage keys to localStorage keys used by admin panel
        const localStorageKeyMap = {
            'windows-apps': 'falcon-x-windows-apps',
            'windows-games': 'falcon-x-windows-games',
            'android-apps': 'falcon-x-android-apps',
            'android-games': 'falcon-x-android-games',
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
    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('show');
        const loadingText = loadingIndicator.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = 'Clearing cache and refreshing...';
        }
    }
    
    // Clear all falcon-x related data from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('falcon-x-')) {
            keysToRemove.push(key);
        }
    }
    
    // Remove all falcon-x keys
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed cache: ${key}`);
    });
    
    // Also remove navigation cache to show updated menu items
    localStorage.removeItem('navigation');
    console.log(`🗑️ Removed navigation cache`);
    
    console.log(`✅ Cleared ${keysToRemove.length} cache items`);
    
    // Show success message
    showToast('✨ Cache cleared! Reloading...', 'success');
    
    // Force hard reload after clearing cache
    setTimeout(() => {
        // Try multiple methods to ensure hard reload
        if (window.location.reload) {
            window.location.reload(true);
        } else {
            window.location.href = window.location.href;
        }
    }, 800);
}

// ===== Create Software Card =====
function createSoftwareCard(software) {
    // Check if icon is a URL or Font Awesome class
    const isImageUrl = software.icon && (software.icon.startsWith('http') || software.icon.startsWith('/') || software.icon.includes('.png') || software.icon.includes('.jpg') || software.icon.includes('.svg') || software.icon.includes('.gif'));
    
    const iconHtml = isImageUrl 
        ? `<img src="${software.icon}" alt="${software.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: contain;">` 
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
        ? `<img src="${app.icon}" alt="${app.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: contain;">` 
        : `<i class="${app.icon || 'fas fa-mobile-alt'}"></i>`;
    
    // Check link type (direct or download) - auto-detect from link content
    const isDirect = app.linkType === 'direct' || 
                     (app.originalDownloadLink && app.originalDownloadLink.startsWith('intent://'));
    
    // Modified badge
    const modifiedBadge = app.isModified 
        ? '<span class="modified-badge modified" style="background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.65rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem; margin-left: 0.5rem;"><i class="fas fa-star" style="font-size: 0.6rem;"></i>Modified</span>'
        : '<span class="modified-badge unmodified" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.65rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem; margin-left: 0.5rem;"><i class="fas fa-check-circle" style="font-size: 0.6rem;"></i>Original</span>';
    
    // Check if links are valid
    const hasDownloadLink = app.downloadLink && app.downloadLink !== '#' && app.downloadLink !== 'undefined' && app.downloadLink.trim() !== '';
    const hasOriginalLink = app.originalDownloadLink && app.originalDownloadLink !== '#' && app.originalDownloadLink !== 'undefined' && app.originalDownloadLink.trim() !== '';
    
    return `
        <div class="software-card" data-category="${app.category}" data-frp-app="true" style="cursor: default; padding: 1.25rem;">
            <div class="software-header" style="margin-bottom: 0.75rem;">
                <div class="software-icon" style="width: 42px; height: 42px; font-size: 1.1rem;">
                    ${iconHtml}
                </div>
                <div class="software-info">
                    <h3 style="font-size: 1rem; margin-bottom: 0.2rem;">${app.name}</h3>
                    ${!isDirect ? `<div style="display: flex; align-items: center; flex-wrap: wrap;">
                        <span class="software-version" style="font-size: 0.8rem;">v${app.version || '1.0'}</span>
                        ${modifiedBadge}
                    </div>` : ''}
                </div>
            </div>
            <p class="software-description" style="font-size: 0.85rem; line-height: 1.4; margin-bottom: 0.75rem;">${app.description}</p>
            ${!isDirect ? `<div class="software-meta" style="padding-top: 0.75rem;">
                <span class="software-size" style="font-size: 0.8rem;"><i class="fas fa-hdd"></i> ${app.size || 'N/A'}</span>
            </div>` : `<div style="padding-top: 0.75rem; min-height: 38px;"></div>`}
            <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; justify-content: center;">
                ${hasDownloadLink 
                    ? `<button class="btn btn-primary" onclick="window.open('${app.downloadLink}', '_blank'); event.stopPropagation();" style="padding: 0.65rem 1.5rem; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(102, 126, 234, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.3)';">
                        <i class="fas fa-${isDirect ? 'external-link-alt' : 'download'}" style="margin-right: 0.5rem;"></i>${isDirect ? 'Open' : 'Download Modified'}
                    </button>`
                    : ''}
                ${hasOriginalLink 
                    ? `<button class="btn" onclick="window.open('${app.originalDownloadLink}', '_blank'); event.stopPropagation();" style="padding: 0.65rem 1.5rem; background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(102, 126, 234, 0.25)';">
                        <i class="fas fa-${isDirect ? 'external-link-alt' : 'certificate'}" style="margin-right: 0.5rem;"></i>${isDirect ? 'Open' : 'Download Original'}
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




// ===== Settings Management =====
function initializeSettings() {
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const performanceModeToggle = document.getElementById('performanceModeToggle');
    const performanceModeText = document.getElementById('performanceModeText');
    
    // Load saved settings
    loadSettings();
    
    // Performance Mode Toggle
    if (performanceModeToggle) {
        // Update button text based on current state
        const updatePerformanceModeUI = () => {
            const isEnabled = document.body.classList.contains('performance-mode');
            performanceModeText.textContent = isEnabled ? 'Disable Performance Mode' : 'Enable Performance Mode';
            performanceModeToggle.style.background = isEnabled ? 
                'linear-gradient(135deg, #10b981, #059669)' : 
                'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
        };
        
        updatePerformanceModeUI();
        
        performanceModeToggle.addEventListener('click', () => {
            const isEnabled = document.body.classList.contains('performance-mode');
            
            if (isEnabled) {
                document.body.classList.remove('performance-mode');
                localStorage.removeItem('performance-mode');
                showToast('Performance mode disabled', 'success');
            } else {
                document.body.classList.add('performance-mode');
                localStorage.setItem('performance-mode', 'true');
                showToast('Performance mode enabled - Animations disabled', 'success');
            }
            
            updatePerformanceModeUI();
        });
    }
    
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
    
    // Load color scheme
    const savedColorScheme = localStorage.getItem('color-scheme') || 'purple';
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
    localStorage.removeItem('color-scheme');
    
    // Reset color scheme to purple
    applyColorScheme('purple');
    document.querySelectorAll('.color-preset').forEach(preset => {
        if (preset.dataset.color === 'purple') {
            preset.classList.add('active');
        } else {
            preset.classList.remove('active');
        }
    });
    
    // Reset hero logo to default
    const heroLogo = document.querySelector('.hero-logo');
    if (heroLogo) {
        heroLogo.src = 'images/854CF0.png';
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
    const systemRequirementsSection = document.getElementById('systemRequirementsSection');
    const modalSystemRequirements = document.getElementById('modalSystemRequirements');
    const additionalInfoSection = document.getElementById('additionalInfoSection');
    const modalAdditionalInfo = document.getElementById('modalAdditionalInfo');
    const tutorialSection = document.getElementById('tutorialSection');
    const modalTutorialVideo = document.getElementById('modalTutorialVideo');
    
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
    
    // Update description with formatted notes
    const description = app.fullDescription || app.description;
    modalDescription.innerHTML = formatDescriptionWithNotes(description);
    
    // Update features
    if (app.features && app.features.length > 0) {
        featuresSection.style.display = 'block';
        modalFeatures.innerHTML = app.features.map(feature => `<li>${feature}</li>`).join('');
    } else {
        featuresSection.style.display = 'none';
    }
    
    // Update system requirements
    if (app.systemRequirements && app.systemRequirements.trim() !== '') {
        systemRequirementsSection.style.display = 'block';
        modalSystemRequirements.innerHTML = `<pre style="white-space: pre-wrap; color: var(--text-secondary); line-height: 1.8; margin: 0;">${app.systemRequirements}</pre>`;
    } else {
        systemRequirementsSection.style.display = 'none';
    }
    
    // Update additional info
    let additionalInfoHTML = '';
    if (app.password && app.password.trim() !== '') {
        additionalInfoHTML += `
            <div class="info-item">
                <div class="info-label"><i class="fas fa-key"></i> Extract Password:</div>
                <div class="info-value password-value">
                    <code>${app.password}</code>
                    <button class="copy-btn" onclick="copyToClipboard('${app.password}'); event.stopPropagation();" title="Copy to clipboard">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
    }
    // downloadLink2 is now Modified 2, downloadLink3 is Original 2
    if (app.downloadLink3 && app.downloadLink3 !== '#' && app.downloadLink3.trim() !== '') {
        additionalInfoHTML += `
            <div class="info-item">
                <div class="info-label"><i class="fas fa-certificate"></i> Alternative Original Link:</div>
                <div class="info-value">
                    <a href="${app.downloadLink3}" target="_blank" class="link-btn" style="background: linear-gradient(135deg, #10b981, #059669); color: white;">
                        <i class="fas fa-certificate"></i> Download
                    </a>
                </div>
            </div>
        `;
    }
    if (app.downloadLink2 && app.downloadLink2 !== '#' && app.downloadLink2.trim() !== '') {
        additionalInfoHTML += `
            <div class="info-item">
                <div class="info-label"><i class="fas fa-download"></i> Alternative Modified Link:</div>
                <div class="info-value">
                    <a href="${app.downloadLink2}" target="_blank" class="link-btn" style="background: linear-gradient(135deg, #f59e0b, #ea580c); color: white;">
                        <i class="fas fa-download"></i> Download
                    </a>
                </div>
            </div>
        `;
    }
    if (additionalInfoHTML !== '') {
        additionalInfoSection.style.display = 'block';
        modalAdditionalInfo.innerHTML = additionalInfoHTML;
    } else {
        additionalInfoSection.style.display = 'none';
    }
    
    // Update screenshots with lazy loading
    if (app.screenshots && app.screenshots.length > 0) {
        screenshotsSection.style.display = 'block';
        screenshotsGallery.innerHTML = app.screenshots.map((screenshot, index) => 
            `<div class="screenshot-item" onclick="openLightbox(${index})">
                <img src="${screenshot}" alt="Screenshot ${index + 1}" loading="lazy">
            </div>`
        ).join('');
    } else {
        screenshotsSection.style.display = 'none';
    }
    
    // Update tutorial video
    if (app.tutorialLink && app.tutorialLink.trim() !== '') {
        tutorialSection.style.display = 'block';
        let videoEmbed = '';
        if (app.tutorialLink.includes('youtube.com') || app.tutorialLink.includes('youtu.be')) {
            const videoId = app.tutorialLink.includes('youtu.be') 
                ? app.tutorialLink.split('youtu.be/')[1]?.split('?')[0]
                : new URLSearchParams(new URL(app.tutorialLink).search).get('v');
            if (videoId) {
                videoEmbed = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
            }
        } else {
            videoEmbed = `<iframe src="${app.tutorialLink}" frameborder="0" allowfullscreen></iframe>`;
        }
        modalTutorialVideo.innerHTML = videoEmbed;
    } else {
        tutorialSection.style.display = 'none';
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
    const systemRequirementsSection = document.getElementById('systemRequirementsSection');
    const modalSystemRequirements = document.getElementById('modalSystemRequirements');
    const additionalInfoSection = document.getElementById('additionalInfoSection');
    const modalAdditionalInfo = document.getElementById('modalAdditionalInfo');
    const tutorialSection = document.getElementById('tutorialSection');
    const modalTutorialVideo = document.getElementById('modalTutorialVideo');
    
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
    const description = app.fullDescription || app.description;
    modalDescription.innerHTML = formatDescriptionWithNotes(description);
    
    // Set features
    if (app.features && app.features.length > 0) {
        featuresSection.style.display = 'block';
        modalFeatures.innerHTML = app.features.map(feature => `<li>${feature}</li>`).join('');
    } else {
        featuresSection.style.display = 'none';
    }
    
    // Set system requirements
    if (app.systemRequirements && app.systemRequirements.trim() !== '') {
        systemRequirementsSection.style.display = 'block';
        modalSystemRequirements.innerHTML = `<pre style="white-space: pre-wrap; color: var(--text-secondary); line-height: 1.8; margin: 0;">${app.systemRequirements}</pre>`;
    } else {
        systemRequirementsSection.style.display = 'none';
    }
    
    // Build download section with password and download buttons
    let additionalInfoHTML = '';
    
    // Password section with simple design
    if (app.password && app.password.trim() !== '') {
        additionalInfoHTML += `
            <div style="display: inline-block; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 1rem;">
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Extract Password</div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <code style="padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 0.95rem; color: var(--text-primary);">${app.password}</code>
                    <button onclick="copyToClipboard('${app.password}'); event.stopPropagation();" 
                        style="padding: 0.75rem 1rem; background: var(--primary-color); border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 0.9rem;">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Helper function to check if text is a contact message (Arabic or English)
    const isContactMessage = (text) => {
        if (!text || typeof text !== 'string') return false;
        const lowerText = text.toLowerCase().trim();
        const contactKeywords = [
            'راسل', 'تواصل', 'اتصل', 'ادمن', 'المسؤول', 'المدير',
            'contact', 'admin', 'message', 'reach', 'connect', 'dm'
        ];
        return contactKeywords.some(keyword => lowerText.includes(keyword));
    };
    
    // Check for download links
    const hasOriginalLink1 = app.originalDownloadLink && app.originalDownloadLink !== '' && app.originalDownloadLink !== '#' && app.originalDownloadLink !== 'undefined' && !isContactMessage(app.originalDownloadLink);
    const hasOriginalLink2 = app.downloadLink3 && app.downloadLink3 !== '#' && app.downloadLink3.trim() !== '' && !isContactMessage(app.downloadLink3);
    const hasModifiedLink1 = app.downloadLink && app.downloadLink !== '#' && app.downloadLink !== 'undefined' && !isContactMessage(app.downloadLink);
    const hasModifiedLink2 = app.downloadLink2 && app.downloadLink2 !== '#' && app.downloadLink2.trim() !== '' && !isContactMessage(app.downloadLink2);
    
    // Check if any link is a contact message
    const hasContactMessage = isContactMessage(app.originalDownloadLink) || isContactMessage(app.downloadLink3) || 
                              isContactMessage(app.downloadLink) || isContactMessage(app.downloadLink2);
    
    const totalOriginalLinks = (hasOriginalLink1 ? 1 : 0) + (hasOriginalLink2 ? 1 : 0);
    const totalModifiedLinks = (hasModifiedLink1 ? 1 : 0) + (hasModifiedLink2 ? 1 : 0);
    const totalLinks = totalOriginalLinks + totalModifiedLinks;
    
    // Download buttons section
    if (totalLinks > 0) {
        additionalInfoHTML += `<div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">`;
        
        // Original links - Purple
        if (hasOriginalLink1) {
            additionalInfoHTML += `
                <button onclick="window.open('${app.originalDownloadLink}', '_blank'); event.stopPropagation();" 
                    style="padding: 0.65rem 1rem; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border: none; border-radius: 20px; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: transform 0.2s ease;" 
                    onmouseover="this.style.transform='translateY(-2px)';" 
                    onmouseout="this.style.transform='translateY(0)';">
                    <i class="fas fa-download" style="margin-right: 0.4rem;"></i>Download Original
                </button>`;
        }
        
        if (hasOriginalLink2) {
            additionalInfoHTML += `
                <button onclick="window.open('${app.downloadLink3}', '_blank'); event.stopPropagation();" 
                    style="padding: 0.65rem 1rem; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border: none; border-radius: 20px; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: transform 0.2s ease;" 
                    onmouseover="this.style.transform='translateY(-2px)';" 
                    onmouseout="this.style.transform='translateY(0)';">
                    <i class="fas fa-download" style="margin-right: 0.4rem;"></i>Download Original
                </button>`;
        }
        
        // Modified links - Blue
        if (hasModifiedLink1) {
            additionalInfoHTML += `
                <button onclick="window.open('${app.downloadLink}', '_blank'); event.stopPropagation();" 
                    style="padding: 0.65rem 1rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; border-radius: 20px; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: transform 0.2s ease;" 
                    onmouseover="this.style.transform='translateY(-2px)';" 
                    onmouseout="this.style.transform='translateY(0)';">
                    <i class="fas fa-download" style="margin-right: 0.4rem;"></i>Download Modified
                </button>`;
        }
        
        if (hasModifiedLink2) {
            additionalInfoHTML += `
                <button onclick="window.open('${app.downloadLink2}', '_blank'); event.stopPropagation();" 
                    style="padding: 0.65rem 1rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; border-radius: 20px; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: transform 0.2s ease;" 
                    onmouseover="this.style.transform='translateY(-2px)';" 
                    onmouseout="this.style.transform='translateY(0)';">
                    <i class="fas fa-download" style="margin-right: 0.4rem;"></i>Download Modified
                </button>`;
        }
        
        additionalInfoHTML += `</div>`;
        
        // Add contact section below download buttons
        additionalInfoHTML += `
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="text-align: center; margin-bottom: 1rem;">
                    <p style="margin: 0 0 0.5rem; color: var(--text-secondary); font-size: 0.9rem; font-weight: 500;">If the link doesn't work or to request an app:</p>
                </div>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;">
                    <button onclick="window.open('https://t.me/anon_design', '_blank'); event.stopPropagation();" 
                        style="padding: 0.7rem 1.2rem; background: linear-gradient(135deg, #0088cc 0%, #006699 100%); border: none; border-radius: 20px; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);" 
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 136, 204, 0.4)';" 
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 136, 204, 0.3)';">
                        <i class="fab fa-telegram" style="margin-right: 0.5rem; font-size: 1rem;"></i>Telegram
                    </button>
                    <button onclick="window.open('https://wa.me/306972462001', '_blank'); event.stopPropagation();" 
                        style="padding: 0.7rem 1.2rem; background: linear-gradient(135deg, #25D366 0%, #1DA851 100%); border: none; border-radius: 20px; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);" 
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(37, 211, 102, 0.4)';" 
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(37, 211, 102, 0.3)';">
                        <i class="fab fa-whatsapp" style="margin-right: 0.5rem; font-size: 1rem;"></i>WhatsApp
                    </button>
                </div>
            </div>
        `;
    } else if (hasContactMessage) {
        // Determine app type dynamically
        const appType = findAppById(currentAppId);
        let appTypeArabic = 'البرنامج/التطبيق'; // default
        let appTypeEnglish = 'program/app';
        
        if (appType) {
            // Check which category the app belongs to
            const windowsLS = localStorage.getItem('falcon-x-windows-apps');
            const androidLS = localStorage.getItem('falcon-x-android-apps');
            const frpToolsLS = localStorage.getItem('falcon-x-frp-tools');
            const frpAppsLS = localStorage.getItem('falcon-x-frp-apps');
            
            if (windowsLS && JSON.parse(windowsLS).find(a => a.id == currentAppId)) {
                appTypeArabic = 'البرنامج';
                appTypeEnglish = 'program';
            } else if (androidLS && JSON.parse(androidLS).find(a => a.id == currentAppId)) {
                appTypeArabic = 'التطبيق';
                appTypeEnglish = 'app';
            } else if (frpToolsLS && JSON.parse(frpToolsLS).find(a => a.id == currentAppId)) {
                appTypeArabic = 'البرنامج';
                appTypeEnglish = 'program';
            } else if (frpAppsLS && JSON.parse(frpAppsLS).find(a => a.id == currentAppId)) {
                appTypeArabic = 'التطبيق';
                appTypeEnglish = 'app';
            }
        }
        
        // Show Contact Admin button with Telegram and WhatsApp links when no download links
        additionalInfoHTML += `
            <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center;">
                <div style="text-align: center; padding: 1.25rem; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05)); border-radius: 12px; border: 2px solid rgba(239, 68, 68, 0.3); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);">
                    <i class="fas fa-dollar-sign" style="color: #ef4444; font-size: 1.5rem; margin-bottom: 0.75rem;"></i>
                    <p style="margin: 0; color: var(--text-primary); font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">هذا ${appTypeArabic} غير مجاني</p>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">يرجى التواصل مع الأدمن للحصول على معلومات التسعير</p>
                    <p style="margin: 0.5rem 0 0; color: var(--text-secondary); font-size: 0.85rem; opacity: 0.8;">This ${appTypeEnglish} is not free. Please contact admin for pricing info</p>
                </div>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;">
                    <button onclick="window.open('https://t.me/anon_design', '_blank'); event.stopPropagation();" 
                        style="padding: 0.75rem 1.25rem; background: linear-gradient(135deg, #0088cc 0%, #006699 100%); border: none; border-radius: 20px; color: white; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);" 
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 136, 204, 0.4)';" 
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 136, 204, 0.3)';">
                        <i class="fab fa-telegram" style="margin-right: 0.5rem; font-size: 1.1rem;"></i>Telegram
                    </button>
                    <button onclick="window.open('https://wa.me/306972462001', '_blank'); event.stopPropagation();" 
                        style="padding: 0.75rem 1.25rem; background: linear-gradient(135deg, #25D366 0%, #1DA851 100%); border: none; border-radius: 20px; color: white; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);" 
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(37, 211, 102, 0.4)';" 
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(37, 211, 102, 0.3)';">
                        <i class="fab fa-whatsapp" style="margin-right: 0.5rem; font-size: 1.1rem;"></i>WhatsApp
                    </button>
                </div>
            </div>
        `;
    } else {
        // Show Coming Soon button when no links available - same position as other buttons
        additionalInfoHTML += `
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                <button onclick="event.stopPropagation();" 
                    style="padding: 0.65rem 1rem; background: linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2)); border: 2px solid rgba(156, 163, 175, 0.3); color: rgba(156, 163, 175, 0.8); border-radius: 20px; font-weight: 600; font-size: 0.85rem; cursor: not-allowed; backdrop-filter: blur(10px);">
                    <i class="fas fa-clock" style="margin-right: 0.4rem; opacity: 0.6;"></i>Coming Soon
                </button>
            </div>
        `;
        
        // Add contact section below Coming Soon button
        additionalInfoHTML += `
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="text-align: center; margin-bottom: 1rem;">
                    <p style="margin: 0 0 0.5rem; color: var(--text-secondary); font-size: 0.9rem; font-weight: 500;">If the link doesn't work or to request an app:</p>
                </div>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;">
                    <button onclick="window.open('https://t.me/anon_design', '_blank'); event.stopPropagation();" 
                        style="padding: 0.7rem 1.2rem; background: linear-gradient(135deg, #0088cc 0%, #006699 100%); border: none; border-radius: 20px; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);" 
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 136, 204, 0.4)';" 
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 136, 204, 0.3)';">
                        <i class="fab fa-telegram" style="margin-right: 0.5rem; font-size: 1rem;"></i>Telegram
                    </button>
                    <button onclick="window.open('https://wa.me/306972462001', '_blank'); event.stopPropagation();" 
                        style="padding: 0.7rem 1.2rem; background: linear-gradient(135deg, #25D366 0%, #1DA851 100%); border: none; border-radius: 20px; color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);" 
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(37, 211, 102, 0.4)';" 
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(37, 211, 102, 0.3)';">
                        <i class="fab fa-whatsapp" style="margin-right: 0.5rem; font-size: 1rem;"></i>WhatsApp
                    </button>
                </div>
            </div>
        `;
    }
    
    // Last Updated is now shown in Share Section, not here
    
    if (additionalInfoHTML !== '') {
        additionalInfoSection.style.display = 'block';
        modalAdditionalInfo.innerHTML = additionalInfoHTML;
    } else {
        additionalInfoSection.style.display = 'none';
    }
    
    
    // Set tutorial video with enhanced design
    if (app.tutorialLink && app.tutorialLink.trim() !== '') {
        tutorialSection.style.display = 'block';
        
        let videoEmbed = '';
        
        // Extract YouTube video ID if it's a YouTube link
        if (app.tutorialLink.includes('youtube.com') || app.tutorialLink.includes('youtu.be')) {
            const videoId = app.tutorialLink.includes('youtu.be') 
                ? app.tutorialLink.split('youtu.be/')[1]?.split('?')[0]
                : new URLSearchParams(new URL(app.tutorialLink).search).get('v');
            
            if (videoId) {
                const uniqueId = `video-${videoId}-${Date.now()}`;
                videoEmbed = `
                    <div style="max-width: 720px; margin: 0 auto;">
                        <div style="position: relative; width: 100%; padding-bottom: 56.25%; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.3);">
                            <div id="${uniqueId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('https://img.youtube.com/vi/${videoId}/maxresdefault.jpg') center/cover; cursor: pointer;" onclick="playVideo('${uniqueId}', '${videoId}')">
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px; background: rgba(255, 0, 0, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s; pointer-events: none;">
                                    <i class="fas fa-play" style="color: white; font-size: 2rem; margin-left: 0.3rem;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            // For non-YouTube videos
            videoEmbed = `
                <div style="max-width: 720px; margin: 0 auto;">
                    <div style="position: relative; width: 100%; padding-bottom: 56.25%; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.3);">
                        <iframe src="${app.tutorialLink}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen 
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                        </iframe>
                    </div>
                </div>
            `;
        }
        
        modalTutorialVideo.innerHTML = videoEmbed;
    } else {
        tutorialSection.style.display = 'none';
    }
    
    // Update download buttons based on app type
    updateDownloadButtons(app);
    
    // Add Last Updated in Share Section
    const lastUpdatedDisplay = document.getElementById('lastUpdatedDisplay');
    if (lastUpdatedDisplay) {
        if (app.lastUpdated) {
            const lastUpdatedText = formatLastUpdated(app.lastUpdated);
            lastUpdatedDisplay.innerHTML = `
                <div style="padding: 0.5rem 0.85rem; background: rgba(59, 130, 246, 0.06); border-radius: 8px; display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; color: var(--text-secondary);">
                    <i class="fas fa-clock" style="color: var(--primary-color); font-size: 0.75rem;"></i>
                    <span>Last Updated: <strong style="color: var(--text-primary);">${lastUpdatedText}</strong></span>
                </div>
            `;
        } else {
            lastUpdatedDisplay.innerHTML = '';
        }
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Reset scroll position to top for modal body
    setTimeout(() => {
        const modalBody = modal.querySelector('.app-modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }, 0);
}

function closeAppDetails() {
    const modal = document.getElementById('appDetailsModal');
    
    // Stop tutorial video by clearing its content
    const modalTutorialVideo = document.getElementById('modalTutorialVideo');
    if (modalTutorialVideo) {
        modalTutorialVideo.innerHTML = ''; // Remove iframe to stop video
    }
    
    // Reset scroll position when closing
    const modalBody = modal.querySelector('.app-modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
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
    
    // Hide footer completely since close button is in header and download buttons are in Download Section
    modalFooter.style.display = 'none';
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

// ===== Copy to Clipboard Function =====
function copyToClipboard(text) {
    // Create temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    showToast('Password copied to clipboard!', 'success');
}

// ===== Play Video Function =====
function playVideo(containerId, videoId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen 
                style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;">
            </iframe>
        `;
        container.style.cursor = 'default';
    }
}

// ===== Format Last Updated Date =====
function formatLastUpdated(dateString) {
    if (!dateString) return 'Not specified';
    
    try {
        const date = new Date(dateString);
        
        // Format: dd/mm/yyyy
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Not specified';
    }
}

// ===== Check Shared App Link =====
function checkSharedAppLink() {
    // Check if URL contains app ID hash
    const hash = window.location.hash;
    if (hash && hash.startsWith('#app-')) {
        const appId = hash.replace('#app-', '');
        
        // Wait a bit for data to load
        setTimeout(() => {
            const app = findAppById(appId);
            if (app) {
                // Navigate to the correct page based on app type
                const pageMap = {
                    'windows': 'windows',
                    'android': 'android',
                    'frp-tool': 'frp',
                    'frp-app': 'frp-apps'
                };
                
                // Determine which page the app belongs to
                let targetPage = 'windows'; // default
                
                // Check in which array the app exists
                const windowsLS = localStorage.getItem('falcon-x-windows-apps');
                if (windowsLS) {
                    const windows = JSON.parse(windowsLS);
                    if (windows.find(a => a.id == appId)) {
                        targetPage = 'windows';
                    }
                }
                
                const androidLS = localStorage.getItem('falcon-x-android-apps');
                if (androidLS) {
                    const android = JSON.parse(androidLS);
                    if (android.find(a => a.id == appId)) {
                        targetPage = 'android';
                    }
                }
                
                const frpToolsLS = localStorage.getItem('falcon-x-frp-tools');
                if (frpToolsLS) {
                    const frpT = JSON.parse(frpToolsLS);
                    if (frpT.find(a => a.id == appId)) {
                        targetPage = 'frp';
                    }
                }
                
                const frpAppsLS = localStorage.getItem('falcon-x-frp-apps');
                if (frpAppsLS) {
                    const frpA = JSON.parse(frpAppsLS);
                    if (frpA.find(a => a.id == appId)) {
                        targetPage = 'frp-apps';
                    }
                }
                
                // Navigate to the page
                navigateToPage(targetPage);
                
                // Wait for page to load then open modal
                setTimeout(() => {
                    showAppDetails(appId);
                    // Clear the hash to avoid re-opening on refresh
                    history.replaceState(null, null, ' ');
                }, 300);
            } else {
                console.log('App not found with ID:', appId);
                showToast('App not found!', 'error');
            }
        }, 500);
    }
}

// ===== Share App Function =====
function shareApp() {
    if (!currentAppId) {
        showToast('No app selected to share!', 'error');
        return;
    }
    
    const app = findAppById(currentAppId);
    if (!app) {
        showToast('App not found!', 'error');
        return;
    }
    
    // Build detailed share content
    const appName = `${app.name} v${app.version}`;
    const appDescription = app.description || '';
    const appSize = app.size || 'N/A';
    const appCategory = app.category || '';
    
    // Create share text with app details
    let shareText = `${appName}\n`;
    shareText += `\n${appDescription}`;
    if (appSize !== 'N/A') {
        shareText += `\nSize: ${appSize}`;
    }
    if (appCategory) {
        shareText += `\nCategory: ${appCategory}`;
    }
    shareText += `\n\nGet it from Falcon X:`;
    
    const shareUrl = window.location.href.split('#')[0] + `#app-${currentAppId}`;
    
    // Check if Web Share API is supported
    if (navigator.share) {
        navigator.share({
            title: appName,
            text: shareText,
            url: shareUrl
        })
        .then(() => showToast('✓ Shared successfully!', 'success'))
        .catch((error) => {
            if (error.name !== 'AbortError') {
                fallbackShare(shareText, shareUrl, app.name);
            }
        });
    } else {
        fallbackShare(shareText, shareUrl, app.name);
    }
}

function fallbackShare(text, url, appName) {
    // Copy to clipboard as fallback
    const shareContent = `${text}\n${url}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareContent)
            .then(() => {
                showToast('✓ Link copied to clipboard!', 'success');
            })
            .catch(() => {
                // Fallback for older browsers
                legacyCopyToClipboard(shareContent, appName);
            });
    } else {
        // Fallback for browsers without Clipboard API
        legacyCopyToClipboard(shareContent, appName);
    }
}

function legacyCopyToClipboard(text, appName) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('✓ Link copied to clipboard!', 'success');
        } else {
            showToast('Unable to copy. Please copy manually.', 'error');
        }
    } catch (err) {
        showToast('Unable to share. Please copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
}

// ===== Format Description with Highlighted Notes =====
function formatDescriptionWithNotes(description) {
    if (!description) return '';
    
    // Replace text within parentheses that starts with "Note:" or "ملاحظة:"
    const formatted = description.replace(
        /\((Note:|ملاحظة:)([^)]+)\)/gi,
        '<span class="note-highlight"><i class="fas fa-exclamation-circle"></i> $1$2</span>'
    );
    
    // Also handle notes without parentheses at the beginning of lines
    return formatted.replace(
        /(^|\n)(Note:|ملاحظة:)([^\n]+)/gi,
        '$1<span class="note-highlight"><i class="fas fa-exclamation-circle"></i> $2$3</span>'
    );
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
window.copyToClipboard = copyToClipboard;
window.playVideo = playVideo;
window.shareApp = shareApp;
