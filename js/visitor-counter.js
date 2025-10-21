// ===== Visitor Counter System =====
// Using CountAPI.xyz - A free and reliable API for counting

class VisitorCounter {
    constructor() {
        // Use a unique namespace and key for your site
        this.namespace = 'falcon-x-site';
        this.key = 'visitors';
        this.apiUrl = `https://api.countapi.xyz/hit/${this.namespace}/${this.key}`;
        this.counterElement = document.getElementById('visitorCount');
        this.init();
    }

    async init() {
        try {
            // Fetch and increment the counter
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            if (data.value) {
                this.animateCounter(data.value);
            } else {
                this.showError();
            }
        } catch (error) {
            console.error('Error fetching visitor count:', error);
            this.showError();
        }
    }

    animateCounter(targetValue) {
        const countElement = this.counterElement.querySelector('.count-number');
        let currentValue = 0;
        const duration = 2000; // 2 seconds
        const increment = Math.ceil(targetValue / (duration / 16)); // 60 FPS
        
        const updateCounter = () => {
            currentValue += increment;
            
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                countElement.textContent = this.formatNumber(currentValue);
                
                // Add completion animation
                this.counterElement.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    this.counterElement.style.transform = 'scale(1)';
                }, 200);
            } else {
                countElement.textContent = this.formatNumber(currentValue);
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }

    formatNumber(num) {
        // Format number with commas
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    showError() {
        const countElement = this.counterElement.querySelector('.count-number');
        countElement.textContent = 'Error';
        countElement.style.fontSize = '2rem';
    }
}

// Initialize the counter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the home page
    const homePage = document.getElementById('home');
    if (homePage && homePage.classList.contains('active')) {
        new VisitorCounter();
    }
    
    // Re-initialize when navigating to home page
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const page = e.currentTarget.getAttribute('data-page');
            if (page === 'home') {
                // Wait for page transition
                setTimeout(() => {
                    const counterElement = document.getElementById('visitorCount');
                    const countNumber = counterElement?.querySelector('.count-number');
                    if (countNumber && countNumber.textContent === 'Loading...') {
                        new VisitorCounter();
                    }
                }, 100);
            }
        });
    });
});
