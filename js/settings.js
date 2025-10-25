// Settings functionality
class SettingsManager {
    constructor() {
        this.themes = {
            default: {
                primary: '#6366f1',
                secondary: '#8b5cf6',
                name: 'default'
            },
            ocean: {
                primary: '#06b6d4',
                secondary: '#0284c7',
                name: 'ocean'
            },
            sunset: {
                primary: '#f59e0b',
                secondary: '#f97316',
                name: 'sunset'
            },
            forest: {
                primary: '#10b981',
                secondary: '#059669',
                name: 'forest'
            },
            rose: {
                primary: '#ec4899',
                secondary: '#db2777',
                name: 'rose'
            }
        };
        
        this.init();
    }
    
    init() {
        // Load saved theme immediately
        const savedTheme = localStorage.getItem('theme') || 'default';
        
        // Apply theme attribute as soon as possible
        document.body.setAttribute('data-theme', savedTheme);
        
        // Apply full theme styling
        this.applyTheme(savedTheme);
        
        // Initialize event listeners after DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }
    
    setupEventListeners() {
        // Settings button click
        const settingsFab = document.getElementById('settingsFab');
        if (settingsFab) {
            settingsFab.addEventListener('click', () => this.openSettings());
        }
        
        // Close settings button
        const settingsClose = document.getElementById('settingsClose');
        if (settingsClose) {
            settingsClose.addEventListener('click', () => this.closeSettings());
        }
        
        // Click outside modal to close
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.closeSettings();
                }
            });
        }
        
        // Clear cache button
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => this.clearCache());
        }
        
        // Theme options
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.changeTheme(theme);
            });
        });
        
        // Language options
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                this.changeLanguage(lang);
            });
        });
        
        // Set active theme and language on load
        this.updateActiveStates();
    }
    
    openSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    clearCache() {
        // Show confirmation dialog with translated message
        const currentLang = localStorage.getItem('language') || 'en';
        const confirmMessage = currentLang === 'ar' 
            ? 'هل أنت متأكد من مسح الذاكرة المؤقتة؟\nسيتم إعادة تحميل الصفحة.'
            : 'Are you sure you want to clear the cache?\nThis will reload the page.';
        
        const confirmed = confirm(confirmMessage);
        
        if (!confirmed) return;
        
        // Disable button and show loading state
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.disabled = true;
            clearCacheBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Clearing...</span>';
        }
        
        // Save important settings
        const theme = localStorage.getItem('theme');
        const language = localStorage.getItem('language');
        const warningDismissed = localStorage.getItem('warningDismissed');
        
        try {
            // Clear localStorage
            localStorage.clear();
            
            // Restore important settings
            if (theme) localStorage.setItem('theme', theme);
            if (language) localStorage.setItem('language', language);
            if (warningDismissed) localStorage.setItem('warningDismissed', warningDismissed);
            
            // Clear sessionStorage
            sessionStorage.clear();
            
            // Clear all cookies (if any)
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // Clear Service Worker cache if exists
            if ('caches' in window) {
                caches.keys().then(function(names) {
                    for (let name of names) {
                        caches.delete(name);
                    }
                });
            }
            
            // Show success notification
            this.showNotification(t('cacheCleared'));
            
            // Reload page with hard refresh to bypass cache
            setTimeout(() => {
                location.reload(true);
            }, 1000);
            
        } catch (error) {
            console.error('Error clearing cache:', error);
            const errorMessage = currentLang === 'ar' 
                ? 'حدث خطأ أثناء مسح الذاكرة المؤقتة.'
                : 'An error occurred while clearing the cache.';
            alert(errorMessage);
        }
    }
    
    changeTheme(themeName) {
        if (this.themes[themeName]) {
            this.applyTheme(themeName);
            localStorage.setItem('theme', themeName);
            this.updateActiveStates();
            this.showNotification(t('themeChanged'));
        }
    }
    
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (theme) {
            // Set data-theme attribute on body for CSS targeting
            document.body.setAttribute('data-theme', themeName);
            
            // Update CSS variables
            document.documentElement.style.setProperty('--primary', theme.primary);
            document.documentElement.style.setProperty('--secondary', theme.secondary);
            
            // Update all elements with gradient backgrounds
            const updateGradients = () => {
                // Sidebar header
                const sidebarHeader = document.querySelector('.sidebar-header');
                if (sidebarHeader) {
                    sidebarHeader.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
                }
                
                // Designer link
                const designerLink = document.querySelector('.designer-link');
                if (designerLink) {
                    designerLink.style.background = `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`;
                }
                
                // Settings button
                const settingsFab = document.getElementById('settingsFab');
                if (settingsFab) {
                    settingsFab.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
                }
                
                // Settings header
                const settingsHeader = document.querySelector('.settings-header');
                if (settingsHeader) {
                    settingsHeader.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
                }
                
                // Update primary buttons
                document.querySelectorAll('.btn-primary').forEach(btn => {
                    btn.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
                });
            };
            
            updateGradients();
            
            // Re-apply after a short delay to catch dynamically loaded elements
            setTimeout(updateGradients, 100);
        }
    }
    
    changeLanguage(lang) {
        if (typeof changeLanguage === 'function') {
            changeLanguage(lang);
            this.updateActiveStates();
            this.showNotification(t('languageChanged'));
            
            // Reload page to apply translations
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }
    
    updateActiveStates() {
        // Update active theme
        const currentTheme = localStorage.getItem('theme') || 'default';
        document.querySelectorAll('.theme-option').forEach(option => {
            if (option.dataset.theme === currentTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        
        // Update active language
        const currentLang = localStorage.getItem('language') || 'en';
        document.querySelectorAll('.language-option').forEach(option => {
            if (option.dataset.lang === currentLang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
    
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'settings-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Add notification animations to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    /* RTL Support */
    body.rtl .settings-notification {
        right: auto;
        left: 20px;
    }
    
    @media (max-width: 768px) {
        .settings-notification {
            top: 10px;
            right: 10px;
            left: 10px;
            padding: 12px 20px;
            font-size: 14px;
        }
        
        body.rtl .settings-notification {
            left: 10px;
        }
    }
`;
document.head.appendChild(style);

// Initialize settings manager
const settingsManager = new SettingsManager();

// Make functions globally available
window.settingsManager = settingsManager;
