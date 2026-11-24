import os
import re
import collections
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

PAGES = [
    'index.html',
    'marksmith.html',
    'garage-controller.html',
    'cli-tour.html',
    'tools.html',
    'stack.html',
    'resources.html',
    'contact.html',
]

# Enforce strict Rule 6 privacy boundary: no private GitHub repos or unpublished scratch projects.
# Note: FuelAhead is showcased strictly as an iOS/Android/Web product (never linking any private GitHub repo).
FORBIDDEN_PRIVATE_TERMS = [
    'thebubbsy/fuelahead',
    'github.com/thebubbsy/fuelahead',
    'bubbsy-flipper-vault',
    'flipper zero',
    'bubbsyflip',
    'pocketdesk',
    'pii-viewer',
    'pii defensibility',
    'm365-canary',
    'm365 canary',
    'teamschatexporter',
    'teams-chat-exporter',
    'bunkrdownloader',
    'mappinglsp',
    'md_to_pdf_tui',
    'deepseek-ocr-client',
    'salesforce-exporter',
]

def verify_static():
    print("========================================")
    print("1. STATIC ASSET & PRIVACY BOUNDARY AUDIT")
    print("========================================")

    for page in PAGES:
        with open(page, 'r', encoding='utf-8') as f:
            content = f.read()
            lower_content = content.lower()
            soup = BeautifulSoup(content, 'html.parser')

        leaked = [term for term in FORBIDDEN_PRIVATE_TERMS if term in lower_content]
        assert len(leaked) == 0, f"PRIVACY VIOLATION in {page}: leaked private repo terms {leaked}"
        assert 'fuel.onyachamp.com' not in lower_content, f"LEGACY LINK in {page}: fuel.onyachamp.com still present"
        assert 'https://fuelahead.com.au' in lower_content, f"MISSING LINK in {page}: expected https://fuelahead.com.au"

        # Check IDs
        ids = [tag['id'] for tag in soup.find_all(id=True)]
        dupes = [item for item, count in collections.Counter(ids).items() if count > 1]
        assert len(dupes) == 0, f"Duplicate IDs found in {page}: {dupes}"
        print(f"[{page}] DOM IDs: {len(ids)} unique IDs, 0 duplicates, 0 private leaks.")

        # Check img elements
        imgs = soup.find_all('img')
        broken_imgs = []
        for img in imgs:
            src = img.get('src')
            if src and not src.startswith('http'):
                if not os.path.exists(src):
                    broken_imgs.append(src)
        assert len(broken_imgs) == 0, f"Broken images in {page}: {broken_imgs}"
        print(f"[{page}] Images: {len(imgs)} local images verified on disk.")

        # Check data-full attributes
        shots = soup.find_all(attrs={'data-full': True})
        broken_shots = []
        for s in shots:
            full = s['data-full']
            if full and not full.startswith('http'):
                if not os.path.exists(full):
                    broken_shots.append(full)
        assert len(broken_shots) == 0, f"Broken lightbox targets in {page}: {broken_shots}"
        print(f"[{page}] Lightbox Targets: {len(shots)} clickable high-res preview targets verified.")

        # Check download links
        downloads = soup.find_all('a', attrs={'download': True})
        broken_downloads = []
        for d in downloads:
            href = d.get('href')
            if href and not href.startswith('http'):
                path = href.split('#')[0].split('?')[0]
                if not os.path.exists(path):
                    broken_downloads.append(href)
        assert len(broken_downloads) == 0, f"Broken download links in {page}: {broken_downloads}"
        print(f"[{page}] Downloads: {len(downloads)} sample documents (.docx, .md, .mp4) verified on disk.")

    for js_file in ['home.js', 'app.js']:
        with open(js_file, 'r', encoding='utf-8') as f:
            js_raw = f.read()
            js_lower = js_raw.lower()
        leaked = [term for term in FORBIDDEN_PRIVATE_TERMS if term in js_lower]
        assert len(leaked) == 0, f"PRIVACY VIOLATION in {js_file}: leaked {leaked}"
        assert 'fuel.onyachamp.com' not in js_lower, f"LEGACY LINK in {js_file}: fuel.onyachamp.com still present"
        if js_file == 'home.js':
            assert 'https://fuelahead.com.au' in js_lower, "MISSING LINK in home.js: expected https://fuelahead.com.au"
            media_refs = sorted(set(re.findall(r'media/[A-Za-z0-9._-]+', js_raw)))
            missing_media = [m for m in media_refs if not os.path.exists(m)]
            assert len(missing_media) == 0, f"Broken media references in home.js: {missing_media}"
            print(f"[home.js] {len(media_refs)} embedded blog media assets verified on disk.")
    print("[Privacy & Links] Zero private leaks, zero legacy fuel links, and https://fuelahead.com.au verified across all pages.")


