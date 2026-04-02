import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:3000")

        # Move the mouse around extensively to deplete stamina
        for _ in range(50):
            await page.mouse.move(100, 100)
            await page.mouse.move(500, 500)
            await page.mouse.move(200, 800)
            await page.mouse.move(800, 200)

        # Take a screenshot to capture the "Cursor Exhausted" modal
        await page.screenshot(path="stamina.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
