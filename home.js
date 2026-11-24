/**
 * OnyaChamp Platform Controller
 * Architecture: The well-kept board
 * Features: FuelAhead Detour Engine, Field Notes Reader, Lightbox, Motion Layer
 */

document.documentElement.classList.add('js');

// ==========================================
// 1. Live FuelAhead Detour & Net Savings Engine
// ==========================================
function initCalculator() {
  const sliderTank = document.getElementById('slider-tank');
  const sliderBase = document.getElementById('slider-base');
  const sliderDisc = document.getElementById('slider-disc');
  const sliderDist = document.getElementById('slider-dist');
  const sliderEcon = document.getElementById('slider-econ');

  if (!sliderTank) return;

  const valTank = document.getElementById('val-tank');
  const valBase = document.getElementById('val-base');
  const valDisc = document.getElementById('val-disc');
  const valDist = document.getElementById('val-dist');
  const valEcon = document.getElementById('val-econ');

  const fillMap = [
    [sliderTank, document.getElementById('fill-tank')],
    [sliderBase, document.getElementById('fill-base')],
    [sliderDisc, document.getElementById('fill-disc')],
    [sliderDist, document.getElementById('fill-dist')],
    [sliderEcon, document.getElementById('fill-econ')],
  ];

  const totemWhole = document.getElementById('totem-whole');
  const totemPriceReadout = document.getElementById('totem-price-readout');
  const outSpread = document.getElementById('out-spread');
  const outEffective = document.getElementById('out-effective');
  const outVerdict = document.getElementById('out-verdict');
  const outVerdictText = document.getElementById('out-verdict-text');
  const outBurnPct = document.getElementById('out-burn-pct');
  const meterKept = document.getElementById('meter-kept');
  const meterBurn = document.getElementById('meter-burn');
  const outBurnLitres = document.getElementById('out-burn-litres');
  const outBreakeven = document.getElementById('out-breakeven');
  const outGross = document.getElementById('out-gross');
  const outCost = document.getElementById('out-cost');
  const outE10 = document.getElementById('out-e10');
  const outNetSub = document.getElementById('out-net-sub');
  const outNet = document.getElementById('out-net');
  const presetBtns = Array.from(document.querySelectorAll('.calc-preset-btn'));

  function syncFills() {
    for (const [slider, fill] of fillMap) {
      if (!slider || !fill) continue;
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const val = parseFloat(slider.value);
      const pct = max > min ? Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)) : 0;
      fill.style.width = `${pct.toFixed(2)}%`;
    }
  }

  function updatePresetStates() {
    for (const btn of presetBtns) {
      const matches =
        parseFloat(sliderTank.value) === parseFloat(btn.dataset.tank) &&
        parseFloat(sliderBase.value) === parseFloat(btn.dataset.base) &&
        parseFloat(sliderDisc.value) === parseFloat(btn.dataset.disc) &&
        parseFloat(sliderDist.value) === parseFloat(btn.dataset.dist) &&
        parseFloat(sliderEcon.value) === parseFloat(btn.dataset.econ);
      btn.classList.toggle('is-active', matches);
      btn.setAttribute('aria-pressed', matches ? 'true' : 'false');
    }
  }

  function update() {
    const tank = parseFloat(sliderTank.value);
    const base = parseFloat(sliderBase.value);
    const disc = parseFloat(sliderDisc.value);
    const dist = parseFloat(sliderDist.value);
    const econ = parseFloat(sliderEcon.value);

    const baseTenths = base + 0.9;
    const discTenths = disc + 0.9;

    // Update labels & progress fills
    valTank.textContent = `${tank} Litres`;
    valBase.textContent = `${base}.9 c/L`;
    valDisc.textContent = `${disc}.9 c/L`;
    valDist.textContent = `${dist.toFixed(1)} km`;
    valEcon.textContent = `${econ.toFixed(1)} L/100km`;
    syncFills();

    // Totem display & spread
    totemWhole.textContent = Math.floor(disc);
    const priceDiffCents = baseTenths - discTenths;
    if (outSpread) {
      if (priceDiffCents > 0.05) {
        outSpread.textContent = `${priceDiffCents.toFixed(1)} c/L cheaper`;
        outSpread.style.color = 'var(--accent)';
      } else if (priceDiffCents < -0.05) {
        outSpread.textContent = `${Math.abs(priceDiffCents).toFixed(1)} c/L pricier`;
        outSpread.style.color = 'var(--danger)';
      } else {
        outSpread.textContent = 'Same pump price';
        outSpread.style.color = 'var(--muted)';
      }
    }

    // Mathematics of Detour
    const grossSavings = (priceDiffCents * tank) / 100;
    const fuelBurnedLitres = dist * (econ / 100);
    const detourFuelCost = fuelBurnedLitres * (discTenths / 100);
    const netSavings = grossSavings - detourFuelCost;
    const e10Cap = discTenths * 0.965;
    const effectiveCents = discTenths + (detourFuelCost * 100) / tank;

    if (outEffective) {
      outEffective.textContent = `${effectiveCents.toFixed(1)} c/L eff.`;
    }
    if (outBurnLitres) {
      outBurnLitres.textContent = `${fuelBurnedLitres.toFixed(2)} L`;
    }
    if (outBreakeven) {
      if (grossSavings > 0) {
        const costPerKm = (econ / 100) * (discTenths / 100);
        const maxKm = costPerKm > 0 ? grossSavings / costPerKm : 0;
        outBreakeven.textContent = `${maxKm.toFixed(1)} km`;
      } else {
        outBreakeven.textContent = '0.0 km';
      }
    }

    outGross.textContent = grossSavings >= 0
      ? `$${grossSavings.toFixed(2)}`
      : `-$${Math.abs(grossSavings).toFixed(2)}`;
    outCost.textContent = `-$${detourFuelCost.toFixed(2)}`;
    if (outE10) {
      outE10.textContent = `${e10Cap.toFixed(1)} c/L`;
    }
    if (outNetSub) {
      outNetSub.textContent = `for a ${tank} L fill`;
    }

    // Savings retention meter
    if (meterKept && meterBurn && outBurnPct) {
      if (grossSavings <= 0) {
        meterKept.style.width = '0%';
        meterBurn.style.width = '100%';
        outBurnPct.textContent = 'No pump discount';
      } else {
        const burnRatio = Math.min(100, Math.round((detourFuelCost / grossSavings) * 100));
        const keptRatio = Math.max(0, 100 - burnRatio);
        meterKept.style.width = `${keptRatio}%`;
        meterBurn.style.width = `${burnRatio}%`;
        outBurnPct.textContent = `${burnRatio}% eaten by drive`;
      }
    }

    // Verdict banner + totem colour + net figure
    if (netSavings >= 1.0) {
      if (outVerdict && outVerdictText) {
        outVerdict.className = 'calc-verdict is-good';
        outVerdictText.textContent = 'Worth the detour';
      }
      if (totemPriceReadout) totemPriceReadout.style.color = 'var(--success)';
      outNet.textContent = `+$${netSavings.toFixed(2)}`;
      outNet.style.color = 'var(--success)';
    } else if (netSavings >= 0) {
      if (outVerdict && outVerdictText) {
        outVerdict.className = 'calc-verdict is-warn';
        outVerdictText.textContent = 'Marginal: under $1 net gain';
      }
      if (totemPriceReadout) totemPriceReadout.style.color = 'var(--accent)';
      outNet.textContent = `+$${netSavings.toFixed(2)}`;
      outNet.style.color = 'var(--accent)';
    } else {
      if (outVerdict && outVerdictText) {
        outVerdict.className = 'calc-verdict is-bad';
        outVerdictText.textContent = 'Skip: detour costs more';
      }
      if (totemPriceReadout) totemPriceReadout.style.color = 'var(--danger)';
      outNet.textContent = `-$${Math.abs(netSavings).toFixed(2)}`;
      outNet.style.color = 'var(--danger)';
    }

    updatePresetStates();
  }

  for (const btn of presetBtns) {
    btn.addEventListener('click', () => {
      sliderTank.value = btn.dataset.tank;
      sliderBase.value = btn.dataset.base;
      sliderDisc.value = btn.dataset.disc;
      sliderDist.value = btn.dataset.dist;
      sliderEcon.value = btn.dataset.econ;
      update();
    });
  }

  [sliderTank, sliderBase, sliderDisc, sliderDist, sliderEcon].forEach(slider => {
    slider.addEventListener('input', update);
  });

  update();
}

