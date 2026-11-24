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
  'article-aus-fuel-carplay': {
    title: 'Australia\'s Broken Servo Data (Especially Victoria) & Why Fuel Apps Skip Android Auto and CarPlay',
    category: 'Open Data Policy & In-Car Engineering',
    content: `
      <p class="lead">Wiring <a href="https://fuelahead.com.au" target="_blank" rel="noopener noreferrer">fuelahead.com.au</a> across Australia exposed two absurdities in local fuel tech: eight jurisdictions running five incompatible data schemes where Victoria's public API is borderline useless beside Western Australia's 2001 design, and an industry of phone apps built strictly for drivers that still refuses to put a UI on car screens.</p>

      <div class="article-stat-strip">
        <div class="article-stat"><strong>5 Platforms</strong><span>Across 8 states &amp; territories</span></div>
        <div class="article-stat"><strong>24-Hour Lag</strong><span>Victoria's public API delay</span></div>
        <div class="article-stat"><strong>2:30 PM Daily</strong><span>WA publishes tomorrow's locked prices</span></div>
      </div>

      <h3>1. Auditing Every Australian State's Servo Data Scheme</h3>
      <p>People assume "government fuel data" means one national JSON endpoint. In reality, integrating national prices means writing separate adapters, timezone handlers, rate-limiters, and licensing gates for five completely different platforms:</p>

      <div class="article-table-wrap">
        <table class="article-table" aria-label="Comparison of Australian state and territory fuel price data feeds">
          <thead>
            <tr>
              <th>Jurisdiction</th>
              <th>Platform</th>
              <th>Developer Access</th>
              <th>Data Freshness</th>
              <th>Quirks &amp; Catch</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>WA</td>
              <td>FuelWatch RSS</td>
              <td>Open XML feed, no key</td>
              <td>Fixed 24 h from 6:00 AM; next day at 2:30 PM</td>
              <td>Must credit FuelWatch; non-commercial terms</td>
              <td><span class="state-tag-good">Open Benchmark</span></td>
            </tr>
            <tr>
              <td>NSW</td>
              <td>API.NSW FuelCheck</td>
              <td>OAuth client credentials</td>
              <td>Real time on change</td>
              <td>Only feed with <code>/prices/new</code> delta; 2,500 free calls/mo</td>
              <td><span class="state-tag-good">Live + Delta</span></td>
            </tr>
            <tr>
              <td>ACT</td>
              <td>API.NSW FuelCheck</td>
              <td>Shared NSW credentials</td>
              <td>Real time (voluntary coverage)</td>
              <td>68+ stations active; legislation still catching up</td>
              <td><span class="state-tag-warn">Partial Coverage</span></td>
            </tr>
            <tr>
              <td>TAS</td>
              <td>API.NSW FuelCheck v2</td>
              <td>Same creds (<code>?states=NSW|TAS</code>)</td>
              <td>Real time (30-min rule)</td>
              <td>Numeric IDs collide with NSW; outage flags from Apr 2026</td>
              <td><span class="state-tag-good">Live Shared Call</span></td>
            </tr>
            <tr>
              <td>QLD</td>
              <td>Informed Sources FPDAPI</td>
              <td>App form + GUID token ($1 licence)</td>
              <td>Real time (30-min rule)</td>
              <td>No delta endpoint (~1 MB state dump), max 1 call/min, audits</td>
              <td><span class="state-tag-good">Live Full State</span></td>
            </tr>
            <tr>
              <td>SA</td>
              <td>Informed Sources FPDAPI</td>
              <td>Publisher registration + GUID ($1.10)</td>
              <td>Real time (30-min rule)</td>
              <td>Clause 2.4 bans charging consumers; mandatory complaint link</td>
              <td><span class="state-tag-warn">Live (Free Only)</span></td>
            </tr>
            <tr>
              <td>NT</td>
              <td>MyFuel NT</td>
              <td>No public live developer API</td>
              <td>Monthly historical files</td>
              <td>Promised API never documented; only portal dumps published</td>
              <td><span class="state-tag-bad">Closed Live Feed</span></td>
            </tr>
            <tr>
              <td>VIC</td>
              <td>Service Victoria Fair Fuel API</td>
              <td>Apply on DataVic (Consumer ID + key)</td>
              <td><strong>~24 hours delayed</strong></td>
              <td>Live prices kept exclusively inside Service Victoria's app</td>
              <td><span class="state-tag-bad">Stale Open Feed</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>2. Why Victoria's Setup Looks Criminal Compared to WA</h3>
      <p>Victoria holds roughly 26% of Australia's motorists. In late 2025 / early 2026 it mandated real-time reporting from fuel retailers within 30 minutes of a price change and rolled out Servo Saver inside Service Victoria's own app. On paper that sounds pro-consumer, until you open the "Fair Fuel Open Data API" documentation.</p>
      <p>The Victorian Government forces stations to submit live prices using public compliance law, keeps the live feed exclusive to its own app, gates third-party developer credentials behind a manual Consumer ID application, and deliberately injects a <strong>24-hour lag</strong> into the public JSON API citing commercial sensitivity. Showing yesterday's Monash Freeway pump price inside a live routing app does not just fail to help drivers; it actively sends them to the wrong servo.</p>
      <p>Compare that directly against Western Australia. WA launched <strong>FuelWatch</strong> in 2001 with an open XML RSS feed and zero API key walls. Better yet, WA's pricing law requires stations to lock tomorrow's price by 2:00 PM each day and publishes tomorrow's locked board at 2:30 PM across ~950 outlets (24 hours from 6:00 AM the following morning, AWST). There is no intra-day guesswork: any developer can answer "fill today or tomorrow morning" with 100% certainty. Even Queensland and South Australia (outsourced through Informed Sources) hand independent publishers live 30-minute updates for a nominal dollar licence. Victoria hoarding live public data behind a 24-hour delay while WA has served next-day locked prices openly for 25 years is backwards.</p>

      <h3>3. Why Almost No Other Fuel App Ships Android Auto or CarPlay</h3>
      <p>Look closely at the major Australian fuel apps motorists rely on every week: NSW FuelCheck, Service Victoria, Petrol Spy, MotorMouth, My 7-Eleven. Virtually none of them ship native Android Auto or Apple CarPlay interfaces, even though literally 100% of their audience is behind a steering wheel or handlebars in a country where touching a phone at traffic lights costs hundreds of dollars and four or five demerit points.</p>
      <p>Three practical incentives keep every competitor on handheld phone screens:</p>
      <ul>
        <li><strong>Head units ban ads:</strong> Both Google and Apple strictly prohibit banner ads, sponsored cards, and popup overlays on car dashboards. Ad-funded fuel apps earn zero impressions inside CarPlay or Android Auto, so management never signs off on building them.</li>
        <li><strong>You cannot mirror a web wrapper onto a dash:</strong> Hybrid mobile apps that display a responsive React or Ionic screen on a phone cannot just cast that DOM to Android Auto. Google forces a dedicated native <code>CarAppService</code> checked by <code>HostValidator</code>, templated UI via <code>MapWithContentTemplate</code> (Car App API 7+) or <code>ListTemplate</code> fallback on older head units, and strict driving-distraction rules that forbid reflowing rows randomly mid-trip. In <a href="https://fuelahead.com.au" target="_blank" rel="noopener noreferrer">FuelAhead</a> I had to wire custom vector map pins directly via <code>AppManager.setSurfaceCallback()</code>, pin row slots to fixed titles (<code>Cheapest</code>, <code>2nd</code>, <code>3rd</code>...), collapse zone switching into one top button (<code>Around / Ahead / Wide / Road</code>), and gate API refreshes by real movement (300 m travelled or 35 deg turn, 8 s minimum cooldown, ignoring noisy compass bearings below 1.5 m/s).</li>
        <li><strong>Apple CarPlay entitlements and Play Store gates:</strong> Apple refuses to render a CarPlay app on any car screen unless you hold a paid Developer account, apply for and win manual review of the <strong>Fueling</strong> CarPlay entitlement, re-architect iOS scene lifecycles, and distribute through App Store/TestFlight (free-profile sideloads cannot carry that entitlement at all). On Android, shipping Android Auto plus hands-free background location triggers full Google Play manual compliance reviews and live screencast proof before testing unlocks.</li>
      </ul>

<pre><code>// FuelCarAppService + PriceMapScreen (au.com.fuelahead.app.car)
// Enforces template fallback, driving-safe fixed slots &amp; 300m / 35deg movement gating
public Screen onCreateScreen(@NonNull Intent intent) {
    return PriceMapScreen.supported(getCarContext())
        ? new PriceMapScreen(getCarContext())   // Car App API 7+ surface map + fixed ranks
        : new StationListScreen(getCarContext()); // Legacy head-unit ListTemplate fallback
}
// Rows stay pinned ("Cheapest", "2nd", "3rd"...) so moving lists never fail Auto limits</code></pre>

      <div class="article-figure-grid">
        <figure class="article-figure" data-full="media/fuelahead-android-auto-night.png" data-caption="FuelAhead Android Auto Night Mode: live raised-tenth price pins rendered directly via native SurfaceCallback templates ($1.899-$2.127/L)">
          <img src="media/fuelahead-android-auto-night.png" alt="FuelAhead Android Auto night-mode car dashboard map displaying live U91 fuel price pins" loading="lazy">
          <figcaption>
            <span>Android Auto Night Dash (<code>isDarkMode()</code>)</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
        <figure class="article-figure" data-full="media/fuelahead-android-auto-day.png" data-caption="FuelAhead Android Auto Day Mode: automatic head-unit theme switching with raised tenths along Enmore Road and Parramatta Road">
          <img src="media/fuelahead-android-auto-day.png" alt="FuelAhead Android Auto day-mode car dashboard map showing live fuel price pins" loading="lazy">
          <figcaption>
            <span>Android Auto Day Dash (Surface Renderer)</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
      </div>

      <div class="article-cta-row">
        <a href="https://fuelahead.com.au" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Launch fuelahead.com.au</a>
        <a href="https://fuelahead.com.au/android" target="_blank" rel="noopener noreferrer" class="btn btn-surface btn-sm">Download Android APK</a>
      </div>
    `
  },
  'article-d1-queryplan': {
    title: 'Cutting Cloudflare D1 Reads 100x with EXPLAIN QUERY PLAN and CROSS JOIN',
    category: 'SQLite Internals & Edge Scaling',
    content: `
      <p class="lead">Expanding <a href="https://fuelahead.com.au" target="_blank" rel="noopener noreferrer">fuelahead.com.au</a> from three eastern fuel feeds to six Australian states pushed my Cloudflare D1 database to 7,133 stations and 23,194 live prices, and immediately slammed into 98.7% of D1's daily 5 million <code>rows_read</code> quota. One <code>EXPLAIN QUERY PLAN</code> call showed why.</p>

      <div class="article-stat-strip">
        <div class="article-stat"><strong>7,133</strong><span>Stations across 6 feeds</span></div>
        <div class="article-stat"><strong>50x-100x</strong><span>Lower D1 rows_read per map pan</span></div>
        <div class="article-stat"><strong>107,090</strong><span>Historical price rows tracked</span></div>
      </div>

      <figure class="article-figure" data-full="media/fuelahead-live-web.png" data-caption="fuelahead.com.au live desktop viewport: resolved Parramatta NSW fuel prices, net savings after driving cost, and 7-day Fill-or-Wait probability">
        <img src="media/fuelahead-live-web.png" alt="Live FuelAhead desktop view showing resolved station markers and Fill-or-Wait card" loading="lazy">
        <figcaption>
          <span>Live multi-state map &amp; Fill-or-Wait engine at fuelahead.com.au (Click to zoom)</span>
          <span class="article-figure-zoom">Inspect Screen &rarr;</span>
        </figcaption>
      </figure>

      <h3>Why SQLite Ignored My Spatial Grid Index</h3>
      <p>The bug hid cleanly under smaller datasets. In <code>pricesMap.js</code> and <code>fillTiming.js</code>, joining <code>stations</code> and <code>fuel_prices</code> with a standard <code>JOIN</code> handed the SQLite planner freedom to pick the driving table. Because the query filtered by <code>fuel_type</code> and price order, SQLite chose <code>idx_fuel_prices_type_price</code> first and scanned roughly 5,500 nationwide price rows on every viewport pan instead of starting from the spatial bounding box <code>idx_stations_cell</code>.</p>
      <p>Switching the map and sector queries to explicit <code>CROSS JOIN fuel_prices p</code> locks join order from <code>stations</code> out, dropping rows scanned per pan by 50x to 100x and removing the temporary B-tree sort for <code>GROUP BY 1</code> in <code>loadCellPrices</code>. I also added an automated <code>EXPLAIN QUERY PLAN</code> assertion in the test suite so future query tweaks fail CI before ever shipping another full-table scan.</p>

<pre><code>-- Force SQLite planner to drive from spatial grid index first
SELECT s.station_id, s.brand, s.lat, s.lng, p.price
FROM stations s
CROSS JOIN fuel_prices p
  ON p.station_id = s.station_id
WHERE s.cell_id IN (/* 9-cell viewport fan */)
  AND p.fuel_type = ?1;</code></pre>

      <h3>Two-Tier Summary Caching &amp; Chunking 1 MiB Blobs Past SQLITE_TOOBIG</h3>
      <p>Viewport queries were only half the read burn. Statewide scorecard aggregations still touched the full price table too often. Layering a dataset-version-keyed isolate snapshot cache with Cloudflare's <code>caches.default</code> edge cache (<code>max-age=600</code>) cut redundant cold scans between scheduled crons.</p>
      <p>Consolidating databases and wiring custom domains (<code>fuelahead.com.au</code> and <code>api.fuelahead.com.au</code>) turned up one more edge constraint: Cloudflare D1 rejects SQL statements above 100 KB (<code>SQLITE_TOOBIG</code>), which breaks importing raw 1 MiB hex timeline snapshots from standard SQL dumps. Reassembling each timeline incrementally via chunked <code>UPDATE ... SET data = unhex(hex(data) || ?)</code> passes moved every byte cleanly, while a stateless zero-D1 reverse proxy kept older mobile builds working during domain cutover.</p>

      <div class="article-cta-row">
        <a href="https://fuelahead.com.au" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Launch fuelahead.com.au</a>
        <a href="https://fuelahead.com.au/android" target="_blank" rel="noopener noreferrer" class="btn btn-surface btn-sm">Download Android APK</a>
      </div>
    `
  },
  'article-table-ast': {
    title: 'Breaking CommonMark\'s Inline-Only Table Ceiling in Native Word OOXML',
    category: 'AST Compilers & Visual Regression',
    content: `
      <p class="lead">Auditing my own showcase screenshots caught an embarrassing bug: the MarkSmith Gauntlet comparison table promised GitHub-style alerts and nested lists inside table cells while actually printing escaped <code>&gt; [!WARNING]</code> plain text right next to the claim.</p>

      <div class="article-stat-strip">
        <div class="article-stat"><strong>4.1 MB &rarr; 145 KB</strong><span>Vector PDF shrinkage</span></div>
        <div class="article-stat"><strong>2,445 Tests</strong><span>Full regression suite passing</span></div>
        <div class="article-stat"><strong>10+ OMML Fixes</strong><span>Unbraced math atoms &amp; symbols</span></div>
      </div>

      <h3>Fixing the Parser Instead of Hiding the Row</h3>
      <p>Standard CommonMark and GFM restrict pipe-table cells to inline tokens only. Worse, walking table cells naively with <code>GetCellText</code> silently drops <code>&lt;br&gt;</code> tags (parsed by Markdig as <code>HtmlInline</code>) alongside code spans and emphasis delimiters. Multi-line alerts and lists inside cells collapse into flat strings.</p>
      <p>Instead of lowering the claim in the README, I updated both pipelines (the WebView live preview and the native OpenXML <code>&lt;w:tc&gt;</code> generator) to reconstruct faithful block Markdown inside qualifying table cells. A cell carrying <code>&lt;br&gt;</code>-joined bullets or blockquote alert markers parses recursively into real nested lists and styled Word callout tables, while raw backtick syntax columns stay strictly unpromoted so documentation examples never self-trigger. I also stripped duplicate CSS/SVG icons that previously survived NoEmoji stripping.</p>

<pre><code>// Reconstruct cell blocks without losing HtmlInline &lt;br&gt; breaks
// Only promote block-structured cells outside literal code spans
if (!IsLiteralCodeSpanCell(cell) &amp;&amp; TryReconstructCellMarkdown(cell, out var blockMd))
{
    CompileNestedTableCellBlocks(wordCell, blockMd, styleContext);
}</code></pre>

      <div class="article-figure-grid">
        <figure class="article-figure" data-full="media/marksmith-feature-tables.png" data-caption="Native block recovery inside Markdown pipe-table cells: inline LaTeX math, monospace code, nested lists, Warning and Tip alert blocks">
          <img src="media/marksmith-feature-tables.png" alt="MarkSmith rendered table showing inline math, nested lists, Warning and Tip alert blocks inside cells" loading="lazy">
          <figcaption>
            <span>Table-cell block recovery (HTML &amp; DOCX)</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
        <figure class="article-figure" data-full="media/word-gauntlet.png" data-caption="OpenXML Gauntlet stress document rendered inside Microsoft Word with matrix equations, syntax-highlighted code captions, and native tables">
          <img src="media/word-gauntlet.png" alt="MarkSmith OpenXML Gauntlet compiled and opened inside Microsoft Word" loading="lazy">
          <figcaption>
            <span>Verified in Microsoft Word (Gauntlet XML)</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
      </div>

      <h3>Unbraced OMML Atoms, <code>\top</code> Symbols, and Parallel Column Regex Traps</h3>
      <p>Regenerating every example document against live Microsoft Word surfaces the bugs synthetic unit tests miss. Two math bugs stood out immediately: <code>\top</code> was missing from the LaTeX-to-OMML symbol map (printing literal text on every transpose superscript), and unbraced atoms such as <code>\boldsymbol\mu</code> fell through verbatim because the parser expected braces. Adding atom-level lookahead alongside <code>\mathbf</code>, <code>\mathbb</code>, and missing operators turned formulas into clean native Word equations.</p>
      <p>I also caught two pipeline traps during the same audit: the standalone CLI previously bypassed AI chat normalization (leaving raw citation markers behind) and skipped OMML conversion, and the <code>:::parallel</code> container regex's leading <code>\s*</code> greedily matched newlines into empty columns. Routing normalization consistently and validating rendered <code>gauntlet_document.xml</code> snapshots locked both preview and exported DOCX together, shrinking vector PDF output from 4.1 MB down to 145 KB.</p>

      <figure class="article-figure" data-full="media/marksmith-feature-math.png" data-caption="Complex multiline Schrödinger operators, 3x3 Hamiltonian matrices, partition function limits, and mhchem chemical equilibrium equations compiled to native OMML">
        <img src="media/marksmith-feature-math.png" alt="MarkSmith rendered LaTeX matrices, integrals, and chemical equations" loading="lazy">
        <figcaption>
          <span>Native OMML matrices, limits, and mhchem equations without fallback bitmaps</span>
          <span class="article-figure-zoom">Inspect Screen &rarr;</span>
        </figcaption>
      </figure>

      <div class="article-cta-row">
        <a href="marksmith.html" class="btn btn-primary btn-sm">Open MarkSmith Deep Dive</a>
        <a href="https://github.com/thebubbsy/marksmith" target="_blank" rel="noopener noreferrer" class="btn btn-surface btn-sm">View MarkSmith on GitHub</a>
      </div>
    `
  },
  'article-oobe-runspace': {
    title: 'Zero-Freeze WPF in PowerShell OOBE: Lock-Free RunspacePools & Hybrid Telemetry',
    category: 'Windows Internals & WPF Concurrency',
    content: `
      <p class="lead">Running a single-file Fluent WPF provisioning hub straight from <code>irm https://onyachamp.com/autopilot | iex</code> at a fresh Windows OOBE prompt looks instant until you trigger a Windows Update COM search, WMI hash harvest, and TLS endpoint check on the Single-Threaded Apartment UI thread and watch Windows mark the window Not Responding.</p>

      <div class="article-stat-strip">
        <div class="article-stat"><strong>30 ms</strong><span>DispatcherTimer queue drain tick</span></div>
        <div class="article-stat"><strong>7 Stages</strong><span>Pre-flight OOBE network ladder</span></div>
        <div class="article-stat"><strong>1-Line</strong><span>Shift+F10 OOBE bootstrap</span></div>
      </div>

      <figure class="article-figure" data-full="media/autopilot-hub-preflight.png" data-caption="AutopilotCommandHub 7-stage enterprise preflight diagnostic ladder running asynchronously off the WPF UI thread">
        <img src="media/autopilot-hub-preflight.png" alt="Autopilot Provisioning Hub Pre-Flight Diagnostics tab running 7-stage checks" loading="lazy">
        <figcaption>
          <span>7-Stage Pre-Flight Diagnostic Ladder: non-blocking async telemetry during live checks</span>
          <span class="article-figure-zoom">Inspect Screen &rarr;</span>
        </figcaption>
      </figure>

      <h3>Why PowerShell WPF Deadlocks on COM &amp; How RunspacePools Fix It</h3>
      <p>Background jobs in PowerShell spawn heavy child processes, while raw runspaces writing directly to WPF controls crash immediately with cross-thread ownership exceptions. The clean pattern inside a zero-dependency standalone script uses a bounded <code>[runspacefactory]::CreateRunspacePool(1, [Math]::Max(4, [Environment]::ProcessorCount))</code> for blocking WMI, Windows Update COM searches, Dell warranty HTTP requests, and storage SMART probes, paired with a lock-free <code>System.Collections.Concurrent.ConcurrentQueue</code>.</p>
      <p>Worker runspaces only ever push plain hashtables (stage status, structured log lines, percentage progress) into the queue. A single lightweight 30ms WPF <code>DispatcherTimer</code> drains that queue on the STA thread, keeping mouse movement, tab switches, and log scrolling completely fluid even when Windows Update COM searches stall for 90 seconds.</p>

<pre><code>$pool = [runspacefactory]::CreateRunspacePool(1, [Math]::Max(4, [Environment]::ProcessorCount))
$pool.Open()
$uiQueue = [System.Collections.Concurrent.ConcurrentQueue[hashtable]]::new()

# Worker pushes plain state only; 30ms DispatcherTimer drains on STA UI thread
$timer = New-Object System.Windows.Threading.DispatcherTimer
$timer.Interval = [TimeSpan]::FromMilliseconds(30)
$timer.Add_Tick({
    $msg = $null
    while ($uiQueue.TryDequeue([ref]$msg)) { Apply-HubUiUpdate $msg }
})</code></pre>

      <div class="article-figure-grid">
        <figure class="article-figure" data-full="media/autopilot-hub-hybrid.png" data-caption="Unified Hybrid & Co-Management telemetry combining dsregcmd state, PRT presence, MDM enrollment, and Conditional Access blockers">
          <img src="media/autopilot-hub-hybrid.png" alt="AutopilotCommandHub Hybrid Join and Co-Management diagnostic tab" loading="lazy">
          <figcaption>
            <span>Unified Entra Join, PRT &amp; CA blocker evaluator</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
        <figure class="article-figure" data-full="media/autopilot-hub-skip-oobe.png" data-caption="Skip Autopilot in OOBE panel with exact NIC tracking so only adapters disabled by bypass get re-enabled">
          <img src="media/autopilot-hub-skip-oobe.png" alt="AutopilotCommandHub Skip Autopilot in OOBE workflow with tracked NIC recovery" loading="lazy">
          <figcaption>
            <span>Tracked NIC recovery &amp; instant state banner refresh</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
      </div>

      <h3>Fixing OOBE State-Machine Edge Cases Instead of Hiding Them</h3>
      <p>Real field testing caught four subtle state-machine bugs that make a big difference on technician benches. First, <code>Enable-HubNetworkAdapters</code> originally re-enabled every disabled physical NIC on the chassis instead of tracking only the adapters suspended by <code>Invoke-AutopilotBypass</code> in <code>$script:BypassDisabledAdapters</code>. Second, running Skip Autopilot left the header banner stale ("Autopilot registered") until a manual refresh instead of immediately invoking <code>Get-DeviceEnrollmentState</code> and updating the UI.</p>
      <p>Third, three overlapping <code>dsregcmd /status</code> and MDM parsers disagreed on edge states, so I unified them into a single evaluator feeding both registration checks and Hybrid/Co-Management Conditional Access readiness. Every provisioning state, PRT flag, and adapter transition comes from one source of truth.</p>

      <div class="article-cta-row">
        <a href="cli-tour.html" class="btn btn-primary btn-sm">Open CLI Pipeline Tour</a>
        <a href="https://github.com/thebubbsy/AutopilotCommandHub" target="_blank" rel="noopener noreferrer" class="btn btn-surface btn-sm">View AutopilotCommandHub</a>
      </div>
    `
  },
  'article-marksmith': {
    title: 'Why I Built My Own OpenXML Compiler Instead of Fighting Pandoc',
    category: 'OpenXML Architecture & WinUI 3',
    content: `
      <p class="lead">If you compile structured technical reports and try to drop them into Microsoft Word for work or a client, standard pipelines immediately fall apart. Tables turn to soup, formulas turn into garbage characters, and Pandoc exports every Mermaid diagram as a blurry 96 DPI bitmap. I got sick of cleaning up broken DOCX files by hand, so I wrote my own offline compiler in C# and .NET 8.</p>

      <figure class="article-figure" data-full="media/marksmith-word-comparison.png" data-caption="Side-by-side comparison inside Word: Pandoc rasterized diagram versus MarkSmith native editable DrawingML vectors">
        <img src="media/marksmith-word-comparison.png" alt="Pandoc raster output versus MarkSmith DrawingML vector shapes" loading="lazy">
        <figcaption>
          <span>Pandoc bitmap output vs MarkSmith native DrawingML vector shapes</span>
          <span class="article-figure-zoom">Inspect Screen &rarr;</span>
        </figcaption>
      </figure>

      <h3>What Actually Makes Microsoft Word Throw "File Corrupted"</h3>
      <p>People assume Word's XML parser is lenient because the UI feels forgiving. It is the exact opposite. Miss one root namespace declaration (<code>w:</code>, <code>a:</code>, <code>wp:</code>, <code>wpg:</code>, <code>m:</code>) on a generated node, or recycle a hardcoded relationship ID like <code>rId1</code> twice in the same part, and Word halts on open with the repair dialog. Every HTML-to-Word converter I tested cut corners there.</p>
      <p>In MarkSmith I throw out shortcut templating completely. Every hyperlink, image, footnote, and embedded object goes through dynamic OpenXML relationship registration (<code>MainDocumentPart.AddExternalRelationship</code> and typed part managers), and large exports stream through <code>OpenXmlWriter</code> SAX passes instead of holding giant DOM trees in RAM.</p>

      <h3>Native DrawingML Shapes Instead of Dead PNGs</h3>
      <p>The whole reason I built ShapeForge into MarkSmith is that you should never have to redraw a flowchart just to change one label inside Word. Pandoc treats Mermaid blocks as external images. MarkSmith parses the flowchart or state AST directly and emits native DrawingML vector groups (<code>&lt;wpg:wgp&gt;</code>) with real Word typography inside every box. Open the exported DOCX and you can click a single node, nudge it three millimetres left, recolour an arrow, and print it cleanly at any DPI.</p>

      <figure class="article-figure" data-full="media/marksmith-mermaid-network.png" data-caption="Mermaid network topology compiled into selectable, editable Word DrawingML shapes and connectors">
        <img src="media/marksmith-mermaid-network.png" alt="Network topology Mermaid diagram rendered as native editable Word DrawingML objects" loading="lazy">
        <figcaption>
          <span>Compiled Mermaid topology opened directly inside Microsoft Word</span>
          <span class="article-figure-zoom">Inspect Screen &rarr;</span>
        </figcaption>
      </figure>

      <h3>Fixing Word's Fake Tabs, Callouts, and OMML Whitespace</h3>
      <p>A lot of Word's advanced structure comes down to half-documented quirks. Word has no native tab container element, so you build interactive collapsible headings with <code>&lt;w15:collapsed w:val="true"/&gt;</code> and outline levels. Complex <code>colspan</code> / <code>rowspan</code> HTML tables need translation into native <code>&lt;w:gridSpan&gt;</code> and <code>&lt;w:vMerge&gt;</code>. And LaTeX math converted to native Office Math (<code>&lt;m:oMath&gt;</code>) silently drops spacing around operators unless every text run explicitly declares <code>xml:space="preserve"</code>.</p>
      <p>None of it needs Word installed or flaky COM interop running in the background. You drop raw Markdown in one pane, preview the result live beside it, and emit a valid ECMA-376 document in milliseconds.</p>

      <div class="article-cta-row">
        <a href="marksmith.html" class="btn btn-primary btn-sm">Open MarkSmith Deep Dive</a>
        <a href="https://github.com/thebubbsy/marksmith" target="_blank" rel="noopener noreferrer" class="btn btn-surface btn-sm">View MarkSmith on GitHub</a>
      </div>
    `
  },
  'article-fuel': {
    title: 'FuelAhead: Why "Cheapest Servo Nearby" Is Usually a Maths Trap',
    category: 'Cloudflare D1 & Fuel Maths',
    content: `
      <p class="lead">Every fuel app in Australia shows a sorted list of cheap signs within five kilometres without answering the only question that matters when you are low on petrol: once I burn fuel driving out of my way, am I actually ahead? Usually you are not.</p>

      <div class="article-figure-grid">
        <figure class="article-figure" data-full="media/fuelahead-phone-value.png" data-caption="FuelAhead mobile card flagging E10 false economy against U91 and deducting real driving fuel cost from gross tank savings">
          <img src="media/fuelahead-phone-value.png" alt="FuelAhead mobile UI showing U91 value and E10 false economy comparison" loading="lazy">
          <figcaption>
            <span>E10 false economy &amp; net pocket maths</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
        <figure class="article-figure" data-full="media/fuelahead-phone-route.png" data-caption="Corridor route radar along the highway keeping stops strictly ahead of your route instead of behind">
          <img src="media/fuelahead-phone-route.png" alt="FuelAhead route corridor view showing stops ahead" loading="lazy">
          <figcaption>
            <span>Corridor route radar along the M1</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
      </div>

      <h3>Variable Polling Across Six States Without Blowing API Caps</h3>
      <p>Across NSW, ACT, Tasmania, QLD, SA, and WA FuelWatch, update cadences vary and upstream API quotas reward smart polling instead of brute-force 24/7 loops. In NSW, service stations report price changes within twenty minutes while the free tier caps roughly 2,500 calls a month.</p>
      <p>I wrote a variable cron schedule inside a Cloudflare Worker writing into D1 SQLite: one baseline sync at midnight, 10-minute delta syncs during morning (06:00-09:59) and afternoon peak hours, 30-minute checks during shoulder windows, and hourly checks overnight. Combined with a persistent <code>api_call_log</code> circuit breaker and Oceania edge D1 replicas running 7,100+ stations, the backend stays fast around Australia with zero always-on VM overhead.</p>

      <h3>Compass Cones vs "On Your Road"</h3>
      <p>My first pass filtered stations strictly inside a 90-degree compass cone ahead of your heading. Out on real Sydney roads that was still too literal: a winding arterial bends thirty degrees right and misses the Ampol sitting directly in front of you, or catches a station three suburbs off to the side that takes twelve minutes in traffic to reach.</p>
      <p>Adding a proper <strong>Road</strong> corridor mode alongside <strong>Ahead</strong>, <strong>Wide</strong>, and <strong>Around</strong> solved it cleanly: lock onto the highway or main road you are actually riding on, surface stations directly on that path first, and call out off-route stops only when net cash savings clear the extra driving burn.</p>

      <h3>E10 False Economy and Motorcycle Helmet Audio</h3>
      <p>One thing that winds me up at Australian bowsers is E10 looking two cents cheaper on the totem while holding roughly 3.5% less energy per litre than U91. <a href="https://fuelahead.com.au" target="_blank" rel="noopener noreferrer">FuelAhead</a> computes equivalent per-kilometre pricing right on the card so you spot false-economy E10 straight away, renders authentic Australian raised tenths on signboard numbers, and matches real station names instead of lazy "Independent" labels.</p>
      <p>Because I ride too, tapping a screen at traffic lights is useless. Past 15 km/h for sixty seconds, background driving mode wakes up and pushes concise voice alerts straight into AirPods, CarPlay, or a Cardo helmet intercom.</p>

      <div class="article-cta-row">
        <a href="https://fuelahead.com.au" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Launch fuelahead.com.au</a>
        <a href="https://fuelahead.com.au/android" target="_blank" rel="noopener noreferrer" class="btn btn-surface btn-sm">Android APK Download</a>
      </div>
    `
  },
  'article-garage': {
    title: 'Running My Garage Door on Cloudflare D1 (And Catching My Own Auth Bug)',
    category: 'Edge IoT & RF Hardware',
    content: `
      <p class="lead">Running home automation on a cheap SD card inside a Raspberry Pi works right up until the card wears out while it is bucketing down rain outside the driveway. I shifted the control plane to Cloudflare Pages + D1 talking to a BroadLink RM4 Pro blasting 433MHz codes over a tiny local LAN runner.</p>

      <div class="article-figure-grid">
        <figure class="article-figure" data-full="media/garage-keypad.png" data-caption="BroadLink Garage Controller mobile PWA keypad with 4-factor verification and 1-tap trust status">
          <img src="media/garage-keypad.png" alt="Smart Garage Controller mobile keypad interface" loading="lazy">
          <figcaption>
            <span>4-factor mobile keypad PWA</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
        <figure class="article-figure" data-full="media/garage-stats.png" data-caption="Cloudflare D1 trigger analytics with live cursor-paginated feed, hourly usage distribution, and Siri Shortcut breakdown">
          <img src="media/garage-stats.png" alt="Smart Garage Controller Cloudflare D1 analytics drawer" loading="lazy">
          <figcaption>
            <span>D1 analytics &amp; keyset activity feed</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
      </div>

      <h3>Catching Factor 4 Missing in My Own Security Audit</h3>
      <p>I originally wrote up the keypad as a 4-factor gate: PIN, stored device UUID, single-use nonce with a 30-second expiry, and a browser hardware fingerprint hash stored in Cloudflare D1. Halfway through auditing my own repo I noticed <code>getHardwareFingerprint()</code> existed in the frontend JS, yet was never actually being attached to the API request payload. The 4-factor gate had silently been running as 3 factors.</p>
      <p>Rather than sweeping it under the rug, I wired the fingerprint cleanly into every signed HMAC request and added an explicit recovery state: if 3 out of 4 factors match (say an iOS update tweaks a browser canvas metric), the UI tells the device clearly why 1-tap trust paused instead of throwing a mystery 403, and lets them re-verify back onto 1-tap opening after entering the keypad PIN once. When deploying live schema tweaks to D1, I also migrated without invalidating authorized family phones, and enforced device nicknames so the log shows whose phone opened the door.</p>

      <h3>Keyset Pagination, Siri Dominance, and Non-Blocking Webhooks</h3>
      <p>Looking at real production D1 telemetry changed what I prioritized next: out of 680 real opens, 627 (92.2%) came from Siri triggers while driving home, yet the old dashboard never even broke out Siri usage and capped activity at 5 rows. Upgrading the activity stream to <code>before_id</code> / <code>after_id</code> keyset cursor pagination eliminated duplicate-row drift during 4-second live delta polling, while per-person webhooks fire asynchronously via Cloudflare's <code>waitUntil()</code> with SSRF host validation so a slow notification endpoint never delays the physical relay.</p>

      <h3>Triple-Burst RF and CarPlay Siri Triggers</h3>
      <p>Garage openers and brick walls ignore a single weak 433MHz packet more often than you would like, so firing the relay does a quick triple burst with controlled spacing. And because pulling a phone out in the driveway is still too much friction, serving a downloadable Apple Shortcut (<code>Open_garage_door.shortcut</code>) lets family phones import hands-free CarPlay triggering in thirty seconds.</p>

      <div class="article-cta-row">
        <a href="garage-controller.html" class="btn btn-primary btn-sm">Open Garage Architecture</a>
        <a href="https://github.com/thebubbsy/broadlink-garage-controller" target="_blank" rel="noopener noreferrer" class="btn btn-surface btn-sm">View GitHub Repository</a>
      </div>
    `
  },
  'article-session0': {
    title: 'Session 0 Isolation: Where Intune Win32 Packages Go to Die',
    category: 'Enterprise Endpoint & Intune Engineering',
    content: `
      <p class="lead">If you have ever pushed a straightforward vendor installer through Microsoft Intune, watched the status sit on "Installing" for eight hours, and finally received <code>0x87D1041C</code>, welcome to Windows Session 0.</p>

      <div class="article-figure-grid">
        <figure class="article-figure" data-full="media/wingetintune-pipeline.png" data-caption="WingetIntune Win32 packaging pipeline with typed adapters, MSI mutex guards, and chunked Azure Block Blob uploads">
          <img src="media/wingetintune-pipeline.png" alt="WingetIntune automated Win32 packaging and Graph publishing flow" loading="lazy">
          <figcaption>
            <span>WingetIntune Graph packaging pipeline</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
        <figure class="article-figure" data-full="media/autopilotfast-oobe.png" data-caption="AutopilotFast Shift+F10 OOBE hardware hash harvester with ASCII QR device-code auth and Graph sync verification">
          <img src="media/autopilotfast-oobe.png" alt="AutopilotFast Shift+F10 OOBE terminal harvester" loading="lazy">
          <figcaption>
            <span>AutopilotFast OOBE hash harvester</span>
            <span class="article-figure-zoom">Enlarge &rarr;</span>
          </figcaption>
        </figure>
      </div>

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

      <div class="article-cta-row">
        <a href="cli-tour.html" class="btn btn-primary btn-sm">Open CLI Pipeline Tour</a>
        <a href="https://github.com/thebubbsy/WingetIntune" target="_blank" rel="noopener noreferrer" class="btn btn-surface btn-sm">View WingetIntune on GitHub</a>
      </div>
    `
  },
  'article-simd': {
    title: 'Stop Using Where-Object on Big Pipelines (344x Faster in C# SIMD)',
    category: 'PowerShell Performance & C# Tooling',
    content: `
      <p class="lead">PowerShell's pipeline reads cleanly on thirty items. Run <code>Where-Object</code> across 200,000 log lines, files, or AD objects and you watch one CPU core peg for fourteen seconds binding <code>$_</code> and invoking a scriptblock on every single record.</p>

      <figure class="article-figure" data-full="media/findobject-benchmark.png" data-caption="FindObject AVX2 SIMD filter benchmark vs native PowerShell Where-Object across 200k records">
        <img src="media/findobject-benchmark.png" alt="FindObject SIMD throughput benchmark comparison chart" loading="lazy">
        <figcaption>
          <span>200,000-record throughput benchmark: Where-Object vs FindObject SIMD early exit</span>
          <span class="article-figure-zoom">Inspect Screen &rarr;</span>
        </figcaption>
      </figure>

      <h3>Dropping Scriptblock Reflection via C# SIMD</h3>
      <p>I wrote <code>FindObject</code> (<code>fob</code>) to filter objects by name and properties using explicit <code>AND</code>/<code>OR</code>/<code>NOT</code> operators directly inside a compiled C# cmdlet. Instead of running dynamic PowerShell expressions per object, it inspects target properties directly and uses .NET's hardware-accelerated <code>String.IndexOf()</code> SIMD paths.</p>
      <p>Against 200,000 process/object records where native <code>Where-Object</code> took 14.2 seconds, <code>FindObject</code> finished full scans in 2.9 seconds. Add early pipeline termination (<code>-First 10</code>) and it stops enumerating the upstream pipeline immediately after matching, dropping query wall time down to ~40 milliseconds (roughly <strong>344x faster</strong>).</p>

      <h3>Keeping Personality in Terminal Tools</h3>
      <p>Engineering utilities do not have to be sterile grey boxes. Alongside stripping milliseconds off pipeline loops and cutting OOBE bootstrap steps in <code>AutopilotCommandHub</code>, I still like hiding small ASCII western shootouts inside terminal splash screens when a tech kicks off an unattended build. If a tool works properly first, a tiny bit of character hurts nobody.</p>

      <div class="article-cta-row">
        <a href="cli-tour.html" class="btn btn-primary btn-sm">Open CLI Pipeline Tour</a>
        <a href="https://github.com/thebubbsy/FindObject" target="_blank" rel="noopener noreferrer" class="btn btn-surface btn-sm">View FindObject on GitHub</a>
      </div>
    `
  },
  'article-startpage': {
    title: 'How My 1,904-Tool OSINT Start Page Got Too Busy for Daily Use',
    category: 'UI Architecture & Pragmatic Simplification',
    content: `
      <p class="lead"><code>bubbsy-start-page</code> grew into a monster: 1,904+ OSINT links, 101 category modules, Australian threat feeds, quick search aliases, and domain drop tracking all crammed onto Cloudflare Pages. It looked awesome as a trophy wall, and became borderline annoying when all I wanted at 8am was to open GitHub.</p>

      <h3>Two Modes Beat Compromise</h3>
      <p>The mistake was trying to keep every radar widget and specialty security database permanently visible at the top of the screen while keeping the page clean. Halfway measures ruined both use cases: stripping tools out defeated the whole point of an OSINT hub, while keeping everything expanded turned opening a browser tab into scanning an aircraft cockpit.</p>
      <p>Splitting an explicit <strong>Basic / Advanced mode toggle</strong> solved it immediately. Default Basic mode leaves only a keyboard-driven command bar, clean aliases, and core daily links; flip to Advanced and all 101 OSINT modules and threat monitors unfold right where they live. Same backend, zero deleted capability, twice as fast to use every day.</p>

      <div class="article-cta-row">
        <a href="https://github.com/thebubbsy/bubbsy-start-page" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">View bubbsy-start-page</a>
      </div>
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

// Escape key listener for modals (close topmost lightbox first)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const lightbox = document.getElementById('shot-lightbox');
    if (lightbox && !lightbox.hasAttribute('hidden')) {
      closeLightbox();
    } else {
      closeReader();
    }
  }
});

// ==========================================
// 3. Universal Lightbox Controller
// ==========================================
let currentShotIndex = -1;
let shotElements = [];
let lightboxScope = 'page';

function getVisibleShots(scope = lightboxScope) {
  if (scope === 'reader') {
    return Array.from(document.querySelectorAll('#article-reader-modal [data-full]')).filter(el => el.offsetParent !== null);
  }
  return Array.from(document.querySelectorAll('main [data-full]')).filter(el => el.offsetParent !== null);
}

function openLightbox(fullSrc, captionText, scope = 'page') {
  const modal = document.getElementById('shot-lightbox');
  const img = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');
  const counter = document.getElementById('lightbox-counter');

  if (!modal || !img) return;

  lightboxScope = scope;
  shotElements = getVisibleShots(scope);
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
    const reader = document.getElementById('article-reader-modal');
    if (!reader || reader.hasAttribute('hidden')) {
      document.body.style.overflow = '';
    }
  }
}

function navigateLightbox(direction) {
  shotElements = getVisibleShots(lightboxScope);
  if (!shotElements.length) return;

  currentShotIndex = (currentShotIndex + direction + shotElements.length) % shotElements.length;
  const target = shotElements[currentShotIndex];
  if (target) {
    openLightbox(target.getAttribute('data-full'), target.getAttribute('data-caption'), lightboxScope);
  }
}

// Lightbox event delegation
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-full]');
  if (trigger) {
    e.preventDefault();
    const inReader = Boolean(trigger.closest('#article-reader-modal'));
    openLightbox(trigger.getAttribute('data-full'), trigger.getAttribute('data-caption'), inReader ? 'reader' : 'page');
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
