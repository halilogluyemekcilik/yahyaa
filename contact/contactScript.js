// =====================
// CONTACT PAGE SCRIPT
// =====================

// Global variables
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const whatsappBtn = document.getElementById('whatsappBtn');
const successModal = document.getElementById('successModal');
const closeSuccessModal = document.getElementById('closeSuccessModal');
const messageTextarea = document.getElementById('message');
const charCount = document.getElementById('charCount');

// Form validation patterns
const patterns = {
    name: /^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]{2,50}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^(\+90|0)?[5][0-9]{9}$/
};

// =====================
// DOM CONTENT LOADED
// =====================
document.addEventListener('DOMContentLoaded', function() {
    initContactPage();
    initFormValidation();
    initCharacterCounter();
    initFAQAccordion();
    initServiceTagInteractions();
    initScrollAnimations();
    
    console.log('📞 Contact Page Loaded Successfully!');
});

// =====================
// CONTACT PAGE INITIALIZATION
// =====================
function initContactPage() {
    // Contact form submission
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    
    // WhatsApp button
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', openWhatsApp);
    }
    
    // Success modal
    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', closeModal);
    }
    
    if (successModal) {
        successModal.addEventListener('click', function(e) {
            if (e.target === successModal) {
                closeModal();
            }
        });
    }
    
    // Service tag clicks in footer
    const serviceTags = document.querySelectorAll('[data-service]');
    serviceTags.forEach(tag => {
        tag.addEventListener('click', function(e) {
            e.preventDefault();
            const service = this.getAttribute('data-service');
            fillContactForm(service);
        });
    });
    
    // Keyboard navigation for contact cards
    const contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const link = card.querySelector('.contact-link');
                if (link) {
                    link.click();
                }
            }
        });
    });
}

// =====================
// FORM VALIDATION
// =====================
function initFormValidation() {
    const formInputs = document.querySelectorAll('.form-input');
    
    formInputs.forEach(input => {
        // Real-time validation
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearError(input));
        
        // Enhanced focus effects
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhoneNumber);
    }
}

function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    const errorElement = document.getElementById(fieldName + 'Error');
    
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.required && !value) {
        isValid = false;
        errorMessage = 'Bu alan zorunludur.';
    }
    // Pattern validation
    else if (value && patterns[fieldName] && !patterns[fieldName].test(value)) {
        isValid = false;
        switch (fieldName) {
            case 'name':
                errorMessage = 'Geçerli bir ad soyad girin.';
                break;
            case 'email':
                errorMessage = 'Geçerli bir e-posta adresi girin.';
                break;
            case 'phone':
                errorMessage = 'Geçerli bir telefon numarası girin.';
                break;
        }
    }
    // Message length validation
    else if (fieldName === 'message' && value.length > 500) {
        isValid = false;
        errorMessage = 'Mesaj 500 karakterden uzun olamaz.';
    }
    
    // Show/hide error
    if (errorElement) {
        if (!isValid) {
            showError(field, errorMessage);
        } else {
            clearError(field);
        }
    }
    
    return isValid;
}

function showError(field, message) {
    const errorElement = document.getElementById(field.name + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        field.style.borderColor = '#ff4757';
    }
}

function clearError(field) {
    const errorElement = document.getElementById(field.name + 'Error');
    if (errorElement) {
        errorElement.classList.remove('show');
        field.style.borderColor = 'rgba(0, 255, 136, 0.2)';
    }
}

function validateForm() {
    const formInputs = document.querySelectorAll('.form-input[required]');
    const privacyCheckbox = document.getElementById('privacy');
    let isValid = true;
    
    // Validate all required fields
    formInputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    // Validate privacy checkbox
    if (!privacyCheckbox.checked) {
        showError(privacyCheckbox, 'Kişisel veri işleme onayı gereklidir.');
        isValid = false;
    }
    
    return isValid;
}