// ==========================================
// 2. Engineering Field Notes (Matthew's Working Notes)
// ==========================================
const articles = {
  'article-marksmith': {
    title: 'Why I Built My Own OpenXML Compiler Instead of Fighting Pandoc',
    category: 'OpenXML Architecture & WinUI 3',
    content: `
      <p class="lead">If you research something useful inside ChatGPT or Claude and try to drop the output into a Microsoft Word report for work or a client, the formatting immediately falls apart. Tables turn to soup, formulas turn into garbage characters, and Pandoc exports every Mermaid diagram as a blurry 96 DPI bitmap. I got sick of cleaning up broken DOCX files by hand, so I wrote my own offline compiler in C# and .NET 8.</p>

      <h3>What Actually Makes Microsoft Word Throw "File Corrupted"</h3>
      <p>People assume Word's XML parser is lenient because the UI feels forgiving. It is the exact opposite. Miss one root namespace declaration (<code>w:</code>, <code>a:</code>, <code>wp:</code>, <code>wpg:</code>, <code>m:</code>) on a generated node, or recycle a hardcoded relationship ID like <code>rId1</code> twice in the same part, and Word halts on open with the repair dialog. Every HTML-to-Word converter I tested cut corners there.</p>
      <p>In MarkSmith I throw out shortcut templating completely. Every hyperlink, image, footnote, and embedded object goes through dynamic OpenXML relationship registration (<code>MainDocumentPart.AddExternalRelationship</code> and typed part managers), and large exports stream through <code>OpenXmlWriter</code> SAX passes instead of holding giant DOM trees in RAM.</p>

      <h3>Native DrawingML Shapes Instead of Dead PNGs</h3>
      <p>The whole reason I built ShapeForge into MarkSmith is that you should never have to redraw a flowchart just to change one label inside Word. Pandoc treats Mermaid blocks as external images. MarkSmith parses the flowchart or state AST directly and emits native DrawingML vector groups (<code>&lt;wpg:wgp&gt;</code>) with real Word typography inside every box. Open the exported DOCX and you can click a single node, nudge it three millimetres left, recolour an arrow, and print it cleanly at any DPI.</p>

      <h3>Fixing Word's Fake Tabs, Callouts, and OMML Whitespace</h3>
      <p>A lot of Word's advanced structure is half-documented quirks. Word has no native tab container element, so you build interactive collapsible headings with <code>&lt;w15:collapsed w:val="true"/&gt;</code> and outline levels. Complex <code>colspan</code> / <code>rowspan</code> HTML tables need translation into native <code>&lt;w:gridSpan&gt;</code> and <code>&lt;w:vMerge&gt;</code>. And LaTeX math converted to native Office Math (<code>&lt;m:oMath&gt;</code>) silently drops spacing around operators unless every text run explicitly declares <code>xml:space="preserve"</code>.</p>
      <p>None of it needs Word installed or flaky COM interop running in the background. You drop raw Markdown in one pane, preview the result live beside it, and emit a valid ECMA-376 document in milliseconds.</p>
    `
  },
  'article-fuel': {
    title: 'FuelAhead: Why "Cheapest Servo Nearby" Is Usually a Maths Trap',
    category: 'Cloudflare D1 & Fuel Maths',
    content: `
      <p class="lead">Every fuel app in Australia shows a sorted list of cheap signs within five kilometres without answering the only question that matters when you are low on petrol: once I burn fuel driving out of my way, am I actually ahead? Usually you are not.</p>

      <h3>Staying Under FuelCheck's 2,500-Call Cap on Free Cloudflare D1</h3>
      <p>In NSW, service stations have to report price changes to government FuelCheck within twenty minutes, and ACT/Tasmania feeds work similarly. The catch is the free API quota (roughly 2,500 calls a month). Polling every ten minutes around the clock blows straight past that ceiling.</p>
      <p>So I wrote a variable cron schedule inside a Cloudflare Worker writing straight into D1 SQLite: one full baseline sync at midnight, 10-minute delta syncs only during morning (06:00–09:59) and afternoon peak hours, 30-minute checks during daytime shoulder windows, and hourly checks overnight. That lands at 72 calls a day (around 2,232 a month across 3,284 stations and 9,649 live prices) with a persistent <code>api_call_log</code> circuit breaker so an errant deploy never burns the quota. Moving the backend onto Workers + D1 meant zero always-on VM bills and fast reads close to Sydney.</p>

      <h3>Compass Cones vs "On Your Road"</h3>
      <p>My first pass filtered stations strictly inside a 90-degree compass cone ahead of your heading. Out on real Sydney roads that was still too dumb: a winding arterial bends thirty degrees right and suddenly misses the Ampol sitting directly in front of you, or includes a station three suburbs off to the side that takes twelve minutes in traffic to reach.</p>
      <p>I added a proper <strong>Road</strong> mode alongside <strong>Ahead</strong>, <strong>Wide</strong>, and <strong>Around</strong>: figure out the main highway or road corridor in the direction you are actually travelling, list what sits directly on that corridor first, and still call out off-route stations only when the net saving genuinely clears the extra kilometres driven.</p>

      <h3>E10 False Economy and Motorcycle Helmet Audio</h3>
      <p>One thing that winds me up at Australian bowsers is E10 looking two cents cheaper on the totem while holding roughly 3.5% less energy per litre than U91. FuelAhead computes the equivalent per-kilometre price right on the card so you can see immediately when "cheaper" E10 is actually a false economy compared to regular 91. I also wired up Australian-style raised tenths on every signboard number and stopped lazy "Independent" labels by matching real station names.</p>
      <p>Because I ride too, tapping a phone at lights is useless. Once coordinate-delta speed stays above 15 km/h for sixty seconds, background location wakes up in driving mode and pushes high-priority navigation alerts straight through AirPods, CarPlay, or a Cardo helmet intercom: cheapest station ahead, price, and minutes away.</p>
    `
  },
  'article-garage': {
    title: 'Running My Garage Door on Cloudflare D1 (And Catching My Own Auth Bug)',
    category: 'Edge IoT & RF Hardware',
    content: `
      <p class="lead">Running home automation on a cheap SD card inside a Raspberry Pi works right up until the card wears out while it is bucketing down rain outside the driveway. I shifted the control plane to Cloudflare Pages + D1 talking to a BroadLink RM4 Pro blasting 433MHz codes over a tiny local LAN runner.</p>

      <h3>Catching Factor 4 Missing in My Own Security Audit</h3>
      <p>I originally wrote up the keypad as a 4-factor gate: PIN, stored device UUID, single-use nonce with a 30-second expiry, and a browser hardware fingerprint hash stored in Cloudflare D1. Halfway through auditing my own repo I noticed <code>getHardwareFingerprint()</code> existed in the frontend JS, yet was never actually being attached to the API request payload. The 4-factor gate had silently been running as 3 factors.</p>
      <p>Rather than sweeping it under the rug, I wired the fingerprint cleanly into every signed HMAC request and added an explicit recovery state: if 3 out of 4 factors match (say an iOS update tweaks a browser canvas metric), the UI tells the device clearly why 1-tap trust paused instead of throwing a mystery 403, and lets them re-verify back onto 1-tap opening after entering the keypad PIN once. When deploying live schema tweaks to D1, I also migrated carefully without kicking out already-authorized family phones, and made 1-tap requests require a nickname so the admin log actually says whose phone opened the door.</p>

      <h3>Triple-Burst RF and CarPlay Siri Triggers</h3>
      <p>Garage openers and brick walls ignore a single weak 433MHz packet more often than you would like, so firing the relay does a quick triple burst with controlled spacing. And because pulling a phone out in the driveway is still too much friction, I generated a clean Apple Shortcut (<code>Open_garage_door.shortcut</code>) served straight off the web UI: import it once and <em>"Hey Siri, open garage door"</em> fires the authenticated Cloudflare endpoint hands-free straight from CarPlay.</p>
    `
  },
  'article-session0': {
    title: 'Session 0 Isolation: Where Intune Win32 Packages Go to Die',
    category: 'Enterprise Endpoint & Intune Engineering',
    content: `
      <p class="lead">If you have ever pushed a straightforward vendor installer through Microsoft Intune, watched the status sit on "Installing" for eight hours, and finally received <code>0x87D1041C</code>, welcome to Windows Session 0.</p>

      <h3>Why Installers Hang Forever Under SYSTEM</h3>
      <p>The Intune Management Extension executes Win32 packages as <code>NT AUTHORITY\\SYSTEM</code> inside Session 0 with no desktop station, no window manager interaction, and nobody coming to click "OK". If an EXE pops an unexpected EULA modal or a legacy updater prompt off-screen, the worker thread freezes until Intune hits its default timeout hours later.</p>
      <p>In <code>WingetIntune</code> and <code>UpdateCascade</code> I added process-tree watchdogs and deterministic exit-code traps so hung child trees never leave an endpoint wedged mid-cascade.</p>

      <h3>MSI Mutex 1618 and the 32-Bit WOW64 Trap</h3>
      <p>Two quieter bugs kill reliability in real tenants:</p>
      <ul>
        <li><strong>Error 1618 (<code>ERROR_INSTALL_ALREADY_RUNNING</code>):</strong> Windows serializes every MSI transaction behind the global <code>_MSIExecute</code> mutex. If Store auto-updates or Defender is holding an MSI lock in the background when your deployment starts, standard scripts bomb out. Polling <code>_MSIExecute</code> with bounded backoff eliminates random rollout failures.</li>
        <li><strong>WOW6432Node Registry Blindness:</strong> Because the Intune Management Extension historically executes detection scripts from a 32-bit host by default, querying <code>HKLM:\\Software\\Vendor</code> silently redirects to <code>WOW6432Node</code> and reports a native 64-bit install as missing (triggering infinite reinstall loops). Opening hives explicitly via <code>[Microsoft.Win32.RegistryKey]::OpenBaseKey('LocalMachine', 'Registry64')</code> puts an end to it.</li>
      </ul>
      <p>Pair that with 6MB chunked Azure Block Blob state machines (shared in <code>IntuneShared</code>) and <code>AutopilotFast</code>'s 7-stage Shift+F10 OOBE network ladder, and provisioning a box stops feeling like rolling dice.</p>
    `
  },
  'article-simd': {
    title: 'Stop Using Where-Object on Big Pipelines (344x Faster in C# SIMD)',
    category: 'PowerShell Performance & C# Tooling',
    content: `
      <p class="lead">PowerShell's pipeline reads cleanly on thirty items. Run <code>Where-Object</code> across 200,000 log lines, files, or AD objects and you watch one CPU core peg for fourteen seconds binding <code>$_</code> and invoking a scriptblock on every single record.</p>

      <h3>Dropping Scriptblock Reflection via C# SIMD</h3>
      <p>I wrote <code>FindObject</code> (<code>fob</code>) to filter objects by name and properties using explicit <code>AND</code>/<code>OR</code>/<code>NOT</code> operators directly inside a compiled C# cmdlet. Instead of running dynamic PowerShell expressions per object, it inspects target properties directly and uses .NET's hardware-accelerated <code>String.IndexOf()</code> SIMD paths.</p>
      <p>Against 200,000 process/object records where native <code>Where-Object</code> took 14.2 seconds, <code>FindObject</code> finished full scans in 2.9 seconds. Add early pipeline termination (<code>-First 10</code>) and it stops enumerating the upstream pipeline immediately after matching, dropping query wall time down to ~40 milliseconds (roughly <strong>344x faster</strong>).</p>

      <h3>Keeping Personality in Terminal Tools</h3>
      <p>Engineering utilities do not have to be sterile grey boxes. Alongside stripping milliseconds off pipeline loops and cutting OOBE bootstrap steps in <code>AutopilotCommandHub</code>, I still like hiding small ASCII western shootouts inside terminal splash screens when a tech kicks off an unattended build. If a tool works properly first, a tiny bit of character hurts nobody.</p>
    `
  },
  'article-startpage': {
    title: 'How My 1,904-Tool OSINT Start Page Got Too Busy for Daily Use',
    category: 'UI Architecture & Pragmatic Simplification',
    content: `
      <p class="lead"><code>bubbsy-start-page</code> grew into a monster: 1,904+ OSINT links, 101 category modules, Australian threat feeds, quick search aliases, and domain drop tracking all crammed onto Cloudflare Pages. It looked awesome as a trophy wall, and became borderline annoying when all I wanted at 8am was to open GitHub.</p>

      <h3>Two Modes Beat Compromise</h3>
      <p>The mistake was trying to keep every radar widget and specialty security database permanently visible at the top of the screen while keeping the page "clean". Halfway measures ruined both use cases: stripping tools out defeated the whole point of an OSINT hub, while keeping everything expanded turned opening a browser tab into scanning an aircraft cockpit.</p>
      <p>Splitting an explicit <strong>Basic / Advanced mode toggle</strong> solved it immediately. Default Basic mode leaves only a keyboard-driven command bar, clean aliases, and core daily links; flip to Advanced and all 101 OSINT modules and threat monitors unfold right where they live. Same backend, zero deleted capability, twice as fast to use every day.</p>
    `
  }
};

