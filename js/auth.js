// Authentication Manager
const AuthManager = {
    // Check if user is authenticated
    isAuthenticated() {
        const token = sessionStorage.getItem('githubToken');
        const username = sessionStorage.getItem('githubUsername');
        const repo = sessionStorage.getItem('githubRepo');
        
        return token && username && repo;
    },
    
    // Get current session data
    getSession() {
        return {
            token: sessionStorage.getItem('githubToken'),
            username: sessionStorage.getItem('githubUsername'),
            repo: sessionStorage.getItem('githubRepo'),
            avatar: sessionStorage.getItem('githubAvatar'),
            name: sessionStorage.getItem('githubName')
        };
    },
    
    // Set session data
    setSession(data) {
        if (data.token) sessionStorage.setItem('githubToken', data.token);
        if (data.username) sessionStorage.setItem('githubUsername', data.username);
        if (data.repo) sessionStorage.setItem('githubRepo', data.repo);
        if (data.avatar) sessionStorage.setItem('githubAvatar', data.avatar);
        if (data.name) sessionStorage.setItem('githubName', data.name);
    },
    
    // Clear session
    logout() {
        sessionStorage.removeItem('githubToken');
        sessionStorage.removeItem('githubUsername');
        sessionStorage.removeItem('githubRepo');
        sessionStorage.removeItem('githubAvatar');
        sessionStorage.removeItem('githubName');
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
