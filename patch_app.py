with open('app.js', 'a') as f:
    f.write(r"""
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.createElement('div');
  overlay.id = 'anti-ux-overlay';
  overlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.9);
    z-index: 999999;
    align-items: center; justify-content: center;
    flex-direction: column;
    color: white;
    font-family: sans-serif;
  `;

  const text = document.createElement('h2');
  text.innerText = 'Wait a second...';

  const instruction = document.createElement('p');
  instruction.innerText = 'To prove your patience, please slide exactly to 42 to proceed.';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = 'anti-ux-slider';
  slider.min = '0';
  slider.max = '100';
  slider.value = '0';

  const confirmBtn = document.createElement('button');
  confirmBtn.id = 'anti-ux-confirm';
  confirmBtn.innerText = 'Confirm Action';
  confirmBtn.style.marginTop = '20px';
  confirmBtn.style.padding = '10px 20px';
  confirmBtn.style.cursor = 'pointer';

  overlay.appendChild(text);
  overlay.appendChild(instruction);
  overlay.appendChild(slider);
  overlay.appendChild(confirmBtn);
  document.body.appendChild(overlay);

  let pendingEventTarget = null;

  document.addEventListener('click', (e) => {
    if (overlay.contains(e.target)) return;

    if (overlay.style.display === 'flex') {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    const interactive = e.target.closest('a, button');
    if (interactive && e.isTrusted) {
      e.preventDefault();
      e.stopPropagation();
      pendingEventTarget = interactive;
      slider.value = '0';
      overlay.style.display = 'flex';
    }
  }, true);

  confirmBtn.addEventListener('click', () => {
    if (slider.value === '42') {
      overlay.style.display = 'none';
      if (pendingEventTarget) {
        pendingEventTarget.click();
        pendingEventTarget = null;
      }
    } else {
      alert('Slider must be exactly 42! You selected ' + slider.value);
    }
  });
});
""")
