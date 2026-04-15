import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:3000/test_close.html")
        await page.wait_for_timeout(1000)

        button = page.locator(".close-button")

        await page.screenshot(path="/app/test_close_before.png")

        # try to hover
        for i in range(8):
            try:
                await button.hover()
                await page.wait_for_timeout(300)
            except Exception as e:
                print(f"hover error {i}: {e}")

        await page.screenshot(path="/app/test_close_after.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
