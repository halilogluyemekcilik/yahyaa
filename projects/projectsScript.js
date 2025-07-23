// =====================
// PROJECTS PAGE JAVASCRIPT
// =====================

class ProjectsManager {
    constructor() {
        this.currentFilter = 'all';
        this.isFilteringInProgress = false;
        this.projectCards = [];
        this.filterButtons = [];
        this.searchInput = null;
        this.emptyState = null;
        
        this.init();
    }

    // =====================
    // INITIALIZATION
    // =====================
    init() {
        console.log('🎯 Projects Page Loading...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            this.initializeComponents();
        }
    }

    initializeComponents() {
        try {
            // Cache DOM elements
            this.cacheElements();
            
            // Initialize components
            this.initProjectFilters();
            this.initProjectSearch();
            this.initProjectCards();
            this.initAnimations();
            this.initAccessibility();
            this.initResponsiveHandling();
            
            // Show all projects initially
            this.filterProjects('all');
            
            console.log('✅ Projects page initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing projects page:', error);
        }
    }

    cacheElements() {
        this.projectCards = Array.from(document.querySelectorAll('.project-card'));
        this.filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
        this.searchInput = document.querySelector('.project-search');
        this.projectsGrid = document.querySelector('.projects-grid');
        this.emptyState = document.querySelector('.projects-empty');
        
        if (!this.projectCards.length) {
            console.warn('⚠️ No project cards found');
        }
        if (!this.filterButtons.length) {
            console.warn('⚠️ No filter buttons found');
        }
    }

