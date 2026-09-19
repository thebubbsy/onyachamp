# OnyaChamp.com

Official platform and systems engineering ecosystem by **Matthew Bubb** (OnyaChamp).

---

## ⚡ Autopilot OOBE Command Hub (`/autopilot`)

A zero-dependency, enterprise-hardened Windows Autopilot OOBE bootstrap engine with an interactive cyber-dark WPF GUI. Designed for field IT technicians during Windows Setup (`Shift + F10`).

### 🚀 1-Line Bootstrap Invocations
```powershell
# Launch interactive cyber-dark GUI
irm https://onyachamp.com/autopilot | iex

# Or execute direct Dell Warranty & Refresh Lifecycle inspection
irm https://onyachamp.com/autopilot | iex -ArgumentList '-DellWarranty'
```

### 🛠️ Core Capabilities
1. **🛡️ Autopilot & Cloud Registration**: High-speed WMI hardware hash harvester (`MDM_DevDetail_Ext01` & OA3 ASN.1 parser), direct Microsoft Intune tenant registration via Graph API (Device Code flow & Client Secrets), profile assignment polling, and CSV export with automated USB flash drive detection.
2. **📦 App Installation Hub (`WingetBatch`)**: Curated multi-bundle enterprise workstation software installer with parallel winget execution, scope selection (System / User), and unattended switches.
3. **🚀 Win32 App Packaging (`WingetIntune`)**: Generates production `.intunewin` containers and packaging manifests directly from winget package manifests with optional cloud upload to Intune.
4. **🔍 7-Stage Pre-Flight Diagnostics (`IntuneShared`)**: Rigorous verification ladder (NIC, Gateway, DNS, Graph API endpoints, TLS 1.2/1.3, TPM 2.0 endorsement, Secure Boot UEFI status).
5. **🏷️ Dell Warranty & Refresh Lifecycle Engine (eAPI v5)**: Real-time vendor SLA entitlement audit and automated hardware refresh determination for fleet management.

---

## 🏷️ Dell Asset Warranty & Hardware Refresh Lifecycle Engine

Directly queries the **Dell Technologies Enterprise Warranty API (SBIL eAPI v5)** to evaluate incoming, returned, or refreshed laptop fleets, determining whether devices should be redeployed or decommissioned.

### 📋 Refresh Determination Rules
| SLA Posture | Days Remaining | Lifecycle Verdict | Action Recommendation |
| :--- | :--- | :--- | :--- |
| **Active Contract** | `> 90 Days` | `ELIGIBLE FOR DEPLOYMENT (DO NOT REFRESH)` | Fully covered under vendor SLA. Eligible for immediate user redeployment. |
| **Expiring Soon** | `1 - 90 Days` | `REFRESH PLANNING (EXPIRING SOON)` | Vendor SLA expires within current fiscal quarter. Schedule replacement cycle. |
| **Expired** | `<= 0 Days` | `REFRESH RECOMMENDED (OUT OF WARRANTY)` | SLA and repair coverage lapsed. Strong candidate for decommissioning. |

### 🔧 Standalone Usage (`Get-DellWarranty.ps1`)
```powershell
# Inspect the local machine's BIOS Service Tag automatically
.\Get-DellWarranty.ps1

# Inspect a specific remote Service Tag in Table format
.\Get-DellWarranty.ps1 -ServiceTag "6BYQJW2" -OutputFormat Table

# Export audit to CSV (auto-detects USB flash drives in GUI)
.\Get-DellWarranty.ps1 -ServiceTag "6BYQJW2" -ExportCsv ".\WarrantyAudit.csv"

# Output structured JSON for automation pipelines
.\Get-DellWarranty.ps1 -ServiceTag "6BYQJW2" -OutputFormat Json
```

### 🔐 API Credential Configuration (`.env`)
The tool works **zero-config out-of-the-box** via embedded enterprise defaults, and seamlessly supports `.env` configuration file overrides:
```env
# Dell Warranty API Credentials (Dell TechDirect SBIL eAPI v5)
DELL_CLIENT_ID=l71df1d39771064ce8a49569b4b56b67c5
DELL_CLIENT_SECRET=c4ec5f7556fa4bc6bb1a5164878f5e2c
DELL_TOKEN_URL=https://apigtwb2c.us.dell.com/auth/oauth/v2/token
DELL_WARRANTY_URL=https://apigtwb2c.us.dell.com/PROD/sbil/eapi/v5/asset-entitlements
```

---

## 🌐 Open-Source Systems & Architecture Showcase
- **MarkSmith**: Next-generation ECMA-376 OpenXML & Markdown compiler for enterprise Office document generation.
- **WingetIntune**: Autonomous PowerShell module bridging winget repository manifests with Microsoft Intune Win32 deployment pipelines.
- **WingetBatch**: High-speed parallel software installer for provisioning field laptops.
- **whisper-writer**: Local AI voice transcription utility.
- **broadlink-garage-controller**: Serverless edge IoT controller runtime.

Hosted on GitHub Pages with continuous deployment via GitHub Actions.

