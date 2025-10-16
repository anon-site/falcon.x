// ===== GitHub API Manager =====
// This file handles all interactions with GitHub API to update data.js

class GitHubAPI {
    constructor() {
        this.config = this.loadConfig();
    }

    // Load GitHub configuration from localStorage
    loadConfig() {
        const saved = localStorage.getItem('githubConfig');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            token: '',
            repo: '',
            branch: 'main'
        };
    }

    // Save GitHub configuration
    saveConfig(config) {
        this.config = config;
        localStorage.setItem('githubConfig', JSON.stringify(config));
    }

    // Check if GitHub is configured
    isConfigured() {
        return this.config.token && this.config.repo && this.config.repo.includes('/');
    }

    // Extract owner and repo from config
    getOwnerAndRepo() {
        if (!this.config.repo || !this.config.repo.includes('/')) {
            return { owner: '', repo: '' };
        }
        const [owner, repo] = this.config.repo.split('/');
        return { owner, repo };
    }

    // Get file content from GitHub
    async getFileContent(path) {
        if (!this.isConfigured()) {
            throw new Error('GitHub is not configured. Please set up your credentials.');
        }

        const { owner, repo } = this.getOwnerAndRepo();
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return {
                content: atob(data.content), // Decode base64
                sha: data.sha // Needed for updates
            };
        } catch (error) {
            console.error('Error fetching file:', error);
            throw error;
        }
    }

    // Update file on GitHub
    async updateFile(path, content, message = 'Update from Falcon X Admin Panel') {
        if (!this.isConfigured()) {
            throw new Error('GitHub is not configured. Please set up your credentials.');
        }

        const { owner, repo } = this.getOwnerAndRepo();
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        
        try {
            // First, get the current file to get its SHA
            const currentFile = await this.getFileContent(path);
            
            // Prepare the update
            const body = {
                message: message,
                content: btoa(unescape(encodeURIComponent(content))), // Encode to base64
                sha: currentFile.sha,
                branch: this.config.branch
            };

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API Error: ${response.status} - ${errorData.message}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating file:', error);
            throw error;
        }
    }

    // Generate data.js content from current data
    generateDataJsContent(windowsApps, androidApps, frpToolsApps, frpAppsApps) {
        let content = '// ===== Windows Software Data =====\n';
        content += 'const windowsSoftware = [\n';
        windowsApps.forEach((app, index) => {
            content += '    {\n';
            content += `        id: 'win-${index + 1}',\n`;
            content += `        name: '${this.escapeString(app.name)}',\n`;
            content += `        version: '${this.escapeString(app.version)}',\n`;
            content += `        category: '${app.category}',\n`;
            content += `        icon: '${app.icon}',\n`;
            content += `        description: '${this.escapeString(app.description)}',\n`;
            content += `        size: '${app.size}',\n`;
            content += `        downloadUrl: '${app.downloadLink}'\n`;
            content += `    }${index < windowsApps.length - 1 ? ',' : ''}\n`;
        });
        content += '];\n\n';

        content += '// ===== Android Applications Data =====\n';
        content += 'const androidApps = [\n';
        androidApps.forEach((app, index) => {
            content += '    {\n';
            content += `        id: 'and-${index + 1}',\n`;
            content += `        name: '${this.escapeString(app.name)}',\n`;
            content += `        version: '${this.escapeString(app.version)}',\n`;
            content += `        category: '${app.category}',\n`;
            content += `        icon: '${app.icon}',\n`;
            content += `        description: '${this.escapeString(app.description)}',\n`;
            content += `        size: '${app.size}',\n`;
            content += `        downloadUrl: '${app.downloadLink}'\n`;
            content += `    }${index < androidApps.length - 1 ? ',' : ''}\n`;
        });
        content += '];\n\n';

        content += '// ===== FRP Tools Data =====\n';
        content += 'const frpTools = [\n';
        frpToolsApps.forEach((app, index) => {
            content += '    {\n';
            content += `        id: 'frp-${index + 1}',\n`;
            content += `        name: '${this.escapeString(app.name)}',\n`;
            content += `        version: '${this.escapeString(app.version)}',\n`;
            content += `        category: '${app.category}',\n`;
            content += `        icon: '${app.icon}',\n`;
            content += `        description: '${this.escapeString(app.description)}',\n`;
            content += `        size: '${app.size}',\n`;
            content += `        downloadUrl: '${app.downloadLink}'\n`;
            content += `    }${index < frpToolsApps.length - 1 ? ',' : ''}\n`;
        });
        content += '];\n\n';

        content += '// ===== FRP Applications Data =====\n';
        content += 'const frpApps = [\n';
        frpAppsApps.forEach((app, index) => {
            content += '    {\n';
            content += `        id: 'frpapp-${index + 1}',\n`;
            content += `        name: '${this.escapeString(app.name)}',\n`;
            content += `        version: '${this.escapeString(app.version)}',\n`;
            content += `        category: '${app.category}',\n`;
            content += `        icon: '${app.icon}',\n`;
            content += `        description: '${this.escapeString(app.description)}',\n`;
            content += `        size: '${app.size}',\n`;
            content += `        downloadUrl: '${app.downloadLink}'\n`;
            content += `    }${index < frpAppsApps.length - 1 ? ',' : ''}\n`;
        });
        content += '];';

        return content;
    }

    // Escape strings for JavaScript
    escapeString(str) {
        if (!str) return '';
        return str.replace(/\\/g, '\\\\')
                  .replace(/'/g, "\\'")
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r');
    }

    // Save all data to GitHub
    async saveAllDataToGitHub(windowsApps, androidApps, frpToolsApps, frpAppsApps) {
        const content = this.generateDataJsContent(windowsApps, androidApps, frpToolsApps, frpAppsApps);
        return await this.updateFile('js/data.js', content, 'Update data.js from Admin Panel');
    }

    // Get user repositories from token
    async getUserRepos() {
        try {
            if (!this.config.token) {
                return { success: false, message: 'الرجاء إدخال التوكن أولاً' };
            }
            
            const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`خطأ في التوكن: ${response.status}`);
            }

            const repos = await response.json();
            return { 
                success: true, 
                repos: repos.map(repo => ({
                    name: repo.full_name,
                    description: repo.description || 'لا يوجد وصف',
                    updated: repo.updated_at
                }))
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Test GitHub connection
    async testConnection() {
        try {
            const { owner, repo } = this.getOwnerAndRepo();
            if (!owner || !repo) {
                return { success: false, message: 'Repository format should be: username/repository-name' };
            }
            
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to connect: ${response.status} ${response.statusText}`);
            }

            return { success: true, message: 'Connected successfully!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Create global instance
const githubAPI = new GitHubAPI();
