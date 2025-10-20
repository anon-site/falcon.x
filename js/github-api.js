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
    async updateFile(path, content, message = 'Update from Falcon X Admin Panel', retryCount = 0) {
        if (!this.isConfigured()) {
            throw new Error('GitHub is not configured. Please set up your credentials.');
        }

        const { owner, repo } = this.getOwnerAndRepo();
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        
        try {
            console.log(`📤 Attempting to update ${path} on GitHub...`);
            console.log(`   Owner: ${owner}, Repo: ${repo}, Branch: ${this.config.branch}`);
            
            // First, get the current file to get its SHA
            const currentFile = await this.getFileContent(path);
            console.log(`✅ Retrieved current file SHA: ${currentFile.sha}`);
            
            // Prepare the update
            const body = {
                message: message,
                content: btoa(unescape(encodeURIComponent(content))), // Encode to base64
                sha: currentFile.sha,
                branch: this.config.branch
            };

            console.log(`📝 Sending update request to GitHub...`);
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
                const errorData = await response.json().catch(() => ({}));
                console.error(`❌ GitHub API Error:`, errorData);
                
                // If 409 conflict and we haven't retried too many times, retry once
                if (response.status === 409 && retryCount < 2) {
                    console.warn(`⚠️ Conflict detected (409), retrying... (attempt ${retryCount + 1})`);
                    // Wait a bit and retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return await this.updateFile(path, content, message, retryCount + 1);
                }
                
                // Provide more detailed error messages
                let errorMessage = `GitHub API Error (${response.status})`;
                if (response.status === 401) {
                    errorMessage += ': Invalid token - تحقق من صلاحية التوكن';
                } else if (response.status === 403) {
                    errorMessage += ': Permission denied - تحقق من صلاحيات التوكن (يجب أن يكون لديه صلاحية repo)';
                } else if (response.status === 404) {
                    errorMessage += ': Repository or file not found - تأكد من اسم Repository والـ Branch';
                } else if (errorData.message) {
                    errorMessage += `: ${errorData.message}`;
                }
                
                throw new Error(errorMessage);
            }

            console.log(`✅ Successfully updated ${path} on GitHub!`);
            return await response.json();
        } catch (error) {
            console.error('❌ Error updating file:', error);
            throw error;
        }
    }

    // Generate data.js content from current data
    generateDataJsContent(windowsApps, androidApps, frpToolsApps, frpAppsApps) {
        let content = '// ===== Windows Software Data =====\n';
        content += 'const windowsSoftware = [\n';
        windowsApps.forEach((app, index) => {
            content += '    {\n';
            content += `        id: ${app.id},\n`;
            content += `        name: '${this.escapeString(app.name)}',\n`;
            content += `        version: '${this.escapeString(app.version)}',\n`;
            content += `        category: '${app.category}',\n`;
            content += `        icon: '${app.icon}',\n`;
            content += `        description: '${this.escapeString(app.description)}',\n`;
            if (app.fullDescription) {
                content += `        fullDescription: '${this.escapeString(app.fullDescription)}',\n`;
            }
            content += `        size: '${app.size}',\n`;
            content += `        downloadLink: '${app.downloadLink}',\n`;
            if (app.originalDownloadLink) {
                content += `        originalDownloadLink: '${app.originalDownloadLink}',\n`;
            }
            content += `        isModified: ${app.isModified}`;
            if (app.downloadLink2 && app.downloadLink2.trim() !== '') {
                content += `,\n        downloadLink2: '${this.escapeString(app.downloadLink2)}'`;
            }
            if (app.downloadLink3 && app.downloadLink3.trim() !== '') {
                content += `,\n        downloadLink3: '${this.escapeString(app.downloadLink3)}'`;
            }
            if (app.tutorialLink && app.tutorialLink.trim() !== '') {
                content += `,\n        tutorialLink: '${this.escapeString(app.tutorialLink)}'`;
            }
            if (app.password && app.password.trim() !== '') {
                content += `,\n        password: '${this.escapeString(app.password)}'`;
            }
            if (app.systemRequirements && app.systemRequirements.trim() !== '') {
                content += `,\n        systemRequirements: '${this.escapeString(app.systemRequirements)}'`;
            }
            if (app.screenshots && app.screenshots.length > 0) {
                content += `,\n        screenshots: [${app.screenshots.map(s => `'${this.escapeString(s)}'`).join(', ')}]`;
            }
            if (app.features && app.features.length > 0) {
                content += `,\n        features: [${app.features.map(f => `'${this.escapeString(f)}'`).join(', ')}]`;
            }
            content += `\n    }${index < windowsApps.length - 1 ? ',' : ''}\n`;
        });
        content += '];\n\n';

        content += '// ===== Android Applications Data =====\n';
        content += 'const androidApps = [\n';
        androidApps.forEach((app, index) => {
            content += '    {\n';
            content += `        id: ${app.id},\n`;
            content += `        name: '${this.escapeString(app.name)}',\n`;
            content += `        version: '${this.escapeString(app.version)}',\n`;
            content += `        category: '${app.category}',\n`;
            content += `        icon: '${app.icon}',\n`;
            content += `        description: '${this.escapeString(app.description)}',\n`;
            if (app.fullDescription) {
                content += `        fullDescription: '${this.escapeString(app.fullDescription)}',\n`;
            }
            content += `        size: '${app.size}',\n`;
            content += `        downloadLink: '${app.downloadLink}',\n`;
            if (app.originalDownloadLink) {
                content += `        originalDownloadLink: '${app.originalDownloadLink}',\n`;
            }
            content += `        isModified: ${app.isModified}`;
            if (app.downloadLink2 && app.downloadLink2.trim() !== '') {
                content += `,\n        downloadLink2: '${this.escapeString(app.downloadLink2)}'`;
            }
            if (app.downloadLink3 && app.downloadLink3.trim() !== '') {
                content += `,\n        downloadLink3: '${this.escapeString(app.downloadLink3)}'`;
            }
            if (app.tutorialLink && app.tutorialLink.trim() !== '') {
                content += `,\n        tutorialLink: '${this.escapeString(app.tutorialLink)}'`;
            }
            if (app.password && app.password.trim() !== '') {
                content += `,\n        password: '${this.escapeString(app.password)}'`;
            }
            if (app.systemRequirements && app.systemRequirements.trim() !== '') {
                content += `,\n        systemRequirements: '${this.escapeString(app.systemRequirements)}'`;
            }
            if (app.screenshots && app.screenshots.length > 0) {
                content += `,\n        screenshots: [${app.screenshots.map(s => `'${this.escapeString(s)}'`).join(', ')}]`;
            }
            if (app.features && app.features.length > 0) {
                content += `,\n        features: [${app.features.map(f => `'${this.escapeString(f)}'`).join(', ')}]`;
            }
            content += `\n    }${index < androidApps.length - 1 ? ',' : ''}\n`;
        });
        content += '];\n\n';

        content += '// ===== FRP Tools Data =====\n';
        content += 'const frpTools = [\n';
        frpToolsApps.forEach((app, index) => {
            content += '    {\n';
            content += `        id: ${app.id},\n`;
            content += `        name: '${this.escapeString(app.name)}',\n`;
            content += `        version: '${this.escapeString(app.version)}',\n`;
            content += `        category: '${app.category}',\n`;
            content += `        icon: '${app.icon}',\n`;
            content += `        description: '${this.escapeString(app.description)}',\n`;
            if (app.fullDescription) {
                content += `        fullDescription: '${this.escapeString(app.fullDescription)}',\n`;
            }
            content += `        size: '${app.size}',\n`;
            content += `        downloadLink: '${app.downloadLink}',\n`;
            if (app.originalDownloadLink) {
                content += `        originalDownloadLink: '${app.originalDownloadLink}',\n`;
            }
            content += `        isModified: ${app.isModified}`;
            if (app.downloadLink2 && app.downloadLink2.trim() !== '') {
                content += `,\n        downloadLink2: '${this.escapeString(app.downloadLink2)}'`;
            }
            if (app.downloadLink3 && app.downloadLink3.trim() !== '') {
                content += `,\n        downloadLink3: '${this.escapeString(app.downloadLink3)}'`;
            }
            if (app.tutorialLink && app.tutorialLink.trim() !== '') {
                content += `,\n        tutorialLink: '${this.escapeString(app.tutorialLink)}'`;
            }
            if (app.password && app.password.trim() !== '') {
                content += `,\n        password: '${this.escapeString(app.password)}'`;
            }
            if (app.systemRequirements && app.systemRequirements.trim() !== '') {
                content += `,\n        systemRequirements: '${this.escapeString(app.systemRequirements)}'`;
            }
            if (app.screenshots && app.screenshots.length > 0) {
                content += `,\n        screenshots: [${app.screenshots.map(s => `'${this.escapeString(s)}'`).join(', ')}]`;
            }
            if (app.features && app.features.length > 0) {
                content += `,\n        features: [${app.features.map(f => `'${this.escapeString(f)}'`).join(', ')}]`;
            }
            content += `\n    }${index < frpToolsApps.length - 1 ? ',' : ''}\n`;
        });
        content += '];\n\n';

        content += '// ===== FRP Applications Data =====\n';
        content += 'const frpApps = [\n';
        frpAppsApps.forEach((app, index) => {
            content += '    {\n';
            content += `        id: ${app.id},\n`;
            content += `        name: '${this.escapeString(app.name)}',\n`;
            content += `        version: '${this.escapeString(app.version)}',\n`;
            content += `        category: '${app.category}',\n`;
            content += `        icon: '${app.icon}',\n`;
            content += `        description: '${this.escapeString(app.description)}',\n`;
            if (app.fullDescription) {
                content += `        fullDescription: '${this.escapeString(app.fullDescription)}',\n`;
            }
            content += `        size: '${app.size}',\n`;
            content += `        downloadLink: '${app.downloadLink}',\n`;
            if (app.originalDownloadLink) {
                content += `        originalDownloadLink: '${app.originalDownloadLink}',\n`;
            }
            content += `        isModified: ${app.isModified}`;
            if (app.linkType) {
                content += `,\n        linkType: '${app.linkType}'`;
            }
            if (app.downloadLink2 && app.downloadLink2.trim() !== '') {
                content += `,\n        downloadLink2: '${this.escapeString(app.downloadLink2)}'`;
            }
            if (app.downloadLink3 && app.downloadLink3.trim() !== '') {
                content += `,\n        downloadLink3: '${this.escapeString(app.downloadLink3)}'`;
            }
            if (app.tutorialLink && app.tutorialLink.trim() !== '') {
                content += `,\n        tutorialLink: '${this.escapeString(app.tutorialLink)}'`;
            }
            if (app.password && app.password.trim() !== '') {
                content += `,\n        password: '${this.escapeString(app.password)}'`;
            }
            if (app.systemRequirements && app.systemRequirements.trim() !== '') {
                content += `,\n        systemRequirements: '${this.escapeString(app.systemRequirements)}'`;
            }
            if (app.screenshots && app.screenshots.length > 0) {
                content += `,\n        screenshots: [${app.screenshots.map(s => `'${this.escapeString(s)}'`).join(', ')}]`;
            }
            if (app.features && app.features.length > 0) {
                content += `,\n        features: [${app.features.map(f => `'${this.escapeString(f)}'`).join(', ')}]`;
            }
            content += `\n    }${index < frpAppsApps.length - 1 ? ',' : ''}\n`;
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

    // Save settings to GitHub
    async saveSettingsToGitHub(siteSettings, colors, navigation, images) {
        const settingsData = {
            siteSettings: siteSettings,
            colors: colors,
            navigation: navigation,
            images: images
        };
        const content = JSON.stringify(settingsData, null, 4);
        return await this.updateFile('js/settings.json', content, 'Update settings from Admin Panel');
    }

    // Get settings from GitHub
    async getSettingsFromGitHub() {
        try {
            const fileData = await this.getFileContent('js/settings.json');
            return JSON.parse(fileData.content);
        } catch (error) {
            console.error('Error loading settings from GitHub:', error);
            return null;
        }
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

    // ===== NEW: Load data.js from GitHub =====
    async loadDataFromGitHub() {
        if (!this.isConfigured()) {
            console.log('⚠️ GitHub not configured, skipping remote load');
            return null;
        }

        try {
            console.log('🔄 Loading data.js from GitHub...');
            const { owner, repo } = this.getOwnerAndRepo();
            
            // Use raw.githubusercontent.com for direct file access (faster)
            const url = `https://raw.githubusercontent.com/${owner}/${repo}/${this.config.branch}/js/data.js`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load data: ${response.status}`);
            }

            const dataJsContent = await response.text();
            
            // Parse the data.js file
            const data = this.parseDataJs(dataJsContent);
            
            console.log('✅ Successfully loaded data from GitHub');
            return data;
        } catch (error) {
            console.error('❌ Error loading data from GitHub:', error);
            return null;
        }
    }

    // Parse data.js content to extract arrays
    parseDataJs(content) {
        try {
            // Create a temporary scope to execute the data.js code safely
            const windowsSoftware = [];
            const androidApps = [];
            const frpTools = [];
            const frpApps = [];
            
            // Use eval in a controlled way (not ideal but works for our use case)
            // Better approach: use Function constructor
            const func = new Function('windowsSoftware', 'androidApps', 'frpTools', 'frpApps', 
                content + '\nreturn { windowsSoftware, androidApps, frpTools, frpApps };'
            );
            
            return func(windowsSoftware, androidApps, frpTools, frpApps);
        } catch (error) {
            console.error('Error parsing data.js:', error);
            return null;
        }
    }

    // Check if remote data is newer than local
    async isRemoteDataNewer() {
        if (!this.isConfigured()) return false;

        try {
            const { owner, repo } = this.getOwnerAndRepo();
            const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=js/data.js&per_page=1`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) return false;

            const commits = await response.json();
            if (commits.length === 0) return false;

            const lastCommitDate = new Date(commits[0].commit.committer.date).getTime();
            const localUpdate = parseInt(localStorage.getItem('falcon-x-last-update') || '0');

            return lastCommitDate > localUpdate;
        } catch (error) {
            console.error('Error checking remote data:', error);
            return false;
        }
    }
}

// Create global instance
const githubAPI = new GitHubAPI();
