// =====================
// GLOBAL VARIABLES
// =====================
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// =====================
// DOM CONTENT LOADED
// =====================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functions
    initMobileNavigation();
    initSmoothScrolling();
    initScrollAnimations();
    initHeaderScroll();
    initTypingEffect();
    
    console.log('🚀 Yahya Haliloğlu Portfolio Loaded Successfully!');
});

// =====================
// MOBILE NAVIGATION
// =====================
function initMobileNavigation() {
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', toggleMobileNav);
        
        // Close menu when clicking on nav links
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileNav);
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                closeMobileNav();
            }
        });
    }
}

function toggleMobileNav() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    if (navMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

function closeMobileNav() {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// =====================
// SMOOTH SCROLLING
// =====================
function initSmoothScrolling() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// =====================
// HEADER SCROLL EFFECT
// =====================
function initHeaderScroll() {
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.style.background = 'rgba(26, 26, 46, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
        } else {
            header.style.background = 'rgba(26, 26, 46, 0.95)';
            header.style.boxShadow = 'none';
        }
        
        // Hide/show header based on scroll direction
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// =====================
// SCROLL ANIMATIONS
// =====================
function initScrollAnimations() {
    // Create intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Add staggered animation for skill items
                if (entry.target.classList.contains('skill-category')) {
                    const skillItems = entry.target.querySelectorAll('.skill-item');
                    skillItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateX(0)';
                        }, index * 100);
                    });
                }
                
                // Add staggered animation for project cards
                if (entry.target.classList.contains('projects-grid')) {
                    const projectCards = entry.target.querySelectorAll('.project-card');
                    projectCards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 200);
                    });
                }
                
                // Add counter animation for stats
                if (entry.target.classList.contains('about-stats')) {
                    animateCounters();
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.about, .skills, .projects-preview, .skill-category, .projects-grid, .about-stats');
    
    animateElements.forEach(el => {
        // Set initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        // Set initial state for skill items
        if (el.classList.contains('skill-category')) {
            const skillItems = el.querySelectorAll('.skill-item');
            skillItems.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-30px)';
                item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            });
        }
        
        // Set initial state for project cards
        if (el.classList.contains('projects-grid')) {
            const projectCards = el.querySelectorAll('.project-card');
            projectCards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(50px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            });
        }
        
        observer.observe(el);
    });
}

// =====================
// COUNTER ANIMATION
// =====================
function animateCounters() {
    const stats = document.querySelectorAll('.stat h3');
    
    stats.forEach(stat => {
        const target = stat.textContent;
        const isNumber = /^\d+/.test(target);
        
        if (isNumber) {
            const finalNumber = parseInt(target);
            let current = 0;
            const increment = finalNumber / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= finalNumber) {
                    stat.textContent = target; // Keep original format
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(current) + (target.includes('+') ? '+' : '');
                }
            }, 40);
        }
    });
}

// =====================
// TYPING EFFECT
// =====================
function initTypingEffect() {
    const subtitle = document.querySelector('.hero-subtitle');
    if (!subtitle) return;
    
    const text = subtitle.textContent;
    subtitle.textContent = '';
    
    let i = 0;
    const typeTimer = setInterval(() => {
        if (i < text.length) {
            subtitle.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typeTimer);
        }
    }, 100);
}

// =====================
// PARTICLE BACKGROUND
// =====================
function createParticleBackground() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particles';
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
    `;
    
    document.body.appendChild(particleContainer);
    
    // Create particles
    for (let i = 0; i < 50; i++) {
        createParticle(particleContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: rgba(0, 255, 136, 0.3);
        border-radius: 50%;
        animation: float ${Math.random() * 10 + 10}s infinite linear;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
    `;
    
    container.appendChild(particle);
}

// Add particle animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize particle background
createParticleBackground();

// =====================
// UTILITY FUNCTIONS
// =====================

// Smooth scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// =====================
// MOUSE CURSOR EFFECTS
// =====================
function initCustomCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: rgba(0, 255, 136, 0.3);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.1s ease;
        mix-blend-mode: difference;
    `;
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX - 10 + 'px';
        cursor.style.top = e.clientY - 10 + 'px';
    });
    
    // Scale cursor on hover
    const hoverElements = document.querySelectorAll('a, button, .btn, .project-card, .skill-item');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(2)';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
        });
    });
}

// Initialize custom cursor (only on desktop)
if (window.innerWidth > 768) {
    initCustomCursor();
}

// =====================
// PERFORMANCE OPTIMIZATION
// =====================

// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy loading for images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// =====================
// ERROR HANDLING
// =====================
window.addEventListener('error', function(e) {
    console.warn('JavaScript error caught:', e.error);
});

// =====================
// ACCESSIBILITY IMPROVEMENTS
// =====================
function initAccessibility() {
    // Add skip navigation link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--neon-green);
        color: var(--primary-dark);
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', function() {
        this.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content id
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.id = 'main-content';
    }
    
    // Keyboard navigation for custom elements
    const focusableElements = document.querySelectorAll('.project-card, .skill-item');
    focusableElements.forEach(el => {
        el.setAttribute('tabindex', '0');
        el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    });
}

// Initialize accessibility features
initAccessibility();

// =====================
// CONSOLE WELCOME MESSAGE
// =====================
console.log(`
🚀 Yahya Haliloğlu Portfolio Website
📧 Contact: [GitHub/LinkedIn]
💼 Full-Stack Developer & Software Engineer
⭐ Built with modern web technologies

Thanks for checking out the code! 
Looking for collaboration opportunities.
`);

// =====================
// ANALYTICS & TRACKING
// =====================
function trackUserInteraction(action, element) {
    // Basic interaction tracking (can be extended with Google Analytics)
    console.log(`User interaction: ${action} on ${element}`);
}

// Track button clicks
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        trackUserInteraction('click', btn.textContent);
    });
});

// Track project card interactions
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
        const projectName = card.querySelector('h3').textContent;
        trackUserInteraction('project_view', projectName);
    });
});