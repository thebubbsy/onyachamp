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

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.createElement('div');
  overlay.id = 'anti-ux-overlay';
  overlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.9);
    z-index: 999999;
    align-items: center; justify-content: center;
    flex-direction: column;
    color: white;
    font-family: sans-serif;
  `;

  const text = document.createElement('h2');
  text.innerText = 'Wait a second...';

  const instruction = document.createElement('p');
  instruction.innerText = 'To prove your patience, please slide exactly to 42 to proceed.';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = 'anti-ux-slider';
  slider.min = '0';
  slider.max = '100';
  slider.value = '0';

  const confirmBtn = document.createElement('button');
  confirmBtn.id = 'anti-ux-confirm';
  confirmBtn.innerText = 'Confirm Action';
  confirmBtn.style.marginTop = '20px';
  confirmBtn.style.padding = '10px 20px';
  confirmBtn.style.cursor = 'pointer';

  overlay.appendChild(text);
  overlay.appendChild(instruction);
  overlay.appendChild(slider);
  overlay.appendChild(confirmBtn);
  document.body.appendChild(overlay);

  let pendingEventTarget = null;

  document.addEventListener('click', (e) => {
    if (overlay.contains(e.target)) return;

    if (overlay.style.display === 'flex') {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    const interactive = e.target.closest('a, button');
    if (interactive && e.isTrusted) {
      e.preventDefault();
      e.stopPropagation();
      pendingEventTarget = interactive;
      slider.value = '0';
      overlay.style.display = 'flex';
    }
  }, true);

  confirmBtn.addEventListener('click', () => {
    if (slider.value === '42') {
      overlay.style.display = 'none';
      if (pendingEventTarget) {
        pendingEventTarget.click();
        pendingEventTarget = null;
      }
    } else {
      alert('Slider must be exactly 42! You selected ' + slider.value);
    }
  });
});
