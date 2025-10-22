// ===== Smart Download Handler =====
// Prevents Uptodown and similar sites from opening extra windows

function smartDownload(url, appName = 'file') {
    // Check if it's an Uptodown direct download link
    if (url.includes('uptodown.com/dwn/') || url.includes('dw.uptodown.com')) {
        // Create a hidden iframe to download without opening new window
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        
        // Remove iframe after 5 seconds
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 5000);
        
        console.log('📥 Downloading via iframe (no popup):', appName);
        return;
    }
    
    // For other links, use normal window.open with noopener
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
}

// Override window.open for download links
const originalWindowOpen = window.open;
window.openDownload = function(url, appName) {
    smartDownload(url, appName);
};