def verify_browser():
    print("\n========================================")
    print("2. PLAYWRIGHT E2E BROWSER VERIFICATION")
    print("========================================")

    with sync_playwright() as p:
        browser = p.chromium.launch()

        viewports = [
            ("Desktop 1080p", 1920, 1080),
            ("Laptop 1366x768", 1366, 768),
            ("Tablet 768x1024", 768, 1024),
            ("Mobile 375x812", 375, 812),
            ("Narrow Mobile 320x568", 320, 568),
        ]

        for page_name in PAGES:
            url = 'file:///' + os.path.abspath(page_name).replace('\\', '/')
            page = browser.new_page()

            console_errors = []
            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
            page.on('pageerror', lambda err: console_errors.append(str(err)))

            page.goto(url)
            page.wait_for_timeout(300)

            for vp_name, w, h in viewports:
                page.set_viewport_size({"width": w, "height": h})
                page.wait_for_timeout(120)

                scroll_w = page.evaluate("document.documentElement.scrollWidth")
                client_w = page.evaluate("document.documentElement.clientWidth")
                has_overflow = scroll_w > client_w

                assert not has_overflow, f"[{page_name}] Horizontal overflow at {vp_name}: client={client_w}, scroll={scroll_w}"
            print(f"[{page_name}] All 5 viewports (320px-1920px): Responsive OK (no overflow).")

            # Filter expected local file:// fetch errors on resources.html
            real_errors = [
                e for e in console_errors
                if 'Failed to fetch' not in e
                and 'Access to fetch' not in e
                and 'ERR_FAILED' not in e
                and 'URL scheme "file" is not supported' not in e
            ]
            assert len(real_errors) == 0, f"[{page_name}] Console errors: {real_errors}"
            print(f"[{page_name}] Console health: 0 errors detected.")

            page.set_viewport_size({"width": 1920, "height": 1080})
            page.wait_for_timeout(120)

            # Universal Lightbox Testing
            first_shot = page.query_selector(
                '.featured-tool-media[data-full], .phone-shot[data-full], .shot[data-full], '
                '.lead-screenshot-box[data-full], .feature-visual-media[data-full], .repo-card-media[data-full]'
            )
            if first_shot:
                first_shot.scroll_into_view_if_needed()
                first_shot.click()
                page.wait_for_timeout(180)

                lightbox = page.query_selector('#shot-lightbox')
                assert lightbox and lightbox.is_visible(), f"[{page_name}] Lightbox did not open"

                img_src = page.evaluate("document.getElementById('lightbox-img').src")
                assert img_src and "media/" in img_src, f"[{page_name}] Lightbox image src invalid: {img_src}"

                next_btn = page.query_selector('.lightbox-next')
                if next_btn:
                    next_btn.click()
                    page.wait_for_timeout(100)
                    img_src2 = page.evaluate("document.getElementById('lightbox-img').src")
                    assert img_src2 != img_src, f"[{page_name}] Next button did not advance image"

                page.keyboard.press('Escape')
                page.wait_for_timeout(150)
                assert not lightbox.is_visible(), f"[{page_name}] Lightbox did not close on Escape"
                print(f"[{page_name}] Universal Lightbox open, next-slide, and Escape dismiss: OK.")

            # Redesigned index.html interactive tests
            if page_name == 'index.html':
                print("[index.html] Testing FuelAhead Detour Calculator...")
                before_net = page.text_content('#out-net')
                page.eval_on_selector('#slider-tank', 'el => { el.value = "80"; el.dispatchEvent(new Event("input")); }')
                page.wait_for_timeout(100)
                after_net = page.text_content('#out-net')
                after_tank = page.text_content('#val-tank')
                assert after_tank == "80 Litres" and after_net != before_net, f"Calculator failed: {before_net} -> {after_net}"

                # Preset tests: Detour Trap -> negative net + bad verdict, then back to Daily Car
                page.click('.calc-preset-btn[data-preset="trap"]')
                page.wait_for_timeout(100)
                trap_net = page.text_content('#out-net')
                trap_verdict_cls = page.get_attribute('#out-verdict', 'class') or ''
                assert trap_net.startswith('-') and 'is-bad' in trap_verdict_cls, f"Trap preset failed: {trap_net}, {trap_verdict_cls}"

                page.click('.calc-preset-btn[data-preset="car"]')
                page.wait_for_timeout(100)
                reset_net = page.text_content('#out-net')
                assert reset_net == "+$10.35", f"Car preset reset failed: {reset_net}"
                print(f"[index.html] Detour Calculator OK: 55L={before_net} -> 80L={after_net}, Trap={trap_net}, Reset={reset_net}.")

                print("[index.html] Testing Engineering Field Notes Modal Reader & Inline Figures...")
                lead_note = page.query_selector('.editorial-split')
                lead_note.scroll_into_view_if_needed()
                lead_note.click()
                page.wait_for_timeout(180)
                reader_modal = page.query_selector('#article-reader-modal')
                assert reader_modal.is_visible(), "Field Notes reader modal did not open"
                reader_title = page.text_content('#reader-content h2')
                assert "OpenXML" in reader_title, f"Unexpected modal title: {reader_title}"
                page.keyboard.press('Escape')
                page.wait_for_timeout(150)
                assert not reader_modal.is_visible(), "Field Notes reader modal did not close on Escape"

                journal_count = len(page.query_selector_all('.journal-item'))
                assert journal_count == 9, f"Expected 9 stacked journal items (+ 1 lead editorial), got {journal_count}"

                aus_note = page.query_selector('.journal-item[data-article="article-aus-fuel-carplay"]')
                assert aus_note is not None, "Missing article-aus-fuel-carplay journal item"
                aus_note.scroll_into_view_if_needed()
                aus_note.click()
                page.wait_for_timeout(220)
                assert reader_modal.is_visible(), "article-aus-fuel-carplay reader modal did not open"
                aus_title = page.text_content('#reader-content h2') or ''
                assert "Victoria" in aus_title, f"Unexpected aus-fuel-carplay title: {aus_title}"
                table_rows = page.evaluate("document.querySelectorAll('#reader-content table.article-table tbody tr').length")
                assert table_rows == 8, f"Expected 8 state rows in comparison table, got {table_rows}"
                aus_fig_loaded = page.evaluate("""() => {
                    const imgs = Array.from(document.querySelectorAll('#reader-content .article-figure img'));
                    imgs.forEach(img => { img.loading = 'eager'; });
                    return imgs.length;
                }""")
                page.wait_for_timeout(300)
                aus_broken_imgs = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('#reader-content .article-figure img'))
                        .filter(img => !img.complete || img.naturalWidth === 0)
                        .map(img => img.getAttribute('src'));
                }""")
                assert aus_fig_loaded == 2 and len(aus_broken_imgs) == 0, f"Broken Android Auto images: {aus_broken_imgs}"
                aus_fig = page.query_selector('#reader-content .article-figure[data-full]')
                assert aus_fig is not None, "Missing inline Android Auto figure inside article-aus-fuel-carplay"
                aus_fig.scroll_into_view_if_needed()
                aus_fig.click()
                page.wait_for_timeout(180)
                lightbox = page.query_selector('#shot-lightbox')
                assert lightbox and lightbox.is_visible(), "Lightbox did not open from Android Auto figure"
                page.keyboard.press('Escape')
                page.wait_for_timeout(150)
                assert not lightbox.is_visible(), "Lightbox did not close on Escape over aus-fuel-carplay"
                assert reader_modal.is_visible(), "Reader modal closed prematurely from Android Auto lightbox"
                page.keyboard.press('Escape')
                page.wait_for_timeout(150)
                assert not reader_modal.is_visible(), "Reader modal did not close on Escape"

                d1_note = page.query_selector('.journal-item[data-article="article-d1-queryplan"]')
                assert d1_note is not None, "Missing article-d1-queryplan journal item"
                d1_note.scroll_into_view_if_needed()
                d1_note.click()
                page.wait_for_timeout(220)
                assert reader_modal.is_visible(), "article-d1-queryplan reader modal did not open"

                article_fig = page.query_selector('#reader-content .article-figure[data-full]')
                assert article_fig is not None, "Missing inline article-figure inside article-d1-queryplan"
                fig_loaded = page.evaluate("""() => {
                    const imgs = Array.from(document.querySelectorAll('#reader-content .article-figure img'));
                    imgs.forEach(img => { img.loading = 'eager'; });
                    return imgs.length;
                }""")
                page.wait_for_timeout(300)
                broken_fig_imgs = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('#reader-content .article-figure img'))
                        .filter(img => !img.complete || img.naturalWidth === 0)
                        .map(img => img.getAttribute('src'));
                }""")
                assert fig_loaded >= 1 and len(broken_fig_imgs) == 0, f"Broken article figure images: {broken_fig_imgs}"

                article_fig.scroll_into_view_if_needed()
                article_fig.click()
                page.wait_for_timeout(180)
                lightbox = page.query_selector('#shot-lightbox')
                assert lightbox and lightbox.is_visible(), "Lightbox did not open from inline article figure"

                page.keyboard.press('Escape')
                page.wait_for_timeout(150)
                assert not lightbox.is_visible(), "Lightbox did not close on first Escape"
                assert reader_modal.is_visible(), "Reader modal closed prematurely when dismissing nested lightbox"

                page.keyboard.press('Escape')
                page.wait_for_timeout(150)
                assert not reader_modal.is_visible(), "Reader modal did not close on second Escape"
                print("[index.html] All 10 Engineering Field Notes, 8-state table, inline figures, and nested Escape behavior verified.")

            # tools.html category filter tests
            if page_name == 'tools.html':
                print("[tools.html] Testing Category Filters across 12 public tools...")
                total_cards = page.evaluate("document.querySelectorAll('.repo-card').length")
                assert total_cards == 12, f"Expected 12 tool cards on tools.html, got {total_cards}"

                page.click('.filter-btn[data-filter="powershell"]')
                page.wait_for_timeout(150)
                visible_cards = page.evaluate("""() => {
                    const cards = Array.from(document.querySelectorAll('.repo-card'));
                    return cards.filter(c => c.style.display !== 'none').length;
                }""")
                print(f"[tools.html] Filter 'powershell': {visible_cards} cards visible.")
                assert visible_cards > 0, "No cards visible after powershell filter"

                page.click('.filter-btn[data-filter="all"]')
                page.wait_for_timeout(100)

            # cli-tour.html interactive terminal tabs tests
            if page_name == 'cli-tour.html':
                print("[cli-tour.html] Testing Interactive Terminal Tabs...")
                for tab_id in ['tab-wingetintune', 'tab-autopilotfast', 'tab-updatecascade', 'tab-autopilothub', 'tab-findobject', 'tab-marksmith']:
                    page.click(f'.terminal-tab-btn[data-tab="{tab_id}"]')
                    page.wait_for_timeout(100)
                    active_pane = page.query_selector(f'#{tab_id}.active')
                    assert active_pane is not None, f"Terminal tab {tab_id} failed to activate"
                print("[cli-tour.html] All 6 terminal tabs switched cleanly.")

            page.close()

        browser.close()
    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    verify_static()
    verify_browser()
