from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")

    # Wait for the trigger and click it to open the modal
    trigger = page.locator('.modal-trigger').first
    trigger.click()

    # Wait for the modal to be visible
    modal = page.locator('#modal-bubblesort')
    modal.wait_for(state="visible")

    # Wait for the close button
    close_button = modal.locator('.close-button')

    # Perform 5 hovers to trigger the escapes
    for i in range(5):
        # We need to hover slightly into the bounding box, not just the center to be safe and ensure the mouseover event triggers
        box = close_button.bounding_box()
        if box:
           page.mouse.move(box['x'] + 5, box['y'] + 5, steps=50)
           page.wait_for_timeout(200) # slight delay to let JS update position

    # Take a screenshot to show the final state
    page.screenshot(path="/app/screenshot.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)