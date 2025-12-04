// =============================================
// ASIAN MEMORY PROJECT - JAVASCRIPT
// Handles interactive functionality
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // === EVENT CARDS EXPANSION ===
    const eventCards = document.querySelectorAll('.event-card');
    
    eventCards.forEach(card => {
        const expandBtn = card.querySelector('.expand-btn');
        
        if (expandBtn) {
            expandBtn.addEventListener('click', function() {
                // Close all other cards
                eventCards.forEach(otherCard => {
                    if (otherCard !== card && otherCard.classList.contains('expanded')) {
                        otherCard.classList.remove('expanded');
                        const otherBtn = otherCard.querySelector('.expand-btn');
                        if (otherBtn) {
                            otherBtn.textContent = 'View Details';
                        }
                    }
                });
                
                // Toggle current card
                card.classList.toggle('expanded');
                
                // Update button text
                if (card.classList.contains('expanded')) {
                    expandBtn.textContent = 'Hide Details';
                } else {
                    expandBtn.textContent = 'View Details';
                }
            });
        }
    });
    
    // === FLIP CARDS MOBILE SUPPORT ===
    const flipCards = document.querySelectorAll('.flip-card');
    
    flipCards.forEach(card => {
        // Add click support for mobile devices
        card.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
        
        // Prevent flipping when clicking on the card itself on desktop (hover handles it)
        // But allow manual toggle on mobile
        if (window.innerWidth <= 768) {
            card.style.cursor = 'pointer';
        }
    });
    
    // === SMOOTH SCROLL FOR ANCHOR LINKS ===
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only handle internal anchor links
            if (href !== '#' && href.length > 1) {
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // === NAVBAR ACTIVE STATE ===
    // Highlight the current page in navigation
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage) {
            link.classList.add('active');
        }
    });
    
    // === RESPONSIVE NAVIGATION ===
    // Handle responsive behavior on window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Reset flip cards on resize
            flipCards.forEach(card => {
                if (window.innerWidth > 768) {
                    card.classList.remove('flipped');
                }
            });
        }, 250);
    });
    
    // === LAZY LOADING FOR IMAGES ===
    // Add lazy loading attribute to images for better performance
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
    });
    
    // === ACCESSIBILITY ENHANCEMENTS ===
    // Add keyboard navigation support for flip cards
    flipCards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'Click to view team member bio');
        
        card.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.classList.toggle('flipped');
            }
        });
    });
    
    // Add keyboard navigation for event cards
    eventCards.forEach(card => {
        const expandBtn = card.querySelector('.expand-btn');
        if (expandBtn) {
            expandBtn.setAttribute('aria-expanded', 'false');
            
            expandBtn.addEventListener('click', function() {
                const isExpanded = card.classList.contains('expanded');
                this.setAttribute('aria-expanded', isExpanded);
            });
        }
    });
    
    // === SCROLL ANIMATIONS (Optional Enhancement) ===
    // Add fade-in animation for elements as they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe cards and sections for scroll animations
    // Only animate flip cards and social links, not event card links
    const animatedElements = document.querySelectorAll('.flip-card, .social-link');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    console.log('Asian Memory Project website loaded successfully! 🎵');
});
