import re
from playwright.sync_api import Page, expect

def test_homepage(page: Page):
    page.goto("http://localhost:3000/")

    # Hide the TOS modal so it doesn't block interaction
    page.evaluate("document.getElementById('tos-modal').style.display = 'none';")

    # Click the first modal trigger
    # Wait! we have to use the mindful cursor wait
    trigger = page.locator('.modal-trigger').first
    trigger.hover()
    page.wait_for_timeout(2000)
    trigger.click()

    # The manual load modal should appear
    page.wait_for_selector('#manual-load-modal', state='visible')

    # Take a screenshot
    page.screenshot(path="screenshot.png")
