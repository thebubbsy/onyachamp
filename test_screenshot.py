from playwright.sync_api import sync_playwright
import time

def test_modal_kinetic_charging():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:3000')

        # Find the first modal trigger
        trigger = page.locator('.modal-trigger').first
        trigger.click()

        # Simulate mouse movements to charge the modal
        # Target distance is 5000.
        # Moving from 0,0 to 1000, 1000 is distance of ~1414
        # We'll do a few sweeps

        # Start at 0,0
        page.mouse.move(0, 0)

        # Sweep 1: 0,0 -> 1000, 1000 (~1414 dist)
        page.mouse.move(1000, 1000, steps=50)

        # Sweep 2: 1000, 1000 -> 0, 0 (~1414 dist)
        page.mouse.move(0, 0, steps=50)

        # Sweep 3: 0,0 -> 1000, 1000 (~1414 dist)
        page.mouse.move(1000, 1000, steps=50)

        # Sweep 4: 1000, 1000 -> 0, 0 (~1414 dist)
        page.mouse.move(0, 0, steps=50)

        # Total distance should be > 5000 now. The modal should open.
        # Wait a moment for modal animation to finish
        time.sleep(1)

        page.screenshot(path='/app/screenshot.png')
        browser.close()

if __name__ == '__main__':
    test_modal_kinetic_charging()