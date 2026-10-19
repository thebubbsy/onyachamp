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
  // 3. Project Showcase Category & Search Filters
  // ==========================================
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.repo-card, .repo-card-featured');
  const toolsSearchInput = document.getElementById('tools-search-input');
  const toolsVisibleCount = document.getElementById('tools-visible-count');

  const applyToolsCatalogFilter = () => {
    const activeBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeBtn ? (activeBtn.getAttribute('data-filter') || 'all') : 'all';
    const query = toolsSearchInput ? toolsSearchInput.value.trim().toLowerCase() : '';
    let shownCount = 0;

    projectCards.forEach(card => {
      const categories = (card.getAttribute('data-category') || '').split(' ');
      const matchesCat = activeFilter === 'all' || categories.includes(activeFilter);
      const matchesSearch = !query || (card.textContent || '').toLowerCase().includes(query);

      if (matchesCat && matchesSearch) {
        card.style.display = '';
        card.style.opacity = '1';
        shownCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (toolsVisibleCount) {
      toolsVisibleCount.textContent = `${shownCount} / ${projectCards.length} shown`;
    }
  };

  if (filterButtons.length > 0 && projectCards.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        if (!filter) return;

        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyToolsCatalogFilter();
      });
    });

    if (toolsSearchInput) {
      toolsSearchInput.addEventListener('input', applyToolsCatalogFilter);
      document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== toolsSearchInput && !['INPUT', 'TEXTAREA'].includes((document.activeElement && document.activeElement.tagName) || '')) {
          e.preventDefault();
          toolsSearchInput.focus();
          toolsSearchInput.select();
        } else if (e.key === 'Escape' && document.activeElement === toolsSearchInput) {
          toolsSearchInput.value = '';
          applyToolsCatalogFilter();
          toolsSearchInput.blur();
        }
      });
    }

    applyToolsCatalogFilter();
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

  // ==========================================
  // 7. Terminal Output & Catalog Export Actions
  // ==========================================
  const copyTerminalBtn = document.getElementById('btn-copy-terminal-output');
  if (copyTerminalBtn) {
    copyTerminalBtn.addEventListener('click', async () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const lines = Array.from(activePane.querySelectorAll('.terminal-line')).map(el => el.textContent.trim());
      try {
        await navigator.clipboard.writeText(lines.join('\n'));
        const orig = copyTerminalBtn.innerHTML;
        copyTerminalBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied!';
        setTimeout(() => { copyTerminalBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy terminal output', err);
      }
    });
  }

  const copyTerminalMdBtn = document.getElementById('btn-copy-terminal-md');
  if (copyTerminalMdBtn) {
    copyTerminalMdBtn.addEventListener('click', async () => {
      const activePane = document.querySelector('.t-pane.active');
      const activeTab = document.querySelector('.terminal-tab-btn.active');
      if (!activePane) return;
      const tabTitle = activeTab ? activeTab.textContent.trim() : 'PowerShell 7.4.5 LTS';
      const lines = Array.from(activePane.querySelectorAll('.terminal-line')).map(el => el.textContent.trim());
      const md = `### ${tabTitle}\n\`\`\`powershell\n${lines.join('\n')}\n\`\`\``;
      try {
        await navigator.clipboard.writeText(md);
        const orig = copyTerminalMdBtn.innerHTML;
        copyTerminalMdBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied MD!';
        setTimeout(() => { copyTerminalMdBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy terminal Markdown block', err);
      }
    });
  }

  const copyCatalogMdBtn = document.getElementById('btn-copy-catalog-md');
  if (copyCatalogMdBtn) {
    copyCatalogMdBtn.addEventListener('click', async () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const rows = [
        '| Project | Category | Description | GitHub |',
        '| :--- | :--- | :--- | :--- |'
      ];
      visibleCards.forEach(card => {
        const nameEl = card.querySelector('.repo-name');
        const linkEl = card.querySelector('.repo-name a');
        const badgeEl = card.querySelector('.repo-header .badge');
        const descEl = card.querySelector('.repo-desc');
        const name = nameEl ? nameEl.textContent.trim() : 'Tool';
        const url = linkEl ? linkEl.getAttribute('href') : '';
        const cat = badgeEl ? badgeEl.textContent.trim() : '';
        const desc = descEl ? descEl.textContent.trim().replace(/\s+/g, ' ').replace(/\|/g, '\\|') : '';
        rows.push(`| **${name}** | ${cat} | ${desc} | ${url} |`);
      });
      try {
        await navigator.clipboard.writeText(rows.join('\n'));
        const orig = copyCatalogMdBtn.innerHTML;
        copyCatalogMdBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied MD!';
        setTimeout(() => { copyCatalogMdBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog Markdown table', err);
      }
    });
  }

  const exportCatalogCsvBtn = document.getElementById('btn-export-catalog-csv');
  if (exportCatalogCsvBtn) {
    exportCatalogCsvBtn.addEventListener('click', () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const escapeCsv = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
      const csvRows = [['Project', 'Category', 'Tags', 'Description', 'GitHubURL'].map(escapeCsv).join(',')];

      visibleCards.forEach(card => {
        const nameEl = card.querySelector('.repo-name');
        const linkEl = card.querySelector('.repo-name a');
        const badgeEl = card.querySelector('.repo-header .badge');
        const descEl = card.querySelector('.repo-desc');
        const tags = Array.from(card.querySelectorAll('.repo-tags .badge')).map(t => t.textContent.trim()).join('; ');

        const name = nameEl ? nameEl.textContent.trim() : 'Tool';
        const url = linkEl ? linkEl.getAttribute('href') : '';
        const cat = badgeEl ? badgeEl.textContent.trim() : '';
        const desc = descEl ? descEl.textContent.trim().replace(/\s+/g, ' ') : '';
        csvRows.push([name, cat, tags, desc, url].map(escapeCsv).join(','));
      });

      const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-tools-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const orig = exportCatalogCsvBtn.innerHTML;
      exportCatalogCsvBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Exported CSV!';
      setTimeout(() => { exportCatalogCsvBtn.innerHTML = orig; }, 1800);
    });
  }

  const copyCatalogCmdsBtn = document.getElementById('btn-copy-catalog-cmds');
  if (copyCatalogCmdsBtn) {
    copyCatalogCmdsBtn.addEventListener('click', async () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const cmdBlocks = ['# OnYaChamp Enterprise PowerShell & Cloud Tooling — Bootstrap / Install Commands'];

      visibleCards.forEach(card => {
        const nameEl = card.querySelector('.repo-name');
        const codeEl = card.querySelector('.repo-terminal code');
        const name = nameEl ? nameEl.textContent.trim() : 'Tool';
        const cmd = codeEl ? codeEl.textContent.trim() : '';
        if (cmd) {
          cmdBlocks.push(`\n# ${name}\n${cmd}`);
        }
      });

      try {
        await navigator.clipboard.writeText(cmdBlocks.join('\n'));
        const orig = copyCatalogCmdsBtn.innerHTML;
        copyCatalogCmdsBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied Cmds!';
        setTimeout(() => { copyCatalogCmdsBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog commands', err);
      }
    });
  }

  const copyCatalogTsvBtn = document.getElementById('btn-copy-catalog-tsv');
  if (copyCatalogTsvBtn) {
    copyCatalogTsvBtn.addEventListener('click', async () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const cleanTsv = (v) => String(v || '').replace(/[\t\r\n]+/g, ' ').trim();
      const rows = ['Name\tCategory\tTags\tCommand\tDescription\tURL'];

      visibleCards.forEach(card => {
        const nameEl = card.querySelector('.repo-name');
        const linkEl = card.querySelector('.repo-name a');
        const badgeEl = card.querySelector('.repo-header .badge');
        const descEl = card.querySelector('.repo-desc');
        const codeEl = card.querySelector('.repo-terminal code');
        const tags = Array.from(card.querySelectorAll('.repo-tags .badge')).map(t => t.textContent.trim()).join('; ');

        rows.push([
          cleanTsv(nameEl ? nameEl.textContent : 'Tool'),
          cleanTsv(badgeEl ? badgeEl.textContent : ''),
          cleanTsv(tags),
          cleanTsv(codeEl ? codeEl.textContent : ''),
          cleanTsv(descEl ? descEl.textContent : ''),
          cleanTsv(linkEl ? linkEl.getAttribute('href') : '')
        ].join('\t'));
      });

      try {
        await navigator.clipboard.writeText(rows.join('\r\n'));
        const orig = copyCatalogTsvBtn.innerHTML;
        copyCatalogTsvBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied TSV!';
        setTimeout(() => { copyCatalogTsvBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog TSV', err);
      }
    });
  }

  const resetCatalogFilterBtn = document.getElementById('btn-reset-catalog-filter');
  if (resetCatalogFilterBtn) {
    resetCatalogFilterBtn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        if ((b.getAttribute('data-filter') || '') === 'all') {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      if (toolsSearchInput) {
        toolsSearchInput.value = '';
      }
      applyToolsCatalogFilter();
    });
  }
});
