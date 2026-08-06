with open("index.html", "r") as f:
    content = f.read()
print("Found closeButtons logic:", "closeButtons.forEach" in content)
