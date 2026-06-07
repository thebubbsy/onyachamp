from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # Bypassing the TOS modal
        page.evaluate("document.getElementById('tos-modal').style.display = 'none';")

        # Clicking a modal trigger
        page.evaluate("""
            const el = document.querySelector('.modal-trigger');
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }));
        """)
        page.wait_for_timeout(500)

        # Verify the manual loader overlay is visible
        overlay_display = page.evaluate("document.querySelector('div[style*=\"z-index: 10000\"]').style.display")
        print(f"Overlay display: {overlay_display}")

        # Pump to 100%
        for _ in range(12):
            page.evaluate("document.getElementById('pump-btn').click();")
            page.wait_for_timeout(20)

        page.wait_for_timeout(500)

        # Verify modal opened
        modal_display = page.evaluate("document.querySelector('#modal-bubblesort').style.display")
        print(f"Modal display after pumping: {modal_display}")

        browser.close()

if __name__ == "__main__":
    run()
