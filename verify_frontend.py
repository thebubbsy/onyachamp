import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(record_video_dir="/app/")
        page = await context.new_page()

        await page.goto("http://localhost:3000")
        await page.wait_for_timeout(1000)

        # Take initial screenshot
        await page.screenshot(path="/app/screenshot_initial.png")

        # Click a button to trigger the anti-ux overlay
        link = page.locator("text=Explore MarkSmith")
        await link.first.click()
        await page.wait_for_timeout(1000)

        # Take screenshot of overlay
        await page.screenshot(path="/app/screenshot_overlay.png")

        # Interact with the slider
        await page.evaluate("document.getElementById('anti-ux-slider').value = '42';")
        await page.locator("text=Confirm Action").click()
        await page.wait_for_timeout(1000)

        # Take final screenshot
        await page.screenshot(path="/app/screenshot_final.png")

        await context.close()
        await browser.close()

asyncio.run(main())
