from playwright.sync_api import sync_playwright
import time
import math

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Navigate to the local server
    page.goto("http://localhost:3000")

    # Wait for page to load
    page.wait_for_load_state("networkidle")

    # Locate the first modal trigger
    trigger = page.locator(".modal-trigger").first

    # Get the bounding box of the trigger to know where to move the mouse
    box = trigger.bounding_box()
    if box:
        center_x = box["x"] + box["width"] / 2
        center_y = box["y"] + box["height"] / 2

        # 1. Take a screenshot before interaction
        page.screenshot(path="/app/screenshot_before.png")

        # 2. Try to click it immediately (should fail due to lack of kinetic energy)
        # Note: We use page.mouse.click instead of trigger.click() to ensure we bypass
        # any Playwright actionability checks that might interfere with our custom logic
        page.mouse.click(center_x, center_y)
        time.sleep(0.5) # Wait a bit to see if modal opens

        # Take a screenshot to prove it didn't open
        page.screenshot(path="/app/screenshot_failed_click.png")

        # 3. Build up kinetic energy by moving the mouse vigorously over the element
        # We need to accumulate 5000 units of distance. Each pixel moved is 2 units.
        # So we need 2500 pixels of movement.

        # Start mouse in center
        page.mouse.move(center_x, center_y)

        radius = min(box["width"], box["height"]) / 4
        steps = 200 # Need lots of steps for distance

        print("Generating kinetic energy...")
        for i in range(steps):
            # Move in a circle pattern
            angle = (i / steps) * math.pi * 20 # 10 full circles
            target_x = center_x + math.cos(angle) * radius
            target_y = center_y + math.sin(angle) * radius

            # The 'steps' parameter here is crucial. It dictates how many intermediate
            # mousemove events Playwright fires during the move. We need a high number
            # to generate enough total distance for our calculation.
            page.mouse.move(target_x, target_y, steps=5)

            # small sleep to ensure intervals don't drain it all away instantly
            time.sleep(0.01)

        # 4. Take a screenshot showing the increased opacity
        page.screenshot(path="/app/screenshot_charged.png")

        # 5. Click again, this time it should succeed
        print("Clicking charged element...")
        page.mouse.click(center_x, center_y)
        time.sleep(1) # wait for modal animation

        # 6. Take final screenshot showing opened modal
        page.screenshot(path="/app/screenshot.png")
        print("Verification complete. Check /app/screenshot.png")

    context.close()
    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