let lastFocusedTrigger = null;

function openReader(articleId) {
  const article = articles[articleId];
  if (!article) return;

  lastFocusedTrigger = document.activeElement;
  const modal = document.getElementById('article-reader-modal');
  const content = document.getElementById('reader-content');
  const closeBtn = modal ? modal.querySelector('.reader-close') : null;

  content.innerHTML = `
    <p class="small muted" style="color: var(--accent); font-weight: 600; margin-bottom: 8px;">${article.category}</p>
    <h2 style="font-size: var(--step-head); margin-bottom: 16px;">${article.title}</h2>
    ${article.content}
  `;

  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  if (closeBtn) closeBtn.focus();
}

function closeReader() {
  const modal = document.getElementById('article-reader-modal');
  if (modal && !modal.hasAttribute('hidden')) {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      lastFocusedTrigger.focus();
    }
  }
}

// Close reader on backdrop click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('article-reader-modal');
  if (modal && !modal.hasAttribute('hidden') && e.target === modal) {
    closeReader();
  }
});

// Escape key listener for modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeReader();
    closeLightbox();
  }
});

// ==========================================
// 3. Universal Lightbox Controller
// ==========================================
let currentShotIndex = -1;
let shotElements = [];

function getVisibleShots() {
  return Array.from(document.querySelectorAll('[data-full]')).filter(el => el.offsetParent !== null);
}

