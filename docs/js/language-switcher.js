/**
 * Language Switcher for Multilingual Quarto Site
 * Handles switching between Spanish (root), Catalan (/ca/), and English (/en/)
 */

function switchLanguage(targetLang) {
    // Get current path
    const currentPath = window.location.pathname;
    
    // Remove any leading slash and site base path
    let cleanPath = currentPath.replace(/^\//, '');
    
    // Remove language prefix if present
    if (cleanPath.startsWith('ca/')) {
        cleanPath = cleanPath.substring(3);
    } else if (cleanPath.startsWith('en/')) {
        cleanPath = cleanPath.substring(3);
    }
    
    // Handle root index page
    if (cleanPath === '' || cleanPath === 'index.html') {
        cleanPath = 'index.html';
    }
    
    // Construct new path based on target language
    let newPath;
    if (targetLang === 'es') {
        // Spanish is in root
        newPath = '/' + cleanPath;
    } else if (targetLang === 'ca') {
        // Catalan is in /ca/
        newPath = '/ca/' + cleanPath;
    } else if (targetLang === 'en') {
        // English is in /en/
        newPath = '/en/' + cleanPath;
    }
    
    // Navigate to new path
    window.location.href = newPath;
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Find all language switcher links and add click handlers
    const langLinks = document.querySelectorAll('[data-lang-switch]');
    
    langLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetLang = this.getAttribute('data-lang-switch');
            switchLanguage(targetLang);
        });
    });
});
