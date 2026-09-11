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

  // Anti-UX features
  const tosModal = document.createElement('div');
  tosModal.id = 'tos-modal';
  tosModal.style.position = 'fixed';
  tosModal.style.inset = '0';
  tosModal.style.backgroundColor = 'rgba(0,0,0,0.95)';
  tosModal.style.zIndex = '9999999';
  tosModal.style.display = 'flex';
  tosModal.style.flexDirection = 'column';
  tosModal.style.alignItems = 'center';
  tosModal.style.justifyContent = 'center';
  tosModal.style.color = '#fff';

  tosModal.innerHTML = `
    <div style="background: #111; padding: 40px; border-radius: 10px; text-align: center; max-width: 400px; border: 1px solid #333;">
      <h2>Terms of Wasting Time</h2>
      <p>Please accept to continue.</p>
      <button id="accept-tos" style="padding: 10px 20px; cursor: pointer; background: #0ea5e9; color: white; border: none; border-radius: 5px;">Accept</button>
    </div>
  `;
  document.body.appendChild(tosModal);

  document.getElementById('accept-tos').addEventListener('click', () => {
      tosModal.style.display = 'none';
  });

  const mCursor = document.createElement('div');
  mCursor.id = 'mindful-cursor';
  mCursor.style.position = 'fixed';
  mCursor.style.width = '30px';
  mCursor.style.height = '30px';
  mCursor.style.borderRadius = '50%';
  mCursor.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
  mCursor.style.pointerEvents = 'none';
  mCursor.style.zIndex = '9999998';
  mCursor.style.transition = 'left 2s ease-out, top 2s ease-out';
  mCursor.style.transform = 'translate(-50%, -50%)';
  mCursor.style.left = '50%';
  mCursor.style.top = '50%';
  document.body.appendChild(mCursor);

  document.addEventListener('mousemove', (e) => {
      mCursor.style.left = e.clientX + 'px';
      mCursor.style.top = e.clientY + 'px';
  });

  document.addEventListener('click', (e) => {
      if (!e.isTrusted) {
          e.preventDefault();
          e.stopPropagation();
          return;
      }

      const rect = mCursor.getBoundingClientRect();
      const cursorX = rect.left + rect.width / 2;
      const cursorY = rect.top + rect.height / 2;

      const dist = Math.sqrt(Math.pow(e.clientX - cursorX, 2) + Math.pow(e.clientY - cursorY, 2));

      if (dist > 30 && e.target.id !== 'accept-tos') {
          e.preventDefault();
          e.stopPropagation();
          alert("Please wait for your mindful cursor to catch up before clicking.");
      }
  }, true);

});
