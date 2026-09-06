## 2026-09-06 - Anti-UX Math Captcha
**Learning:** Implementing annoying but functional anti-UX features like a prompt-based math captcha requires careful handling of native browser dialogs in automated testing (Playwright) to prevent scripts from hanging.
**Action:** When implementing similar interceptors in the future, ensure a Playwright page.on('dialog') handler is set up to automatically answer or dismiss the dialog so that the test suite remains robust and unimpeded.
