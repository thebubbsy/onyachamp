/**
 * Downloads page: lists files from data/resources.json (built by
 * scripts/build_resources.py), downloads them straight from GitHub, and
 * reports each click to the D1-backed counter at /api/downloads/*.
 */
document.addEventListener('DOMContentLoaded', () => {
  const groupsEl = document.getElementById('res-groups');
  const totalEl = document.getElementById('res-total');
  const last30El = document.getElementById('res-last30');
  const countEl = document.getElementById('res-count');
  const syncedEl = document.getElementById('res-synced');
  if (!groupsEl) return;

  const STATS_URL = '/api/downloads/stats';
  const HIT_URL = '/api/downloads/hit';

  let stats = null; // { total, last30, files: { id: count } } once loaded
  let filter = 'all';

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fmtSize = (bytes) => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const fmtNum = (n) => Number(n || 0).toLocaleString();

  const typeOf = (file) => (file.name.toLowerCase().endsWith('.ps1') ? 'ps1' : 'app');

  const countLabel = (id) => {
    if (!stats) return '';
    const n = stats.files[id] || 0;
    return `${fmtNum(n)} download${n === 1 ? '' : 's'}`;
  };

  function renderStats() {
    if (!stats) return;
    totalEl.textContent = fmtNum(stats.total);
    last30El.textContent = fmtNum(stats.last30);
    groupsEl.querySelectorAll('[data-count-for]').forEach((el) => {
      el.textContent = countLabel(el.dataset.countFor);
    });
  }

  function render(manifest) {
    const groups = manifest.groups || [];
    countEl.textContent = fmtNum(groups.reduce((n, g) => n + g.files.length, 0));

    if (manifest.generated) {
      syncedEl.textContent = `File list last synced from GitHub ${fmtDate(manifest.generated)}.`;
    }

    if (!groups.length) {
      groupsEl.innerHTML = '<p class="res-empty">No files to list yet.</p>';
      return;
    }

    groupsEl.innerHTML = groups.map((g) => `
      <section class="res-group" data-types="${[...new Set(g.files.map(typeOf))].join(' ')}">
        <header class="res-group-head">
          <div>
            <h3>${esc(g.repo)}</h3>
            ${g.description ? `<p>${esc(g.description)}</p>` : ''}
          </div>
          <a class="res-repo-link" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> Repo</a>
        </header>
        <ul class="res-files">
          ${g.files.map((f) => `
            <li class="res-file" data-type="${typeOf(f)}">
              <span class="res-file-icon res-icon-${typeOf(f)}" aria-hidden="true">
                <i class="${typeOf(f) === 'ps1' ? 'fas fa-terminal' : 'fa-brands fa-windows'}"></i>
              </span>
              <div class="res-file-info">
                <span class="res-file-name">${esc(f.name)}</span>
                <span class="res-file-meta">
                  ${f.kind === 'release' ? `<span class="res-tag">${esc(f.version)}</span>` : '<span class="res-tag res-tag-branch">latest</span>'}
                  ${f.size ? `<span>${fmtSize(f.size)}</span>` : ''}
                  ${f.updated ? `<span>Updated ${fmtDate(f.updated)}</span>` : ''}
                  <span class="res-file-count" data-count-for="${esc(f.id)}">${countLabel(f.id)}</span>
                </span>
              </div>
              <a class="btn btn-primary btn-sm res-dl" href="${esc(f.url)}" download="${esc(f.name)}"
                 data-id="${esc(f.id)}" data-name="${esc(f.name)}" data-kind="${esc(f.kind)}">
                <i class="fas fa-download"></i> Download
              </a>
            </li>`).join('')}
        </ul>
      </section>`).join('');

    applyFilter();
  }

  function applyFilter() {
    groupsEl.querySelectorAll('.res-group').forEach((group) => {
      let visible = 0;
      group.querySelectorAll('.res-file').forEach((row) => {
        const show = filter === 'all' || row.dataset.type === filter;
        row.hidden = !show;
        if (show) visible++;
      });
      group.hidden = visible === 0;
    });
  }

  function recordHit(id) {
    const body = JSON.stringify({ id });
    let sent = false;
    try {
      sent = navigator.sendBeacon && navigator.sendBeacon(HIT_URL, body);
    } catch (e) { /* fall through */ }
    if (!sent) {
      fetch(HIT_URL, { method: 'POST', body, keepalive: true }).catch(() => {});
    }
    if (stats) {
      stats.files[id] = (stats.files[id] || 0) + 1;
      stats.total++;
      stats.last30++;
      renderStats();
    }
  }

  // Release assets come from github.com with an attachment header, so the plain
  // link already downloads without leaving the page. Raw repo files are served
  // as text, and the download attribute is ignored cross-origin, so fetch those
  // and save them as a blob instead.
  async function downloadRaw(link) {
    const original = link.innerHTML;
    link.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading';
    link.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(link.href);
      if (!res.ok) throw new Error(res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = link.dataset.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      window.open(link.href, '_blank', 'noopener');
    } finally {
      link.innerHTML = original;
      link.removeAttribute('aria-busy');
    }
  }

  groupsEl.addEventListener('click', (e) => {
    const link = e.target.closest('.res-dl');
    if (!link || e.button !== 0) return;
    recordHit(link.dataset.id);
    if (link.dataset.kind === 'file' && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) {
      e.preventDefault();
      downloadRaw(link);
    }
  });

  document.querySelectorAll('.res-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      document.querySelectorAll('.res-filter').forEach((b) => b.classList.toggle('is-active', b === btn));
      applyFilter();
    });
  });

  fetch('data/resources.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(render)
    .catch(() => {
      groupsEl.innerHTML = '<p class="res-empty">Couldn\'t load the file list. Everything is also on <a href="https://github.com/thebubbsy" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>';
    });

  fetch(STATS_URL)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((s) => {
      stats = { total: s.total || 0, last30: s.last30 || 0, files: s.files || {} };
      renderStats();
    })
    .catch(() => {
      totalEl.textContent = '–';
      last30El.textContent = '–';
      totalEl.title = last30El.title = 'Download stats are unavailable right now';
    });
});
