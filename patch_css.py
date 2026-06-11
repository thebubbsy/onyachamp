import re

with open('style.css', 'r') as f:
    content = f.read()

replacement = """
.achievement {
    background: #222;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    transition: transform 0.3s ease;
    cursor: pointer;
    user-select: none;
}

.achievement:hover {
    transform: scale(0.1);
}
"""

content = re.sub(
    r'\.achievement \{[^}]+\}',
    replacement.strip(),
    content
)

with open('style.css', 'w') as f:
    f.write(content)
