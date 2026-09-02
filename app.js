/**
 * OnyaChamp / Matthew Bubb - Platform & MarkSmith Simulator
 * Pure vanilla ES6+ with zero heavy external dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. Screenshot gallery lightbox
  // ==========================================
  const lightbox = document.getElementById('shot-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const shots = document.querySelectorAll('.shot[data-full]');

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightboxImg.src = '';
    document.body.style.overflow = '';
  };

  const openLightbox = (src, alt) => {
    if (!lightbox) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  shots.forEach(shot => {
    shot.setAttribute('tabindex', '0');
    shot.setAttribute('role', 'button');

    const open = () => {
      const img = shot.querySelector('img');
      openLightbox(shot.getAttribute('data-full'), img ? img.alt : '');
    };

    shot.addEventListener('click', open);
    shot.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });

  if (lightbox) {
    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
    });
  }

  // Autoplay is a nicety, not a requirement — respect a reduced-motion preference
  // and browsers that refuse the play() promise.
  const demoVideo = document.getElementById('app-demo-video');
  if (demoVideo) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      demoVideo.autoplay = false;
      demoVideo.pause();
    } else {
      const attempt = demoVideo.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    }
  }

  // ==========================================
  // 2. Terminal & Code Snippet Copy Buttons
  // ==========================================
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const codeSnippet = btn.getAttribute('data-copy');
      if (!codeSnippet) return;

      try {
        await navigator.clipboard.writeText(codeSnippet);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i>';
        btn.title = 'Copied!';
        
        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.title = 'Copy command';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard', err);
      }
    });
  });

  // ==========================================
  // Anti-UX: Mindful Cursor Interceptor
  // ==========================================
  let totalDistance = 0;
  let lastPos = { x: -1, y: -1 };

  document.addEventListener('mousemove', (e) => {
    if (lastPos.x !== -1) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    lastPos = { x: e.clientX, y: e.clientY };
  });

  document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button');
    if (target) {
      if (!e.isTrusted) {
        e.preventDefault();
        e.stopPropagation();
        alert('Automated clicks are strictly prohibited by our mindful cursor policy.');
        return;
      }

      if (totalDistance < 1000) {
        e.preventDefault();
        e.stopPropagation();
        alert('Mindful Cursor: You must move your mouse around more mindfully (at least 1000px) before clicking to generate enough kinetic energy.');
        return;
      }

      // Reset distance after successful click
      totalDistance = 0;
    }
  }, true);

  // ==========================================
  // 3. Mobile Navigation Toggle
  // ==========================================
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        if (navLinks.classList.contains('active')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });
    });
  }
});
