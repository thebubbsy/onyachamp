import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:3000")

        # Wait a bit for everything to load and animations to settle
        await page.wait_for_timeout(2000)

        # Ensure the TOS modal is visible
        modal = await page.wait_for_selector('#tos-modal', state='visible')

        # Take a screenshot
        await page.screenshot(path="/app/screenshot.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
