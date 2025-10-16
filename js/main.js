// ===== DOM Elements =====
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileOverlay = document.getElementById('mobileOverlay');
const desktopThemeToggle = document.getElementById('desktopThemeToggle');
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeSidebar();
    initializeNavigation();
    initializeStatCounters();
    initializeSearch();
    initializeFilters();
    loadSoftwareData();
});

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
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (desktopThemeToggle) {
            desktopThemeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    } else {
        document.body.classList.remove('light-theme');
        if (desktopThemeToggle) {
            desktopThemeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
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

// ===== Navigation Management =====
function initializeNavigation() {
    // Handle menu item clicks
    menuItems.forEach(item => {
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
        
        // Load FRP apps
        const frpAppsContainer = document.getElementById('frpApps');
        if (frpAppsContainer) {
            const frpAppsData = getDataFromStorage('frp-apps-apps', frpApps);
            frpAppsContainer.innerHTML = frpAppsData.map(app => createSoftwareCard(app)).join('');
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
    showToast('Refreshing data from admin panel...', 'info');
    
    // Clear cache and reload software data
    setTimeout(() => {
        loadSoftwareData();
        showToast('Data refreshed successfully!', 'success');
    }, 300);
}

// ===== Create Software Card =====
function createSoftwareCard(software) {
    return `
        <div class="software-card" data-category="${software.category}">
            <div class="software-header">
                <div class="software-icon">
                    <i class="${software.icon}"></i>
                </div>
                <div class="software-info">
                    <h3>${software.name}</h3>
                    <span class="software-version">v${software.version}</span>
                </div>
            </div>
            <p class="software-description">${software.description}</p>
            <div class="software-meta">
                <span class="software-size">${software.size}</span>
                <button class="download-btn" onclick="downloadSoftware('${software.id}')">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        </div>
    `;
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


// ===== Export Functions =====
window.navigateToPage = navigateToPage;
window.downloadSoftware = downloadSoftware;
