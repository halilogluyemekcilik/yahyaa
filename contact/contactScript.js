document.addEventListener('DOMContentLoaded', () => {
    // Navbar Toggle Functionality (Ana script.js'ten kopyalanabilir veya contact.html'de ana script dosyasını çağırabiliriz.)
    // Eğer ana script.js dosyasını contact.html'e dahil ettiysen, bu kısmı burada tekrar etmene gerek yok.
    // Ancak mobil menü toggle'ı sadece ana scriptte tanımlıysa ve diğer sayfalarda da çalışmasını istiyorsan,
    // ya ana scripti tüm sayfalara dahil etmelisin ya da bu kodu her sayfada tekrar etmelisin.
    // Şu anki HTML yapına göre, '../script.js' zaten çağrıldığı için bu kısmı burada tekrar etmiyorum.

    // Contact Form Submission (Simple Client-Side Validation & Message)
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission

            // Basic validation
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();

            if (!name || !email || !subject || !message) {
                displayMessage('Lütfen tüm alanları doldurun.', 'error');
                return;
            }

            // Simple email format validation (more robust validation should be on server-side)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                displayMessage('Geçerli bir e-posta adresi girin.', 'error');
                return;
            }

            // Simulate form submission (in a real application, you'd send this data to a server)
            // For now, we'll just show a success message.
            console.log('Form Submitted:', { name, email, subject, message });

            displayMessage('Mesajınız başarıyla gönderildi! Teşekkürler.', 'success');
            contactForm.reset(); // Clear the form fields after successful submission
        });
    }

    function displayMessage(msg, type) {
        formMessage.textContent = msg;
        formMessage.className = 'form-message ' + type; // Add 'success' or 'error' class
        formMessage.style.opacity = '1';
        formMessage.style.visibility = 'visible';

        // Hide message after 5 seconds
        setTimeout(() => {
            formMessage.style.opacity = '0';
            formMessage.style.visibility = 'hidden';
            formMessage.className = 'form-message'; // Reset class
        }, 5000);
    }
});