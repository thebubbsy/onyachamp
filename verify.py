import re
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(record_video_dir="/app/")
        page = context.new_page()
        page.goto("http://localhost:3000")

        # Set up a listener for the prompt dialog
        # The prompt asks for a math sum: "Anti-UX security check! What is 1 + 2?"
        def handle_dialog(dialog):
            if dialog.type == "prompt":
                message = dialog.message
                print(f"Dialog message: {message}")
                # Extract the numbers from the message
                match = re.search(r'What is (\d+)\s*\+\s*(\d+)\?', message)
                if match:
                    n1 = int(match.group(1))
                    n2 = int(match.group(2))
                    ans = str(n1 + n2)
                    print(f"Answering with {ans}")
                    dialog.accept(ans)
                else:
                    print("Could not parse prompt, answering with 0")
                    dialog.accept("0")
            else:
                dialog.accept()

        page.on("dialog", handle_dialog)

        # Find the copy button and click it
        copy_btn = page.locator(".copy-btn").first
        copy_btn.click()

        page.wait_for_timeout(1000)

        # Ensure the prompt occurred and copy happened successfully
        page.screenshot(path="/app/screenshot.png")

        context.close()
        browser.close()

if __name__ == "__main__":
    run()
