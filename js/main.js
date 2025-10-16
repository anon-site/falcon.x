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
    initializeCustomCursor();
    initializeSettings();
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
        <div class="software-card" data-category="${software.category}">
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


// ===== Custom Cursor =====
let cursorSpeed = 1;

function initializeCustomCursor() {
    // Don't initialize on mobile devices
    if (window.innerWidth <= 768) return;
    
    // Load saved cursor settings
    const savedCursorStyle = localStorage.getItem('cursor-style') || 'arrow';
    const savedCursorSpeed = localStorage.getItem('cursor-speed') || '1';
    cursorSpeed = parseFloat(savedCursorSpeed);
    applyCursorStyle(savedCursorStyle);
    
    // Create cursor element
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.id = 'customCursor';
    document.body.appendChild(cursor);
    
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
        cursorX += (mouseX - cursorX) * cursorSpeed;
        cursorY += (mouseY - cursorY) * cursorSpeed;
        
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    
    // Add hover effect for interactive elements
    const linkElements = 'a, .menu-item, .feature-link, .social-link';
    const buttonElements = 'button, .btn, .filter-btn, .download-btn, .cursor-option, .speed-btn, .color-preset';
    const textElements = 'input, textarea';
    
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
        if (e.target.closest(linkElements + ',' + buttonElements + ',' + textElements)) {
            cursor.classList.remove('hover', 'link', 'text');
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
        cursor.style.opacity = '0';
    });
    
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
    });
}

function applyCursorStyle(style) {
    document.body.classList.remove('cursor-arrow', 'cursor-dot', 'cursor-cross');
    document.body.classList.add(`cursor-${style}`);
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
    const savedCursorStyle = localStorage.getItem('cursor-style') || 'arrow';
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
    
    // Reset cursor style to arrow
    applyCursorStyle('arrow');
    document.querySelectorAll('.cursor-option').forEach(option => {
        if (option.dataset.cursor === 'arrow') {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Reset cursor speed to fast
    updateCursorSpeed(1);
    document.querySelectorAll('.speed-btn').forEach(btn => {
        if (btn.dataset.speed === '1') {
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
}

// ===== Export Functions =====
window.navigateToPage = navigateToPage;
window.downloadSoftware = downloadSoftware;
