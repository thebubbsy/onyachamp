import os
import collections
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

PAGES = [
    'index.html',
    'marksmith.html',
    'fuelahead.html',
    'teams-chat-exporter.html',
    'garage-controller.html',
    'cli-tour.html',
    'tools.html',
    'stack.html',
    'resources.html',
    'contact.html'
]

def verify_static():
    print("========================================")
    print("1. STATIC ASSET & DOM INTEGRITY AUDIT")
    print("========================================")
    
    for page in PAGES:
        with open(page, 'r', encoding='utf-8') as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')
        
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
        print(f"[{page}] Downloads: {len(downloads)} sample documents (.docx, .md, .mp4) verified on disk.")

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
        
        for page_name in PAGES:
            url = 'file:///' + os.path.abspath(page_name).replace('\\', '/')
            page = browser.new_page()
            
            console_errors = []
            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
            page.on('pageerror', lambda err: console_errors.append(str(err)))
            
            page.goto(url)
            page.wait_for_timeout(200)
            
            for vp_name, w, h in viewports:
                page.set_viewport_size({"width": w, "height": h})
                page.wait_for_timeout(100)
                
                scroll_w = page.evaluate("document.documentElement.scrollWidth")
                client_w = page.evaluate("document.documentElement.clientWidth")
                has_overflow = scroll_w > client_w
                
                assert not has_overflow, f"[{page_name}] Horizontal overflow at {vp_name}: client={client_w}, scroll={scroll_w}"
            print(f"[{page_name}] All 5 viewports (320px-1920px): Responsive OK (no overflow).")
            
            # Filter out expected local file:// fetch errors on resources.html
            real_errors = [e for e in console_errors if 'Failed to fetch' not in e and 'Access to fetch' not in e and 'ERR_FAILED' not in e and 'URL scheme "file" is not supported' not in e]
            assert len(real_errors) == 0, f"[{page_name}] Console errors: {real_errors}"
            print(f"[{page_name}] Console health: 0 errors detected.")
            
            # Reset viewport to desktop for interactive tests
            page.set_viewport_size({"width": 1920, "height": 1080})
            page.wait_for_timeout(100)
            
            # Interactive Lightbox Testing on page
            first_shot = page.query_selector('.shot[data-full], .lead-screenshot-box[data-full], .feature-visual-media[data-full], .repo-card-media[data-full]')
            if first_shot:
                first_shot.click()
                page.wait_for_timeout(150)
                
                lightbox = page.query_selector('#shot-lightbox')
                assert lightbox.is_visible(), f"[{page_name}] Lightbox did not open"
                
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
            
            # If on tools.html, test Category Filter across all 18 tools
            if page_name == 'tools.html':
                print("[tools.html] Testing Category Filters across 18 tools...")
                total_cards = page.evaluate("document.querySelectorAll('.repo-card').length")
                assert total_cards == 18, f"Expected 18 tool cards on tools.html, got {total_cards}"
                
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
            
            # If on cli-tour.html, test all 6 Interactive Terminal Tabs
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