function openLightbox(fullSrc, captionText) {
  const modal = document.getElementById('shot-lightbox');
  const img = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');
  const counter = document.getElementById('lightbox-counter');

  if (!modal || !img) return;

  shotElements = getVisibleShots();
  currentShotIndex = shotElements.findIndex(el => el.getAttribute('data-full') === fullSrc);

  img.src = fullSrc;
  caption.textContent = captionText || '';
  if (counter && currentShotIndex >= 0) {
    counter.textContent = `${currentShotIndex + 1} / ${shotElements.length}`;
  }

  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const modal = document.getElementById('shot-lightbox');
  if (modal && !modal.hasAttribute('hidden')) {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }
}

function navigateLightbox(direction) {
  shotElements = getVisibleShots();
  if (!shotElements.length) return;

  currentShotIndex = (currentShotIndex + direction + shotElements.length) % shotElements.length;
  const target = shotElements[currentShotIndex];
  if (target) {
    openLightbox(target.getAttribute('data-full'), target.getAttribute('data-caption'));
  }
}

// Lightbox event delegation
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-full]');
  if (trigger) {
    e.preventDefault();
    openLightbox(trigger.getAttribute('data-full'), trigger.getAttribute('data-caption'));
    return;
  }

  if (e.target.closest('.lightbox-close') || e.target.id === 'shot-lightbox') {
    closeLightbox();
    return;
  }

  if (e.target.closest('.lightbox-prev')) {
    navigateLightbox(-1);
    return;
  }

  if (e.target.closest('.lightbox-next')) {
    navigateLightbox(1);
    return;
  }
});