// =====================
// CHARACTER COUNTER
// =====================
function initCharacterCounter() {
    if (messageTextarea && charCount) {
        messageTextarea.addEventListener('input', updateCharacterCount);
        updateCharacterCount(); // Initial count
    }
}

function updateCharacterCount() {
    const currentLength = messageTextarea.value.length;
    const maxLength = 500;
    
    charCount.textContent = currentLength;
    
    // Color coding
    const countElement = charCount.parentElement;
    countElement.classList.remove('warning', 'error');
    
    if (currentLength > maxLength * 0.8) {
        countElement.classList.add('warning');
    }
    if (currentLength > maxLength) {
        countElement.classList.add('error');
    }
}

// =====================
// FORM SUBMISSION - MAİL GÖNDERME
// =====================
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        showNotification('Lütfen tüm alanları doğru şekilde doldurun.', 'error');
        return;
    }
    
    // Show loading state
    setButtonLoading(submitBtn, true);
    
    try {
        // Form verilerini al
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim() || 'Belirtilmemiş',
            subject: document.getElementById('subject').selectedOptions[0]?.text || 'Genel İletişim',
            message: document.getElementById('message').value.trim()
        };
        
        // Mail içeriğini oluştur
        const mailSubject = `Portfolio İletişim: ${formData.subject}`;
        const mailBody = `Merhaba Yahya,

Portfolio sitenizden yeni bir mesaj geldi:

👤 Ad Soyad: ${formData.name}
📧 E-posta: ${formData.email}
📱 Telefon: ${formData.phone}
🏷️ Konu: ${formData.subject}

💬 Mesaj:
${formData.message}

---
Bu mesaj portfolio sitenizdeki iletişim formundan gönderilmiştir.

İyi çalışmalar!`;
        
        // Mailto linkini oluştur ve aç
        const mailtoLink = `mailto:halilogluyahya@gmail.com?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
        
        // Test: Mail istemcisini aç
        console.log('Mail linki:', mailtoLink);
        
        try {
            window.location.href = mailtoLink;
            
            // Kullanıcıya bilgi ver
            showNotification('Mail istemciniz açılıyor...', 'info');
            
            // Başarı mesajı göster
            setTimeout(() => {
                showSuccessModal();
                contactForm.reset();
                updateCharacterCount();
                trackUserInteraction('mail_sent', 'contact_form');
            }, 1000);
            
        } catch (error) {
            console.error('Mail açma hatası:', error);
            showNotification('Mail istemcisi açılamadı. Lütfen halilogluyahya@gmail.com adresine manuel mesaj gönderin.', 'error');
        }
        
    } catch (error) {
        console.error('Mail gönderme hatası:', error);
        showNotification('Mail gönderilemedi. Lütfen tekrar deneyin.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

function setButtonLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (isLoading) {
        btnText.style.opacity = '0';
        btnLoading.classList.remove('hidden');
        button.disabled = true;
    } else {
        btnText.style.opacity = '1';
        btnLoading.classList.add('hidden');
        button.disabled = false;
    }
}

// =====================
// WHATSAPP INTEGRATION
// =====================
function openWhatsApp() {
    const formData = getFormData();
    const message = createWhatsAppMessage(formData);
    const phoneNumber = '905389249250';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    trackUserInteraction('whatsapp_click', 'contact_form');
}

function getFormData() {
    return {
        name: document.getElementById('name').value || 'Belirtilmemiş',
        email: document.getElementById('email').value || 'Belirtilmemiş',
        phone: document.getElementById('phone').value || 'Belirtilmemiş',
        subject: document.getElementById('subject').selectedOptions[0]?.text || 'Belirtilmemiş',
        message: document.getElementById('message').value || 'Mesaj yazılmamış'
    };
}

function createWhatsAppMessage(data) {
    return `🚀 *Yeni Proje Talebi*

👤 *Ad Soyad:* ${data.name}
📧 *E-posta:* ${data.email}
📱 *Telefon:* ${data.phone}
🏷️ *Konu:* ${data.subject}

💬 *Mesaj:*
${data.message}

