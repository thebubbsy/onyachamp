# OnyaChamp.com

The personal portfolio of **Matthew Bubb** (OnyaChamp), a systems engineer and tooling architect based in Australia.

🌍 **Live site:** [onyachamp.com](https://onyachamp.com)

---

## What's on the site

- **Home ([`index.html`](index.html))** covers my flagship projects, with screenshots, sample outputs and links to each repo:
  - **MarkSmith**: an offline Markdown-to-Office compiler that produces native Word and PowerPoint files, editable vector diagrams and native equations.
  - **TeamsChatExporter Pro**: exports Microsoft Teams chats with compliance-grade audit trails.
  - **WingetIntune**, **WingetBatch**, **AutopilotFast** and **FindObject**: PowerShell and .NET tooling for Windows fleet management.
  - **broadlink-garage-controller**: a serverless smart-home controller.
  - A terminal walkthrough, my PowerShell Gallery modules, my tech stack and contact links.
- **MarkSmith ([`marksmith.html`](marksmith.html))** is a dedicated product page. It has an interactive Markdown-to-Word demo, side-by-side comparisons with Pandoc and other converters, downloadable sample documents and pricing.

## Tech

It's a plain static site: HTML, CSS and vanilla JavaScript, with no build step. It's hosted on **GitHub Pages** at a custom domain, and every push to `main` redeploys it through GitHub Actions ([`deploy.yml`](.github/workflows/deploy.yml)).

To preview locally, open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

---

## 📝 Footnote: PowerShell scripts

You'll also notice a few PowerShell scripts in the repo root. The site isn't about them. They live here for two reasons:

- **To keep them.** Like a one-offs repo, they're tools I want to hold on to permanently.
- **To run them quickly.** Because GitHub Pages serves these files at `onyachamp.com`, I can run them on any machine, including a fresh Windows install at OOBE (`Shift + F10`), with a single `irm | iex` line:

```powershell
irm https://onyachamp.com/autopilot | iex   # Autopilot OOBE Command Hub
irm https://onyachamp.com/cascade   | iex   # UpdateCascade (Windows Update & driver loop)
```

| File | What it is |
| :--- | :--- |
| `autopilot` / `autopilot.ps1` | Autopilot OOBE Command Hub. It's automatically synced from [AutopilotCommandHub](https://github.com/thebubbsy/AutopilotCommandHub). |
| `cascade` / `cascade.ps1` | UpdateCascade, a multi-pass Windows Update and driver installer that keeps running across reboots. See [UpdateCascade](https://github.com/thebubbsy/UpdateCascade). |
| `Get-DellWarranty.ps1` | Dell warranty and hardware-refresh lookup. It needs your own Dell API credentials; see `.env.example`. |
| `Start-DeviceAuth.ps1` | Device-code sign-in helper for Microsoft Graph and Intune. |

The copies without an extension exist so the `irm` URLs stay short. Full documentation for each tool lives in its own repository.
