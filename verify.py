import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(record_video_dir="/app/")
        page = await context.new_page()

        await page.goto("http://localhost:3000")

        # Bypass TOS
        await page.evaluate("document.getElementById('tos-modal').style.display = 'none';")
        await page.evaluate("document.getElementById('mindful-cursor').style.display = 'none';")

        # Open modal
        await page.evaluate("document.getElementById('modal-bubblesort').style.display = 'block';")

        # Click close button using javascript since it might be obscured by other elements
        page.once("dialog", lambda dialog: dialog.accept("I acknowledge Matthew Bubb's genius"))

        await page.evaluate("document.querySelector('#modal-bubblesort .close-button').click();")

        await page.wait_for_timeout(500)
        await page.screenshot(path="/app/screenshot.png")

        await context.close()
        await browser.close()

asyncio.run(verify())
