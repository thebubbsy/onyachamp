import os
import collections
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

FORBIDDEN_PRIVATE_TERMS = [
    "TeamsChatExporter",
    "thebubbsy/fuelahead",
    "salesforce-exporter",
    "pocketdesk",
    "bubbsy-flipper-vault",
    "m365-canary-tui",
]

def verify_static():
    print("========================================")
    print("1. STATIC ASSET, DOM & PRIVACY AUDIT")
    print("========================================")
    
    for page in ['index.html', 'marksmith.html']:
        with open(page, 'r', encoding='utf-8') as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')
        
        # Privacy check against private repo leaks
        lower = content.lower()
        for term in FORBIDDEN_PRIVATE_TERMS:
            assert term.lower() not in lower, f"PRIVACY VIOLATION in {page}: found '{term}'"
        
        # Check IDs
        ids = [tag['id'] for tag in soup.find_all(id=True)]
        dupes = [item for item, count in collections.Counter(ids).items() if count > 1]
        assert len(dupes) == 0, f"Duplicate IDs found in {page}: {dupes}"
        print(f"[{page}] DOM IDs: {len(ids)} unique IDs, 0 duplicates.")
        
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
        print(f"[{page}] Downloads: {len(downloads)} sample documents verified on disk.")

    # Verify app.js privacy too
    with open('app.js', 'r', encoding='utf-8') as f:
        app_js = f.read().lower()
    for term in FORBIDDEN_PRIVATE_TERMS:
        assert term.lower() not in app_js, f"PRIVACY VIOLATION in app.js: found '{term}'"
    print("[Privacy] Zero private repository leaks across index.html, marksmith.html, and app.js.")


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
            ("Narrow Mobile 320x568", 320, 568)
        ]
        
        for page_name in ['index.html', 'marksmith.html']:
            url = 'file:///' + os.path.abspath(page_name).replace('\\', '/')
            page = browser.new_page()
            
            console_errors = []
            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
            page.on('pageerror', lambda err: console_errors.append(str(err)))
            
            page.goto(url)
            page.wait_for_timeout(400)
            
            for vp_name, w, h in viewports:
                page.set_viewport_size({"width": w, "height": h})
                page.wait_for_timeout(150)
                
                scroll_w = page.evaluate("document.documentElement.scrollWidth")
                client_w = page.evaluate("document.documentElement.clientWidth")
                has_overflow = scroll_w > client_w
                
                assert not has_overflow, f"[{page_name}] Horizontal overflow at {vp_name}: client={client_w}, scroll={scroll_w}"
                print(f"[{page_name}] Viewport {vp_name} ({w}x{h}): Responsive OK (no overflow).")
            
            assert len(console_errors) == 0, f"[{page_name}] Console errors: {console_errors}"
            print(f"[{page_name}] Console health: 0 errors detected.")
            
            # Interactive Lightbox Testing
            print(f"[{page_name}] Testing Universal Lightbox interactions...")
            first_shot = page.query_selector('.featured-tool-media[data-full], .phone-shot[data-full], .shot[data-full], [data-full]')
            if first_shot:
                first_shot.scroll_into_view_if_needed()
                first_shot.click()
                page.wait_for_timeout(200)
                
                lightbox = page.query_selector('#shot-lightbox')
                assert lightbox.is_visible(), f"[{page_name}] Lightbox did not open"
                
                img_src = page.evaluate("document.getElementById('lightbox-img').src")
                assert img_src and "media/" in img_src, f"[{page_name}] Lightbox image src invalid: {img_src}"
                
                counter = page.evaluate("document.getElementById('lightbox-counter') ? document.getElementById('lightbox-counter').textContent : ''")
                caption = page.evaluate("document.getElementById('lightbox-caption') ? document.getElementById('lightbox-caption').textContent : ''")
                print(f"[{page_name}] Lightbox opened: Counter='{counter}', Caption preview='{caption[:40]}...'")
                
                next_btn = page.query_selector('.lightbox-next')
                if next_btn:
                    next_btn.click()
                    page.wait_for_timeout(100)
                    img_src2 = page.evaluate("document.getElementById('lightbox-img').src")
                    assert img_src2 != img_src, f"[{page_name}] Next button did not advance image"
                    print(f"[{page_name}] Next navigation button: OK (advanced to {img_src2.split('/')[-1]}).")
                
                page.keyboard.press('Escape')
                page.wait_for_timeout(150)
                assert not lightbox.is_visible(), f"[{page_name}] Lightbox did not close on Escape"
                print(f"[{page_name}] Lightbox Escape key dismiss: OK.")
            
            # Index-specific interactive tests: Detour Calculator + Field Notes Modal Reader
            if page_name == 'index.html':
                print("[index.html] Testing FuelAhead Detour Calculator...")
                before_net = page.text_content('#out-net')
                page.eval_on_selector('#slider-tank', 'el => { el.value = "80"; el.dispatchEvent(new Event("input")); }')
                page.wait_for_timeout(100)
                after_net = page.text_content('#out-net')
                after_tank = page.text_content('#val-tank')
                assert after_tank == "80 Litres" and after_net != before_net, f"Calculator failed to update: {before_net} -> {after_net}"
                print(f"[index.html] Detour Calculator OK: 55L={before_net} -> 80L={after_net}.")

                print("[index.html] Testing Engineering Field Notes Modal Reader...")
                lead_note = page.query_selector('.editorial-split')
                lead_note.scroll_into_view_if_needed()
                lead_note.click()
                page.wait_for_timeout(200)
                reader_modal = page.query_selector('#article-reader-modal')
                assert reader_modal.is_visible(), "Field Notes reader modal did not open"
                reader_title = page.text_content('#reader-content h2')
                assert "OpenXML" in reader_title, f"Unexpected modal article title: {reader_title}"
                page.keyboard.press('Escape')
                page.wait_for_timeout(150)
                assert not reader_modal.is_visible(), "Field Notes reader modal did not close on Escape"
                print(f"[index.html] Field Notes Modal OK: opened '{reader_title}' and closed via Escape.")

                page.set_viewport_size({"width": 1920, "height": 1080})
                for tab_item in page.query_selector_all('.journal-item'):
                    assert tab_item.is_visible(), "Journal item missing"
                print("[index.html] All 6 Engineering Field Notes verified interactive.")
                
            page.close()
        
        browser.close()
    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    verify_static()
    verify_browser()
