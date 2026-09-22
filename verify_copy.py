from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(record_video_dir="/app/")
        page = context.new_page()

        page.goto("http://localhost:3000/")

        # Click the first copy button
        page.once("dialog", lambda dialog: dialog.accept("Install-Module -Name WingetIntune"))
        page.click(".copy-btn")

        page.wait_for_timeout(1000)

        page.screenshot(path="/app/screenshot.png")

        context.close()
        browser.close()

run()