// Arrow key navigation for lightbox
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('shot-lightbox');
  if (modal && !modal.hasAttribute('hidden')) {
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  }
});

// ==========================================
// 4. Clipboard Copy Buttons
// ==========================================
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;

  const text = btn.getAttribute('data-copy');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      const icon = btn.querySelector('i');
      if (icon) {
        const originalClass = icon.className;
        icon.className = 'fas fa-check';
        btn.style.color = 'var(--success)';
        setTimeout(() => {
          icon.className = originalClass;
          btn.style.color = '';
        }, 2000);
      }
    }).catch(() => {});
  }
});

// ==========================================
// 5. Scroll & Viewport Motion Layer
// ==========================================
function initMotion() {
  const reveals = Array.from(document.querySelectorAll('[data-reveal]'));

  const revealInView = () => {
    const vh = window.innerHeight || 900;
    for (const el of reveals) {
      if (el.classList.contains('is-in')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.96 && rect.bottom > 0) {
        el.classList.add('is-in');
      }
    }
  };

  revealInView();
  window.addEventListener('scroll', revealInView, { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px 40px 0px'
    });

    reveals.forEach(el => observer.observe(el));
  }
}

// ==========================================
// 6. DOM Boot
// ==========================================
function boot() {
  initCalculator();
  initMotion();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
