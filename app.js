// ==========================================================================
// LoveGoBuy Finds VIP - App Logic & Interactivity
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const REFERRAL_CODE = 'W5U2B5';

    // DOM Elements
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const copyBtn = document.getElementById('copy-code-btn');
    const headerCodeBadge = document.getElementById('header-code-badge');
    const footerCopyBtn = document.getElementById('footer-copy-btn');
    
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const filterPills = document.getElementById('filter-pills');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    const noResults = document.getElementById('no-results');
    const resetSearchBtn = document.getElementById('reset-search-btn');

    let activeCategory = 'all';
    let searchQuery = '';

    // ==========================================================================
    // Clipboard Copy & Toast Functionality
    // ==========================================================================
    function copyCodeToClipboard(customMessage = `Code promo ${REFERRAL_CODE} copié !`) {
        navigator.clipboard.writeText(REFERRAL_CODE)
            .then(() => {
                showToast(customMessage);
            })
            .catch(err => {
                // Fallback for older browsers
                const tempInput = document.createElement('input');
                tempInput.value = REFERRAL_CODE;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                showToast(customMessage);
            });
    }

    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 2800);
    }

    // Copy event listeners
    if (copyBtn) copyBtn.addEventListener('click', () => copyCodeToClipboard());
    if (headerCodeBadge) headerCodeBadge.addEventListener('click', () => copyCodeToClipboard());
    if (footerCopyBtn) footerCopyBtn.addEventListener('click', () => copyCodeToClipboard());

    // ==========================================================================
    // Filter & Search Logic
    // ==========================================================================
    function filterProducts() {
        let visibleCount = 0;

        productCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            const cardTitle = (card.getAttribute('data-title') || card.textContent).toLowerCase();
            
            const matchesCategory = (activeCategory === 'all') || (cardCategory === activeCategory) || (card.classList.contains('featured-card'));
            const matchesSearch = searchQuery === '' || cardTitle.includes(searchQuery);

            if (matchesCategory && matchesSearch) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Toggle No Results View
        if (visibleCount === 0) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
    }

    // Category Click Event
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.getAttribute('data-category');
            filterProducts();
        });
    });

    // Search Input Event
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            
            if (searchQuery.length > 0) {
                clearSearchBtn.style.display = 'flex';
            } else {
                clearSearchBtn.style.display = 'none';
            }
            
            filterProducts();
        });
    }

    // Clear Search Button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.style.display = 'none';
            filterProducts();
            searchInput.focus();
        });
    }

    // Reset Button in empty state
    if (resetSearchBtn) {
        resetSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            activeCategory = 'all';
            clearSearchBtn.style.display = 'none';
            
            filterBtns.forEach(b => b.classList.remove('active'));
            if (filterBtns[0]) filterBtns[0].classList.add('active');
            
            filterProducts();
        });
    }
});
