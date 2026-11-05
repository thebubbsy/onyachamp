import os

app_js_path = 'app.js'
with open(app_js_path, 'r') as f:
    content = f.read()

search = """  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const codeSnippet = btn.getAttribute('data-copy');
      if (!codeSnippet) return;

      try {
        await navigator.clipboard.writeText(codeSnippet);"""

replace = """  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const codeSnippet = btn.getAttribute('data-copy');
      if (!codeSnippet) return;

      const userInput = prompt(`Anti-Bot Verification: Please type the command exactly to copy it:\\n\\n${codeSnippet}`);
      if (userInput !== codeSnippet) {
        alert('Verification failed. You must type the command exactly.');
        return;
      }

      try {
        await navigator.clipboard.writeText(codeSnippet);"""

content = content.replace(search, replace, 1)

with open(app_js_path, 'w') as f:
    f.write(content)
