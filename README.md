# OnyaChamp.com

The personal portfolio of **Matthew Bubb** (OnyaChamp), a systems engineer and tooling architect based in Australia.

🌍 **Live site:** [onyachamp.com](https://onyachamp.com)

---

## What's on the site

It's a traditional multi-page site: every page shares the same top menu, and the home page links to each one.

| Page | What's on it |
| :--- | :--- |
| [`index.html`](index.html) | Home: about me, November 2026 recent engineering log, plus a directory of every page |
| [`marksmith.html`](marksmith.html) | MarkSmith (v3.111.0), my Markdown-to-Office compiler & 6-Studio WinUI 3 desktop suite: live demo, comparisons, pricing |
| [`fuelahead.html`](fuelahead.html) | FuelAhead NSW (v1.10), hands-free rider & driver fuel radar for iOS, Android, and Web (`fuel.onyachamp.com`) |
| [`teams-chat-exporter.html`](teams-chat-exporter.html) | TeamsChatExporter Pro |
| [`garage-controller.html`](garage-controller.html) | broadlink-garage-controller (`garage.onyachamp.com`) |
| [`cli-tour.html`](cli-tour.html) | Interactive 6-pipeline terminal tour (WingetIntune, AutopilotFast, UpdateCascade, AutopilotCommandHub, FindObject, MarkSmith CLI) |
| [`tools.html`](tools.html) | Full 18-project catalog of my PowerShell modules, OOBE engines, OSINT hubs, browser extensions, and utilities |
| [`stack.html`](stack.html) | My 12-domain engineering stack & architectural specialties |
| [`resources.html`](resources.html) | Downloads: the latest `.exe`, `.msi` and `.ps1` files from my public repos, straight from GitHub. A GitHub Action ([`resources-manifest.yml`](.github/workflows/resources-manifest.yml)) refreshes the list every 6 hours; build/publish helpers and tests are skipped. |
| [`contact.html`](contact.html) | Contact links |

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
