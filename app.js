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


// Anti-UX logic
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.createElement('div');
  overlay.id = 'tos-modal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);z-index:99999;display:none;align-items:center;justify-content:center;flex-direction:column;color:white;font-family:sans-serif;backdrop-filter:blur(5px);';
  overlay.innerHTML = `
    <div style="background:#111;padding:40px;border-radius:8px;text-align:center;border:1px solid #333;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
      <h3 style="margin-top:0;color:#fff;">Are you sure?</h3>
      <p style="color:#aaa;margin-bottom:20px;">Prove your patience. Move the slider to exactly 73.</p>
      <input type="range" id="anti-ux-slider" min="1" max="100" value="50" style="width:250px;margin-bottom:20px;">
      <br>
      <button id="anti-ux-btn" style="padding:10px 20px;cursor:pointer;background:#444;color:#888;border:none;border-radius:4px;" disabled>Access Denied</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const slider = document.getElementById('anti-ux-slider');
  const btn = document.getElementById('anti-ux-btn');
  let pendingEventTarget = null;

  document.addEventListener('click', (e) => {
    if (overlay.style.display === 'flex') {
      if (!overlay.contains(e.target)) {
        e.stopPropagation();
        e.preventDefault();
      }
      return;
    }

    const interactive = e.target.closest('a, button, .shot, input');
    if (interactive && !interactive.dataset.unlocked && interactive.id !== 'anti-ux-btn' && interactive.id !== 'anti-ux-slider') {
      e.stopPropagation();
      e.preventDefault();
      pendingEventTarget = interactive;
      overlay.style.display = 'flex';
      slider.value = 50;
      btn.disabled = true;
      btn.textContent = 'Access Denied';
      btn.style.background = '#444';
      btn.style.color = '#888';
    }
  }, true);

  slider.addEventListener('input', () => {
    if (slider.value === '73') {
      btn.disabled = false;
      btn.textContent = 'Proceed';
      btn.style.background = '#38bdf8';
      btn.style.color = '#fff';
    } else {
      btn.disabled = true;
      btn.textContent = 'Access Denied';
      btn.style.background = '#444';
      btn.style.color = '#888';
    }
  });

  btn.addEventListener('click', () => {
    overlay.style.display = 'none';
    if (pendingEventTarget) {
      pendingEventTarget.dataset.unlocked = 'true';
      pendingEventTarget.click();
      setTimeout(() => {
        delete pendingEventTarget.dataset.unlocked;
        pendingEventTarget = null;
      }, 50);
    }
  });
});
