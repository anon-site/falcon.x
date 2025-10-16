// Admin Authentication - Two Step Process
let tempToken = '';

// Toggle token visibility
function toggleToken() {
    const tokenInput = document.getElementById('githubToken');
    const toggleBtn = document.querySelector('#tokenForm .toggle-password i');
    
    if (tokenInput.type === 'password') {
        tokenInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        tokenInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

// Step 1: Handle GitHub Token submission
const tokenForm = document.getElementById('tokenForm');
if (tokenForm) {
    tokenForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const token = document.getElementById('githubToken').value.trim();
        const rememberToken = document.getElementById('rememberToken').checked;
        const errorMessage = document.getElementById('errorMessage');
        
        // Validate token format
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            errorMessage.textContent = 'تنسيق التوكن غير صحيح. يجب أن يبدأ بـ ghp_ أو github_pat_';
            errorMessage.style.display = 'block';
            setTimeout(() => errorMessage.style.display = 'none', 3000);
            return;
        }
        
        // Verify token by making a simple API call
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                // Token is valid
                tempToken = token;
                const userData = await response.json();
                
                // Hide token form, show repo form
                document.getElementById('tokenForm').style.display = 'none';
                document.getElementById('repoForm').style.display = 'block';
                document.getElementById('loginDescription').textContent = 'اختر الـ Repository للإدارة';
                
                // Fill username automatically
                document.getElementById('repoOwner').value = userData.login;
                
                // Load user repositories
                await loadUserRepositories(token, userData.login);
            } else {
                errorMessage.textContent = 'التوكن غير صحيح أو لا يملك الصلاحيات اللازمة';
                errorMessage.style.display = 'block';
                setTimeout(() => errorMessage.style.display = 'none', 3000);
            }
        } catch (error) {
            errorMessage.textContent = 'خطأ في الاتصال بـ GitHub. تحقق من الاتصال بالإنترنت';
            errorMessage.style.display = 'block';
            setTimeout(() => errorMessage.style.display = 'none', 3000);
        }
    });
}

// Step 2: Handle Repository submission
const repoForm = document.getElementById('repoForm');
if (repoForm) {
    repoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const owner = document.getElementById('repoOwner').value.trim();
        const name = document.getElementById('repoName').value.trim();
        const errorMessage = document.getElementById('repoErrorMessage');
        
        // Verify repository exists
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
                headers: {
                    'Authorization': `token ${tempToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                // Save credentials
                const rememberToken = document.getElementById('rememberToken').checked;
                
                const sessionData = {
                    token: tempToken,
                    repo: { owner, name },
                    loginTime: new Date().toISOString()
                };
                
                // Save based on remember preference
                if (rememberToken) {
                    localStorage.setItem('githubToken', tempToken);
                    localStorage.setItem('githubRepo', JSON.stringify({ owner, name }));
                }
                
                sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
                
                // Redirect to admin panel
                window.location.href = 'admin.html';
            } else {
                errorMessage.textContent = 'الـ Repository غير موجود أو لا تملك صلاحية الوصول إليه';
                errorMessage.style.display = 'block';
                setTimeout(() => errorMessage.style.display = 'none', 3000);
            }
        } catch (error) {
            errorMessage.textContent = 'خطأ في التحقق من الـ Repository';
            errorMessage.style.display = 'block';
            setTimeout(() => errorMessage.style.display = 'none', 3000);
        }
    });
}

// Load user repositories
async function loadUserRepositories(token, username) {
    const repoLoader = document.getElementById('repoLoader');
    const repoSelect = document.getElementById('repoName');
    const errorMessage = document.getElementById('repoErrorMessage');
    
    try {
        // Show loader
        repoLoader.style.display = 'block';
        repoSelect.style.display = 'none';
        
        // Fetch repositories (including private repos)
        const response = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const repos = await response.json();
            
            // Clear existing options except the first one
            repoSelect.innerHTML = '<option value="">اختر Repository...</option>';
            
            // Add repositories to select
            repos.forEach(repo => {
                const option = document.createElement('option');
                option.value = repo.name;
                option.textContent = `${repo.name}${repo.private ? ' 🔒' : ''}`;
                option.dataset.fullName = repo.full_name;
                repoSelect.appendChild(option);
            });
            
            // Check if there's a saved repo and select it
            const savedRepo = localStorage.getItem('githubRepo');
            if (savedRepo) {
                const repo = JSON.parse(savedRepo);
                if (repo.name) {
                    repoSelect.value = repo.name;
                }
            }
            
            // Hide loader, show select
            repoLoader.style.display = 'none';
            repoSelect.style.display = 'block';
            
            if (repos.length === 0) {
                errorMessage.textContent = 'لم يتم العثور على Repositories. قم بإنشاء repository أولاً.';
                errorMessage.style.display = 'block';
            }
        } else {
            throw new Error('Failed to fetch repositories');
        }
    } catch (error) {
        repoLoader.style.display = 'none';
        errorMessage.textContent = 'خطأ في تحميل الـ Repositories. حاول مرة أخرى.';
        errorMessage.style.display = 'block';
        
        // Show the select anyway in case of error
        repoSelect.style.display = 'block';
    }
}

// Back to token form
function backToToken() {
    document.getElementById('repoForm').style.display = 'none';
    document.getElementById('tokenForm').style.display = 'block';
    document.getElementById('loginDescription').textContent = 'أدخل Personal Access Token للمتابعة';
    tempToken = '';
}

// Check if already logged in
window.addEventListener('DOMContentLoaded', function() {
    const session = sessionStorage.getItem('adminSession');
    
    if (session) {
        const data = JSON.parse(session);
        // Check if token is still valid (less than 24 hours)
        const loginTime = new Date(data.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
            window.location.href = 'admin.html';
        } else {
            // Session expired
            sessionStorage.removeItem('adminSession');
        }
    }
});
