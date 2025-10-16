// ===== Windows Software Data =====
const windowsSoftware = [
    {
        id: 'win-1',
        name: 'Visual Studio Code',
        version: '1.85.0',
        category: 'productivity',
        icon: 'fas fa-code',
        description: 'Free source code editor with built-in support for JavaScript, TypeScript, and Node.js',
        size: '88.2 MB',
        downloadUrl: 'https://code.visualstudio.com/download'
    },
    {
        id: 'win-2',
        name: 'Chrome Browser',
        version: '120.0.6099',
        category: 'productivity',
        icon: 'fab fa-chrome',
        description: 'Fast, secure, and free web browser built for the modern web',
        size: '112.5 MB',
        downloadUrl: 'https://www.google.com/chrome/'
    },
    {
        id: 'win-3',
        name: 'VLC Media Player',
        version: '3.0.20',
        category: 'multimedia',
        icon: 'fas fa-play-circle',
        description: 'Free and open-source cross-platform multimedia player',
        size: '42.8 MB',
        downloadUrl: 'https://www.videolan.org/vlc/'
    },
    {
        id: 'win-4',
        name: 'WinRAR',
        version: '6.24',
        category: 'utilities',
        icon: 'fas fa-file-archive',
        description: 'Powerful archive manager for Windows',
        size: '3.2 MB',
        downloadUrl: 'https://www.rarlab.com/download.htm'
    },
    {
        id: 'win-5',
        name: 'OBS Studio',
        version: '30.0.2',
        category: 'multimedia',
        icon: 'fas fa-video',
        description: 'Free and open-source software for video recording and live streaming',
        size: '142 MB',
        downloadUrl: 'https://obsproject.com/download'
    },
    {
        id: 'win-6',
        name: 'CCleaner',
        version: '6.19',
        category: 'utilities',
        icon: 'fas fa-broom',
        description: 'System optimization, privacy, and cleaning tool',
        size: '58 MB',
        downloadUrl: 'https://www.ccleaner.com/ccleaner/download'
    }
];

// ===== Android Applications Data =====
const androidApps = [
    {
        id: 'and-1',
        name: 'WhatsApp',
        version: '2.24.1.5',
        category: 'social',
        icon: 'fab fa-whatsapp',
        description: 'Simple, reliable, and secure messaging and calling app',
        size: '85 MB',
        downloadUrl: 'https://www.whatsapp.com/download'
    },
    {
        id: 'and-2',
        name: 'MT Manager',
        version: '2.14.5',
        category: 'tools',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Mt_Manager_Logo.png',
        description: 'MT Manager 2.14.5 is a file management and APK editing tool that allows you to edit code and resources, unzip and compress files, and sign or recompile applications.',
        size: '22.41',
        downloadUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Mt_Manager_Logo.png'
    }
];

// ===== FRP Tools Data =====
const frpTools = [
    {
        id: 'frp-1',
        name: 'Samsung FRP Tool',
        version: '2.8',
        category: 'samsung',
        icon: 'fas fa-mobile-alt',
        description: 'Remove FRP lock from Samsung devices running Android 5-13',
        size: '15.2 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-2',
        name: 'GSM Flasher ADB',
        version: '1.0.7',
        category: 'universal',
        icon: 'fas fa-tools',
        description: 'Universal FRP bypass tool using ADB commands',
        size: '8.5 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-3',
        name: 'Xiaomi Mi Account',
        version: '3.2.1',
        category: 'xiaomi',
        icon: 'fas fa-unlock',
        description: 'Remove Mi Account lock from Xiaomi devices',
        size: '22.8 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-4',
        name: 'FRP Bypass APK',
        version: '2024.1',
        category: 'universal',
        icon: 'fas fa-key',
        description: 'Android app to bypass Google account verification',
        size: '4.2 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-5',
        name: 'Oppo FRP Unlock',
        version: '1.5.8',
        category: 'oppo',
        icon: 'fas fa-lock-open',
        description: 'Professional tool for Oppo and Realme FRP removal',
        size: '18.6 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-6',
        name: 'Samsung Odin',
        version: '3.14.4',
        category: 'samsung',
        icon: 'fas fa-sync',
        description: 'Official Samsung flashing tool for firmware and FRP',
        size: '5.8 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-7',
        name: 'MiFlash Unlock',
        version: '6.5.224',
        category: 'xiaomi',
        icon: 'fas fa-mobile',
        description: 'Official Xiaomi bootloader unlock tool',
        size: '62.4 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-8',
        name: 'Realme Flash Tool',
        version: '2.0.1',
        category: 'oppo',
        icon: 'fas fa-download',
        description: 'Flash firmware and remove FRP on Realme devices',
        size: '45.2 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-9',
        name: 'FRP Hijacker',
        version: '1.0',
        category: 'universal',
        icon: 'fas fa-user-secret',
        description: 'Advanced FRP bypass tool for multiple brands',
        size: '12.4 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-10',
        name: 'Samsung ENG Boot',
        version: '2023.12',
        category: 'samsung',
        icon: 'fas fa-cog',
        description: 'Engineering boot files for Samsung FRP bypass',
        size: '285 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-11',
        name: 'Xiaomi EDL Auth',
        version: '2.1',
        category: 'xiaomi',
        icon: 'fas fa-shield-alt',
        description: 'EDL authentication bypass for Xiaomi devices',
        size: '8.9 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-12',
        name: 'Universal ADB',
        version: '5.0',
        category: 'universal',
        icon: 'fas fa-terminal',
        description: 'ADB drivers and FRP tools for all Android devices',
        size: '32.5 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-13',
        name: 'Oppo A3s Tool',
        version: '1.2',
        category: 'oppo',
        icon: 'fas fa-wrench',
        description: 'Specialized tool for Oppo A3s FRP and pattern unlock',
        size: '14.8 MB',
        downloadUrl: '#'
    },
    {
        id: 'frp-14',
        name: 'Samsung Combination',
        version: '2024',
        category: 'samsung',
        icon: 'fas fa-file-archive',
        description: 'Combination firmware files for Samsung FRP bypass',
        size: '1.2 GB',
        downloadUrl: '#'
    },
    {
        id: 'frp-15',
        name: 'Technocare APK',
        version: '8.0.1',
        category: 'universal',
        icon: 'fas fa-magic',
        description: 'One-click FRP bypass APK for Android 5-8',
        size: '2.8 MB',
        downloadUrl: '#'
    }
];