---
Yahya Haliloğlu Portfolio sitesinden gönderildi.`;
}

// =====================
// MODAL MANAGEMENT
// =====================
function showSuccessModal() {
    if (successModal) {
        successModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Auto close after 5 seconds
        setTimeout(() => {
            closeModal();
        }, 5000);
    }
}

function closeModal() {
    if (successModal) {
        successModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// =====================
// FAQ ACCORDION
// =====================
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
            
            trackUserInteraction('faq_toggle', question.querySelector('h3').textContent);
        });
        
        // Keyboard navigation
        question.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                question.click();
            }
        });
        
        question.setAttribute('tabindex', '0');
    });
}

// =====================
// SERVICE TAG INTERACTIONS
// =====================
function initServiceTagInteractions() {
    const serviceTags = document.querySelectorAll('.service-tag');
    
    serviceTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const service = this.textContent.trim();
            fillContactFormWithService(service);
            
            // Smooth scroll to form
            const formContainer = document.querySelector('.form-container');
            if (formContainer) {
                formContainer.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
            
            trackUserInteraction('service_tag_click', service);
        });
        
        // Add hover effect
        tag.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        tag.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function fillContactFormWithService(service) {
    const subjectSelect = document.getElementById('subject');
    const messageTextarea = document.getElementById('message');
    
    // Map service names to form values
    const serviceMap = {
        'Web Tasarım': 'web-tasarim',
        'E-ticaret': 'web-tasarim',
        'Mobil App': 'mobil-uygulama',
        'AI/ML': 'ai-ml',
        'API Geliştirme': 'fullstack',
        'Database': 'fullstack',
        'DevOps': 'danismanlik',
        'Danışmanlık': 'danismanlik'
    };
    
    const serviceValue = serviceMap[service] || 'diger';
    
    if (subjectSelect) {
        subjectSelect.value = serviceValue;
    }
    
    if (messageTextarea && !messageTextarea.value.trim()) {
        messageTextarea.value = `Merhaba,\n\n${service} konusunda bilgi almak istiyorum. Detayları görüşebilir miyiz?\n\nTeşekkürler.`;
        updateCharacterCount();
    }
}

function fillContactForm(serviceType) {
    const subjectSelect = document.getElementById('subject');
    const messageTextarea = document.getElementById('message');
    
    if (subjectSelect) {
        subjectSelect.value = serviceType;
    }
    
    // Auto-fill message based on service type
    const messages = {
        'web-tasarim': 'Merhaba,\n\nWeb sitesi tasarımı konusunda bilgi almak istiyorum. Projemi görüşebilir miyiz?',
        'mobil-uygulama': 'Merhaba,\n\nMobil uygulama geliştirme konusunda bilgi almak istiyorum. Detayları konuşabilir miyiz?',
        'ai-ml': 'Merhaba,\n\nAI/ML projesi konusunda bilgi almak istiyorum. Nasıl bir çözüm önerirsiniz?',
        'danismanlik': 'Merhaba,\n\nTeknik danışmanlık hizmeti almak istiyorum. Hangi konularda destek veriyorsunuz?'
    };
    
    if (messageTextarea && messages[serviceType] && !messageTextarea.value.trim()) {
        messageTextarea.value = messages[serviceType];
        updateCharacterCount();
    }
    
    // Scroll to form
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

// =====================
// PHONE NUMBER FORMATTING
// =====================
function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    // Remove leading zeros and country code
    if (value.startsWith('90')) {
        value = value.substring(2);
    }
    if (value.startsWith('0')) {
        value = value.substring(1);
    }
    
    // Format as: +90 5XX XXX XX XX
    if (value.length > 0) {
        if (value.length <= 3) {
            value = `+90 ${value}`;
        } else if (value.length <= 6) {
            value = `+90 ${value.substring(0, 3)} ${value.substring(3)}`;
        } else if (value.length <= 8) {
            value = `+90 ${value.substring(0, 3)} ${value.substring(3, 6)} ${value.substring(6)}`;
        } else {
            value = `+90 ${value.substring(0, 3)} ${value.substring(3, 6)} ${value.substring(6, 8)} ${value.substring(8, 10)}`;
        }
    }
    
    e.target.value = value;
}

// =====================
// SCROLL ANIMATIONS
// =====================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Staggered animations for contact cards
                if (entry.target.classList.contains('contact-cards')) {
                    const cards = entry.target.querySelectorAll('.contact-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 100);
                    });
                }
                
                // Staggered animations for FAQ items
                if (entry.target.classList.contains('faq-container')) {
                    const items = entry.target.querySelectorAll('.faq-item');
                    items.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);
    
    // Elements to animate
    const animateElements = document.querySelectorAll('.contact-info, .contact-form-section, .faq-section, .contact-cards, .faq-container');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        // Set initial state for child elements
        if (el.classList.contains('contact-cards')) {
            const cards = el.querySelectorAll('.contact-card');
            cards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            });
        }
        
        if (el.classList.contains('faq-container')) {
            const items = el.querySelectorAll('.faq-item');
            items.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(30px)';
                item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            });
        }
        
        observer.observe(el);
    });
}

// =====================
// NOTIFICATIONS
// =====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4757' : '#2ed573'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 2001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide notification
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// =====================
// UTILITY FUNCTIONS
// =====================
function trackUserInteraction(action, element) {
    console.log(`Contact Page Interaction: ${action} on ${element}`);
    
    // Here you can integrate with analytics services
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: 'Contact',
            event_label: element
        });
    }
}

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

// =====================
// ACCESSIBILITY ENHANCEMENTS
// =====================
function initAccessibility() {
    // Add aria labels to interactive elements
    const contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach((card, index) => {
        const title = card.querySelector('h3').textContent;
        card.setAttribute('aria-label', `${title} ile iletişime geç`);
        card.setAttribute('role', 'button');
    });
    
    // Add aria labels to form elements
    const formInputs = document.querySelectorAll('.form-input');
    formInputs.forEach(input => {
        const label = input.previousElementSibling;
        if (label && label.classList.contains('form-label')) {
            const labelText = label.textContent.trim();
            input.setAttribute('aria-label', labelText);
        }
    });
    
    // Announce form errors to screen readers
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(error => {
        error.setAttribute('role', 'alert');
        error.setAttribute('aria-live', 'polite');
    });
}

// =====================
// PERFORMANCE OPTIMIZATION
// =====================
function initPerformanceOptimizations() {
    // Lazy load contact card animations
    const cards = document.querySelectorAll('.contact-card');
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                cardObserver.unobserve(entry.target);
            }
        });
    });
    
    cards.forEach(card => cardObserver.observe(card));
    
    // Debounce scroll events
    let ticking = false;
    function updateScrollElements() {
        // Update scroll-dependent elements
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateScrollElements);
            ticking = true;
        }
    });
}

// =====================
// ERROR HANDLING
// =====================
window.addEventListener('error', function(e) {
    console.warn('Contact page error:', e.error);
    showNotification('Bir hata oluştu. Sayfa yenilenerek tekrar denenebilir.', 'error');
});

// =====================
// INITIALIZATION
// =====================
// Initialize accessibility and performance features
document.addEventListener('DOMContentLoaded', function() {
    initAccessibility();
    initPerformanceOptimizations();
});

// =====================
// CLEANUP
// =====================
window.addEventListener('beforeunload', function() {
    // Clean up any intervals or timeouts
    document.body.style.overflow = 'auto';
});

// =====================
// CONSOLE MESSAGE
// =====================
console.log(`
📞 Contact Page Features:
✅ Form validation and submission
✅ Mail integration (mailto)
✅ WhatsApp integration
✅ FAQ accordion
✅ Character counter
✅ Success modal
✅ Scroll animations
✅ Accessibility features
✅ Error handling

Built with ❤️ by Yahya Haliloğlu
`);