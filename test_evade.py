import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:3000")

        await page.evaluate("document.getElementById('tos-modal').style.display = 'none';")
        await page.wait_for_timeout(1000)

        await page.click(".achievement.modal-trigger")
        await page.wait_for_timeout(500)

        button = page.locator(".close-button").first
        for i in range(5):
            try:
                await button.hover(force=True)
                await page.wait_for_timeout(200)
            except Exception:
                pass

        await page.screenshot(path="/app/screenshot.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())