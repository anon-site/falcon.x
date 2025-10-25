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
            ? 'هل أنت متأكد من مسح الذاكرة المؤقتة؟\nملاحظة: هذا سيمسح البيانات المحلية في هذا المتصفح فقط\nسيتم إعادة تحميل الصفحة.'
            : 'Are you sure you want to clear the cache?\nNote: This will only clear local data in THIS browser\nThe page will reload.';
        
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
            
            // IMPORTANT: Remove cache timestamp to force GitHub data reload
            localStorage.removeItem('falconx_data_timestamp');
            
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
            
            // Add timestamp to force cache refresh
            const timestamp = new Date().getTime();
            localStorage.setItem('lastCacheCleared', timestamp.toString());
            
            // Show success notification
            this.showNotification(t('cacheCleared'));
            
            // Reload page with hard refresh to bypass cache
            // Using window.location.href with timestamp to force full reload
            setTimeout(() => {
                // Force hard refresh with cache bypass
                const url = new URL(window.location.href);
                url.searchParams.set('_', timestamp);
                window.location.href = url.href;
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
    
    showNotification(message, type = 'success') {
        // Create notification container
        const notification = document.createElement('div');
        notification.className = `falcon-notification falcon-notification-${type}`;
        
        // Get current theme colors
        const currentTheme = this.themes[localStorage.getItem('theme') || 'default'];
        
        // Create notification content
        const icon = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 
                     type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Set custom properties for theme colors
        if (type === 'success') {
            notification.style.setProperty('--notif-primary', currentTheme.primary);
            notification.style.setProperty('--notif-secondary', currentTheme.secondary);
        }
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}


// Initialize settings manager
const settingsManager = new SettingsManager();

// Make functions globally available
window.settingsManager = settingsManager;
