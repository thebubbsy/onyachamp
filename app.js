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

  const copyCatalogJsonBtn = document.getElementById('btn-copy-catalog-json');
  if (copyCatalogJsonBtn) {
    copyCatalogJsonBtn.addEventListener('click', async () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const items = visibleCards.map(card => {
        const nameEl = card.querySelector('.repo-name');
        const linkEl = card.querySelector('.repo-name a');
        const badgeEl = card.querySelector('.repo-header .badge');
        const descEl = card.querySelector('.repo-desc');
        const codeEl = card.querySelector('.repo-terminal code');
        const tags = Array.from(card.querySelectorAll('.repo-tags .badge')).map(t => t.textContent.trim());
        return {
          name: nameEl ? nameEl.textContent.trim() : 'Tool',
          category: badgeEl ? badgeEl.textContent.trim() : '',
          tags,
          command: codeEl ? codeEl.textContent.trim() : '',
          description: descEl ? descEl.textContent.trim().replace(/\s+/g, ' ') : '',
          githubUrl: linkEl ? linkEl.getAttribute('href') : ''
        };
      });

      try {
        await navigator.clipboard.writeText(JSON.stringify(items, null, 2));
        const orig = copyCatalogJsonBtn.innerHTML;
        copyCatalogJsonBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied JSON!';
        setTimeout(() => { copyCatalogJsonBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog JSON', err);
      }
    });
  }

  const copyCatalogCsvBtn = document.getElementById('btn-copy-catalog-csv');
  if (copyCatalogCsvBtn) {
    copyCatalogCsvBtn.addEventListener('click', async () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const escCsv = (v) => '"' + String(v || '').replace(/\r?\n/g, ' ').trim().replace(/"/g, '""') + '"';
      const rows = ['"Name","Category","Tags","Command","Description","URL"'];

      visibleCards.forEach(card => {
        const nameEl = card.querySelector('.repo-name');
        const linkEl = card.querySelector('.repo-name a');
        const badgeEl = card.querySelector('.repo-header .badge');
        const descEl = card.querySelector('.repo-desc');
        const codeEl = card.querySelector('.repo-terminal code');
        const tags = Array.from(card.querySelectorAll('.repo-tags .badge')).map(t => t.textContent.trim()).join('; ');

        rows.push([
          escCsv(nameEl ? nameEl.textContent : 'Tool'),
          escCsv(badgeEl ? badgeEl.textContent : ''),
          escCsv(tags),
          escCsv(codeEl ? codeEl.textContent : ''),
          escCsv(descEl ? descEl.textContent : ''),
          escCsv(linkEl ? linkEl.getAttribute('href') : '')
        ].join(','));
      });

      try {
        await navigator.clipboard.writeText(rows.join('\r\n'));
        const orig = copyCatalogCsvBtn.innerHTML;
        copyCatalogCsvBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied CSV!';
        setTimeout(() => { copyCatalogCsvBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog CSV', err);
      }
    });
  }

  const copyTerminalCmdBtn = document.getElementById('btn-copy-terminal-cmd');
  if (copyTerminalCmdBtn) {
    copyTerminalCmdBtn.addEventListener('click', async () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const cmdEl = activePane.querySelector('.t-cmd');
      const cmdText = cmdEl ? cmdEl.textContent.trim() : '';
      if (!cmdText) return;
      try {
        await navigator.clipboard.writeText(cmdText);
        const orig = copyTerminalCmdBtn.innerHTML;
        copyTerminalCmdBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied Cmd!';
        setTimeout(() => { copyTerminalCmdBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy terminal command', err);
      }
    });
  }

  const copyTerminalJsonBtn = document.getElementById('btn-copy-terminal-json');
  if (copyTerminalJsonBtn) {
    copyTerminalJsonBtn.addEventListener('click', async () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
      const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
      const cmdEl = activePane.querySelector('.t-cmd');
      const cmdText = cmdEl ? cmdEl.textContent.trim() : '';
      const lines = Array.from(activePane.querySelectorAll('.terminal-line')).map(l => l.textContent.trim());
      const payload = {
        tabId: activePane.id,
        title: tabTitle,
        shell: 'PowerShell 7.4.5 LTS',
        command: cmdText,
        lineCount: lines.length,
        lines
      };
      try {
        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        const orig = copyTerminalJsonBtn.innerHTML;
        copyTerminalJsonBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied JSON!';
        setTimeout(() => { copyTerminalJsonBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy terminal JSON', err);
      }
    });
  }

  const copyTerminalTsvBtn = document.getElementById('btn-copy-terminal-tsv');
  if (copyTerminalTsvBtn) {
    copyTerminalTsvBtn.addEventListener('click', async () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
      const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
      const clean = (v) => String(v || '').replace(/[\t\r\n]+/g, ' ').trim();
      const rows = ['LineNumber\tTab\tSeverity\tContent'];
      Array.from(activePane.querySelectorAll('.terminal-line')).forEach((el, idx) => {
        let sev = 'OUTPUT';
        if (el.classList.contains('t-success')) sev = 'SUCCESS';
        else if (el.classList.contains('t-warn')) sev = 'WARN';
        else if (el.classList.contains('t-info')) sev = 'INFO';
        else if (el.querySelector('.t-cmd')) sev = 'COMMAND';
        rows.push([idx + 1, clean(tabTitle), sev, clean(el.textContent)].join('\t'));
      });
      try {
        await navigator.clipboard.writeText(rows.join('\r\n'));
        const orig = copyTerminalTsvBtn.innerHTML;
        copyTerminalTsvBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied TSV!';
        setTimeout(() => { copyTerminalTsvBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy terminal TSV', err);
      }
    });
  }

  const downloadTerminalJsonBtn = document.getElementById('btn-download-terminal-json');
  if (downloadTerminalJsonBtn) {
    downloadTerminalJsonBtn.addEventListener('click', () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
      const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
      const cmdEl = activePane.querySelector('.t-cmd');
      const cmdText = cmdEl ? cmdEl.textContent.trim() : '';
      const lines = Array.from(activePane.querySelectorAll('.terminal-line')).map(l => l.textContent.trim());
      const payload = {
        exportedAt: new Date().toISOString(),
        tabId: activePane.id,
        title: tabTitle,
        shell: 'PowerShell 7.4.5 LTS',
        command: cmdText,
        lineCount: lines.length,
        lines
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-terminal-${activePane.id}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = downloadTerminalJsonBtn.innerHTML;
      downloadTerminalJsonBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved JSON!';
      setTimeout(() => { downloadTerminalJsonBtn.innerHTML = orig; }, 1800);
    });
  }

  const exportCatalogTsvFileBtn = document.getElementById('btn-export-catalog-tsv-file');
  if (exportCatalogTsvFileBtn) {
    exportCatalogTsvFileBtn.addEventListener('click', () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const clean = (v) => String(v || '').replace(/[\t\r\n]+/g, ' ').trim();
      const rows = ['Name\tCategory\tTags\tCommand\tDescription\tURL'];
      visibleCards.forEach(card => {
        const nameEl = card.querySelector('.repo-name');
        const linkEl = card.querySelector('.repo-name a');
        const badgeEl = card.querySelector('.repo-header .badge');
        const descEl = card.querySelector('.repo-desc');
        const codeEl = card.querySelector('.repo-terminal code');
        const tags = Array.from(card.querySelectorAll('.repo-tags .badge')).map(t => t.textContent.trim()).join('; ');
        rows.push([
          clean(nameEl ? nameEl.textContent : 'Tool'),
          clean(badgeEl ? badgeEl.textContent : ''),
          clean(tags),
          clean(codeEl ? codeEl.textContent : ''),
          clean(descEl ? descEl.textContent : ''),
          clean(linkEl ? linkEl.getAttribute('href') : '')
        ].join('\t'));
      });
      const blob = new Blob([rows.join('\r\n')], { type: 'text/tab-separated-values;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-tools-catalog-${new Date().toISOString().slice(0, 10)}.tsv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = exportCatalogTsvFileBtn.innerHTML;
      exportCatalogTsvFileBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Exported TSV!';
      setTimeout(() => { exportCatalogTsvFileBtn.innerHTML = orig; }, 1800);
    });
  }

  const exportCatalogJsonFileBtn = document.getElementById('btn-export-catalog-json-file');
  if (exportCatalogJsonFileBtn) {
    exportCatalogJsonFileBtn.addEventListener('click', () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const items = visibleCards.map(card => {
        const nameEl = card.querySelector('.repo-name');
        const linkEl = card.querySelector('.repo-name a');
        const badgeEl = card.querySelector('.repo-header .badge');
        const descEl = card.querySelector('.repo-desc');
        const codeEl = card.querySelector('.repo-terminal code');
        const tags = Array.from(card.querySelectorAll('.repo-tags .badge')).map(t => t.textContent.trim());
        return {
          name: nameEl ? nameEl.textContent.trim() : 'Tool',
          category: badgeEl ? badgeEl.textContent.trim() : '',
          tags,
          command: codeEl ? codeEl.textContent.trim() : '',
          description: descEl ? descEl.textContent.trim() : '',
          url: linkEl ? linkEl.getAttribute('href') : ''
        };
      });
      const payload = {
        exportedAt: new Date().toISOString(),
        toolCount: items.length,
        tools: items
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-tools-catalog-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = exportCatalogJsonFileBtn.innerHTML;
      exportCatalogJsonFileBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Exported JSON!';
      setTimeout(() => { exportCatalogJsonFileBtn.innerHTML = orig; }, 1800);
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

  const exportCatalogMdFileBtn = document.getElementById('btn-export-catalog-md-file');
  if (exportCatalogMdFileBtn) {
    exportCatalogMdFileBtn.addEventListener('click', () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const mdLines = [
        '# OnYaChamp Enterprise PowerShell & Cloud Tooling Catalog',
        '',
        `- **Exported**: ${new Date().toISOString()}`,
        `- **Visible Tools**: ${visibleCards.length}`,
        '',
        '| Project | Category | Tags | Command | Description | GitHub |',
        '| :--- | :--- | :--- | :--- | :--- | :--- |'
      ];
      visibleCards.forEach(card => {
        const nameEl = card.querySelector('.repo-name');
        const linkEl = card.querySelector('.repo-name a');
        const badgeEl = card.querySelector('.repo-header .badge');
        const descEl = card.querySelector('.repo-desc');
        const codeEl = card.querySelector('.repo-terminal code');
        const tags = Array.from(card.querySelectorAll('.repo-tags .badge')).map(t => t.textContent.trim()).join(', ');
        const esc = (v) => String(v || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
        const name = esc(nameEl ? nameEl.textContent : 'Tool');
        const cat = esc(badgeEl ? badgeEl.textContent : '');
        const cmd = esc(codeEl ? codeEl.textContent : '');
        const desc = esc(descEl ? descEl.textContent : '');
        const url = esc(linkEl ? linkEl.getAttribute('href') : '');
        mdLines.push(`| **${name}** | ${cat} | ${esc(tags)} | \`${cmd}\` | ${desc} | ${url} |`);
      });
      const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-tools-catalog-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = exportCatalogMdFileBtn.innerHTML;
      exportCatalogMdFileBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Exported MD!';
      setTimeout(() => { exportCatalogMdFileBtn.innerHTML = orig; }, 1800);
    });
  }

  const copyCatalogUrlsBtn = document.getElementById('btn-copy-catalog-urls');
  if (copyCatalogUrlsBtn) {
    copyCatalogUrlsBtn.addEventListener('click', async () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const urls = visibleCards
        .map(card => {
          const linkEl = card.querySelector('.repo-name a');
          return linkEl ? (linkEl.getAttribute('href') || '').trim() : '';
        })
        .filter(Boolean);
      try {
        await navigator.clipboard.writeText(urls.join('\n'));
        const orig = copyCatalogUrlsBtn.innerHTML;
        copyCatalogUrlsBtn.innerHTML = `<i class="fas fa-check" style="color: #10b981;"></i> Copied ${urls.length} URLs!`;
        setTimeout(() => { copyCatalogUrlsBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog URLs', err);
      }
    });
  }

  const copyTerminalCsvBtn = document.getElementById('btn-copy-terminal-csv');
  if (copyTerminalCsvBtn) {
    copyTerminalCsvBtn.addEventListener('click', async () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
      const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
      const escCsv = (v) => `"${String(v || '').replace(/\r?\n/g, ' ').trim().replace(/"/g, '""')}"`;
      const rows = ['"LineNumber","Tab","Severity","Content"'];
      Array.from(activePane.querySelectorAll('.terminal-line')).forEach((el, idx) => {
        let sev = 'OUTPUT';
        if (el.classList.contains('t-success')) sev = 'SUCCESS';
        else if (el.classList.contains('t-warn')) sev = 'WARN';
        else if (el.classList.contains('t-info')) sev = 'INFO';
        else if (el.querySelector('.t-cmd')) sev = 'COMMAND';
        rows.push([escCsv(idx + 1), escCsv(tabTitle), escCsv(sev), escCsv(el.textContent)].join(','));
      });
      try {
        await navigator.clipboard.writeText(rows.join('\r\n'));
        const orig = copyTerminalCsvBtn.innerHTML;
        copyTerminalCsvBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied CSV!';
        setTimeout(() => { copyTerminalCsvBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy terminal CSV', err);
      }
    });
  }

  const downloadTerminalCsvBtn = document.getElementById('btn-download-terminal-csv');
  if (downloadTerminalCsvBtn) {
    downloadTerminalCsvBtn.addEventListener('click', () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
      const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
      const escCsv = (v) => `"${String(v || '').replace(/\r?\n/g, ' ').trim().replace(/"/g, '""')}"`;
      const rows = ['"LineNumber","Tab","Severity","Content"'];
      Array.from(activePane.querySelectorAll('.terminal-line')).forEach((el, idx) => {
        let sev = 'OUTPUT';
        if (el.classList.contains('t-success')) sev = 'SUCCESS';
        else if (el.classList.contains('t-warn')) sev = 'WARN';
        else if (el.classList.contains('t-info')) sev = 'INFO';
        else if (el.querySelector('.t-cmd')) sev = 'COMMAND';
        rows.push([escCsv(idx + 1), escCsv(tabTitle), escCsv(sev), escCsv(el.textContent)].join(','));
      });
      const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-terminal-${activePane.id}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = downloadTerminalCsvBtn.innerHTML;
      downloadTerminalCsvBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved CSV!';
      setTimeout(() => { downloadTerminalCsvBtn.innerHTML = orig; }, 1800);
    });
  }

  const exportCatalogUrlsFileBtn = document.getElementById('btn-export-catalog-urls-file');
  if (exportCatalogUrlsFileBtn) {
    exportCatalogUrlsFileBtn.addEventListener('click', () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const lines = [
        `# OnYaChamp Visible Tools URLs & Quick-Start Commands (${visibleCards.length} tools)`,
        `# Exported: ${new Date().toISOString()}`,
        ''
      ];
      visibleCards.forEach(card => {
        const nameEl = card.querySelector('.repo-name');
        const linkEl = card.querySelector('.repo-name a');
        const codeEl = card.querySelector('.code-snippet code');
        const name = nameEl ? nameEl.textContent.trim() : 'Tool';
        const url = linkEl ? linkEl.getAttribute('href') : '';
        const cmd = codeEl ? codeEl.textContent.trim() : '';
        lines.push(`${name}\t${url}\t${cmd}`);
      });
      const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-tools-urls-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = exportCatalogUrlsFileBtn.innerHTML;
      exportCatalogUrlsFileBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved URLs!';
      setTimeout(() => { exportCatalogUrlsFileBtn.innerHTML = orig; }, 1800);
    });
  }

  const copyCatalogTagsBtn = document.getElementById('btn-copy-catalog-tags');
  if (copyCatalogTagsBtn) {
    copyCatalogTagsBtn.addEventListener('click', async () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const tagCounts = {};
      visibleCards.forEach(card => {
        Array.from(card.querySelectorAll('.repo-tag')).forEach(t => {
          const tag = t.textContent.trim();
          if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      const mdLines = [
        `# OnYaChamp Visible Catalog Tag Breakdown (${visibleCards.length} tools, ${sorted.length} unique tags)`,
        '',
        '| Tag | Tool Count |',
        '| :--- | ---: |',
        ...sorted.map(([tag, cnt]) => `| \`${tag}\` | ${cnt} |`)
      ];
      try {
        await navigator.clipboard.writeText(mdLines.join('\n'));
        const orig = copyCatalogTagsBtn.innerHTML;
        copyCatalogTagsBtn.innerHTML = `<i class="fas fa-check" style="color: #10b981;"></i> Copied ${sorted.length} Tags!`;
        setTimeout(() => { copyCatalogTagsBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog tags', err);
      }
    });
  }

  const downloadTerminalTsvBtn = document.getElementById('btn-download-terminal-tsv');
  if (downloadTerminalTsvBtn) {
    downloadTerminalTsvBtn.addEventListener('click', () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
      const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
      const cleanTsv = (v) => String(v || '').replace(/[\t\r\n]+/g, ' ').trim();
      const rows = ['LineNumber\tTab\tSeverity\tContent'];
      Array.from(activePane.querySelectorAll('.terminal-line')).forEach((el, idx) => {
        let sev = 'OUTPUT';
        if (el.classList.contains('t-success')) sev = 'SUCCESS';
        else if (el.classList.contains('t-warn')) sev = 'WARN';
        else if (el.classList.contains('t-info')) sev = 'INFO';
        else if (el.querySelector('.t-cmd')) sev = 'COMMAND';
        rows.push([idx + 1, cleanTsv(tabTitle), sev, cleanTsv(el.textContent)].join('\t'));
      });
      const blob = new Blob([rows.join('\r\n')], { type: 'text/tab-separated-values;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-terminal-${activePane.id}-${new Date().toISOString().slice(0, 10)}.tsv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = downloadTerminalTsvBtn.innerHTML;
      downloadTerminalTsvBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved TSV!';
      setTimeout(() => { downloadTerminalTsvBtn.innerHTML = orig; }, 1800);
    });
  }

  const downloadTerminalMdBtn = document.getElementById('btn-download-terminal-md');
  if (downloadTerminalMdBtn) {
    downloadTerminalMdBtn.addEventListener('click', () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
      const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
      const escMd = (v) => String(v || '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
      const mdLines = [
        `# OnYaChamp Interactive CLI Session — ${tabTitle}`,
        '',
        `- **Exported**: ${new Date().toISOString()}`,
        `- **Session Pane**: \`${activePane.id}\``,
        '',
        '| # | Severity | Output / Command |',
        '| ---: | :---: | :--- |'
      ];
      Array.from(activePane.querySelectorAll('.terminal-line')).forEach((el, idx) => {
        let sev = 'OUTPUT';
        if (el.classList.contains('t-success')) sev = 'SUCCESS';
        else if (el.classList.contains('t-warn')) sev = 'WARN';
        else if (el.classList.contains('t-info')) sev = 'INFO';
        else if (el.querySelector('.t-cmd')) sev = 'COMMAND';
        mdLines.push(`| ${idx + 1} | **${sev}** | \`${escMd(el.textContent)}\` |`);
      });
      const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-terminal-${activePane.id}-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = downloadTerminalMdBtn.innerHTML;
      downloadTerminalMdBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved MD!';
      setTimeout(() => { downloadTerminalMdBtn.innerHTML = orig; }, 1800);
    });
  }

  const exportCatalogTagsFileBtn = document.getElementById('btn-export-catalog-tags-file');
  if (exportCatalogTagsFileBtn) {
    exportCatalogTagsFileBtn.addEventListener('click', () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const tagCounts = {};
      let totalTags = 0;
      visibleCards.forEach(card => {
        Array.from(card.querySelectorAll('.repo-tag')).forEach(t => {
          const tag = t.textContent.trim();
          if (tag) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            totalTags++;
          }
        });
      });
      const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      const lines = [
        `# OnYaChamp Tag & Category Frequency Breakdown`,
        `# Exported: ${new Date().toISOString()}`,
        `# Total Visible Tools: ${visibleCards.length}`,
        `# Total Tag References: ${totalTags}`,
        `# Unique Tags: ${sorted.length}`,
        'Tag,ToolCount,SharePercentage'
      ];
      sorted.forEach(([tag, cnt]) => {
        const pct = ((cnt / Math.max(1, visibleCards.length)) * 100).toFixed(1) + '%';
        lines.push(`"${tag.replace(/"/g, '""')}",${cnt},"${pct}"`);
      });
      const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-tools-tags-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = exportCatalogTagsFileBtn.innerHTML;
      exportCatalogTagsFileBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved Tags CSV!';
      setTimeout(() => { exportCatalogTagsFileBtn.innerHTML = orig; }, 1800);
    });
  }

  const exportCatalogHtmlFileBtn = document.getElementById('btn-export-catalog-html-file');
  if (exportCatalogHtmlFileBtn) {
    exportCatalogHtmlFileBtn.addEventListener('click', () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const escHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const rows = [];
      visibleCards.forEach(card => {
        const nameEl = card.querySelector('.repo-name');
        const linkEl = card.querySelector('.repo-name a');
        const descEl = card.querySelector('.repo-desc');
        const codeEl = card.querySelector('.code-snippet code');
        const tags = Array.from(card.querySelectorAll('.repo-tag')).map(t => escHtml(t.textContent.trim())).filter(Boolean);
        const name = escHtml(nameEl ? nameEl.textContent.trim() : 'Tool');
        const url = linkEl ? linkEl.getAttribute('href') : '';
        const desc = escHtml(descEl ? descEl.textContent.trim() : '');
        const cmd = escHtml(codeEl ? codeEl.textContent.trim() : '');
        const tagBadges = tags.map(t => `<span class="badge" style="background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.25); border-radius: 4px; padding: 2px 6px; font-size: 0.72rem; margin-right: 4px; display: inline-block;">${t}</span>`).join(' ');
        rows.push(`
          <tr>
            <td style="font-weight: 600; color: #f8fafc;"><a href="${escHtml(url)}" target="_blank" style="color: #38bdf8; text-decoration: none;">${name}</a></td>
            <td>${tagBadges}</td>
            <td style="font-size: 0.85rem; color: #cbd5e1;">${desc}</td>
            <td><code style="background: #0f172a; padding: 3px 6px; border-radius: 4px; font-size: 0.75rem; color: #4ade80;">${cmd}</code></td>
          </tr>
        `);
      });

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OnYaChamp Tools Catalog Snapshot</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 2rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #f8fafc; margin-bottom: 0.25rem; }
    .meta { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: #131b2e; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; }
    th { background: #1e293b; color: #94a3b8; text-align: left; padding: 10px 14px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #334155; }
    td { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); vertical-align: top; }
    tr:hover td { background: rgba(255,255,255,0.02); }
  </style>
</head>
<body>
  <div class="container">
    <h1>OnYaChamp Tools Catalog Snapshot</h1>
    <div class="meta">Exported ${new Date().toISOString()} &bull; <strong>${visibleCards.length}</strong> tools shown</div>
    <table>
      <thead>
        <tr>
          <th>Tool Name</th>
          <th>Tags / Category</th>
          <th>Description</th>
          <th>Quick Install / Run</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('\n')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-tools-catalog-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = exportCatalogHtmlFileBtn.innerHTML;
      exportCatalogHtmlFileBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved HTML!';
      setTimeout(() => { exportCatalogHtmlFileBtn.innerHTML = orig; }, 1800);
    });
  }

  const downloadTerminalHtmlBtn = document.getElementById('btn-download-terminal-html');
  if (downloadTerminalHtmlBtn) {
    downloadTerminalHtmlBtn.addEventListener('click', () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
      const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
      const escHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const lines = [];
      Array.from(activePane.querySelectorAll('.terminal-line')).forEach(el => {
        let color = '#e2e8f0';
        if (el.classList.contains('t-success')) color = '#4ade80';
        else if (el.classList.contains('t-warn')) color = '#fbbf24';
        else if (el.classList.contains('t-info')) color = '#38bdf8';
        else if (el.querySelector('.t-cmd')) color = '#a78bfa';
        lines.push(`<div style="color: ${color}; line-height: 1.6; font-family: Consolas, 'Cascadia Code', monospace; font-size: 13px;">${escHtml(el.textContent)}</div>`);
      });

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CLI Tour Transcript — ${escHtml(tabTitle)}</title>
  <style>
    body { font-family: Consolas, 'Cascadia Code', monospace; background: #0c1017; color: #e2e8f0; padding: 2rem; margin: 0; }
    .window { max-width: 1000px; margin: 0 auto; background: #161b22; border: 1px solid #30363d; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: #21262d; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; }
    .title { color: #f0f6fc; font-weight: 600; font-size: 13px; }
    .body { padding: 1rem 1.5rem; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="window">
    <div class="header">
      <span class="title">PowerShell 7.4.5 &bull; ${escHtml(tabTitle)}</span>
      <span style="font-size: 11px; color: #8b949e;">Exported ${new Date().toISOString()}</span>
    </div>
    <div class="body">
      ${lines.join('\n')}
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-terminal-${activePane.id}-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = downloadTerminalHtmlBtn.innerHTML;
      downloadTerminalHtmlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved HTML!';
      setTimeout(() => { downloadTerminalHtmlBtn.innerHTML = orig; }, 1800);
    });
  }

  const copyTerminalHtmlBtn = document.getElementById('btn-copy-terminal-html');
  if (copyTerminalHtmlBtn) {
    copyTerminalHtmlBtn.addEventListener('click', async () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
      const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
      const escHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const lines = [];
      Array.from(activePane.querySelectorAll('.terminal-line')).forEach(el => {
        let color = '#e2e8f0';
        if (el.classList.contains('t-success')) color = '#4ade80';
        else if (el.classList.contains('t-warn')) color = '#fbbf24';
        else if (el.classList.contains('t-info')) color = '#38bdf8';
        else if (el.querySelector('.t-cmd')) color = '#a78bfa';
        lines.push(`<div style="color: ${color}; line-height: 1.5;">${escHtml(el.textContent)}</div>`);
      });
      const htmlSnippet = `<div style="background: #0f172a; color: #e2e8f0; font-family: Consolas, 'Cascadia Code', monospace; font-size: 13px; padding: 14px; border-radius: 6px; border: 1px solid #1e293b;">
  <div style="color: #94a3b8; font-size: 11px; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 4px;"><strong>PowerShell 7.4.5</strong> &bull; ${escHtml(tabTitle)} &bull; ${new Date().toISOString()}</div>
  ${lines.join('\n')}
</div>`;
      try {
        await navigator.clipboard.writeText(htmlSnippet);
        const orig = copyTerminalHtmlBtn.innerHTML;
        copyTerminalHtmlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied HTML!';
        setTimeout(() => { copyTerminalHtmlBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy terminal HTML', err);
      }
    });
  }

  const copyCatalogHtmlBtn = document.getElementById('btn-copy-catalog-html');
  if (copyCatalogHtmlBtn) {
    copyCatalogHtmlBtn.addEventListener('click', async () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const escHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const rows = [];
      visibleCards.forEach(card => {
        const nameEl = card.querySelector('.repo-name');
        const linkEl = card.querySelector('.repo-name a');
        const descEl = card.querySelector('.repo-desc');
        const codeEl = card.querySelector('.code-snippet code');
        const tags = Array.from(card.querySelectorAll('.repo-tag')).map(t => escHtml(t.textContent.trim())).filter(Boolean);
        const name = escHtml(nameEl ? nameEl.textContent.trim() : 'Tool');
        const url = linkEl ? linkEl.getAttribute('href') : '';
        const desc = escHtml(descEl ? descEl.textContent.trim() : '');
        const cmd = escHtml(codeEl ? codeEl.textContent.trim() : '');
        const tagBadges = tags.map(t => `<span style="background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.25); border-radius: 4px; padding: 2px 6px; font-size: 0.72rem; margin-right: 4px; display: inline-block;">${t}</span>`).join(' ');
        rows.push(`
          <tr>
            <td style="font-weight: 600; color: #f8fafc; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06);"><a href="${escHtml(url)}" target="_blank" style="color: #38bdf8; text-decoration: none;">${name}</a></td>
            <td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06);">${tagBadges}</td>
            <td style="font-size: 0.85rem; color: #cbd5e1; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06);">${desc}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06);"><code style="background: #0f172a; padding: 3px 6px; border-radius: 4px; font-size: 0.75rem; color: #4ade80;">${cmd}</code></td>
          </tr>
        `);
      });

      const htmlSnippet = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; padding: 1.5rem; border-radius: 8px; border: 1px solid #1e293b;">
  <div style="color: #f8fafc; font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">OnYaChamp Tools Catalog Snapshot</div>
  <div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">Exported: ${new Date().toISOString()} &bull; <strong>${visibleCards.length}</strong> visible tools</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
    <thead>
      <tr style="background: #1e293b; color: #94a3b8; text-align: left; text-transform: uppercase; font-size: 0.75rem;">
        <th style="padding: 8px 12px; border-bottom: 1px solid #334155;">Tool</th>
        <th style="padding: 8px 12px; border-bottom: 1px solid #334155;">Tags</th>
        <th style="padding: 8px 12px; border-bottom: 1px solid #334155;">Description</th>
        <th style="padding: 8px 12px; border-bottom: 1px solid #334155;">Quick Command</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join('\n')}
    </tbody>
  </table>
</div>`;

      try {
        await navigator.clipboard.writeText(htmlSnippet);
        const orig = copyCatalogHtmlBtn.innerHTML;
        copyCatalogHtmlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied HTML!';
        setTimeout(() => { copyCatalogHtmlBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog HTML', err);
      }
    });
  }

  const copyCatalogTagsHtmlBtn = document.getElementById('btn-copy-catalog-tags-html');
  if (copyCatalogTagsHtmlBtn) {
    copyCatalogTagsHtmlBtn.addEventListener('click', async () => {
      const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
      const escHtml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const tagCounts = {};
      let totalTags = 0;
      visibleCards.forEach(card => {
        Array.from(card.querySelectorAll('.repo-tag')).forEach(t => {
          const tag = t.textContent.trim();
          if (tag) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            totalTags++;
          }
        });
      });
      const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      const rows = sorted.map(([tag, cnt]) => {
        const pct = ((cnt / Math.max(1, visibleCards.length)) * 100).toFixed(1) + '%';
        return `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-weight: 600;"><span style="background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.25); border-radius: 4px; padding: 2px 6px; font-size: 0.75rem;">${escHtml(tag)}</span></td>
            <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: right; font-weight: 600; color: #f8fafc;">${cnt}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: right; color: #34d399;">${pct}</td>
          </tr>
        `;
      });

      const htmlSnippet = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; padding: 1.5rem; border-radius: 8px; border: 1px solid #1e293b; max-width: 600px;">
  <div style="color: #f8fafc; font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">OnYaChamp Tag &amp; Category Frequency Breakdown</div>
  <div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">Exported: ${new Date().toISOString()} &bull; <strong>${visibleCards.length}</strong> visible tools &bull; <strong>${sorted.length}</strong> unique tags</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
    <thead>
      <tr style="background: #1e293b; color: #94a3b8; text-align: left; text-transform: uppercase; font-size: 0.75rem;">
        <th style="padding: 8px 12px; border-bottom: 1px solid #334155;">Tag / Category</th>
        <th style="padding: 8px 12px; border-bottom: 1px solid #334155; text-align: right;">Tools</th>
        <th style="padding: 8px 12px; border-bottom: 1px solid #334155; text-align: right;">Share</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join('\n')}
    </tbody>
  </table>
</div>`;

      try {
        await navigator.clipboard.writeText(htmlSnippet);
        const orig = copyCatalogTagsHtmlBtn.innerHTML;
        copyCatalogTagsHtmlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied Tags HTML!';
        setTimeout(() => { copyCatalogTagsHtmlBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog tags HTML', err);
      }
    });
  }

  const generateCatalogXml = () => {
    const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
    const escXml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const toolsXml = visibleCards.map(card => {
      const nameEl = card.querySelector('.repo-name');
      const linkEl = card.querySelector('.repo-name a');
      const descEl = card.querySelector('.repo-desc');
      const codeEl = card.querySelector('.code-snippet code');
      const category = card.getAttribute('data-category') || '';
      const badgeEl = card.querySelector('.badge');
      const badge = badgeEl ? badgeEl.textContent.trim() : '';
      const tags = Array.from(card.querySelectorAll('.repo-tag')).map(t => t.textContent.trim()).filter(Boolean);
      const name = nameEl ? nameEl.textContent.trim() : 'Tool';
      const url = linkEl ? linkEl.getAttribute('href') : '';
      const desc = descEl ? descEl.textContent.trim() : '';
      const cmd = codeEl ? codeEl.textContent.trim() : '';
      const tagsXml = tags.map(t => `      <tag>${escXml(t)}</tag>`).join('\n');
      return `    <tool name="${escXml(name)}" url="${escXml(url)}" category="${escXml(category)}">
      <badge>${escXml(badge)}</badge>
      <description>${escXml(desc)}</description>
      <command>${escXml(cmd)}</command>
      <tags>
${tagsXml}
      </tags>
    </tool>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<catalog generated="${new Date().toISOString()}" totalTools="${visibleCards.length}">\n${toolsXml}\n</catalog>`;
  };

  const exportCatalogXmlBtn = document.getElementById('btn-export-catalog-xml-file');
  if (exportCatalogXmlBtn) {
    exportCatalogXmlBtn.addEventListener('click', () => {
      const xml = generateCatalogXml();
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-tools-catalog-${new Date().toISOString().slice(0, 10)}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = exportCatalogXmlBtn.innerHTML;
      exportCatalogXmlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved XML!';
      setTimeout(() => { exportCatalogXmlBtn.innerHTML = orig; }, 1800);
    });
  }

  const copyCatalogXmlBtn = document.getElementById('btn-copy-catalog-xml');
  if (copyCatalogXmlBtn) {
    copyCatalogXmlBtn.addEventListener('click', async () => {
      const xml = generateCatalogXml();
      try {
        await navigator.clipboard.writeText(xml);
        const orig = copyCatalogXmlBtn.innerHTML;
        copyCatalogXmlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied XML!';
        setTimeout(() => { copyCatalogXmlBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog XML', err);
      }
    });
  }

  const generateTerminalXml = () => {
    const activePane = document.querySelector('.t-pane.active');
    if (!activePane) return '';
    const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
    const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
    const escXml = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const lines = [];
    Array.from(activePane.querySelectorAll('.terminal-line')).forEach(el => {
      let type = 'text';
      if (el.classList.contains('t-success')) type = 'success';
      else if (el.classList.contains('t-warn')) type = 'warning';
      else if (el.classList.contains('t-info')) type = 'info';
      else if (el.classList.contains('t-accent')) type = 'accent';
      else if (el.querySelector('.t-cmd')) type = 'command';
      lines.push(`    <line type="${type}"><![CDATA[${el.textContent}]]></line>`);
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<terminalSession tab="${escXml(tabTitle)}" exported="${new Date().toISOString()}">\n${lines.join('\n')}\n</terminalSession>`;
  };

  const downloadTerminalXmlBtn = document.getElementById('btn-download-terminal-xml');
  if (downloadTerminalXmlBtn) {
    downloadTerminalXmlBtn.addEventListener('click', () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const xml = generateTerminalXml();
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-terminal-${activePane.id}-${new Date().toISOString().slice(0, 10)}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = downloadTerminalXmlBtn.innerHTML;
      downloadTerminalXmlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved XML!';
      setTimeout(() => { downloadTerminalXmlBtn.innerHTML = orig; }, 1800);
    });
  }

  const copyTerminalXmlBtn = document.getElementById('btn-copy-terminal-xml');
  if (copyTerminalXmlBtn) {
    copyTerminalXmlBtn.addEventListener('click', async () => {
      const xml = generateTerminalXml();
      if (!xml) return;
      try {
        await navigator.clipboard.writeText(xml);
        const orig = copyTerminalXmlBtn.innerHTML;
        copyTerminalXmlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied XML!';
        setTimeout(() => { copyTerminalXmlBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy terminal XML', err);
      }
    });
  }

  const generateCatalogYaml = () => {
    const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
    const yamlEscape = s => JSON.stringify(String(s || ''));
    const toolsYaml = visibleCards.map(card => {
      const nameEl = card.querySelector('.repo-name');
      const linkEl = card.querySelector('.repo-name a');
      const descEl = card.querySelector('.repo-desc');
      const codeEl = card.querySelector('.code-snippet code');
      const category = card.getAttribute('data-category') || '';
      const badgeEl = card.querySelector('.badge');
      const badge = badgeEl ? badgeEl.textContent.trim() : '';
      const tags = Array.from(card.querySelectorAll('.repo-tag')).map(t => t.textContent.trim()).filter(Boolean);
      const name = nameEl ? nameEl.textContent.trim() : 'Tool';
      const url = linkEl ? linkEl.getAttribute('href') : '';
      const desc = descEl ? descEl.textContent.trim() : '';
      const cmd = codeEl ? codeEl.textContent.trim() : '';
      const tagsYaml = tags.length > 0 ? tags.map(t => `      - ${yamlEscape(t)}`).join('\n') : '      []';
      return `  - name: ${yamlEscape(name)}
    url: ${yamlEscape(url)}
    category: ${yamlEscape(category)}
    badge: ${yamlEscape(badge)}
    description: ${yamlEscape(desc)}
    command: ${yamlEscape(cmd)}
    tags:
${tagsYaml}`;
    }).join('\n');

    return `# OnYaChamp Tools Catalog\n# Generated: ${new Date().toISOString()}\ntotalTools: ${visibleCards.length}\ntools:\n${toolsYaml}\n`;
  };

  const exportCatalogYamlBtn = document.getElementById('btn-export-catalog-yaml-file');
  if (exportCatalogYamlBtn) {
    exportCatalogYamlBtn.addEventListener('click', () => {
      const yaml = generateCatalogYaml();
      const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-tools-catalog-${new Date().toISOString().slice(0, 10)}.yaml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = exportCatalogYamlBtn.innerHTML;
      exportCatalogYamlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved YAML!';
      setTimeout(() => { exportCatalogYamlBtn.innerHTML = orig; }, 1800);
    });
  }

  const copyCatalogYamlBtn = document.getElementById('btn-copy-catalog-yaml');
  if (copyCatalogYamlBtn) {
    copyCatalogYamlBtn.addEventListener('click', async () => {
      const yaml = generateCatalogYaml();
      try {
        await navigator.clipboard.writeText(yaml);
        const orig = copyCatalogYamlBtn.innerHTML;
        copyCatalogYamlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied YAML!';
        setTimeout(() => { copyCatalogYamlBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog YAML', err);
      }
    });
  }

  const generateTerminalYaml = () => {
    const activePane = document.querySelector('.t-pane.active');
    if (!activePane) return '';
    const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
    const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
    const yamlEscape = s => JSON.stringify(String(s || ''));
    const lines = [];
    Array.from(activePane.querySelectorAll('.terminal-line')).forEach(el => {
      let type = 'text';
      if (el.classList.contains('t-success')) type = 'success';
      else if (el.classList.contains('t-warn')) type = 'warning';
      else if (el.classList.contains('t-info')) type = 'info';
      else if (el.classList.contains('t-accent')) type = 'accent';
      else if (el.querySelector('.t-cmd')) type = 'command';
      lines.push(`    - type: ${yamlEscape(type)}\n      text: ${yamlEscape(el.textContent.trim())}`);
    });
    return `# OnYaChamp Terminal Session\n# Tab: ${tabTitle}\n# Exported: ${new Date().toISOString()}\nsession:\n  tab: ${yamlEscape(tabTitle)}\n  runtime: "PowerShell 7.4.5 LTS"\n  totalLines: ${lines.length}\n  lines:\n${lines.join('\n')}\n`;
  };

  const downloadTerminalYamlBtn = document.getElementById('btn-download-terminal-yaml');
  if (downloadTerminalYamlBtn) {
    downloadTerminalYamlBtn.addEventListener('click', () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const yaml = generateTerminalYaml();
      const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-terminal-${activePane.id}-${new Date().toISOString().slice(0, 10)}.yaml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = downloadTerminalYamlBtn.innerHTML;
      downloadTerminalYamlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved YAML!';
      setTimeout(() => { downloadTerminalYamlBtn.innerHTML = orig; }, 1800);
    });
  }

  const copyTerminalYamlBtn = document.getElementById('btn-copy-terminal-yaml');
  if (copyTerminalYamlBtn) {
    copyTerminalYamlBtn.addEventListener('click', async () => {
      const yaml = generateTerminalYaml();
      if (!yaml) return;
      try {
        await navigator.clipboard.writeText(yaml);
        const orig = copyTerminalYamlBtn.innerHTML;
        copyTerminalYamlBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied YAML!';
        setTimeout(() => { copyTerminalYamlBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy terminal YAML', err);
      }
    });
  }

  const generateCatalogNdjson = () => {
    const visibleCards = Array.from(document.querySelectorAll('.repo-card')).filter(c => c.style.display !== 'none');
    return visibleCards.map(card => {
      const nameEl = card.querySelector('.repo-name');
      const linkEl = card.querySelector('.repo-name a');
      const descEl = card.querySelector('.repo-desc');
      const codeEl = card.querySelector('.code-snippet code');
      const category = card.getAttribute('data-category') || '';
      const badgeEl = card.querySelector('.badge');
      const badge = badgeEl ? badgeEl.textContent.trim() : '';
      const tags = Array.from(card.querySelectorAll('.repo-tag')).map(t => t.textContent.trim()).filter(Boolean);
      const name = nameEl ? nameEl.textContent.trim() : 'Tool';
      const url = linkEl ? linkEl.getAttribute('href') : '';
      const desc = descEl ? descEl.textContent.trim() : '';
      const cmd = codeEl ? codeEl.textContent.trim() : '';
      return JSON.stringify({
        name,
        url,
        category,
        badge,
        description: desc,
        command: cmd,
        tags
      });
    }).join('\n') + '\n';
  };

  const exportCatalogNdjsonBtn = document.getElementById('btn-export-catalog-ndjson-file');
  if (exportCatalogNdjsonBtn) {
    exportCatalogNdjsonBtn.addEventListener('click', () => {
      const ndjson = generateCatalogNdjson();
      const blob = new Blob([ndjson], { type: 'application/x-ndjson;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-tools-catalog-${new Date().toISOString().slice(0, 10)}.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = exportCatalogNdjsonBtn.innerHTML;
      exportCatalogNdjsonBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved NDJSON!';
      setTimeout(() => { exportCatalogNdjsonBtn.innerHTML = orig; }, 1800);
    });
  }

  const copyCatalogNdjsonBtn = document.getElementById('btn-copy-catalog-ndjson');
  if (copyCatalogNdjsonBtn) {
    copyCatalogNdjsonBtn.addEventListener('click', async () => {
      const ndjson = generateCatalogNdjson();
      try {
        await navigator.clipboard.writeText(ndjson);
        const orig = copyCatalogNdjsonBtn.innerHTML;
        copyCatalogNdjsonBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied NDJSON!';
        setTimeout(() => { copyCatalogNdjsonBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy catalog NDJSON', err);
      }
    });
  }

  const generateTerminalNdjson = () => {
    const activePane = document.querySelector('.t-pane.active');
    if (!activePane) return '';
    const activeTabBtn = document.querySelector('.terminal-tab-btn.active');
    const tabTitle = activeTabBtn ? activeTabBtn.textContent.trim() : activePane.id;
    const lines = [];
    Array.from(activePane.querySelectorAll('.terminal-line')).forEach((el, idx) => {
      let type = 'text';
      if (el.classList.contains('t-success')) type = 'success';
      else if (el.classList.contains('t-warn')) type = 'warning';
      else if (el.classList.contains('t-info')) type = 'info';
      else if (el.classList.contains('t-accent')) type = 'accent';
      else if (el.querySelector('.t-cmd')) type = 'command';
      lines.push(JSON.stringify({
        tab: tabTitle,
        lineIndex: idx + 1,
        type,
        text: el.textContent.trim(),
        timestamp: new Date().toISOString()
      }));
    });
    return lines.join('\n') + '\n';
  };

  const downloadTerminalNdjsonBtn = document.getElementById('btn-download-terminal-ndjson');
  if (downloadTerminalNdjsonBtn) {
    downloadTerminalNdjsonBtn.addEventListener('click', () => {
      const activePane = document.querySelector('.t-pane.active');
      if (!activePane) return;
      const ndjson = generateTerminalNdjson();
      const blob = new Blob([ndjson], { type: 'application/x-ndjson;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onyachamp-terminal-${activePane.id}-${new Date().toISOString().slice(0, 10)}.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const orig = downloadTerminalNdjsonBtn.innerHTML;
      downloadTerminalNdjsonBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Saved NDJSON!';
      setTimeout(() => { downloadTerminalNdjsonBtn.innerHTML = orig; }, 1800);
    });
  }

  const copyTerminalNdjsonBtn = document.getElementById('btn-copy-terminal-ndjson');
  if (copyTerminalNdjsonBtn) {
    copyTerminalNdjsonBtn.addEventListener('click', async () => {
      const ndjson = generateTerminalNdjson();
      if (!ndjson) return;
      try {
        await navigator.clipboard.writeText(ndjson);
        const orig = copyTerminalNdjsonBtn.innerHTML;
        copyTerminalNdjsonBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> Copied NDJSON!';
        setTimeout(() => { copyTerminalNdjsonBtn.innerHTML = orig; }, 1800);
      } catch (err) {
        console.error('Failed to copy terminal NDJSON', err);
      }
    });
  }
});
