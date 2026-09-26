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

- **Downloads ([`resources.html`](resources.html))** lists the latest `.exe`, `.msi` and `.ps1` files from my public GitHub repos: assets from each repo's latest release, plus `.ps1` files in each repo's root. Files download straight from GitHub. A GitHub Action ([`resources-manifest.yml`](.github/workflows/resources-manifest.yml)) refreshes the list every 6 hours.

## Tech

It's a plain static site: HTML, CSS and vanilla JavaScript, with no build step. It's hosted on **GitHub Pages** at a custom domain, and every push to `main` redeploys it through GitHub Actions ([`deploy.yml`](.github/workflows/deploy.yml)).

To preview locally, open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

### Download counter

The Downloads page counts clicks with a small Cloudflare Worker ([`worker/`](worker)) that stores daily totals in D1 and serves `onyachamp.com/api/downloads/*`. It only counts downloads started from the site, not downloads made directly on GitHub. It stores no IPs or visitor data.

One-time setup:

1. Create the database: `npx wrangler d1 create onyachamp-stats`, then paste the printed `database_id` into [`worker/wrangler.toml`](worker/wrangler.toml).
2. Add repo secrets `CLOUDFLARE_API_TOKEN` (with Workers Scripts, Workers Routes and D1 edit permissions) and `CLOUDFLARE_ACCOUNT_ID`.
3. Push to `main` (or run the **Deploy download counter** workflow). It applies [`worker/schema.sql`](worker/schema.sql) and deploys the Worker.

Until that's done, the page still works; it just shows no counts.

---

## PowerShell scripts

The `.ps1` files in the root aren't part of the site. They're stored here to keep, and because Pages serves them, two of them can be run on any machine (including at OOBE with `Shift + F10`) in one line:

```powershell
irm https://onyachamp.com/autopilot | iex   # Autopilot OOBE Command Hub
irm https://onyachamp.com/cascade   | iex   # UpdateCascade
```

- `autopilot`, `autopilot.ps1`: [AutopilotCommandHub](https://github.com/thebubbsy/AutopilotCommandHub), synced automatically
- `cascade`, `cascade.ps1`: [UpdateCascade](https://github.com/thebubbsy/UpdateCascade), a Windows Update and driver installer that keeps running across reboots
- `Get-DellWarranty.ps1`: Dell warranty lookup (needs your own API credentials, see `.env.example`)
- `Start-DeviceAuth.ps1`: device-code sign-in for Microsoft Graph and Intune
