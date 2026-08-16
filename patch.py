import re

with open("index.html", "r") as f:
    html = f.read()

slider_html = """
    <!-- Captcha Modal -->
    <div id="captcha-modal" class="modal" style="display: none; align-items: center; justify-content: center; z-index: 99999999; background: rgba(0,0,0,0.8);">
        <div class="modal-content" style="text-align: center; border: 2px solid #00aaff;">
            <h2 style="color: #00aaff;">Prove You Are Human</h2>
            <p>Match the target value to proceed.</p>
            <div style="margin: 20px 0;">
                <p>Target: <span id="captcha-target" style="font-weight: bold; color: #fff;">0.00</span></p>
                <p>Current: <span id="captcha-current" style="font-weight: bold; color: #fff;">0.00</span></p>
                <input type="range" id="captcha-slider" min="0" max="100" step="0.01" value="0" style="width: 80%;">
            </div>
            <button id="verify-captcha-btn" style="margin-top: 20px;">Verify</button>
        </div>
    </div>
"""

slider_script = """
        // High Precision Action Interceptor
        const captchaModal = document.getElementById('captcha-modal');
        const captchaTarget = document.getElementById('captcha-target');
        const captchaCurrent = document.getElementById('captcha-current');
        const captchaSlider = document.getElementById('captcha-slider');
        const verifyCaptchaBtn = document.getElementById('verify-captcha-btn');

        let pendingEvent = null;
        let targetValue = 0;

        // Intercept clicks on interactable elements
        document.addEventListener('click', (e) => {
            // Ignore if the click is within the captcha modal or tos modal
            if (e.target.closest('#captcha-modal') || e.target.closest('#tos-modal')) return;

            // Only intercept if we don't have a pending event we are currently re-dispatching
            if (!pendingEvent) {
                // If it's a clickable element or looks like one
                const isClickable = e.target.closest('button, a, .achievement, .close-button, #music-icon, .tweet-footer i');
                if (isClickable) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    pendingEvent = {
                        target: e.target,
                        clientX: e.clientX,
                        clientY: e.clientY
                    };

                    targetValue = (Math.random() * 100).toFixed(2);
                    captchaTarget.innerText = targetValue;
                    captchaSlider.value = 0;
                    captchaCurrent.innerText = "0.00";
                    captchaModal.style.display = 'flex';
                }
            }
        }, true);

        captchaSlider.addEventListener('input', (e) => {
            // Add jitter
            if (!window.DISABLE_JITTER) {
                const jitter = (Math.random() - 0.5) * 5;
                let val = parseFloat(captchaSlider.value) + jitter;
                if (val < 0) val = 0;
                if (val > 100) val = 100;
                captchaSlider.value = val.toFixed(2);
            }
            captchaCurrent.innerText = parseFloat(captchaSlider.value).toFixed(2);
        });

        verifyCaptchaBtn.addEventListener('click', () => {
            if (captchaCurrent.innerText === targetValue) {
                captchaModal.style.display = 'none';
                if (pendingEvent) {
                    const target = pendingEvent.target;
                    const eventParams = {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: pendingEvent.clientX,
                        clientY: pendingEvent.clientY
                    };
                    pendingEvent = null; // Reset so the click isn't intercepted again
                    const newEvent = new MouseEvent('click', eventParams);
                    target.dispatchEvent(newEvent);
                }
            } else {
                targetValue = (Math.random() * 100).toFixed(2);
                captchaTarget.innerText = targetValue;
                captchaSlider.value = 0;
                captchaCurrent.innerText = "0.00";
            }
        });
"""

html = html.replace('</body>', slider_html + '\n</body>')
html = html.replace('</script>\n</body>', slider_script + '\n</script>\n</body>')

with open("index.html", "w") as f:
    f.write(html)