    // =====================
    // PROJECT FILTERING
    // =====================
    initProjectFilters() {
        if (!this.filterButtons.length) return;

        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleFilterClick(e));
            button.addEventListener('keydown', (e) => this.handleFilterKeydown(e));
        });

        // Set initial active filter
        const activeButton = this.filterButtons.find(btn => btn.classList.contains('active'));
        if (activeButton) {
            this.currentFilter = activeButton.getAttribute('data-filter');
        }
    }

    handleFilterClick(event) {
        if (this.isFilteringInProgress) return;

        const button = event.currentTarget;
        const filter = button.getAttribute('data-filter');

        // Update active state
        this.updateActiveFilter(button);
        
        // Filter projects
        this.filterProjects(filter);
        
        // Track usage
        this.trackFilterUsage(filter);
    }

    handleFilterKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleFilterClick(event);
        }
    }

    updateActiveFilter(activeButton) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    filterProjects(filter) {
        if (this.isFilteringInProgress) return;
        
        this.isFilteringInProgress = true;
        this.currentFilter = filter;

        // Clear search if filtering
        if (this.searchInput && this.searchInput.value) {
            this.searchInput.value = '';
        }

        // Add loading state
        this.setLoadingState(true);

        // Hide all cards first
        this.hideAllCards();

        // Show filtered cards with staggered animation
        setTimeout(() => {
            this.showFilteredCards(filter);
        }, 200);
    }

    hideAllCards() {
        this.projectCards.forEach(card => {
            card.classList.add('hidden');
            card.classList.remove('show');
        });
    }

    showFilteredCards(filter) {
        let visibleCount = 0;
        const delay = 100;

        this.projectCards.forEach((card, index) => {
            const categories = card.getAttribute('data-category') || '';
            const shouldShow = filter === 'all' || categories.includes(filter);

            if (shouldShow) {
                setTimeout(() => {
                    card.classList.remove('hidden');
                    card.classList.add('show');
                }, index * delay);
                visibleCount++;
            }
        });

        // Finish loading state
        setTimeout(() => {
            this.setLoadingState(false);
            this.toggleEmptyState(visibleCount === 0, filter);
            this.isFilteringInProgress = false;
        }, this.projectCards.length * delay + 300);
    }

    setLoadingState(isLoading) {
        if (this.projectsGrid) {
            this.projectsGrid.style.opacity = isLoading ? '0.7' : '1';
            this.projectsGrid.style.pointerEvents = isLoading ? 'none' : 'auto';
        }
    }

    // =====================
    // SEARCH FUNCTIONALITY
    // =====================
    initProjectSearch() {
        if (!this.searchInput) return;

        // Debounced search
        let searchTimeout;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchProjects(e.target.value);
            }, 300);
        });

        // Clear search on Escape
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    }

    searchProjects(query) {
        const searchQuery = query.toLowerCase().trim();
        
        if (searchQuery === '') {
            this.filterProjects(this.currentFilter);
            return;
        }

        let visibleCount = 0;

        this.projectCards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.project-description')?.textContent.toLowerCase() || '';
            const techTags = Array.from(card.querySelectorAll('.tech-tag'))
                .map(tag => tag.textContent.toLowerCase());

            const matches = title.includes(searchQuery) || 
                           description.includes(searchQuery) || 
                           techTags.some(tech => tech.includes(searchQuery));

            if (matches) {
                card.classList.remove('hidden');
                card.classList.add('show');
                visibleCount++;
            } else {
                card.classList.add('hidden');
                card.classList.remove('show');
            }
        });

        this.toggleEmptyState(visibleCount === 0, `"${query}"`);
        this.trackSearch(searchQuery, visibleCount);
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.filterProjects(this.currentFilter);
        }
    }

    // =====================
    // EMPTY STATE HANDLING
    // =====================
    toggleEmptyState(show, filterContext = '') {
        if (!this.emptyState) return;

        if (show) {
            this.updateEmptyStateMessage(filterContext);
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
        }
    }

    updateEmptyStateMessage(context) {
        if (!this.emptyState) return;

        const title = this.emptyState.querySelector('h3');
        const description = this.emptyState.querySelector('p');

        if (context.startsWith('"')) {
            // Search context
            if (title) title.textContent = 'Arama sonucu bulunamadı';
            if (description) description.textContent = `${context} için eşleşen proje bulunamadı. Farklı anahtar kelimeler deneyebilirsiniz.`;
        } else {
            // Filter context
            if (title) title.textContent = 'Bu kategoride proje bulunamadı';
            if (description) description.textContent = 'Farklı bir kategori seçerek diğer projelerimi keşfedebilirsiniz.';
        }
    }

    // =====================
    // PROJECT CARDS INTERACTION
    // =====================
    initProjectCards() {
        this.projectCards.forEach((card, index) => {
            // Mouse interactions
            card.addEventListener('mouseenter', () => this.handleCardHover(card, true));
            card.addEventListener('mouseleave', () => this.handleCardHover(card, false));
            
            // Click handling
            card.addEventListener('click', (e) => this.handleCardClick(e, card));
            
            // Keyboard navigation
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'article');
            card.addEventListener('keydown', (e) => this.handleCardKeydown(e, card));

            // Initialize project links
            this.initProjectLinks(card);
        });
    }

    handleCardHover(card, isHovering) {
        if (window.innerWidth <= 768) return; // Skip hover effects on mobile
        
        const transform = isHovering && !card.classList.contains('hidden') 
            ? 'translateY(-15px) scale(1.02)' 
            : 'translateY(0) scale(1)';
            
        card.style.transform = transform;
    }

    handleCardClick(event, card) {
        // Handle mobile overlay toggle
        if (window.innerWidth <= 768) {
            const overlay = card.querySelector('.project-overlay');
            if (overlay && !event.target.closest('.project-link')) {
                const isVisible = overlay.style.opacity === '1';
                overlay.style.opacity = isVisible ? '0' : '1';
            }
        }

        // Track card interaction
        const title = card.querySelector('h3')?.textContent || 'Unknown Project';
        this.trackProjectClick(title);
    }

    handleCardKeydown(event, card) {
        if (event.key === 'Enter') {
            const firstLink = card.querySelector('.project-link');
            if (firstLink) {
                firstLink.click();
            }
        }
    }

    initProjectLinks(card) {
        const links = card.querySelectorAll('.project-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.getAttribute('href') === '#') {
                    e.preventDefault();
                    this.showProjectModal(card);
                }
            });
        });
    }

    // =====================
    // PROJECT MODAL
    // =====================
    showProjectModal(projectCard) {
        const projectData = this.extractProjectData(projectCard);
        const modal = this.createProjectModal(projectData);
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        
        // Animate modal in
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });

        // Setup close handlers
        this.setupModalCloseHandlers(modal);
    }

    extractProjectData(card) {
        return {
            title: card.querySelector('h3')?.textContent || 'Untitled Project',
            description: card.querySelector('.project-description')?.textContent || 'No description available',
            techTags: Array.from(card.querySelectorAll('.tech-tag')).map(tag => tag.textContent),
            features: Array.from(card.querySelectorAll('.feature span')).map(span => span.textContent),
            date: card.querySelector('.project-date')?.textContent || 'Unknown date'
        };
    }

    createProjectModal(data) {
        const modal = document.createElement('div');
        modal.className = 'project-modal';
        modal.innerHTML = `
            <div class="modal-overlay" aria-hidden="true"></div>
            <div class="modal-content" role="dialog" aria-labelledby="modal-title" aria-describedby="modal-description">
                <button class="modal-close" aria-label="Modalı kapat" type="button">
                    <i class="fas fa-times"></i>
                </button>
                
                <h2 id="modal-title">${this.escapeHtml(data.title)}</h2>
                <p class="modal-date">${this.escapeHtml(data.date)}</p>
                <p id="modal-description">${this.escapeHtml(data.description)}</p>
                
                ${data.techTags.length ? `
                    <h3>Teknolojiler</h3>
                    <div class="modal-tech">
                        ${data.techTags.map(tech => `<span class="tech-tag">${this.escapeHtml(tech)}</span>`).join('')}
                    </div>
                ` : ''}
                
                ${data.features.length ? `
                    <h3>Özellikler</h3>
                    <ul class="modal-features">
                        ${data.features.map(feature => `<li>${this.escapeHtml(feature)}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `;

        return modal;
    }

    setupModalCloseHandlers(modal) {
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');

        const closeModal = () => this.closeProjectModal(modal);

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        // Escape key handler
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus management
        closeBtn.focus();
    }

    closeProjectModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scroll
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 300);
    }

    // =====================
    // ANIMATIONS
    // =====================
    initAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe animatable elements
        const animatableElements = document.querySelectorAll('.page-hero, .project-filter, .projects-section, .projects-cta');
        animatableElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            observer.observe(el);
        });
    }

    animateElement(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';

        // Special animations for specific elements
        if (element.classList.contains('projects-section')) {
            this.animateProjectCards();
        }
        if (element.classList.contains('project-filter')) {
            this.animateFilterButtons();
        }
    }

    animateProjectCards() {
        const visibleCards = this.projectCards.filter(card => !card.classList.contains('hidden'));
        visibleCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    animateFilterButtons() {
        this.filterButtons.forEach((button, index) => {
            setTimeout(() => {
                button.style.opacity = '1';
                button.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // =====================
    // ACCESSIBILITY
    // =====================
    initAccessibility() {
        // Add ARIA labels to filter buttons
        this.filterButtons.forEach(button => {
            const filter = button.getAttribute('data-filter');
            const label = button.getAttribute('aria-label') || `Filter projects by ${filter}`;
            button.setAttribute('aria-label', label);
            button.setAttribute('role', 'button');
        });

        // Add ARIA labels to project cards
        this.projectCards.forEach(card => {
            const title = card.querySelector('h3')?.textContent || 'Untitled Project';
            card.setAttribute('aria-label', `Project: ${title}`);
        });

        // Improve search accessibility
        if (this.searchInput) {
            this.searchInput.setAttribute('aria-describedby', 'search-help');
            
            // Add hidden help text
            const helpText = document.createElement('div');
            helpText.id = 'search-help';
            helpText.className = 'sr-only';
            helpText.textContent = 'Proje başlığı, açıklama veya teknoloji adı ile arayabilirsiniz';
            this.searchInput.parentNode.appendChild(helpText);
        }
    }

    // =====================
    // RESPONSIVE HANDLING
    // =====================
    initResponsiveHandling() {
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResponsiveChanges();
            }, 250);
        };

        window.addEventListener('resize', handleResize);
        this.handleResponsiveChanges(); // Call initially
    }

    handleResponsiveChanges() {
        const isMobile = window.innerWidth <= 768;
        
        // Handle project card overlays on mobile
        this.projectCards.forEach(card => {
            const overlay = card.querySelector('.project-overlay');
            if (overlay) {
                if (isMobile) {
                    overlay.style.opacity = '0';
                } else {
                    overlay.style.opacity = '';
                }
            }
        });

        // Handle filter buttons scroll on mobile
        if (isMobile) {
            this.enableFilterButtonsScroll();
        }
    }

    enableFilterButtonsScroll() {
        const filterContainer = document.querySelector('.filter-buttons');
        if (!filterContainer) return;

        // Add scroll indicators if needed
        const hasOverflow = filterContainer.scrollWidth > filterContainer.clientWidth;
        if (hasOverflow) {
            filterContainer.classList.add('scrollable');
        }
    }

    // =====================
    // UTILITY FUNCTIONS
    // =====================
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
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

    getProjectCountByCategory() {
        const counts = {
            all: this.projectCards.length,
            fullstack: 0,
            mobile: 0,
            ai: 0,
            web: 0,
            system: 0
        };

        this.projectCards.forEach(card => {
            const categories = (card.getAttribute('data-category') || '').split(' ');
            categories.forEach(category => {
                if (counts.hasOwnProperty(category.trim())) {
                    counts[category.trim()]++;
                }
            });
        });

        return counts;
    }

    updateFilterButtonsWithCount() {
        const counts = this.getProjectCountByCategory();
        
        this.filterButtons.forEach(button => {
            const filter = button.getAttribute('data-filter');
            const count = counts[filter] || 0;
            const span = button.querySelector('span');
            
            if (span && !span.textContent.includes('(')) {
                span.innerHTML = `${span.textContent} <small>(${count})</small>`;
            }
        });
    }

    // =====================
    // ANALYTICS & TRACKING
    // =====================
    trackFilterUsage(filter) {
        console.log(`🔍 Filter used: ${filter}`);
        // Add your analytics tracking here
        // Example: gtag('event', 'filter_projects', { filter_name: filter });
        
        // Track to local storage for basic analytics
        this.updateLocalAnalytics('filter_usage', filter);
    }

    trackProjectClick(projectTitle) {
        console.log(`👆 Project clicked: ${projectTitle}`);
        // Add your analytics tracking here
        // Example: gtag('event', 'project_view', { project_name: projectTitle });
        
        this.updateLocalAnalytics('project_clicks', projectTitle);
    }

    trackSearch(query, resultCount) {
        console.log(`🔎 Search performed: "${query}" - ${resultCount} results`);
        // Add your analytics tracking here
        // Example: gtag('event', 'search_projects', { search_term: query, result_count: resultCount });
        
        this.updateLocalAnalytics('search_queries', { query, resultCount });
    }

    updateLocalAnalytics(type, data) {
        try {
            const analytics = JSON.parse(localStorage.getItem('projects_analytics') || '{}');
            
            if (!analytics[type]) {
                analytics[type] = [];
            }
            
            analytics[type].push({
                data,
                timestamp: Date.now()
            });
            
            // Keep only last 100 entries per type
            analytics[type] = analytics[type].slice(-100);
            
            localStorage.setItem('projects_analytics', JSON.stringify(analytics));
        } catch (error) {
            console.warn('Could not save analytics data:', error);
        }
    }

    // =====================
    // PUBLIC API METHODS
    // =====================
    filterByCategory(category) {
        const button = this.filterButtons.find(btn => btn.getAttribute('data-filter') === category);
        if (button) {
            button.click();
        }
    }

    searchByTerm(term) {
        if (this.searchInput) {
            this.searchInput.value = term;
            this.searchProjects(term);
        }
    }

    getVisibleProjects() {
        return this.projectCards.filter(card => !card.classList.contains('hidden'));
    }

    getCurrentFilter() {
        return this.currentFilter;
    }

    // =====================
    // ERROR HANDLING
    // =====================
    handleError(error, context = 'Unknown') {
        console.error(`❌ Projects Manager Error [${context}]:`, error);
        
        // You could send errors to your error tracking service here
        // Example: Sentry.captureException(error, { extra: { context } });
    }
}

// =====================
// MODAL STYLES
// =====================
const modalStyles = `
<style>
.project-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.project-modal.show {
    opacity: 1;
    visibility: visible;
}

.modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
}

.modal-content {
    position: relative;
    max-width: 600px;
    width: 100%;
    background: var(--gradient-card);
    border-radius: 20px;
    border: 1px solid rgba(0, 255, 136, 0.3);
    padding: 2rem;
    max-height: 80vh;
    overflow-y: auto;
    transform: translateY(50px);
    transition: transform 0.3s ease;
    color: var(--light-text);
}

.project-modal.show .modal-content {
    transform: translateY(0);
}

.modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: var(--gray-text);
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.3s ease;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.modal-close:hover {
    color: var(--neon-green);
    background: rgba(0, 255, 136, 0.1);
}

.modal-content h2 {
    color: var(--neon-green);
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
    line-height: 1.3;
    padding-right: 3rem;
}

.modal-date {
    color: var(--gray-text);
    font-size: 0.9rem;
    margin-bottom: 1rem;
    opacity: 0.8;
}

.modal-content p {
    color: var(--gray-text);
    line-height: 1.7;
    margin-bottom: 1.5rem;
}

.modal-content h3 {
    color: var(--light-text);
    margin: 1.5rem 0 1rem 0;
    font-size: 1.2rem;
}

.modal-tech {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.modal-features {
    list-style: none;
    padding: 0;
    margin: 0;
}

.modal-features li {
    color: var(--gray-text);
    margin-bottom: 0.5rem;
    padding-left: 1.5rem;
    position: relative;
}

.modal-features li::before {
    content: '•';
    color: var(--neon-green);
    position: absolute;
    left: 0;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

@media (max-width: 768px) {
    .project-modal {
        padding: 1rem;
    }
    
    .modal-content {
        padding: 1.5rem;
        max-height: 90vh;
    }
    
    .modal-content h2 {
        font-size: 1.3rem;
        padding-right: 2.5rem;
    }
}
</style>
`;

// =====================
// INITIALIZATION
// =====================
document.head.insertAdjacentHTML('beforeend', modalStyles);

// Initialize the Projects Manager
let projectsManager;

// Enhanced error handling
window.addEventListener('error', (e) => {
    console.warn('🚨 Projects page error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.warn('🚨 Unhandled promise rejection:', e.reason);
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        projectsManager = new ProjectsManager();
    });
} else {
    projectsManager = new ProjectsManager();
}

// Expose to global scope for debugging
window.ProjectsManager = ProjectsManager;
window.projectsManager = projectsManager;

// Development helpers
if (process?.env?.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    console.log(`
🎯 Projects Page Debug Info:
✅ Projects Manager initialized
✅ Available methods:
   - projectsManager.filterByCategory('ai')
   - projectsManager.searchByTerm('react')
   - projectsManager.getVisibleProjects()
   - projectsManager.getCurrentFilter()

🚀 Ready for interaction!
    `);
}