// ===== FRP Applications Data =====
const frpApps = [
    {
        id: 'frpapp-1',
        name: 'FRP Bypass APK',
        version: '2024.5',
        category: 'universal',
        icon: 'fas fa-unlock-alt',
        description: 'Universal FRP bypass application for Android 5-14',
        size: '4.8 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-2',
        name: 'Samsung FRP Helper',
        version: '3.2.1',
        category: 'samsung',
        icon: 'fas fa-mobile-alt',
        description: 'Specialized FRP bypass app for Samsung Galaxy devices',
        size: '6.5 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-3',
        name: 'Quick Shortcut Maker',
        version: '2.4.0',
        category: 'universal',
        icon: 'fas fa-bolt',
        description: 'Create shortcuts to bypass FRP lock screen',
        size: '3.2 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-4',
        name: 'Xiaomi FRP Unlocker',
        version: '2.0.8',
        category: 'xiaomi',
        icon: 'fas fa-key',
        description: 'Remove Mi Account and FRP from Xiaomi devices',
        size: '8.4 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-5',
        name: 'Pangu FRP Bypass',
        version: '1.8.2',
        category: 'universal',
        icon: 'fas fa-shield-alt',
        description: 'Advanced FRP removal tool for multiple brands',
        size: '5.6 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-6',
        name: 'Huawei ID Bypass',
        version: '1.5.4',
        category: 'huawei',
        icon: 'fas fa-unlock',
        description: 'Remove Huawei ID and FRP lock',
        size: '7.2 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-7',
        name: 'Oppo FRP Remover',
        version: '2.3.1',
        category: 'oppo',
        icon: 'fas fa-lock-open',
        description: 'Remove FRP and pattern lock from Oppo devices',
        size: '6.8 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-8',
        name: 'Test DPC',
        version: '7.0.5',
        category: 'universal',
        icon: 'fas fa-vial',
        description: 'Device Policy Controller for FRP bypass',
        size: '4.1 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-9',
        name: 'Realme FRP Tool',
        version: '1.9.2',
        category: 'realme',
        icon: 'fas fa-mobile',
        description: 'FRP bypass and unlock tool for Realme devices',
        size: '5.9 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-10',
        name: 'Samsung Bypass 2024',
        version: '4.0.1',
        category: 'samsung',
        icon: 'fas fa-tools',
        description: 'Latest Samsung FRP bypass for Android 14',
        size: '7.8 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-11',
        name: 'Alliance Shield',
        version: '1.0.4',
        category: 'universal',
        icon: 'fas fa-user-shield',
        description: 'Multiple FRP bypass methods in one app',
        size: '9.2 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-12',
        name: 'Xiaomi Unlocker Pro',
        version: '3.1.5',
        category: 'xiaomi',
        icon: 'fas fa-crown',
        description: 'Professional Mi Account and FRP remover',
        size: '10.5 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-13',
        name: 'FRP Skip',
        version: '2.2.0',
        category: 'universal',
        icon: 'fas fa-forward',
        description: 'Skip Google account verification on any device',
        size: '3.8 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-14',
        name: 'Huawei FRP Master',
        version: '2.6.3',
        category: 'huawei',
        icon: 'fas fa-graduation-cap',
        description: 'Complete FRP solution for Huawei and Honor',
        size: '8.9 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-15',
        name: 'Realme Quick Bypass',
        version: '1.4.7',
        category: 'realme',
        icon: 'fas fa-rocket',
        description: 'Fast FRP bypass for all Realme models',
        size: '5.3 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-16',
        name: 'Samsung Knox Bypass',
        version: '1.2.8',
        category: 'samsung',
        icon: 'fas fa-lock',
        description: 'Bypass Samsung Knox and FRP protection',
        size: '11.2 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-17',
        name: 'Oppo ColorOS FRP',
        version: '2.1.4',
        category: 'oppo',
        icon: 'fas fa-palette',
        description: 'FRP bypass for ColorOS 7-13',
        size: '7.6 MB',
        downloadUrl: '#'
    },
    {
        id: 'frpapp-18',
        name: 'D&G FRP Tool',
        version: '3.5.2',
        category: 'universal',
        icon: 'fas fa-wrench',
        description: 'Professional FRP bypass for Android 8-14',
        size: '6.4 MB',
        downloadUrl: '#'
    }
];