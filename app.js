/**
 * OnyaChamp / Matthew Bubb - Systems Engineering Platform
 * High-performance interactive UI engine:
 * 1. Universal Delegated Screenshot Lightbox with Mobile Swipe & On-Screen Nav
 * 2. Multi-Tab Production Terminal Simulator
 * 3. Filterable Project Catalog
 * 4. Video Motion & Autoplay Controller
 * 5. Clipboard Snippet Copy Helpers
 * 6. Responsive Mobile Navigation Drawer
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ==========================================
  // 1. Universal Screenshot Gallery Lightbox
  // ==========================================
  const lightbox = document.getElementById('shot-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');

  const shotSelectors = '.shot[data-full], .project-shot-thumb[data-full], .lead-screenshot-box[data-full], .feature-visual-media[data-full], .repo-card-media[data-full], [data-lightbox]';

  // Helper: returns only elements currently visible in the DOM
  const getVisibleShots = () => {
    return Array.from(document.querySelectorAll(shotSelectors)).filter(el => {
      return el.offsetParent !== null;
    });
  };

  let currentVisibleIndex = -1;
  let lastFocusedElement = null;

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    if (lightboxImg) lightboxImg.src = '';
    document.body.style.overflow = '';
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  };

  const openLightboxAtIndex = (index, visibleShots) => {
    const shots = visibleShots || getVisibleShots();
    if (!lightbox || !lightboxImg || index < 0 || index >= shots.length) return;

    currentVisibleIndex = index;
    const item = shots[index];
    const fullSrc = item.getAttribute('data-full') || item.getAttribute('data-lightbox');
    const captionText = item.getAttribute('data-caption') ||
                        (item.querySelector('img') ? item.querySelector('img').alt : '') ||
                        'Screenshot preview';

    lightboxImg.src = fullSrc;
    lightboxImg.alt = captionText;

    if (lightboxCaption) {
      lightboxCaption.textContent = captionText;
      lightboxCaption.style.display = captionText ? 'block' : 'none';
    }

    if (lightboxCounter) {
      lightboxCounter.textContent = `${index + 1} / ${shots.length}`;
      lightboxCounter.style.display = shots.length > 1 ? 'block' : 'none';
    }

    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';

    // Focus close button for keyboard accessibility
    if (closeBtn) closeBtn.focus();
  };

  const navigateLightbox = (delta) => {
    const shots = getVisibleShots();
    if (shots.length <= 1) return;
    const nextIndex = (currentVisibleIndex + delta + shots.length) % shots.length;
    openLightboxAtIndex(nextIndex, shots);
  };

  // Mark all shot elements accessible
  const setupShotAccessibility = () => {
    document.querySelectorAll(shotSelectors).forEach(shot => {
      if (!shot.hasAttribute('tabindex')) shot.setAttribute('tabindex', '0');
      if (!shot.hasAttribute('role')) shot.setAttribute('role', 'button');
      if (!shot.hasAttribute('aria-label')) shot.setAttribute('aria-label', 'Enlarge screenshot');
    });
  };
  setupShotAccessibility();

  // Delegated click handler for opening screenshots
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest(shotSelectors);
    if (!trigger) return;

    // Don't trigger if clicked a nested download link or button inside figcaption
    if (e.target.closest('a[download], button, .shot-download-link')) return;

    e.preventDefault();
    lastFocusedElement = trigger;
    const visibleShots = getVisibleShots();
    const idx = visibleShots.indexOf(trigger);
    if (idx !== -1) {
      openLightboxAtIndex(idx, visibleShots);
    }
  });

  // Delegated keyboard handler for Enter / Space on screenshots
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const trigger = document.activeElement ? document.activeElement.closest(shotSelectors) : null;
      if (trigger && lightbox && lightbox.hidden) {
        e.preventDefault();
        lastFocusedElement = trigger;
        const visibleShots = getVisibleShots();
        const idx = visibleShots.indexOf(trigger);
        if (idx !== -1) {
          openLightboxAtIndex(idx, visibleShots);
        }
      }
    }
  });

  if (lightbox) {
    // Click dismissal & controls
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close') || e.target.closest('.lightbox-close')) {
        closeLightbox();
      }
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
      });
    }

    // Keyboard navigation within lightbox
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateLightbox(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateLightbox(-1);
      } else if (e.key === 'Tab') {
        // Simple focus trap between close and nav buttons
        const focusable = [closeBtn, prevBtn, nextBtn].filter(Boolean);
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    // Touch swipe gesture support for mobile
    let touchStartX = 0;
    let touchStartY = 0;

    lightbox.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // Ensure horizontal swipe is dominant and exceeds 40px threshold
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
          if (diffX < 0) {
            navigateLightbox(1); // Swiped left -> next
          } else {
            navigateLightbox(-1); // Swiped right -> prev
          }
        }
      }
    }, { passive: true });
  }

  // ==========================================
  // 2. Interactive Terminal Simulator Tabs
  // ==========================================
  const terminalTabs = document.querySelectorAll('.terminal-tab-btn');
  const terminalPanes = document.querySelectorAll('.t-pane');

  terminalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      if (!targetId) return;

      terminalTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      terminalPanes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    });
  });

  // Wire up any high-res terminal screenshot preview links
  document.querySelectorAll('.terminal-shot-link[data-full]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const visibleShots = getVisibleShots();
      const idx = visibleShots.indexOf(link);
      if (idx !== -1) {
        openLightboxAtIndex(idx, visibleShots);
      }
    });
  });

  // ==========================================
  // 3. Project Showcase Category Filters
  // ==========================================
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.repo-card, .repo-card-featured');

  if (filterButtons.length > 0 && projectCards.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        if (!filter) return;

        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        projectCards.forEach(card => {
          const categories = (card.getAttribute('data-category') || '').split(' ');
          if (filter === 'all' || categories.includes(filter)) {
            card.style.display = '';
            card.style.opacity = '1';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // ==========================================
  // 4. Video Autoplay & Motion Preference
  // ==========================================
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
  // 5. Terminal & Code Snippet Copy Buttons
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
        btn.title = 'Copied to clipboard!';

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
  // 6. Mobile Navigation Toggle
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
