with open('app.js', 'r') as f:
    content = f.read()

search_str = """    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const codeSnippet = btn.getAttribute('data-copy');
      if (!codeSnippet) return;

      try {
        await navigator.clipboard.writeText(codeSnippet);"""

replace_str = """    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const codeSnippet = btn.getAttribute('data-copy');
      if (!codeSnippet) return;

      const n1 = Math.floor(Math.random() * 10) + 1;
      const n2 = Math.floor(Math.random() * 10) + 1;
      const ans = prompt(`Anti-UX security check! What is ${n1} + ${n2}?`);
      if (parseInt(ans, 10) !== n1 + n2) {
        alert("Incorrect! Copy canceled.");
        return;
      }

      try {
        await navigator.clipboard.writeText(codeSnippet);"""

if search_str in content:
    content = content.replace(search_str, replace_str, 1)
    with open('app.js', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Search string not found")
