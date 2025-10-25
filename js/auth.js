// Authentication Manager
const AuthManager = {
    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('githubToken');
        const username = localStorage.getItem('githubUsername');
        const repo = localStorage.getItem('githubRepo');
        
        return token && username && repo;
    },
    
    // Get current session data
    getSession() {
        return {
            token: localStorage.getItem('githubToken'),
            username: localStorage.getItem('githubUsername'),
            repo: localStorage.getItem('githubRepo'),
            avatar: localStorage.getItem('githubAvatar'),
            name: localStorage.getItem('githubName')
        };
    },
    
    // Set session data
    setSession(data) {
        if (data.token) localStorage.setItem('githubToken', data.token);
        if (data.username) localStorage.setItem('githubUsername', data.username);
        if (data.repo) localStorage.setItem('githubRepo', data.repo);
        if (data.avatar) localStorage.setItem('githubAvatar', data.avatar);
        if (data.name) localStorage.setItem('githubName', data.name);
    },
    
    // Clear session
    logout() {
        localStorage.removeItem('githubToken');
        localStorage.removeItem('githubUsername');
        localStorage.removeItem('githubRepo');
        localStorage.removeItem('githubAvatar');
        localStorage.removeItem('githubName');
        window.location.href = 'login.html';
    },
    
    // Validate token with GitHub API
    async validateToken(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Invalid token or unauthorized');
            }
            
            const userData = await response.json();
            return {
                success: true,
                data: userData
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Get user repositories
    async getRepositories(token) {
        try {
            const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch repositories');
            }
            
            const repos = await response.json();
            return {
                success: true,
                data: repos
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Require authentication (redirect if not authenticated)
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
}
