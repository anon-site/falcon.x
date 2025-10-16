// Admin Authentication
const DEFAULT_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

// Handle login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorMessage = document.getElementById('errorMessage');
    
    // Get stored credentials or use default
    const storedCredentials = JSON.parse(localStorage.getItem('adminCredentials')) || DEFAULT_CREDENTIALS;
    
    if (username === storedCredentials.username && password === storedCredentials.password) {
        // Successful login
        const sessionData = {
            username: username,
            loginTime: new Date().toISOString(),
            remember: rememberMe
        };
        
        if (rememberMe) {
            localStorage.setItem('adminSession', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
        }
        
        // Redirect to admin panel
        window.location.href = 'admin.html';
    } else {
        // Failed login
        errorMessage.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        errorMessage.style.display = 'block';
        
        // Clear password field
        document.getElementById('password').value = '';
        
        // Hide error after 3 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
});

// Check if already logged in
window.addEventListener('DOMContentLoaded', function() {
    const session = localStorage.getItem('adminSession') || sessionStorage.getItem('adminSession');
    
    if (session) {
        window.location.href = 'admin.html';
    }
});
