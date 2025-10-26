// Custom Notification System
// ========================

// Inject notification HTML if not exists
function initNotificationSystem() {
    if (document.getElementById('customNotificationModal')) return;
    
    const modalHTML = `
        <div class="custom-notification-modal" id="customNotificationModal">
            <div class="notification-modal-box">
                <div class="notification-modal-icon" id="notificationModalIcon">
                    <i class="fas fa-check"></i>
                </div>
                <div class="notification-modal-title" id="notificationModalTitle"></div>
                <div class="notification-modal-message" id="notificationModalMessage"></div>
                <div class="notification-modal-buttons" id="notificationModalButtons"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add styles if not exists
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            .custom-notification-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 99999;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(5px);
            }

            .custom-notification-modal.show {
                display: flex !important;
                animation: fadeIn 0.3s;
            }

            .notification-modal-box {
                background: #1e293b;
                border-radius: 16px;
                padding: 2rem;
                max-width: 420px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 1px solid #334155;
                animation: slideUp 0.3s;
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .notification-modal-icon {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
                font-size: 2.5rem;
            }

            .notification-modal-icon.success {
                background: rgba(16, 185, 129, 0.15);
                color: #10b981;
            }

            .notification-modal-icon.error {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
            }

            .notification-modal-icon.info {
                background: rgba(99, 102, 241, 0.15);
                color: #6366f1;
            }

            .notification-modal-icon.warning {
                background: rgba(245, 158, 11, 0.15);
                color: #f59e0b;
            }

            .notification-modal-title {
                font-size: 1.35rem;
                font-weight: 700;
                text-align: center;
                margin-bottom: 0.75rem;
                color: #f1f5f9;
            }

            .notification-modal-message {
                text-align: center;
                color: #94a3b8;
                margin-bottom: 1.75rem;
                line-height: 1.6;
                font-size: 1.05rem;
            }

            .notification-modal-buttons {
                display: flex;
                gap: 0.75rem;
            }

            .notification-modal-buttons button {
                flex: 1;
                padding: 1rem;
                border: none;
                border-radius: 10px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }

            .notification-btn-primary {
                background: #6366f1;
                color: white;
            }

            .notification-btn-primary:hover {
                background: #4f46e5;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            }

            .notification-btn-secondary {
                background: #0f172a;
                color: #f1f5f9;
                border: 2px solid #334155;
            }

            .notification-btn-secondary:hover {
                background: #334155;
            }

            .notification-btn-danger {
                background: #ef4444;
                color: white;
            }

            .notification-btn-danger:hover {
                background: #dc2626;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
            }
        `;
        document.head.appendChild(style);
    }
}

// Show custom modal
function showNotificationModal(type, title, message, buttons = []) {
    initNotificationSystem();
    
    const modal = document.getElementById('customNotificationModal');
    const modalIcon = document.getElementById('notificationModalIcon');
    const modalTitle = document.getElementById('notificationModalTitle');
    const modalMessage = document.getElementById('notificationModalMessage');
    const modalButtons = document.getElementById('notificationModalButtons');

    // Set icon
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    modalIcon.className = `notification-modal-icon ${type}`;
    modalIcon.innerHTML = `<i class="fas ${icons[type]}"></i>`;
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Set buttons
    if (buttons.length === 0) {
        modalButtons.innerHTML = `
            <button class="notification-btn-primary" onclick="closeNotificationModal()">
                <i class="fas fa-check"></i> حسناً
            </button>
        `;
    } else {
        modalButtons.innerHTML = buttons.map(btn => 
            `<button class="${btn.class}" onclick="${btn.action}">${btn.text}</button>`
        ).join('');
    }

    modal.classList.add('show');
}

// Close modal
function closeNotificationModal() {
    const modal = document.getElementById('customNotificationModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Close on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('customNotificationModal');
    if (e.target === modal) {
        closeNotificationModal();
    }
});

// Custom Alert
window.customAlert = function(type, message) {
    const titles = {
        success: 'نجح',
        error: 'خطأ',
        info: 'معلومة',
        warning: 'تحذير'
    };
    showNotificationModal(type, titles[type], message);
};

// Custom Confirm with Promise
window.customConfirm = function(message, title = 'تأكيد') {
    return new Promise((resolve) => {
        const buttons = [
            {
                text: '<i class="fas fa-times"></i> إلغاء',
                class: 'notification-btn-secondary',
                action: 'closeNotificationModal(); window.__confirmResolve(false);'
            },
            {
                text: '<i class="fas fa-check"></i> تأكيد',
                class: 'notification-btn-primary',
                action: 'closeNotificationModal(); window.__confirmResolve(true);'
            }
        ];
        
        window.__confirmResolve = resolve;
        showNotificationModal('warning', title, message, buttons);
    });
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotificationSystem);
} else {
    initNotificationSystem();
}
