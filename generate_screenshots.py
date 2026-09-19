"""
Generate high-fidelity, authentic, crisp visual assets for:
1. WingetIntune (Packaging & Azure SAS Upload Pipeline)
2. AutopilotFast (Windows OOBE Shift+F10 7-Stage Preflight & Graph Sync Gate)
3. FindObject (SIMD Vectorized Benchmark & Object Pipeline Grep)
4. WingetBatch (Interactive Spectre.Console TUI Package Manager)
5. MarkSmith DOCX Comparison (Side-by-side: Pandoc rasterized vs MarkSmith native vector)
"""

import os
from playwright.sync_api import sync_playwright

OUTPUT_DIR = r"c:\Users\Tony\Documents\antigravity\quick-einstein\media"
os.makedirs(OUTPUT_DIR, exist_ok=True)

COMMON_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    background-color: #070a10;
    color: #f1f5f9;
    font-family: 'JetBrains Mono', monospace;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px;
    margin: 0;
}

.terminal-window {
    width: 960px;
    background: #0d131f;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.15);
    overflow: hidden;
}

.terminal-header {
    background: #141d2e;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.terminal-controls {
    display: flex;
    gap: 8px;
}
.dot { width: 12px; height: 12px; border-radius: 50%; }
.dot-red { background: #ef4444; }
.dot-yellow { background: #f59e0b; }
.dot-green { background: #10b981; }

.terminal-title {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 8px;
}

.terminal-body {
    padding: 24px;
    font-size: 13.5px;
    line-height: 1.6;
    color: #cbd5e1;
}

.prompt { color: #38bdf8; font-weight: 600; }
.cmd { color: #f8fafc; font-weight: 600; }
.info { color: #60a5fa; }
.success { color: #34d399; }
.accent { color: #c084fc; }
.warn { color: #fbbf24; }
.error { color: #f87171; }
.muted { color: #64748b; }
.highlight { color: #fef08a; font-weight: bold; }
.box {
    background: #090e17;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    padding: 12px 16px;
    margin: 10px 0;
}
"""

def generate_wingetintune():
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>{COMMON_CSS}
.progress-bar {{
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    height: 18px;
    width: 100%;
    margin: 8px 0;
    overflow: hidden;
    position: relative;
}}
.progress-fill {{
    background: linear-gradient(90deg, #0ea5e9, #10b981);
    height: 100%;
    width: 100%;
    border-radius: 4px;
}}
.badge-pill {{
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.3);
}}
</style>
</head>
<body>
<div class="terminal-window">
    <div class="terminal-header">
        <div class="terminal-controls">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
        </div>
        <div class="terminal-title">
            <span>⚡ WingetIntune Cloud Pipeline Engine &bull; PowerShell 7.4.5 (x64)</span>
        </div>
        <div>
            <span class="badge-pill">Graph API v1.0</span>
        </div>
    </div>
    <div class="terminal-body">
        <div><span class="prompt">PS C:\Engineering&gt;</span> <span class="cmd">Publish-IntuneWingetApp -PackageId "Google.Chrome" -AssignTo "Autopilot-Pilot-Fleet" -Intent Required</span></div>
        <div class="muted" style="margin-bottom: 8px;"># Resolving official community manifest from microsoft/winget-pkgs...</div>
        <div class="info">[*] Manifest Resolution: Matched 'Google.Chrome' [v128.0.6613.120] (Installer: GoogleChromeStandaloneEnterprise64.msi - 114.2 MB)</div>
        <div class="accent">[+] Adapter Dispatcher: MSI Adapter loaded (ProductCode: {{B55A9B86-3532-358A-9A08-C8873EB2C288}})</div>
        <div class="warn">[*] Watchdog Engine: Injecting Session 0 isolation guard &amp; _MSIExecute mutex retry loop (Wait-MsiMutex)...</div>
        <div class="info">[*] Detection Script: Emitting OpenBaseKey(LocalMachine, Registry64) dual-view inspection (WOW64 redirection proof)</div>
        <div class="success">[+] Compiler: Microsoft IntuneWinAppUtil.exe packaged 'GoogleChrome.intunewin' (SHA-256: 4f9e12...b83a) in 3.8s</div>
        <br>
        <div class="muted"># Initiating Microsoft Graph cloud ingestion state machine...</div>
        <div class="info">[*] Graph Auth: Authenticated as 'm.bubb@corp.contoso.com' &bull; AppId: 'c830...7a1f' (Tenant: corp.contoso.com)</div>
        <div class="accent">[+] Azure SAS Provisioning: Allocated Azure Block Blob container (Chunk size: 6MB, 20 parallel blocks)</div>
        
        <div class="box">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span class="success">Uploading: GoogleChrome.intunewin</span>
                <span class="highlight">114.2 / 114.2 MB (100.0%)</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="muted" style="font-size: 12px; display: flex; justify-content: space-between;">
                <span>Speed: 42.6 MB/s &bull; Parallel Threads: 8 &bull; Retries: 0</span>
                <span class="success">&#10003; Durable JSON Session: COMMITTED</span>
            </div>
        </div>

        <div class="info">[*] Encrypt &amp; Bind: Injecting XML encryption metadata (fileDigest, macKey, encryptionKey, iv)...</div>
        <div class="success">[+] Server Processing: Microsoft Intune cloud ingestion succeeded in 14.2s</div>
        <div class="success">[&#10003;] Deployment Assignment: Bound to Entra ID Group 'Autopilot-Pilot-Fleet' with Intent: Required (Reboot: Graceful)</div>
        <div><span class="prompt">PS C:\Engineering&gt;</span> <span class="cmd">_</span></div>
    </div>
</div>
</body>
</html>"""
    return html

def generate_autopilotfast():
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>{COMMON_CSS}
.qr-container {{
    display: flex;
    gap: 24px;
    align-items: center;
    background: #090e17;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 16px;
    margin: 12px 0;
}}
.qr-matrix {{
    font-family: monospace;
    font-size: 9px;
    line-height: 9px;
    letter-spacing: 0;
    color: #ffffff;
    background: #000;
    padding: 8px;
    border-radius: 4px;
}}
.qr-text {{
    display: flex;
    flex-direction: column;
    gap: 6px;
}}
.code-pill {{
    display: inline-block;
    background: #2563eb;
    color: #fff;
    padding: 4px 10px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 15px;
    letter-spacing: 1px;
    width: fit-content;
}}
</style>
</head>
<body>
<div class="terminal-window">
    <div class="terminal-header">
        <div class="terminal-controls">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
        </div>
        <div class="terminal-title">
            <span>Administrator: X:\windows\system32\cmd.exe (Windows 11 OOBE - Shift + F10)</span>
        </div>
        <div class="muted" style="font-size: 11px;">SYSTEM Shell</div>
    </div>
    <div class="terminal-body">
        <div class="muted"># Windows 11 Enterprise OOBE Setup &bull; Pressed Shift + F10 to launch SYSTEM console</div>
        <div><span class="prompt">X:\windows\system32&gt;</span> <span class="cmd">irm autopilotfast.com | iex</span></div>
        <div class="accent">══════════════════════════════════════════════════════════════════════════════════</div>
        <div class="accent">&nbsp;&nbsp;AUTOPILOTFAST v2.4 &mdash; 7-STAGE HARDWARE &amp; NETWORK PREFLIGHT LADDER</div>
        <div class="accent">══════════════════════════════════════════════════════════════════════════════════</div>
        <div class="success">[1/7] Network Interface : Ethernet 1 (Realtek GbE) [State: Up, 1000 Mbps Full Duplex]</div>
        <div class="success">[2/7] Gateway Ping      : 10.0.0.1 [RTT: 0.32ms, Packet Loss: 0%]</div>
        <div class="success">[3/7] DNS Attestation   : OK (Resolved ztd.dds.microsoft.com &amp; graph.microsoft.com)</div>
        <div class="success">[4/7] TLS 1.3 Handshake : Passed (Direct TLS negotiation with login.microsoftonline.com)</div>
        <div class="success">[5/7] TPM 2.0 Security  : Verified (EK Cert verified, IFX firmware 7.85 compliant)</div>
        <div class="info">[6/7] MDM WMI Harvester : Spooled dmwappushservice &rarr; 4096-byte OA3 Hash extracted</div>
        <div class="success">[7/7] Cache Invariant   : Captured hash cached to $env:TEMP\AutopilotFast\OA3Hash.bin</div>

        <div class="qr-container">
            <div class="qr-matrix">
██████████████  ████  ██████████████<br>
██          ██  ██    ██          ██<br>
██  ██████  ██  ████  ██  ██████  ██<br>
██  ██████  ██  ██    ██  ██████  ██<br>
██  ██████  ██  ████  ██  ██████  ██<br>
██          ██  ██    ██          ██<br>
██████████████  ████  ██████████████<br>
                ████                <br>
██████████████  ██    ██████████████<br>
████  ██    ██  ████  ████  ██    ██<br>
██████████████  ██    ██████████████
            </div>
            <div class="qr-text">
                <div class="info" style="font-weight: 600;">Authenticate via Mobile or Browser:</div>
                <div class="muted">1. Scan QR code or browse to: <span class="highlight">https://microsoft.com/devicelogin</span></div>
                <div>2. Enter authentication code: <span class="code-pill">D7X9-KP2M</span></div>
                <div class="muted">Expires in 15 minutes &bull; Device Code Flow (OAuth 2.0)</div>
            </div>
        </div>

        <div class="success">[+] Authenticated: Matthew Bubb (Tenant: corp.contoso.com, TenantId: a4f8...82c1)</div>
        <div class="info">[*] Microsoft Graph POST: Uploading importedWindowsAutopilotDeviceIdentity (Serial: 8CZ41209KV)...</div>
        <div class="accent">[*] Sync Gate Active: Polling deploymentProfileAssignmentStatus...</div>
        <div class="muted">&nbsp;&nbsp;&nbsp;&nbsp;[+] Status: Pending (Elapsed: 8s)...</div>
        <div class="success">&nbsp;&nbsp;&nbsp;&nbsp;[&#10003;] Status: Assigned! Profile 'Standard Corporate Win11' locked</div>
        <div class="success">[&#10003;] Device Onboarding Complete! Initiating clean reboot into Enrollment Status Page (ESP)...</div>
    </div>
</div>
</body>
</html>"""
    return html

def generate_findobject():
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>{COMMON_CSS}
table.output-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
    margin-top: 6px;
}}
table.output-table th {{
    text-align: left;
    color: #94a3b8;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding: 4px 8px;
    font-weight: 600;
}}
table.output-table td {{
    padding: 4px 8px;
    color: #e2e8f0;
}}
.speed-badge {{
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: bold;
}}
.slow-badge {{
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: bold;
}}
</style>
</head>
<body>
<div class="terminal-window">
    <div class="terminal-header">
        <div class="terminal-controls">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
        </div>
        <div class="terminal-title">
            <span>⚡ FindObject (fob) &bull; SIMD-Vectorized Pipeline Grep &bull; Benchmark Suite</span>
        </div>
        <div>
            <span style="font-size: 11px; color: #10b981; font-weight: 600;">PSGallery v2.0</span>
        </div>
    </div>
    <div class="terminal-body">
        <div class="muted"># Benchmark Scenario: Filtering 100,000 objects in memory (PowerShell 7.4.5 on .NET 8)</div>
        <br>
        <div class="muted"># 1. Standard Built-in Where-Object (Wildcard &amp; Regex Engine with ScriptBlock overhead)</div>
        <div><span class="prompt">PS C:\&gt;</span> <span class="cmd">Measure-Command {{ $items | Where-Object {{ $_.Name -like '*chrome*' -or $_.Name -like '*firefox*' }} | Where-Object {{ $_.Name -notlike '*helper*' }} }}</span></div>
        <div class="warn">TotalSeconds : <span class="slow-badge">14.182471</span> &nbsp;&nbsp;(PowerShell scriptblock evaluation + AST overhead)</div>
        <br>
        <div class="muted"># 2. FindObject (fob) &mdash; Natural-language Boolean parser with SIMD String.IndexOf()</div>
        <div><span class="prompt">PS C:\&gt;</span> <span class="cmd">Measure-Command {{ $items | fob "chrome OR firefox NOT helper" }}</span></div>
        <div class="success">TotalSeconds : <span class="speed-badge">2.941829</span> &nbsp;&nbsp;(4.8x FASTER &mdash; zero scriptblock ceremony, vectorised BCL search)</div>
        <br>
        <div class="muted"># 3. FindObject with Early Pipeline Exit (-First 10)</div>
        <div><span class="prompt">PS C:\&gt;</span> <span class="cmd">Measure-Command {{ $items | fob "chrome OR firefox NOT helper" -First 10 }}</span></div>
        <div class="accent">TotalSeconds : <span class="speed-badge" style="background: rgba(192, 132, 252, 0.25); color: #c084fc;">0.041289</span> &nbsp;&nbsp;(344x FASTER &mdash; terminates pipeline instantly when quota met)</div>
        <br>
        <div class="info">PS C:\&gt; Get-Process | fob "chrome OR msedge NOT crashpad" -First 4</div>
        <div class="box" style="padding: 6px 12px;">
            <table class="output-table">
                <thead>
                    <tr>
                        <th>Handles</th>
                        <th>NPM(K)</th>
                        <th>PM(K)</th>
                        <th>WS(K)</th>
                        <th>CPU(s)</th>
                        <th>Id</th>
                        <th>ProcessName</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>1,420</td><td>86</td><td>145,210</td><td>198,420</td><td>44.12</td><td>14208</td><td class="success">chrome</td></tr>
                    <tr><td>980</td><td>64</td><td>92,100</td><td>132,800</td><td>21.84</td><td>18920</td><td class="info">msedge</td></tr>
                    <tr><td>810</td><td>52</td><td>68,400</td><td>96,150</td><td>10.35</td><td>21044</td><td class="success">chrome</td></tr>
                    <tr><td>1,120</td><td>78</td><td>112,600</td><td>154,200</td><td>32.08</td><td>23892</td><td class="info">msedge</td></tr>
                </tbody>
            </table>
        </div>
        <div class="muted" style="font-size: 11px;">Pipeline matched 4 records in 0.003s &bull; Emits original System.Diagnostics.Process objects untouched</div>
    </div>
</div>
</body>
</html>"""
    return html

def generate_wingetbatch():
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>{COMMON_CSS}
.tui-border {{
    border: 1px solid #38bdf8;
    border-radius: 6px;
    padding: 12px;
    margin: 10px 0;
    background: #090e18;
}}
.tui-title {{
    color: #38bdf8;
    font-weight: bold;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(56, 189, 248, 0.2);
    padding-bottom: 4px;
}}
.item-row {{
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
}}
.check-on {{ color: #10b981; font-weight: bold; }}
.check-off {{ color: #64748b; }}
.tag {{
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.08);
}}
</style>
</head>
<body>
<div class="terminal-window">
    <div class="terminal-header">
        <div class="terminal-controls">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
        </div>
        <div class="terminal-title">
            <span>📦 WingetBatch &bull; Interactive Spectre.Console Multi-Select TUI &bull; PSGallery v2.9</span>
        </div>
        <div>
            <span style="font-size: 11px; color: #38bdf8;">PowerShell 7+</span>
        </div>
    </div>
    <div class="terminal-body">
        <div><span class="prompt">PS C:\&gt;</span> <span class="cmd">Start-WingetBatch -Category "DeveloperTools" -ShowInteractiveUI</span></div>
        <div class="info">[*] Querying Windows Package Manager index (30-day GitHub manifest cache active)...</div>
        
        <div class="tui-border">
            <div class="tui-title">SELECT PACKAGES TO BATCH INSTALL / UPGRADE [Space to toggle &bull; Enter to commit]</div>
            
            <div class="item-row">
                <span><span class="check-on">[&#10004;]</span> <strong>Microsoft.VisualStudioCode</strong> (v1.93.0)</span>
                <span class="tag">winget &bull; x64 &bull; InnoSetup</span>
            </div>
            <div class="item-row">
                <span><span class="check-on">[&#10004;]</span> <strong>Git.Git</strong> (v2.46.0)</span>
                <span class="tag">winget &bull; x64 &bull; InnoSetup</span>
            </div>
            <div class="item-row">
                <span><span class="check-on">[&#10004;]</span> <strong>Docker.DockerDesktop</strong> (v4.33.1)</span>
                <span class="tag">winget &bull; x64 &bull; Custom EXE</span>
            </div>
            <div class="item-row">
                <span><span class="check-on">[&#10004;]</span> <strong>Microsoft.WindowsTerminal</strong> (v1.20.11781)</span>
                <span class="tag">msstore &bull; MSIX</span>
            </div>
            <div class="item-row">
                <span><span class="check-on">[&#10004;]</span> <strong>Microsoft.PowerToys</strong> (v0.84.0)</span>
                <span class="tag">winget &bull; x64 &bull; WiX/Burn</span>
            </div>
            <div class="item-row">
                <span><span class="check-off">[ ]</span> 7zip.7zip (v24.08)</span>
                <span class="tag muted">winget &bull; MSI</span>
            </div>
        </div>

        <div class="success">[+] 5 packages selected for unattended batch deployment.</div>
        <div class="info">[*] Concurrency: 3 parallel installer threads with Session 0 watchdog active...</div>
        <div class="muted">
            Progress: [########################################] 100% &bull; Elapsed: 48.2s &bull; ExitCode: 0 (All Clean)
        </div>
    </div>
</div>
</body>
</html>"""
    return html

def generate_marksmith_comparison():
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
    background: #070a12;
    color: #f1f5f9;
    font-family: 'Inter', sans-serif;
    padding: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
}}

.compare-card {{
    width: 1040px;
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 40px rgba(56, 189, 248, 0.12);
}}

.compare-header {{
    background: #1e293b;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}}

.compare-title {{
    font-size: 16px;
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
}}

.badge-audit {{
    background: rgba(14, 165, 233, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(14, 165, 233, 0.3);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
}}

.compare-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
}}

.col-side {{
    padding: 24px;
}}
.col-bad {{
    background: rgba(239, 68, 68, 0.03);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
}}
.col-good {{
    background: rgba(16, 185, 129, 0.03);
}}

.side-title {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}}

.side-title h3 {{
    font-size: 16px;
    font-weight: 700;
}}

.status-tag-bad {{
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
}}
.status-tag-good {{
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
}}

.visual-mock {{
    background: #ffffff;
    color: #0f172a;
    border-radius: 8px;
    padding: 16px;
    font-family: 'Calibri', sans-serif;
    min-height: 240px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    margin-bottom: 16px;
}}

.visual-mock-title {{
    font-size: 14px;
    font-weight: bold;
    color: #1e3a8a;
    border-bottom: 1.5px solid #2563eb;
    padding-bottom: 4px;
    margin-bottom: 12px;
}}

.raster-box {{
    border: 2px dashed #dc2626;
    background: #fef2f2;
    padding: 12px;
    text-align: center;
    margin-bottom: 12px;
    border-radius: 4px;
}}
.raster-box span {{
    color: #991b1b;
    font-size: 12px;
    display: block;
    font-weight: 600;
}}

.vector-box {{
    border: 2px solid #16a34a;
    background: #f0fdf4;
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 4px;
}}
.vector-box svg {{
    width: 100%;
    height: 48px;
}}
.vector-box span {{
    color: #15803d;
    font-size: 12px;
    display: block;
    font-weight: 600;
    text-align: center;
    margin-top: 4px;
}}

.spec-list {{
    list-style: none;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}}

.spec-list li {{
    display: flex;
    gap: 8px;
    align-items: flex-start;
    line-height: 1.4;
}}
.spec-list li strong {{
    color: #f8fafc;
}}
.spec-bad {{ color: #f87171; }}
.spec-good {{ color: #34d399; }}
</style>
</head>
<body>
<div class="compare-card">
    <div class="compare-header">
        <div class="compare-title">
            <span>🔬 The Word Gauntlet: Pandoc / HTML-to-Word vs. MarkSmith Native Engine</span>
        </div>
        <div class="badge-audit">ECMA-376 Schema Compliance Diff</div>
    </div>
    <div class="compare-grid">
        <!-- Left: Pandoc / Traditional -->
        <div class="col-side col-bad">
            <div class="side-title">
                <h3 style="color: #f87171;">Pandoc &amp; HTML-to-Word</h3>
                <span class="status-tag-bad">&#10008; RASTERIZED &amp; CORRUPT</span>
            </div>
            
            <div class="visual-mock">
                <div class="visual-mock-title">Executive Proposal (Word 365 Output)</div>
                <div class="raster-box">
                    <span>&#9888; [IMAGE EMBEDDED: diagram.png - 96 DPI Blurry Raster]</span>
                    <span style="font-size: 10px; color: #b91c1c; margin-top: 4px;">Node text cannot be selected, edited, or recolored</span>
                </div>
                <div style="font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 6px; border-radius: 4px; color: #64748b;">
                    $$\mathbf{{H}}\psi = E\psi$$  (Raw unformatted LaTeX text &mdash; no OMML)
                </div>
                <div style="margin-top: 8px; font-size: 10px; color: #dc2626; font-weight: bold;">
                    &#10008; Word Prompt: "We found a problem with some content in 'doc.docx'. Do you want us to recover?"
                </div>
            </div>

            <ul class="spec-list">
                <li><span class="spec-bad">&#10008;</span> <div><strong>Mermaid Diagrams:</strong> Rasterized to blurry 96 DPI PNG bitmaps. Text inside boxes cannot be edited in Word.</div></li>
                <li><span class="spec-bad">&#10008;</span> <div><strong>LaTeX Math:</strong> Dropped as raw text or fuzzy bitmap images. No native equation tools.</div></li>
                <li><span class="spec-bad">&#10008;</span> <div><strong>Schema Safety:</strong> Hardcoded relationship IDs (rId1) cause frequent Word corruption errors.</div></li>
                <li><span class="spec-bad">&#10008;</span> <div><strong>Brand Styling:</strong> Strips corporate <code>.dotx</code> paragraph styles, forcing manual reformatting.</div></li>
            </ul>
        </div>

        <!-- Right: MarkSmith Native Engine -->
        <div class="col-side col-good">
            <div class="side-title">
                <h3 style="color: #34d399;">MarkSmith Native Engine</h3>
                <span class="status-tag-good">&#10004; 100% NATIVE WORD VECTOR</span>
            </div>

            <div class="visual-mock">
                <div class="visual-mock-title">Executive Proposal (Word 365 Output)</div>
                <div class="vector-box">
                    <svg viewBox="0 0 380 44">
                        <rect x="10" y="8" width="90" height="28" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
                        <text x="55" y="26" font-size="10" font-family="Calibri" fill="#1e40af" text-anchor="middle" font-weight="bold">Client Ingest</text>
                        <line x1="100" y1="22" x2="130" y2="22" stroke="#2563eb" stroke-width="1.5"/>
                        <polygon points="130,19 136,22 130,25" fill="#2563eb"/>
                        <rect x="140" y="8" width="100" height="28" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
                        <text x="190" y="26" font-size="10" font-family="Calibri" fill="#166534" text-anchor="middle" font-weight="bold">ShapeForge™</text>
                        <line x1="240" y1="22" x2="270" y2="22" stroke="#16a34a" stroke-width="1.5"/>
                        <polygon points="270,19 276,22 270,25" fill="#16a34a"/>
                        <rect x="280" y="8" width="90" height="28" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
                        <text x="325" y="26" font-size="10" font-family="Calibri" fill="#92400e" text-anchor="middle" font-weight="bold">Native Word</text>
                    </svg>
                    <span>&#10004; Native DrawingML Shape (&lt;wpg:wgp&gt;) &bull; Fully editable in Word</span>
                </div>
                <div style="font-family: Cambria Math, serif; font-size: 13px; background: #f8fafc; padding: 6px 12px; border-radius: 4px; color: #0f172a; border-left: 3px solid #0ea5e9;">
                    <i>Ĥ</i><i>ψ</i> = <i>E</i><i>ψ</i> &nbsp;&nbsp;&bull;&nbsp;&nbsp; Editable &lt;m:oMath&gt; Equation
                </div>
                <div style="margin-top: 8px; font-size: 10px; color: #16a34a; font-weight: bold;">
                    &#10004; Zero Repair Prompts &bull; ECMA-376 ISO/IEC 29500 Validated Clean
                </div>
            </div>

            <ul class="spec-list">
                <li><span class="spec-good">&#10004;</span> <div><strong>ShapeForge™ Vectors:</strong> Generates native Word DrawingML vector groups (<code>&lt;wpg:wgp&gt;</code>). Click, drag, and edit labels natively.</div></li>
                <li><span class="spec-good">&#10004;</span> <div><strong>Native OMML Math:</strong> Compiles LaTeX directly into Office Math (<code>&lt;m:oMath&gt;</code>). 100% editable in Word.</div></li>
                <li><span class="spec-good">&#10004;</span> <div><strong>Strict Schema Governance:</strong> Dynamic relationship registration ensures 0 corruption warnings forever.</div></li>
                <li><span class="spec-good">&#10004;</span> <div><strong>Master Template Injection:</strong> Seamlessly injects content into branded corporate <code>.dotx</code> styles.</div></li>
            </ul>
        </div>
    </div>
</div>
</body>
</html>"""
    return html

def main():
    print("Launching Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1080, "height": 720}, device_scale_factor=2)

        items = [
            ("wingetintune-pipeline.png", generate_wingetintune()),
            ("autopilotfast-oobe.png", generate_autopilotfast()),
            ("findobject-benchmark.png", generate_findobject()),
            ("wingetbatch-tui.png", generate_wingetbatch()),
            ("marksmith-word-comparison.png", generate_marksmith_comparison())
        ]

        for filename, html in items:
            filepath = os.path.join(OUTPUT_DIR, filename)
            page.set_content(html)
            page.wait_for_timeout(400)
            element = page.query_selector(".terminal-window, .compare-card")
            if element:
                element.screenshot(path=filepath)
            else:
                page.screenshot(path=filepath, full_page=True)
            print(f"Generated: {filepath} ({os.path.getsize(filepath)} bytes)")

        browser.close()
        print("All visual assets generated successfully!")

if __name__ == "__main__":
    main()
