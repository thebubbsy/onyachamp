/**
 * OnyaChamp / Matthew Bubb - Platform & MarkSmith Simulator
 * Pure vanilla ES6+ with zero heavy external dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. MarkSmith WinUI 3 Desktop App Simulator
  // ==========================================

  const renderedPage = document.getElementById('sim-rendered-page');
  const themeButtons = document.querySelectorAll('.theme-pill-btn');
  const aiToggle = document.getElementById('sim-ai-toggle');
  const shapeToggle = document.getElementById('sim-shape-toggle');
  const exportBtn = document.getElementById('sim-export-btn');
  const toastNotification = document.getElementById('sim-toast');
  const playDemoBtn = document.getElementById('btn-play-demo');
  const simProgress = document.getElementById('sim-progress-fill');
  const simStatus = document.getElementById('sim-status-text');
  const editorCode = document.getElementById('sim-editor-code');
  const viewTabs = document.querySelectorAll('.view-tab-btn');
  const editorPane = document.getElementById('sim-editor-pane');
  const previewPane = document.getElementById('sim-preview-pane');

  // Theme Preset Switching
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const theme = btn.getAttribute('data-theme');
      if (renderedPage) {
        renderedPage.className = 'rendered-page theme-' + theme;
      }
    });
  });

  // AI Normalizer Toggle
  if (aiToggle) {
    aiToggle.addEventListener('click', () => {
      aiToggle.classList.toggle('on');
      const isOn = aiToggle.classList.contains('on');
      const citationPip = document.querySelector('.doc-pip');
      if (citationPip) {
        citationPip.style.display = isOn ? 'none' : 'inline';
      }
    });
  }

  // ShapeForge Toggle
  if (shapeToggle) {
    shapeToggle.addEventListener('click', () => {
      shapeToggle.classList.toggle('on');
      const isOn = shapeToggle.classList.contains('on');
      const diagramBox = document.querySelector('.doc-diagram-box');
      if (diagramBox) {
        diagramBox.style.borderColor = isOn ? '#38bdf8' : '#e2e8f0';
      }
    });
  }

  // Export Button & Toast Trigger
  const triggerToast = (filename = 'Quarterly_Report_2026.docx') => {
    if (!toastNotification) return;
    const bodyEl = toastNotification.querySelector('.toast-body');
    if (bodyEl) {
      bodyEl.textContent = `${filename} • ECMA-376 Schema Valid (0 errors)`;
    }
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 4500);
  };

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Compiling OOXML...';
      setTimeout(() => {
        exportBtn.innerHTML = '<i class="fas fa-file-word"></i> Export DOCX';
        triggerToast('Quarterly_Report_2026.docx');
      }, 700);
    });
  }

  // View Mode Tabs (Dual Split / Preview Only / Code Only)
  viewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      viewTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const mode = tab.getAttribute('data-mode');
      if (mode === 'split') {
        if (editorPane) editorPane.style.display = 'block';
        if (previewPane) previewPane.style.display = 'flex';
      } else if (mode === 'preview') {
        if (editorPane) editorPane.style.display = 'none';
        if (previewPane) previewPane.style.display = 'flex';
      } else if (mode === 'code') {
        if (editorPane) editorPane.style.display = 'block';
        if (previewPane) previewPane.style.display = 'none';
      }
    });
  });

  // Automated Interactive Video / Simulation Run
  let isSimulating = false;
  const sampleSteps = [
    { progress: 20, status: '1. Ingesting Raw AI Markdown...', theme: 'executive' },
    { progress: 45, status: '2. Normalizing AI Quirks & LaTeX Delimiters...', theme: 'executive', aiOn: true },
    { progress: 70, status: '3. ShapeForge: Compiling Mermaid to Native Vector Shapes...', theme: 'nordic', aiOn: true },
    { progress: 90, status: '4. Applying Corporate Theme & ContrastGuard...', theme: 'cyberpunk', aiOn: true },
    { progress: 100, status: '5. Export Complete (ECMA-376 Valid ✓)', theme: 'executive', export: true }
  ];

  if (playDemoBtn) {
    playDemoBtn.addEventListener('click', () => {
      if (isSimulating) return;
      isSimulating = true;
      playDemoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running Showcase...';

      let stepIndex = 0;
      const interval = setInterval(() => {
        if (stepIndex >= sampleSteps.length) {
          clearInterval(interval);
          isSimulating = false;
          playDemoBtn.innerHTML = '<i class="fas fa-rotate-right"></i> Replay Showcase';
          return;
        }

        const step = sampleSteps[stepIndex];
        if (simProgress) simProgress.style.width = step.progress + '%';
        if (simStatus) simStatus.textContent = step.status;

        // Apply theme for step
        if (step.theme && renderedPage) {
          themeButtons.forEach(b => {
            if (b.getAttribute('data-theme') === step.theme) {
              b.classList.add('active');
            } else {
              b.classList.remove('active');
            }
          });
          renderedPage.className = 'rendered-page theme-' + step.theme;
        }

        // Toggle AI switch
        if (step.aiOn && aiToggle) {
          aiToggle.classList.add('on');
          const pip = document.querySelector('.doc-pip');
          if (pip) pip.style.display = 'none';
        }

        // Trigger export on final step
        if (step.export) {
          triggerToast('Executive_Summary_Final.docx');
        }

        stepIndex++;
      }, 1400);
    });
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
