// Back button functionality
document.getElementById('backBtn').addEventListener('click', function() {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // If no history, go to home page
        window.location.href = 'home.html';
    }
});

// Smooth scroll effect for internal links (if any are added later)
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

// Add scroll-based animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections for scroll animations
document.querySelectorAll('.about-section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Add loading animation delay for sections
document.querySelectorAll('.about-section').forEach((section, index) => {
    setTimeout(() => {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
    }, 200 * (index + 1));
});

// Add click effect to contact links
document.querySelectorAll('.contact-link').forEach(link => {
    link.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: rippleEffect 0.6s ease-out;
            pointer-events: none;
        `;
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes rippleEffect {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    .contact-link {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(style);

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // ESC key to go back
    if (e.key === 'Escape') {
        document.getElementById('backBtn').click();
    }
    
    // Alt + H to go home
    if (e.altKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = 'home.html';
    }
});

// Add page load animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(20px)';
    document.body.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);
});

// Console message for developers
console.log(`
🎨 PixyShare About Page
Built with glassmorphism design
Created as a side project with ❤️

Features:
- Responsive glassmorphism UI
- Smooth animations
- Keyboard navigation (ESC to go back, Alt+H for home)
- Accessibility focused
- Modern CSS Grid & Flexbox

Developer: OCTEXA
GitHub: https://github.com/OCTEXA
Instagram: https://www.instagram.com/oct.exa/
Website: https://uniapp.site/
`);