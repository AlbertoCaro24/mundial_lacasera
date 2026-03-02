document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            // Remove active from all contents
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active to clicked button
            btn.classList.add('active');
            
            // Add active to corresponding content
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // Scroll to top of tabs smoothly on mobile if needed
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });

    // Mobile menu toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const desktopNav = document.querySelector('.desktop-nav');
    
    // Si quisieramos desplegarlo
    mobileBtn.addEventListener('click', () => {
        if(desktopNav.style.display === 'flex') {
            desktopNav.style.display = 'none';
        } else {
            desktopNav.style.display = 'flex';
            desktopNav.style.flexDirection = 'column';
            desktopNav.style.position = 'absolute';
            desktopNav.style.top = '100%';
            desktopNav.style.left = '0';
            desktopNav.style.right = '0';
            desktopNav.style.background = '#ffffff';
            desktopNav.style.padding = '1rem';
            desktopNav.style.borderBottom = '1px solid #f3f4f6';
        }
    });

    // Reset styles on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            desktopNav.style.display = 'flex';
            desktopNav.style.flexDirection = 'row';
            desktopNav.style.position = 'static';
            desktopNav.style.padding = '0';
        } else {
            desktopNav.style.display = 'none';
        }
    });
});
