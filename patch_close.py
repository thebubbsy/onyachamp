import re

with open('index.html', 'r') as f:
    html = f.read()

old_close_logic = """        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });"""

new_close_logic = """        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.dataset.closing === 'true') return;
                button.dataset.closing = 'true';
                let progress = 0;
                const originalText = button.innerHTML;
                button.style.fontSize = '14px';

                const interval = setInterval(() => {
                    progress += 2;
                    button.innerText = `Closing ${progress}%`;
                    if (progress >= 100) {
                        clearInterval(interval);
                        const modal = button.closest('.modal');
                        if (modal) {
                            modal.style.display = 'none';
                        }
                        button.dataset.closing = 'false';
                        button.innerHTML = originalText;
                        button.style.fontSize = '';
                    }
                }, 100); // 5 seconds total
            });
        });"""

old_outside_logic = """        // Close modal when clicking outside content
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });"""

new_outside_logic = """        // Close modal when clicking outside content
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal') && event.target.id !== 'tos-modal') {
                // Anti-UX: Do not close when clicking outside. Force them to use the slow button.
            }
        });"""

html = html.replace(old_close_logic, new_close_logic)
html = html.replace(old_outside_logic, new_outside_logic)

with open('index.html', 'w') as f:
    f.write(html)
print("Patched index.html")
