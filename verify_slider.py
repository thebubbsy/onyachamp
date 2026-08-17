from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(500)

    # Hide TOS modal to bypass scroll check
    page.evaluate("document.getElementById('tos-modal').style.display = 'none';")
    page.wait_for_timeout(500)

    # Bypass mindful cursor that prevents normal clicks if distance > 15
    locator = page.locator(".achievement").first
    box = locator.bounding_box()
    if box:
        x = box["x"] + box["width"] / 2
        y = box["y"] + box["height"] / 2
        page.mouse.move(x, y, steps=10)
        page.wait_for_timeout(250)
        page.mouse.click(x, y)

    page.wait_for_timeout(1000)

    # Screenshot of slider modal
    page.screenshot(path="/app/verification.png")

    # Force value to pass
    page.evaluate("""
        const slider = document.getElementById('human-slider');
        const inst = document.querySelector('#slider-modal p').innerText;
        const target = inst.split(': ')[1];
        slider.value = target;
    """)
    page.wait_for_timeout(500)

    # Accept dialog to clear it
    page.once("dialog", lambda dialog: dialog.accept())

    btn_locator = page.locator("#slider-verify-btn")
    btn_box = btn_locator.bounding_box()
    if btn_box:
        x = btn_box["x"] + btn_box["width"] / 2
        y = btn_box["y"] + btn_box["height"] / 2
        page.mouse.move(x, y, steps=10)
        page.wait_for_timeout(250)
        page.mouse.click(x, y)

    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/app/"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
