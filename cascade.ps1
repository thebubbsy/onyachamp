<#
.SYNOPSIS
    UpdateCascade - Autonomous Multi-Pass Windows Update & Driver Engine with Bulletproof Reboot Persistence.
.DESCRIPTION
    UpdateCascade is a standalone, single-file Windows Update and Driver cascade utility engineered
    for Windows 11, Windows 10, Windows Server, and Windows Setup (OOBE Shift+F10).

    Features:
    - 1-Click Autonomous Multi-Pass Cascade: Scans, downloads, installs, countdown reboots,
      and persistently relaunches across reboots until 0 updates remain or -MaxPasses is reached.
    - Bulletproof Multi-Tier Relaunch Persistence across ALL Windows lifecycle phases:
      * HKLM RunOnce (Standard + Elevated '*' priority prefix)
      * HKLM Run
      * HKCU RunOnce & Run
      * Default User Profile Hive (C:\Users\Default\NTUSER.DAT) RunOnce/Run injection
      * Scheduled Task (AtLogOn for BUILTIN\Administrators & BUILTIN\Users)
      * Scheduled Task (AtStartup as NT AUTHORITY\SYSTEM)
      * Winlogon Userinit Key Hook
      * Winlogon AppSetup Key Hook
      * Active Setup Component
      * SetupComplete.cmd & ErrorHandler.cmd in %windir%\Setup\Scripts
      * All Users & Default User Startup Folders
      * RunOnceEx Registry Keys
      * Ephemeral Windows Boot Service (UpdateCascadeSvc)
      * Dedicated Bootstrap Launchers (resume.cmd, resume.vbs, launch.cmd)
    - 4-Tier Bulletproof Reboot Execution (shutdown.exe, Win32 InitiateSystemShutdownEx/ExitWindowsEx,
      Restart-Computer -Force, WMI/CIM Win32Shutdown).
    - Modern Win11 Cyber-Dark Lightweight WPF GUI + Headless / Autonomous CLI Automation.
    - Zero external module dependencies: Native COM (Microsoft.Update.Session) & USO Client.

.PARAMETER Autonomous
    Run the cascade completely unattended in headless CLI mode.
.PARAMETER MaxPasses
    Maximum cascade passes (scans/installs/reboots) before completing (default: 5).
.PARAMETER IncludeDrivers
    Include hardware device drivers and firmware updates from Microsoft Update catalog (default: $true).
.PARAMETER RebootDelay
    Reboot countdown delay in seconds (default: 5).
.PARAMETER NoReboot
    Install updates but suppress automatic system reboot.
.PARAMETER ScanOnly
    Query pending updates and drivers without installing.
.PARAMETER ResumeFromRestart
    Internal parameter triggered by persistence launchers to resume the active cascade pass.
.PARAMETER Unregister
    Cleanly remove and unregister all 17 persistence mechanisms and temporary state files.
.PARAMETER Status
    Output the current cascade state as JSON.

.EXAMPLE
    # One-line web bootstrap launch (GUI)
    irm https://onyachamp.com/cascade | iex

.EXAMPLE
    # CLI unattended 5-pass cascade with drivers
    powershell.exe -ExecutionPolicy Bypass -File .\cascade.ps1 -Autonomous -MaxPasses 5 -IncludeDrivers

.EXAMPLE
    # Scan only
    powershell.exe -ExecutionPolicy Bypass -File .\cascade.ps1 -ScanOnly

.EXAMPLE
    # Emergency unregister / cleanup
    powershell.exe -ExecutionPolicy Bypass -File .\cascade.ps1 -Unregister

.NOTES
    Author:  Matthew Bubb <matt@onyachamp.com>
    License: MIT
#>

[CmdletBinding(DefaultParameterSetName = 'Default')]
param(
    [Parameter(ParameterSetName = 'Default')]
    [Parameter(ParameterSetName = 'Interactive')]
    [switch]$Gui,

    [Parameter(ParameterSetName = 'Autonomous')]
    [switch]$Autonomous,

    [Parameter(ParameterSetName = 'Autonomous')]
    [Parameter(ParameterSetName = 'Interactive')]
    [Alias('PatchCascade')]
    [switch]$Cascade,

    [Parameter(ParameterSetName = 'Default')]
    [Parameter(ParameterSetName = 'Autonomous')]
    [Parameter(ParameterSetName = 'Interactive')]
    [int]$MaxPasses = 5,

    [Parameter(ParameterSetName = 'Default')]
    [Parameter(ParameterSetName = 'Autonomous')]
    [Parameter(ParameterSetName = 'Interactive')]
    [switch]$IncludeDrivers = $true,

    [Parameter(ParameterSetName = 'Default')]
    [Parameter(ParameterSetName = 'Autonomous')]
    [Parameter(ParameterSetName = 'Interactive')]
    [int]$RebootDelay = 5,

    [Parameter(ParameterSetName = 'Default')]
    [Parameter(ParameterSetName = 'Autonomous')]
    [Parameter(ParameterSetName = 'Interactive')]
    [switch]$NoReboot,

    [Parameter(ParameterSetName = 'ScanOnly')]
    [switch]$ScanOnly,

    [Parameter(ParameterSetName = 'Resume')]
    [switch]$ResumeFromRestart,

    [Parameter(ParameterSetName = 'BootWorker')]
    [switch]$BootWorker,

    [Parameter(ParameterSetName = 'Unregister')]
    [Alias('Cleanup')]
    [switch]$Unregister,

    [Parameter(ParameterSetName = 'Status')]
    [switch]$Status,

    [string]$LogPath
)

Set-StrictMode -Off
$ErrorActionPreference = 'Continue'

# --- 1. GLOBAL CONSTANTS & DIRECTORIES ---
$script:AppName            = 'UpdateCascade'
$script:AppVersion        = '1.0.0'
$script:PersistDir         = Join-Path $env:ProgramData 'UpdateCascade'
$script:StateFile          = Join-Path $script:PersistDir 'cascade_state.json'
$script:LogFile            = if ($LogPath) { $LogPath } else { Join-Path $script:PersistDir 'cascade.log' }
$script:ScriptSelfCopy     = Join-Path $script:PersistDir 'UpdateCascade.ps1'
$script:ResumeCmd          = Join-Path $script:PersistDir 'resume.cmd'
$script:ResumeVbs          = Join-Path $script:PersistDir 'resume.vbs'
$script:LaunchCmd          = Join-Path $script:PersistDir 'launch.cmd'
$script:MutexName          = 'Global\UpdateCascade_Master_Mutex'
$script:TaskLogonName      = 'UpdateCascade_Logon'
$script:TaskBootName       = 'UpdateCascade_Boot'
$script:ServiceName        = 'UpdateCascadeSvc'
$script:RunOnceName        = '*UpdateCascade'
$script:RunName            = 'UpdateCascade'
$script:ActiveSetupGuid    = '{D8F9A5B2-7C34-4C2E-8E9F-1A2B3C4D5E6F}'
$script:RebootAborted      = $false
$script:GuiLogCallback     = $null

# --- 2. LOGGING ENGINE ---
function Write-CascadeLog {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [ValidateSet('INFO', 'SUCCESS', 'WARN', 'ERROR', 'STEP')]
        [string]$Level = 'INFO'
    )

    $timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    $prefix = "[$timestamp] [$Level]"
    $line = "$prefix $Message"

    $fgColor = switch ($Level) {
        'SUCCESS' { [ConsoleColor]::Green }
        'WARN'    { [ConsoleColor]::Yellow }
        'ERROR'   { [ConsoleColor]::Red }
        'STEP'    { [ConsoleColor]::Cyan }
        default   { [ConsoleColor]::Gray }
    }

    try {
        Write-Host $line -ForegroundColor $fgColor
    } catch {
        [Console]::WriteLine($line)
    }

    try {
        if (-not (Test-Path $script:PersistDir)) {
            New-Item -Path $script:PersistDir -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null
        }
        [System.IO.File]::AppendAllText($script:LogFile, "$line`r`n", [System.Text.Encoding]::UTF8)
    } catch { }

    if ($script:GuiLogCallback) {
        try { & $script:GuiLogCallback $Message $Level } catch { }
    }
}

# --- 3. RUNTIME CONTEXT & ELEVATION ---
function Get-CascadeRuntimeContext {
    [CmdletBinding()]
    param()

    $isSystem = $false
    $isAdmin = $false
    $isOobe = $false
    $userName = $env:USERNAME

    try {
        $ident = [System.Security.Principal.WindowsIdentity]::GetCurrent()
        $isSystem = ($ident.User.Value -eq 'S-1-5-18')
        $princ = [System.Security.Principal.WindowsPrincipal]$ident
        $isAdmin = $princ.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator) -or $isSystem
        $userName = $ident.Name
    } catch { }

    try {
        $setupType = (Get-ItemProperty 'HKLM:\SYSTEM\Setup' -Name 'SetupType' -ErrorAction SilentlyContinue).SetupType
        $oobeInProg = (Get-ItemProperty 'HKLM:\SYSTEM\Setup' -Name 'OOBEInProgress' -ErrorAction SilentlyContinue).OOBEInProgress
        $cmdLine = (Get-ItemProperty 'HKLM:\SYSTEM\Setup' -Name 'CmdLine' -ErrorAction SilentlyContinue).CmdLine
        if ($setupType -gt 0 -or $oobeInProg -eq 1 -or ($cmdLine -and $cmdLine -match 'msoobe')) {
            $isOobe = $true
        }
    } catch { }

    $hostExe = (Get-Process -Id $PID).Path
    if (-not $hostExe -or -not (Test-Path $hostExe)) {
        $hostExe = if ($PSVersionTable.PSEdition -eq 'Core') {
            (Get-Command pwsh.exe -ErrorAction SilentlyContinue).Source
        } else {
            Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
        }
    }

    return [PSCustomObject]@{
        IsSystem      = $isSystem
        IsAdmin       = $isAdmin
        IsOobe        = $isOobe
        UserName      = $userName
        HostExe       = $hostExe
        Interactive   = [Environment]::UserInteractive
    }
}

function Ensure-CascadeElevation {
    [CmdletBinding()]
    param()

    $ctx = Get-CascadeRuntimeContext
    if (-not $ctx.IsAdmin) {
        Write-CascadeLog "Administrator privileges are required for Windows Update installation. Attempting elevation..." "WARN"
        $selfScript = $PSCommandPath
        if (-not $selfScript) {
            $selfScript = Save-CascadeSelfCopy
        }
        $argList = "-NoProfile -ExecutionPolicy Bypass -STA -File `"$selfScript`""
        if ($Autonomous) { $argList += " -Autonomous -MaxPasses $MaxPasses -IncludeDrivers:$IncludeDrivers" }

        try {
            $proc = Start-Process -FilePath "powershell.exe" -ArgumentList $argList -Verb RunAs -PassThru -ErrorAction Stop
            if ($proc) {
                Write-CascadeLog "Elevated process launched (PID: $($proc.Id)). Exiting current unprivileged process." "INFO"
                exit 0
            }
        } catch {
            Write-CascadeLog "Elevation request was cancelled or failed: $($_.Exception.Message)" "ERROR"
            Write-CascadeLog "Please re-run this script in an elevated PowerShell prompt (Run as Administrator)." "ERROR"
            exit 1
        }
    }
}

# --- 4. SELF-PERSISTENCE SCRIPT EMISSION ---
function Save-CascadeSelfCopy {
    [CmdletBinding()]
    param()

    try {
        if (-not (Test-Path $script:PersistDir)) {
            New-Item -Path $script:PersistDir -ItemType Directory -Force | Out-Null
        }

        # 1. Save PowerShell Script Copy
        $scriptSource = $null
        if ($PSCommandPath -and (Test-Path $PSCommandPath)) {
            $scriptSource = [System.IO.File]::ReadAllText($PSCommandPath, [System.Text.Encoding]::UTF8)
        } else {
            # In-memory execution (irm ... | iex)
            # Try reading local development/test script first if present
            $localCandidate = "C:\src\UpdateCascade\cascade.ps1"
            if (Test-Path $localCandidate) {
                try { $scriptSource = [System.IO.File]::ReadAllText($localCandidate, [System.Text.Encoding]::UTF8) } catch { }
            }
            if (-not $scriptSource -or $scriptSource.Length -lt 2000) {
                # Fetch authoritative script payload from remote distribution endpoint
                $fetchUrls = @(
                    'https://onyachamp.com/cascade',
                    'https://raw.githubusercontent.com/thebubbsy/UpdateCascade/main/cascade'
                )
                foreach ($u in $fetchUrls) {
                    try {
                        $webClient = New-Object System.Net.WebClient
                        $scriptSource = $webClient.DownloadString($u)
                        $webClient.Dispose()
                        if ($scriptSource -and $scriptSource.Length -ge 2000) { break }
                    } catch { }
                }
            }
        }

        if ($scriptSource -and $scriptSource.Length -ge 2000) {
            [System.IO.File]::WriteAllText($script:ScriptSelfCopy, $scriptSource, [System.Text.Encoding]::UTF8)
            Write-CascadeLog "Saved local persistent payload to: $script:ScriptSelfCopy" "INFO"
        }

        # 2. Emit Master resume.cmd Launcher with Self-Healing Recovery
        $resumeCmdContent = @"
@echo off
setlocal enabledelayedexpansion
title UpdateCascade Auto-Resume Launcher
echo [UpdateCascade] System restarted. Waiting for services to stabilize...
timeout /t 4 /nobreak >nul 2>&1

set SCRIPT_PATH=%~dp0UpdateCascade.ps1
if not exist "%SCRIPT_PATH%" goto RecoverPayload
for %%A in ("%SCRIPT_PATH%") do if %%~zA LSS 2000 goto RecoverPayload
goto LaunchEngine

:RecoverPayload
echo [UpdateCascade] Payload missing or truncated. Downloading authoritative engine...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://onyachamp.com/cascade', '%SCRIPT_PATH%')"
if not exist "%SCRIPT_PATH%" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://raw.githubusercontent.com/thebubbsy/UpdateCascade/main/cascade', '%SCRIPT_PATH%')"
)

:LaunchEngine
set PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe
echo [UpdateCascade] Launching cascade engine...
start "" "%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -STA -File "%SCRIPT_PATH%" -ResumeFromRestart
exit /b 0
"@
        [System.IO.File]::WriteAllText($script:ResumeCmd, $resumeCmdContent, [System.Text.Encoding]::ASCII)

        # 3. Emit Silent resume.vbs COM Launcher (Flicker-Free Invocation)
        $resumeVbsContent = @"
Set objShell = CreateObject("WScript.Shell")
strCmd = "cmd.exe /c """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\resume.cmd"""
objShell.Run strCmd, 0, False
Set objShell = Nothing
"@
        [System.IO.File]::WriteAllText($script:ResumeVbs, $resumeVbsContent, [System.Text.Encoding]::ASCII)

        # 4. Emit Interactive launch.cmd
        $launchCmdContent = @"
@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0UpdateCascade.ps1" %*
"@
        [System.IO.File]::WriteAllText($script:LaunchCmd, $launchCmdContent, [System.Text.Encoding]::ASCII)

        return $script:ScriptSelfCopy
    } catch {
        Write-CascadeLog "Failed to persist script files: $($_.Exception.Message)" "WARN"
        return $PSCommandPath
    }
}

# --- 5. CASCADE STATE MANAGEMENT ---
function Get-CascadeState {
    [CmdletBinding()]
    param()

    if (Test-Path $script:StateFile) {
        try {
            $raw = [System.IO.File]::ReadAllText($script:StateFile, [System.Text.Encoding]::UTF8)
            if (-not [string]::IsNullOrWhiteSpace($raw)) {
                return ConvertFrom-Json $raw -ErrorAction Stop
            }
        } catch { }
    }
    return $null
}

function Set-CascadeState {
    [CmdletBinding()]
    param(
        [int]$CurrentPass = 1,
        [int]$MaxPasses = 5,
        [bool]$IncludeDrivers = $true,
        [int]$TotalInstalled = 0,
        [bool]$Active = $true,
        [bool]$Autonomous = $false
    )

    try {
        if (-not (Test-Path $script:PersistDir)) {
            New-Item -Path $script:PersistDir -ItemType Directory -Force | Out-Null
        }
        $stateObj = [PSCustomObject]@{
            Active         = $Active
            Autonomous     = $Autonomous
            CurrentPass    = $CurrentPass
            MaxPasses      = $MaxPasses
            IncludeDrivers = $IncludeDrivers
            TotalInstalled = $TotalInstalled
            UpdatedUtc     = (Get-Date).ToUniversalTime().ToString('o')
            MachineName    = $env:COMPUTERNAME
        }
        $json = ConvertTo-Json $stateObj -Compress
        [System.IO.File]::WriteAllText($script:StateFile, $json, [System.Text.Encoding]::UTF8)
        return $true
    } catch {
        Write-CascadeLog "Failed to write cascade state: $($_.Exception.Message)" "WARN"
        return $false
    }
}

function Clear-CascadeState {
    [CmdletBinding()]
    param()

    try {
        if (Test-Path $script:StateFile) {
            Remove-Item -Path $script:StateFile -Force -ErrorAction SilentlyContinue
        }
        return $true
    } catch {
        return $false
    }
}

# --- 6. MULTI-TIER RELAUNCH PERSISTENCE ENGINE (17 DISTINCT VECTORS) ---
function Register-CascadePersistence {
    [CmdletBinding()]
    param()

    Write-CascadeLog "Arming 17-tier relaunch persistence across Windows lifecycle contexts..." "STEP"
    $payloadPath = Save-CascadeSelfCopy
    $resumeCmd = $script:ResumeCmd
    $resumeVbs = $script:ResumeVbs
    $registeredCount = 0

    # Vector 1: HKLM RunOnce (Standard + Elevated '*' priority prefix)
    # Winlogon processes '*' entries with priority even in Safe Mode
    try {
        Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce' `
            -Name $script:RunOnceName -Value "cmd.exe /c `"$resumeCmd`"" -Type String -Force -ErrorAction Stop
        $registeredCount++
    } catch { }

    # Vector 2: HKLM Run (Persistent on every logon until completion)
    try {
        Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' `
            -Name $script:RunName -Value "cmd.exe /c `"$resumeCmd`"" -Type String -Force -ErrorAction Stop
        $registeredCount++
    } catch { }

    # Vector 3: HKCU RunOnce & Run (Current User Context)
    try {
        Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce' `
            -Name $script:RunOnceName -Value "cmd.exe /c `"$resumeCmd`"" -Type String -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' `
            -Name $script:RunName -Value "cmd.exe /c `"$resumeCmd`"" -Type String -Force -ErrorAction SilentlyContinue
        $registeredCount += 2
    } catch { }

    # Vector 4: Default User Profile Hive Injection (Crucial for OOBE & New User Creation)
    # Uses reg.exe directly to avoid handle locking traps in PowerShell registry provider
    try {
        $defHive = Join-Path $env:SystemDrive 'Users\Default\NTUSER.DAT'
        if (Test-Path $defHive) {
            $regExe = Join-Path $env:SystemRoot 'System32\reg.exe'
            & $regExe load "HKLM\UpdateCascadeDef" "$defHive" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                & $regExe add "HKLM\UpdateCascadeDef\Software\Microsoft\Windows\CurrentVersion\RunOnce" /v "$script:RunOnceName" /t REG_SZ /d "cmd.exe /c `"$resumeCmd`"" /f 2>&1 | Out-Null
                & $regExe unload "HKLM\UpdateCascadeDef" 2>&1 | Out-Null
                $registeredCount++
            }
        }
    } catch { }

    # Vector 5: Interactive Scheduled Task (AtLogOn for BUILTIN\Administrators & BUILTIN\Users)
    try {
        if (Get-Command New-ScheduledTaskAction -ErrorAction SilentlyContinue) {
            $action    = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$resumeCmd`""
            $trigger   = New-ScheduledTaskTrigger -AtLogOn
            $principal = New-ScheduledTaskPrincipal -GroupId "BUILTIN\Administrators" -RunLevel Highest
            $settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero)
            Register-ScheduledTask -TaskName $script:TaskLogonName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force -ErrorAction Stop | Out-Null
            $registeredCount++
        } elseif (Get-Command schtasks.exe -ErrorAction SilentlyContinue) {
            cmd.exe /c "schtasks.exe /Create /TN `"$($script:TaskLogonName)`" /TR `"cmd.exe /c `"`"$resumeCmd`"`"`" /SC ONLOGON /RL HIGHEST /F /IT" 2>&1 | Out-Null
            $registeredCount++
        }
    } catch { }

    # Vector 6: Boot-Time Scheduled Task (AtStartup as NT AUTHORITY\SYSTEM)
    # Solves the condition where machine restarts and sits at Windows Login / Lock screen unattended
    try {
        if (Get-Command New-ScheduledTaskAction -ErrorAction SilentlyContinue) {
            $actionBoot    = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$resumeCmd`" -Boot"
            $triggerBoot   = New-ScheduledTaskTrigger -AtStartup
            $principalBoot = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -RunLevel Highest
            $settingsBoot  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero)
            Register-ScheduledTask -TaskName $script:TaskBootName -Action $actionBoot -Trigger $triggerBoot -Principal $principalBoot -Settings $settingsBoot -Force -ErrorAction Stop | Out-Null
            $registeredCount++
        } elseif (Get-Command schtasks.exe -ErrorAction SilentlyContinue) {
            cmd.exe /c "schtasks.exe /Create /TN `"$($script:TaskBootName)`" /TR `"cmd.exe /c `"`"$resumeCmd`"`" -Boot`" /SC ONSTART /RU `"SYSTEM`" /RL HIGHEST /F" 2>&1 | Out-Null
            $registeredCount++
        }
    } catch { }

    # Vector 7: Winlogon Userinit Key Hook
    # Winlogon invokes Userinit for EVERY logon before Explorer initializes
    try {
        $winlogonKey = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
        $curUserinit = (Get-ItemProperty $winlogonKey -Name 'Userinit' -ErrorAction SilentlyContinue).Userinit
        if ($curUserinit -and $curUserinit -notlike "*UpdateCascade*") {
            Set-ItemProperty $winlogonKey -Name 'UpdateCascade_Userinit_Orig' -Value $curUserinit -Type String -Force -ErrorAction SilentlyContinue
            $cleanUserinit = $curUserinit.TrimEnd(',')
            $userinitExec = "$env:SystemRoot\System32\cmd.exe /c `"$resumeCmd`""
            $newUserinit = "$cleanUserinit,$userinitExec,"
            Set-ItemProperty $winlogonKey -Name 'Userinit' -Value $newUserinit -Type String -Force -ErrorAction SilentlyContinue
            $registeredCount++
        }
    } catch { }

    # Vector 8: Winlogon AppSetup Key Hook
    try {
        $winlogonKey = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
        $curAppSetup = (Get-ItemProperty $winlogonKey -Name 'AppSetup' -ErrorAction SilentlyContinue).AppSetup
        if (-not $curAppSetup -or $curAppSetup -notlike "*UpdateCascade*") {
            $appSetupExec = "$env:SystemRoot\System32\cmd.exe /c `"$resumeCmd`""
            if ($curAppSetup) {
                Set-ItemProperty $winlogonKey -Name 'UpdateCascade_AppSetup_Orig' -Value $curAppSetup -Type String -Force -ErrorAction SilentlyContinue
                Set-ItemProperty $winlogonKey -Name 'AppSetup' -Value "$curAppSetup,$appSetupExec," -Type String -Force -ErrorAction SilentlyContinue
            } else {
                Set-ItemProperty $winlogonKey -Name 'AppSetup' -Value "$appSetupExec," -Type String -Force -ErrorAction SilentlyContinue
            }
            $registeredCount++
        }
    } catch { }

    # Vector 9: Active Setup Component
    # Handled by userinit/explorer for all existing and newly logged-in accounts
    try {
        $activeSetupKey = "HKLM:\SOFTWARE\Microsoft\Active Setup\Installed Components\$script:ActiveSetupGuid"
        if (-not (Test-Path $activeSetupKey)) { New-Item -Path $activeSetupKey -Force | Out-Null }
        Set-ItemProperty -Path $activeSetupKey -Name '(Default)' -Value 'UpdateCascade Auto-Resume' -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $activeSetupKey -Name 'StubPath' -Value "cmd.exe /c `"$resumeCmd`"" -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $activeSetupKey -Name 'Version' -Value '1,0,0' -Force -ErrorAction SilentlyContinue
        $registeredCount++
    } catch { }

    # Vector 10: SetupComplete.cmd Hook (%windir%\Setup\Scripts\SetupComplete.cmd)
    # Native Windows Setup specialization and post-OOBE transition fallback
    try {
        $setupDir = Join-Path $env:SystemRoot 'Setup\Scripts'
        if (-not (Test-Path $setupDir)) { New-Item -Path $setupDir -ItemType Directory -Force | Out-Null }
        $setupCompletePath = Join-Path $setupDir 'SetupComplete.cmd'
        $hookBlock = "REM --- UpdateCascade Hook ---`r`nstart `"`" cmd.exe /c `"$resumeCmd`"`r`nREM --- End UpdateCascade Hook ---"

        if (Test-Path $setupCompletePath) {
            $existing = [System.IO.File]::ReadAllText($setupCompletePath, [System.Text.Encoding]::ASCII)
            if ($existing -notlike '*UpdateCascade*') {
                $hasEchoOff = ($existing -match '(?i)^\s*@echo\s+off')
                if ($hasEchoOff) {
                    $cleaned = $existing -replace '(?i)^\s*@echo\s+off\s*(\r?\n)?', ''
                    $newContent = "@echo off`r`n$hookBlock`r`n$cleaned"
                } else {
                    $newContent = "$hookBlock`r`n$existing"
                }
                [System.IO.File]::WriteAllText($setupCompletePath, $newContent, [System.Text.Encoding]::ASCII)
                $registeredCount++
            }
        } else {
            $newContent = "@echo off`r`n$hookBlock`r`n"
            [System.IO.File]::WriteAllText($setupCompletePath, $newContent, [System.Text.Encoding]::ASCII)
            $registeredCount++
        }
    } catch { }

    # Vector 11: ErrorHandler.cmd Hook (%windir%\Setup\Scripts\ErrorHandler.cmd)
    try {
        $setupDir = Join-Path $env:SystemRoot 'Setup\Scripts'
        $errorHandlerPath = Join-Path $setupDir 'ErrorHandler.cmd'
        $errHookBlock = "REM --- UpdateCascade Error Hook ---`r`nstart `"`" cmd.exe /c `"$resumeCmd`"`r`nREM --- End UpdateCascade Error Hook ---"
        if (Test-Path $errorHandlerPath) {
            $existing = [System.IO.File]::ReadAllText($errorHandlerPath, [System.Text.Encoding]::ASCII)
            if ($existing -notlike '*UpdateCascade*') {
                [System.IO.File]::AppendAllText($errorHandlerPath, "`r`n$errHookBlock`r`n", [System.Text.Encoding]::ASCII)
                $registeredCount++
            }
        } else {
            [System.IO.File]::WriteAllText($errorHandlerPath, "@echo off`r`n$errHookBlock`r`n", [System.Text.Encoding]::ASCII)
            $registeredCount++
        }
    } catch { }

    # Vector 12: All Users Startup Folder
    try {
        $commonStartup = [Environment]::GetFolderPath([Environment+SpecialFolder]::CommonStartup)
        if ($commonStartup -and (Test-Path $commonStartup)) {
            $startupCmd = Join-Path $commonStartup 'UpdateCascade.cmd'
            $cmdContent = "@echo off`r`nstart `"`" cmd.exe /c `"$resumeCmd`"`r`n"
            [System.IO.File]::WriteAllText($startupCmd, $cmdContent, [System.Text.Encoding]::ASCII)
            $registeredCount++
        }
    } catch { }

    # Vector 13: Default User Startup Folder (Inherited by new profiles)
    try {
        $defStartup = Join-Path $env:SystemDrive 'Users\Default\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup'
        if (-not (Test-Path $defStartup)) { New-Item -Path $defStartup -ItemType Directory -Force | Out-Null }
        $defStartupCmd = Join-Path $defStartup 'UpdateCascade.cmd'
        $cmdContent = "@echo off`r`nstart `"`" cmd.exe /c `"$resumeCmd`"`r`n"
        [System.IO.File]::WriteAllText($defStartupCmd, $cmdContent, [System.Text.Encoding]::ASCII)
        $registeredCount++
    } catch { }

    # Vector 14: RunOnceEx Registry Keys
    try {
        $roeKey = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnceEx\900'
        if (-not (Test-Path $roeKey)) { New-Item -Path $roeKey -Force | Out-Null }
        Set-ItemProperty -Path $roeKey -Name 'UpdateCascade' -Value "cmd.exe /c `"$resumeCmd`"" -Force -ErrorAction SilentlyContinue
        $registeredCount++
    } catch { }

    # Vector 15: Native Windows Setup OOBE CmdLine Hook (HKLM:\SYSTEM\Setup\CmdLine)
    # The native Windows Setup mechanism invoked across OOBE reboot phases before explorer.exe
    try {
        $setupKey = 'HKLM:\SYSTEM\Setup'
        $curCmd = (Get-ItemProperty $setupKey -Name 'CmdLine' -ErrorAction SilentlyContinue).CmdLine
        if ($curCmd -and $curCmd -notlike "*UpdateCascade*") {
            Set-ItemProperty $setupKey -Name 'UpdateCascade_CmdLine_Orig' -Value $curCmd -Type String -Force -ErrorAction SilentlyContinue
        }
        $oobeCmd = "$env:SystemRoot\System32\cmd.exe /c `"$resumeCmd`""
        Set-ItemProperty $setupKey -Name 'CmdLine' -Value $oobeCmd -Type String -Force -ErrorAction SilentlyContinue
        $registeredCount++
    } catch { }

    # Vector 16: Local Group Policy Startup Script
    try {
        $gpDir = Join-Path $env:SystemRoot 'System32\GroupPolicy\Machine\Scripts\Startup'
        if (-not (Test-Path $gpDir)) { New-Item -Path $gpDir -ItemType Directory -Force | Out-Null }
        $gpCmd = Join-Path $gpDir 'UpdateCascade_GP.cmd'
        [System.IO.File]::WriteAllText($gpCmd, "@echo off`r`nstart `"`" cmd.exe /c `"$resumeCmd`"`r`n", [System.Text.Encoding]::ASCII)
        $registeredCount++
    } catch { }

    # Vector 17: User Profile Startup Folder
    try {
        $userStartup = [Environment]::GetFolderPath([Environment+SpecialFolder]::Startup)
        if ($userStartup -and (Test-Path $userStartup)) {
            $userStartupCmd = Join-Path $userStartup 'UpdateCascade.cmd'
            [System.IO.File]::WriteAllText($userStartupCmd, "@echo off`r`nstart `"`" cmd.exe /c `"$resumeCmd`"`r`n", [System.Text.Encoding]::ASCII)
            $registeredCount++
        }
    } catch { }

    Write-CascadeLog "Armed $registeredCount relaunch persistence vectors successfully." "SUCCESS"
    return $registeredCount
}

# --- 7. COMPLETE SYSTEMATIC CLEAN UNREGISTRATION ENGINE ---
function Unregister-CascadePersistence {
    [CmdletBinding()]
    param()

    Write-CascadeLog "Disarming all persistence vectors and restoring pristine system configuration..." "STEP"
    $cleanedCount = 0

    # 1. HKLM RunOnce & Run
    try {
        foreach ($k in @('RunOnce', 'Run')) {
            $p = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\$k"
            foreach ($n in @($script:RunOnceName, $script:RunName, 'UpdateCascade')) {
                if ((Get-ItemProperty -Path $p -Name $n -ErrorAction SilentlyContinue).$n) {
                    Remove-ItemProperty -Path $p -Name $n -Force -ErrorAction SilentlyContinue
                    $cleanedCount++
                }
            }
        }
    } catch { }

    # 2. HKCU RunOnce & Run
    try {
        foreach ($k in @('RunOnce', 'Run')) {
            $p = "HKCU:\Software\Microsoft\Windows\CurrentVersion\$k"
            foreach ($n in @($script:RunOnceName, $script:RunName, 'UpdateCascade')) {
                if ((Get-ItemProperty -Path $p -Name $n -ErrorAction SilentlyContinue).$n) {
                    Remove-ItemProperty -Path $p -Name $n -Force -ErrorAction SilentlyContinue
                    $cleanedCount++
                }
            }
        }
    } catch { }

    # 3. Default User Hive RunOnce
    try {
        $defHive = Join-Path $env:SystemDrive 'Users\Default\NTUSER.DAT'
        if (Test-Path $defHive) {
            $regExe = Join-Path $env:SystemRoot 'System32\reg.exe'
            & $regExe load "HKLM\UpdateCascadeDef" "$defHive" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                & $regExe delete "HKLM\UpdateCascadeDef\Software\Microsoft\Windows\CurrentVersion\RunOnce" /v "$script:RunOnceName" /f 2>&1 | Out-Null
                & $regExe unload "HKLM\UpdateCascadeDef" 2>&1 | Out-Null
                $cleanedCount++
            }
        }
    } catch { }

    # 4. Scheduled Tasks
    try {
        foreach ($task in @($script:TaskLogonName, $script:TaskBootName)) {
            if (Get-Command Unregister-ScheduledTask -ErrorAction SilentlyContinue) {
                if (Get-ScheduledTask -TaskName $task -ErrorAction SilentlyContinue) {
                    Unregister-ScheduledTask -TaskName $task -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
                    $cleanedCount++
                }
            } elseif (Get-Command schtasks.exe -ErrorAction SilentlyContinue) {
                cmd.exe /c "schtasks.exe /Delete /TN `"$task`" /F" 2>&1 | Out-Null
                $cleanedCount++
            }
        }
    } catch { }

    # 5. Restore Winlogon Userinit Key
    try {
        $winlogonKey = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
        $orig = (Get-ItemProperty $winlogonKey -Name 'UpdateCascade_Userinit_Orig' -ErrorAction SilentlyContinue).UpdateCascade_Userinit_Orig
        if ($orig) {
            Set-ItemProperty $winlogonKey -Name 'Userinit' -Value $orig -Type String -Force -ErrorAction SilentlyContinue
            Remove-ItemProperty $winlogonKey -Name 'UpdateCascade_Userinit_Orig' -Force -ErrorAction SilentlyContinue
            $cleanedCount++
        } else {
            $cur = (Get-ItemProperty $winlogonKey -Name 'Userinit' -ErrorAction SilentlyContinue).Userinit
            if ($cur -and $cur -like "*UpdateCascade*") {
                $cleaned = ($cur.Split(',') | Where-Object { $_ -and $_ -notlike "*UpdateCascade*" }) -join ','
                if (-not $cleaned) { $cleaned = "C:\Windows\system32\userinit.exe," }
                if (-not $cleaned.EndsWith(',')) { $cleaned += ',' }
                Set-ItemProperty $winlogonKey -Name 'Userinit' -Value $cleaned -Type String -Force -ErrorAction SilentlyContinue
                $cleanedCount++
            }
        }
    } catch { }

    # 6. Restore Winlogon AppSetup Key
    try {
        $winlogonKey = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
        $origApp = (Get-ItemProperty $winlogonKey -Name 'UpdateCascade_AppSetup_Orig' -ErrorAction SilentlyContinue).UpdateCascade_AppSetup_Orig
        if ($origApp) {
            Set-ItemProperty $winlogonKey -Name 'AppSetup' -Value $origApp -Type String -Force -ErrorAction SilentlyContinue
            Remove-ItemProperty $winlogonKey -Name 'UpdateCascade_AppSetup_Orig' -Force -ErrorAction SilentlyContinue
            $cleanedCount++
        } else {
            $curApp = (Get-ItemProperty $winlogonKey -Name 'AppSetup' -ErrorAction SilentlyContinue).AppSetup
            if ($curApp -and $curApp -like "*UpdateCascade*") {
                $cleaned = ($curApp.Split(',') | Where-Object { $_ -and $_ -notlike "*UpdateCascade*" }) -join ','
                if ($cleaned) {
                    Set-ItemProperty $winlogonKey -Name 'AppSetup' -Value $cleaned -Type String -Force -ErrorAction SilentlyContinue
                } else {
                    Remove-ItemProperty $winlogonKey -Name 'AppSetup' -Force -ErrorAction SilentlyContinue
                }
                $cleanedCount++
            }
        }
    } catch { }

    # 7. Active Setup Component Key
    try {
        $activeSetupKey = "HKLM:\SOFTWARE\Microsoft\Active Setup\Installed Components\$script:ActiveSetupGuid"
        if (Test-Path $activeSetupKey) {
            Remove-Item -Path $activeSetupKey -Recurse -Force -ErrorAction SilentlyContinue
            $cleanedCount++
        }
    } catch { }

    # 8. SetupComplete.cmd & ErrorHandler.cmd Hook Cleanup
    try {
        foreach ($scriptName in @('SetupComplete.cmd', 'ErrorHandler.cmd')) {
            $scriptPath = Join-Path $env:SystemRoot "Setup\Scripts\$scriptName"
            if (Test-Path $scriptPath) {
                $content = [System.IO.File]::ReadAllText($scriptPath, [System.Text.Encoding]::ASCII)
                if ($content -like '*UpdateCascade*') {
                    $lines = (Get-Content -Path $scriptPath -ErrorAction SilentlyContinue) | Where-Object {
                        $_ -notmatch '(?i)UpdateCascade' -and $_ -notmatch '(?i)resume\.cmd'
                    }
                    $trimmed = ($lines -join "`r`n").Trim()
                    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed -eq '@echo off') {
                        Remove-Item -Path $scriptPath -Force -ErrorAction SilentlyContinue
                    } else {
                        [System.IO.File]::WriteAllText($scriptPath, ($lines -join "`r`n"), [System.Text.Encoding]::ASCII)
                    }
                    $cleanedCount++
                }
            }
        }
    } catch { }

    # 9. Startup Folder Scripts Cleanup
    try {
        $commonStartup = [Environment]::GetFolderPath([Environment+SpecialFolder]::CommonStartup)
        $defStartup = Join-Path $env:SystemDrive 'Users\Default\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup'
        $userStartup = [Environment]::GetFolderPath([Environment+SpecialFolder]::Startup)
        foreach ($d in @($commonStartup, $defStartup, $userStartup)) {
            if ($d) {
                $f = Join-Path $d 'UpdateCascade.cmd'
                if (Test-Path $f) { Remove-Item -Path $f -Force -ErrorAction SilentlyContinue; $cleanedCount++ }
            }
        }
    } catch { }

    # 10. RunOnceEx Key Cleanup
    try {
        $roeKey = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnceEx\900'
        if (Test-Path $roeKey) {
            Remove-ItemProperty -Path $roeKey -Name 'UpdateCascade' -Force -ErrorAction SilentlyContinue
            $subKeys = (Get-Item $roeKey).Property
            if (-not $subKeys -or $subKeys.Count -eq 0) { Remove-Item -Path $roeKey -Force -ErrorAction SilentlyContinue }
            $cleanedCount++
        }
    } catch { }

    # 11. Native Windows Setup OOBE CmdLine Restoration
    try {
        $setupKey = 'HKLM:\SYSTEM\Setup'
        $origCmd = (Get-ItemProperty $setupKey -Name 'UpdateCascade_CmdLine_Orig' -ErrorAction SilentlyContinue).UpdateCascade_CmdLine_Orig
        if ($origCmd) {
            Set-ItemProperty $setupKey -Name 'CmdLine' -Value $origCmd -Type String -Force -ErrorAction SilentlyContinue
            Remove-ItemProperty $setupKey -Name 'UpdateCascade_CmdLine_Orig' -Force -ErrorAction SilentlyContinue
            $cleanedCount++
        } else {
            $curCmd = (Get-ItemProperty $setupKey -Name 'CmdLine' -ErrorAction SilentlyContinue).CmdLine
            if ($curCmd -and $curCmd -like "*UpdateCascade*") {
                Set-ItemProperty $setupKey -Name 'CmdLine' -Value "" -Type String -Force -ErrorAction SilentlyContinue
                $cleanedCount++
            }
        }
    } catch { }

    # 12. Group Policy Script Cleanup
    try {
        $gpCmd = Join-Path $env:SystemRoot 'System32\GroupPolicy\Machine\Scripts\Startup\UpdateCascade_GP.cmd'
        if (Test-Path $gpCmd) { Remove-Item -Path $gpCmd -Force -ErrorAction SilentlyContinue; $cleanedCount++ }
    } catch { }

    # 13. Remove Launcher CMD & VBS Files
    try {
        foreach ($f in @($script:ResumeCmd, $script:ResumeVbs, $script:LaunchCmd)) {
            if (Test-Path $f) { Remove-Item -Path $f -Force -ErrorAction SilentlyContinue; $cleanedCount++ }
        }
    } catch { }

    # 14. Stop and delete legacy service if present
    try {
        $scExe = Join-Path $env:SystemRoot 'System32\sc.exe'
        if (Test-Path $scExe) {
            cmd.exe /c "sc.exe query UpdateCascadeSvc >nul 2>&1 && sc.exe stop UpdateCascadeSvc >nul 2>&1 && sc.exe delete UpdateCascadeSvc >nul 2>&1"
        }
    } catch { }

    Clear-CascadeState | Out-Null
    Write-CascadeLog "Disarmed and cleaned $cleanedCount persistence artifacts. System is clean." "SUCCESS"
    return $cleanedCount
}

# --- 8. 4-TIER BULLETPROOF REBOOT ENGINE ---
function Invoke-CascadeReboot {
    [CmdletBinding()]
    param(
        [int]$DelaySeconds = 0,
        [string]$Reason = 'UpdateCascade Multi-Pass System Restart'
    )

    if ($script:RebootAborted) {
        Write-CascadeLog "Reboot invocation suppressed: Operator aborted restart countdown." "WARN"
        return $false
    }

    Write-CascadeLog "Executing system restart (Delay: ${DelaySeconds}s, Reason: '$Reason')..." "STEP"

    # Tier 1: shutdown.exe /r /t <delay> /f /c "..."
    try {
        $shutdownExe = Join-Path $env:SystemRoot 'System32\shutdown.exe'
        if (Test-Path $shutdownExe) {
            $argList = "/r /t $DelaySeconds /f /c `"$Reason`""
            $p = Start-Process -FilePath $shutdownExe -ArgumentList $argList -NoNewWindow -PassThru -ErrorAction SilentlyContinue
            if ($p) {
                $p.WaitForExit(2000)
                if ($p.HasExited -and $p.ExitCode -ne 0 -and $p.ExitCode -ne 1190) {
                    Write-CascadeLog "shutdown.exe exited with code $($p.ExitCode). Retrying without comment..." "WARN"
                    $p2 = Start-Process -FilePath $shutdownExe -ArgumentList "/r /t $DelaySeconds /f" -NoNewWindow -PassThru -ErrorAction SilentlyContinue
                    if ($p2) {
                        $p2.WaitForExit(2000)
                        if (-not $p2.HasExited -or $p2.ExitCode -eq 0 -or $p2.ExitCode -eq 1190) {
                            Write-CascadeLog "Restart dispatched successfully via shutdown.exe." "SUCCESS"
                            return $true
                        }
                    }
                } else {
                    Write-CascadeLog "Restart dispatched successfully via shutdown.exe." "SUCCESS"
                    return $true
                }
            }
        }
    } catch {
        Write-CascadeLog "Tier 1 shutdown.exe warning: $($_.Exception.Message)" "WARN"
    }

    # Tier 2: Win32 API InitiateSystemShutdownEx & ExitWindowsEx via P/Invoke with Token Privilege Adjustment
    try {
        if (-not ([System.Management.Automation.PSTypeName]'Win32CascadeShutdown').Type) {
            Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class Win32CascadeShutdown {
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern bool InitiateSystemShutdownEx(string lpMachineName, string lpMessage, uint dwTimeout, bool bForceAppsClosed, bool bRebootAfterShutdown, uint dwReason);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool ExitWindowsEx(uint uFlags, uint dwReason);

    [DllImport("advapi32.dll", SetLastError = true)]
    private static extern bool OpenProcessToken(IntPtr ProcessHandle, uint DesiredAccess, out IntPtr TokenHandle);

    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    private static extern bool LookupPrivilegeValue(string lpSystemName, string lpName, out LUID lpLuid);

    [DllImport("advapi32.dll", SetLastError = true)]
    private static extern bool AdjustTokenPrivileges(IntPtr TokenHandle, bool DisableAllPrivileges, ref TOKEN_PRIVILEGES NewState, uint BufferLength, IntPtr PreviousState, IntPtr ReturnLength);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr hObject);

    [DllImport("kernel32.dll")]
    private static extern IntPtr GetCurrentProcess();

    [StructLayout(LayoutKind.Sequential)]
    private struct LUID {
        public uint LowPart;
        public int HighPart;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct TOKEN_PRIVILEGES {
        public uint PrivilegeCount;
        public LUID Luid;
        public uint Attributes;
    }

    private const uint TOKEN_ADJUST_PRIVILEGES = 0x0020;
    private const uint TOKEN_QUERY = 0x0008;
    private const uint SE_PRIVILEGE_ENABLED = 0x00000002;
    private const string SE_SHUTDOWN_NAME = "SeShutdownPrivilege";

    public static bool EnableShutdownPrivilege() {
        IntPtr hToken;
        if (!OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, out hToken)) {
            return false;
        }
        try {
            LUID luid;
            if (!LookupPrivilegeValue(null, SE_SHUTDOWN_NAME, out luid)) {
                return false;
            }
            TOKEN_PRIVILEGES tp = new TOKEN_PRIVILEGES();
            tp.PrivilegeCount = 1;
            tp.Luid = luid;
            tp.Attributes = SE_PRIVILEGE_ENABLED;
            return AdjustTokenPrivileges(hToken, false, ref tp, 0, IntPtr.Zero, IntPtr.Zero);
        } finally {
            CloseHandle(hToken);
        }
    }
}
"@ -ErrorAction SilentlyContinue
        }
        if (([System.Management.Automation.PSTypeName]'Win32CascadeShutdown').Type) {
            [Win32CascadeShutdown]::EnableShutdownPrivilege() | Out-Null
            # SHTDN_REASON_FLAG_PLANNED (0x80000000) | MAJOR_OPERATINGSYSTEM (0x00020000) | MINOR_UPGRADE (0x00000003)
            $res = [Win32CascadeShutdown]::InitiateSystemShutdownEx($null, $Reason, [uint32]$DelaySeconds, $true, $true, 0x80020003)
            if ($res) {
                Write-CascadeLog "Restart dispatched successfully via Win32 InitiateSystemShutdownEx." "SUCCESS"
                return $true
            }
            # EWX_REBOOT (0x00000002) | EWX_FORCE (0x00000004)
            $res2 = [Win32CascadeShutdown]::ExitWindowsEx(0x6, 0x80020003)
            if ($res2) {
                Write-CascadeLog "Restart dispatched successfully via Win32 ExitWindowsEx." "SUCCESS"
                return $true
            }
        }
    } catch { }

    # Tier 3: PowerShell Native Restart-Computer -Force
    try {
        Restart-Computer -Force -ErrorAction Stop
        Write-CascadeLog "Restart dispatched successfully via Restart-Computer -Force." "SUCCESS"
        return $true
    } catch {
        Write-CascadeLog "Tier 3 Restart-Computer failed: $($_.Exception.Message)" "WARN"
    }

    # Tier 4: WMI / CIM Win32_OperatingSystem Win32Shutdown(6)
    try {
        $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction SilentlyContinue
        if ($os) {
            Invoke-CimMethod -InputObject $os -MethodName Win32Shutdown -Arguments @{ Flags = 6; Reserved = 0 } -ErrorAction Stop | Out-Null
            Write-CascadeLog "Restart dispatched successfully via CIM Win32Shutdown(6)." "SUCCESS"
            return $true
        }
    } catch { }

    Write-CascadeLog "All 4 reboot execution tiers were exhausted without confirmation." "ERROR"
    return $false
}

# --- 9. WINDOWS UPDATE & DRIVER ENGINE (COM Microsoft.Update.Session) ---
function Ensure-CascadeUpdateServices {
    [CmdletBinding()]
    param()

    $services = @('wuauserv', 'UsoSvc', 'BITS', 'TrustedInstaller', 'cryptsvc')
    foreach ($s in $services) {
        try {
            $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
            if ($svc) {
                if ($svc.StartType -eq 'Disabled') {
                    Set-Service -Name $s -StartupType Manual -ErrorAction SilentlyContinue
                }
                if ($svc.Status -ne 'Running') {
                    Start-Service -Name $s -ErrorAction SilentlyContinue
                }
            }
        } catch { }
    }
}

function Enable-MicrosoftUpdateCatalog {
    [CmdletBinding()]
    param()

    try {
        $sm = New-Object -ComObject Microsoft.Update.ServiceManager -ErrorAction Stop
        # Microsoft Update Service GUID: 7971f918-a847-4430-9279-4a52d1efe18d
        $serviceId = "7971f918-a847-4430-9279-4a52d1efe18d"
        $existing = $sm.Services | Where-Object { $_.ServiceID -eq $serviceId }
        if (-not $existing) {
            Write-CascadeLog "Registering Microsoft Update Catalog for device drivers and extended patches..." "INFO"
            $sm.AddService2($serviceId, 7, "") | Out-Null
            Write-CascadeLog "Microsoft Update Catalog successfully registered." "SUCCESS"
        }
    } catch { }
}

function Invoke-CascadeUsoScan {
    [CmdletBinding()]
    param()

    Ensure-CascadeUpdateServices
    $uso = Join-Path $env:SystemRoot "System32\usoclient.exe"
    if (Test-Path $uso) {
        Start-Process -FilePath $uso -ArgumentList "StartInteractiveScan" -WindowStyle Hidden -ErrorAction SilentlyContinue
        return $true
    }
    return $false
}

function Get-CascadePendingUpdates {
    [CmdletBinding()]
    param(
        [switch]$IncludeDrivers = $true,
        [scriptblock]$StatusCallback
    )

    Ensure-CascadeUpdateServices
    if ($IncludeDrivers) { Enable-MicrosoftUpdateCatalog }

    if ($StatusCallback) { & $StatusCallback "Connecting to Windows Update COM session..." }

    $updates = @()
    try {
        $session = New-Object -ComObject Microsoft.Update.Session
        $searcher = $session.CreateUpdateSearcher()

        # Query syntax for Windows Update Agent API
        $query = "IsInstalled=0 and IsHidden=0"
        if (-not $IncludeDrivers) {
            $query += " and Type='Software'"
        }

        if ($StatusCallback) { & $StatusCallback "Scanning for available updates ($query)..." }
        $searchResult = $searcher.Search($query)

        if ($searchResult -and $searchResult.Updates) {
            for ($i = 0; $i -lt $searchResult.Updates.Count; $i++) {
                $u = $searchResult.Updates.Item($i)
                $isDriver = $false
                try {
                    if ($u.Type -eq 2) { $isDriver = $true }
                    if ($u.Categories) {
                        for ($c = 0; $c -lt $u.Categories.Count; $c++) {
                            if ($u.Categories.Item($c).Name -like '*Driver*') { $isDriver = $true; break }
                        }
                    }
                } catch { }

                $sizeMb = 0
                try {
                    $sizeMb = [math]::Round($u.MaxDownloadSize / 1MB, 2)
                } catch { }

                $kb = ""
                try {
                    if ($u.KBArticleIDs -and $u.KBArticleIDs.Count -gt 0) {
                        $kbList = @()
                        for ($k = 0; $k -lt $u.KBArticleIDs.Count; $k++) {
                            $kbList += "KB" + $u.KBArticleIDs.Item($k)
                        }
                        $kb = $kbList -join ", "
                    }
                } catch { }

                $uId = ""
                try {
                    if ($u.Identity -and $u.Identity.UpdateID) {
                        $uId = $u.Identity.UpdateID.ToString()
                    }
                } catch { }

                $updates += [PSCustomObject]@{
                    Title          = $u.Title
                    KB             = $kb
                    SizeMB         = $sizeMb
                    IsDownloaded   = [bool]$u.IsDownloaded
                    IsMandatory    = [bool]$u.IsMandatory
                    RebootRequired = [bool]$u.RebootRequired
                    IsDriver       = $isDriver
                    UpdateID       = $uId
                    Status         = 'Pending'
                    UpdateObject   = $u
                }
            }
        }
    } catch {
        Write-CascadeLog "Windows Update scan failed: $($_.Exception.Message)" "ERROR"
        if ($StatusCallback) { & $StatusCallback "Scan failed: $($_.Exception.Message)" }
    }

    return $updates
}

function Test-CascadeSystemRebootPending {
    [CmdletBinding()]
    param()

    $pending = $false
    try {
        if (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired") { $pending = $true }
        if (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending") { $pending = $true }
        $sm = (Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager" -Name "PendingFileRenameOperations" -ErrorAction SilentlyContinue).PendingFileRenameOperations
        if ($sm) { $pending = $true }
    } catch { }
    return $pending
}

function Install-CascadeUpdates {
    [CmdletBinding()]
    param(
        [System.Collections.IList]$UpdatesToProcess,
        [scriptblock]$StatusCallback,
        [scriptblock]$ProgressCallback
    )

    if (-not $UpdatesToProcess -or $UpdatesToProcess.Count -eq 0) {
        if ($StatusCallback) { & $StatusCallback "No updates supplied for installation." }
        return [PSCustomObject]@{
            Success        = $true
            InstalledCount = 0
            FailedCount    = 0
            RebootRequired = $false
        }
    }

    Ensure-CascadeUpdateServices
    $session = New-Object -ComObject Microsoft.Update.Session
    $downloader = $session.CreateUpdateDownloader()
    $downloadColl = New-Object -ComObject Microsoft.Update.UpdateColl

    if ($StatusCallback) { & $StatusCallback "Preparing download bundle for $($UpdatesToProcess.Count) update package(s)..." }

    foreach ($item in $UpdatesToProcess) {
        $uObj = if ($item.UpdateObject) { $item.UpdateObject } else { $item }
        if ($uObj.EulaAccepted -eq $false) {
            try { $uObj.AcceptEula() } catch { }
        }
        $downloadColl.Add($uObj) | Out-Null
    }

    $downloader.Updates = $downloadColl
    if ($StatusCallback) { & $StatusCallback "Downloading $($downloadColl.Count) update package(s)..." }

    try {
        $downloadResult = $downloader.Download()
    } catch {
        Write-CascadeLog "Download error: $($_.Exception.Message)" "ERROR"
        if ($StatusCallback) { & $StatusCallback "Download error: $($_.Exception.Message)" }
        return [PSCustomObject]@{
            Success        = $false
            InstalledCount = 0
            FailedCount    = $UpdatesToProcess.Count
            RebootRequired = $false
            Error          = $_.Exception.Message
        }
    }

    $installer = $session.CreateUpdateInstaller()
    $installer.ForceQuiet = $true
    $installed = 0
    $failed = 0
    $rebootNeeded = $false

    for ($i = 0; $i -lt $downloadColl.Count; $i++) {
        $u = $downloadColl.Item($i)
        $pct = [math]::Round((($i) / $downloadColl.Count) * 100)
        if ($ProgressCallback) { & $ProgressCallback $pct }

        if (-not $u.IsDownloaded) {
            $failed++
            Write-CascadeLog "Skipping un-downloaded update: $($u.Title)" "WARN"
            continue
        }

        if ($StatusCallback) { & $StatusCallback "Installing ($($i + 1)/$($downloadColl.Count)): $($u.Title)..." }

        $singleColl = New-Object -ComObject Microsoft.Update.UpdateColl
        $singleColl.Add($u) | Out-Null
        $installer.Updates = $singleColl

        try {
            $instRes = $installer.Install()
            $code = $instRes.ResultCode
            # ResultCode: 2 = Succeeded, 3 = SucceededWithErrors
            if ($code -eq 2 -or $code -eq 3) {
                $installed++
                Write-CascadeLog "Installed successfully: $($u.Title)" "SUCCESS"
            } else {
                $failed++
                Write-CascadeLog "Installation failed (Code $code): $($u.Title)" "WARN"
            }
            if ($instRes.RebootRequired) {
                $rebootNeeded = $true
            }
        } catch {
            $failed++
            Write-CascadeLog "Installation exception on $($u.Title): $($_.Exception.Message)" "ERROR"
        }
    }

    if ($ProgressCallback) { & $ProgressCallback 100 }
    if ($StatusCallback) {
        & $StatusCallback "Installation finished: $installed succeeded, $failed failed. Reboot required: $rebootNeeded"
    }

    return [PSCustomObject]@{
        Success        = ($failed -eq 0)
        InstalledCount = $installed
        FailedCount    = $failed
        RebootRequired = $rebootNeeded
    }
}

# --- 10. AUTONOMOUS CASCADE LOOP ENGINE ---
function Start-AutonomousCascadeLoop {
    [CmdletBinding()]
    param(
        [int]$MaxPasses = 5,
        [switch]$IncludeDrivers = $true,
        [int]$RebootDelay = 5,
        [switch]$NoReboot,
        [scriptblock]$StatusCallback,
        [scriptblock]$ProgressCallback,
        [scriptblock]$CountdownCallback
    )

    $state = Get-CascadeState
    $currentPass    = if ($state -and $state.Active) { [int]$state.CurrentPass } else { 1 }
    $totalInstalled = if ($state -and $state.Active) { [int]$state.TotalInstalled } else { 0 }
    $effDrivers     = if ($state -and $state.Active) { [bool]$state.IncludeDrivers } else { $IncludeDrivers }
    $effMaxPasses   = if ($state -and $state.Active) { [int]$state.MaxPasses } else { $MaxPasses }

    Write-CascadeLog "=== UPDATE CASCADE: PASS $currentPass OF $effMaxPasses (Total Installed So Far: $totalInstalled) ===" "STEP"
    if ($StatusCallback) {
        & $StatusCallback "Starting Cascade Pass $currentPass of $effMaxPasses (Drivers: $effDrivers)..."
    }

    # Step 1: Scan for updates
    $rawUpdates = Get-CascadePendingUpdates -IncludeDrivers:$effDrivers -StatusCallback $StatusCallback

    if (-not $rawUpdates -or $rawUpdates.Count -eq 0) {
        Write-CascadeLog "System is 100% up to date! Zero pending updates found." "SUCCESS"
        Write-CascadeLog "Cascade loop complete. Total updates installed across passes: $totalInstalled." "SUCCESS"
        Unregister-CascadePersistence
        Clear-CascadeState
        if ($StatusCallback) {
            & $StatusCallback "System is 100% up to date! Cascade loop complete. Total updates installed: $totalInstalled."
        }
        return [PSCustomObject]@{
            Completed      = $true
            CurrentPass    = $currentPass
            TotalInstalled = $totalInstalled
            RebootRequired = $false
        }
    }

    Write-CascadeLog "Pass ${currentPass}: Found $($rawUpdates.Count) pending update package(s)." "INFO"
    if ($StatusCallback) { & $StatusCallback "Pass ${currentPass}: Found $($rawUpdates.Count) pending updates. Starting download & install..." }

    # Step 2: Download and install
    $installRes = Install-CascadeUpdates -UpdatesToProcess $rawUpdates -StatusCallback $StatusCallback -ProgressCallback $ProgressCallback
    $totalInstalled += $installRes.InstalledCount

    # Step 3: Check reboot requirements
    $rebootNeeded = [bool]$installRes.RebootRequired
    if (-not $rebootNeeded) {
        $rebootNeeded = ($installRes.InstalledCount -gt 0) -or (Test-CascadeSystemRebootPending)
    }

    if ($rebootNeeded) {
        $nextPass = $currentPass + 1
        if ($nextPass -le $effMaxPasses) {
            Write-CascadeLog "Reboot is REQUIRED to commit installed updates. Preparing Pass $nextPass of $effMaxPasses..." "WARN"
            Set-CascadeState -CurrentPass $nextPass -MaxPasses $effMaxPasses -IncludeDrivers:$effDrivers -TotalInstalled $totalInstalled -Active $true -Autonomous $true
            Register-CascadePersistence

            if ($NoReboot) {
                Write-CascadeLog "-NoReboot specified. Automatic restart suppressed. Please reboot manually to continue cascade." "WARN"
                return [PSCustomObject]@{
                    Completed      = $false
                    CurrentPass    = $currentPass
                    NextPass       = $nextPass
                    TotalInstalled = $totalInstalled
                    RebootRequired = $true
                }
            }

            # Countdown restart
            Write-CascadeLog "Restarting system automatically in $RebootDelay seconds..." "STEP"
            for ($s = $RebootDelay; $s -gt 0; $s--) {
                if ($script:RebootAborted) {
                    Write-CascadeLog "Restart aborted by operator." "WARN"
                    return [PSCustomObject]@{ Completed = $false; RebootAborted = $true }
                }
                if ($CountdownCallback) { & $CountdownCallback $s }
                if ($StatusCallback) { & $StatusCallback "Restarting system in $s second(s)... (Click Cancel to abort)" }
                Start-Sleep -Seconds 1
            }

            if (-not $script:RebootAborted) {
                Invoke-CascadeReboot -DelaySeconds 0 -Reason "UpdateCascade: Pass $currentPass commit, resuming Pass $nextPass"
            }
            return [PSCustomObject]@{
                Completed      = $false
                CurrentPass    = $currentPass
                NextPass       = $nextPass
                TotalInstalled = $totalInstalled
                RebootRequired = $true
            }
        } else {
            Write-CascadeLog "Reached configured MaxPasses ($effMaxPasses). Cascade complete. Total updates installed: $totalInstalled." "SUCCESS"
            Unregister-CascadePersistence
            Clear-CascadeState
            if (-not $NoReboot) {
                Write-CascadeLog "Final reboot to commit all installed patches in $RebootDelay seconds..." "STEP"
                Start-Sleep -Seconds $RebootDelay
                Invoke-CascadeReboot -DelaySeconds 0 -Reason "UpdateCascade: Final patch commit"
            }
            return [PSCustomObject]@{
                Completed      = $true
                CurrentPass    = $currentPass
                TotalInstalled = $totalInstalled
                RebootRequired = $true
            }
        }
    } else {
        Write-CascadeLog "Zero updates pending reboot. Cascade successfully complete! Total installed: $totalInstalled." "SUCCESS"
        Unregister-CascadePersistence
        Clear-CascadeState
        if ($StatusCallback) {
            & $StatusCallback "Zero updates pending reboot. Cascade complete! Total updates installed: $totalInstalled."
        }
        return [PSCustomObject]@{
            Completed      = $true
            CurrentPass    = $currentPass
            TotalInstalled = $totalInstalled
            RebootRequired = $false
        }
    }
}

# --- 11. WORKER RUNSPACE FACTORY & MODERN WIN11 LIGHTWEIGHT WPF GUI ---
function New-CascadeRunspace {
    [CmdletBinding()]
    param()

    $iss = [System.Management.Automation.Runspaces.InitialSessionState]::CreateDefault()

    $funcNames = @(
        'Write-CascadeLog',
        'Get-CascadeRuntimeContext',
        'Save-CascadeSelfCopy',
        'Get-CascadeState',
        'Set-CascadeState',
        'Clear-CascadeState',
        'Register-CascadePersistence',
        'Unregister-CascadePersistence',
        'Invoke-CascadeReboot',
        'Ensure-CascadeUpdateServices',
        'Enable-MicrosoftUpdateCatalog',
        'Invoke-CascadeUsoScan',
        'Get-CascadePendingUpdates',
        'Install-CascadeUpdates',
        'Test-CascadeSystemRebootPending',
        'Start-AutonomousCascadeLoop'
    )

    foreach ($fn in $funcNames) {
        $c = Get-Command $fn -ErrorAction SilentlyContinue
        if ($c) {
            $iss.Commands.Add((New-Object System.Management.Automation.Runspaces.SessionStateFunctionEntry($fn, $c.Definition)))
        }
    }

    $vars = @{
        'AppName'         = $script:AppName
        'AppVersion'     = $script:AppVersion
        'PersistDir'      = $script:PersistDir
        'StateFile'       = $script:StateFile
        'LogFile'         = $script:LogFile
        'ScriptSelfCopy'  = $script:ScriptSelfCopy
        'ResumeCmd'       = $script:ResumeCmd
        'ResumeVbs'       = $script:ResumeVbs
        'LaunchCmd'       = $script:LaunchCmd
        'MutexName'       = $script:MutexName
        'TaskLogonName'   = $script:TaskLogonName
        'TaskBootName'    = $script:TaskBootName
        'ServiceName'     = $script:ServiceName
        'RunOnceName'     = $script:RunOnceName
        'RunName'         = $script:RunName
        'ActiveSetupGuid' = $script:ActiveSetupGuid
    }

    foreach ($kv in $vars.GetEnumerator()) {
        $iss.Variables.Add((New-Object System.Management.Automation.Runspaces.SessionStateVariableEntry($kv.Key, $kv.Value, 'Cascade global')))
    }

    $rs = [runspacefactory]::CreateRunspace($iss)
    $rs.ApartmentState = 'MTA'
    $rs.Open()
    return $rs
}

function Start-CascadeGui {
    [CmdletBinding()]
    param(
        [switch]$MonitorOnly
    )

    # Ensure STA apartment state
    if ([System.Threading.Thread]::CurrentThread.GetApartmentState() -ne [System.Threading.ApartmentState]::STA) {
        Write-CascadeLog "WPF GUI requires STA thread apartment. Relaunching in dedicated STA host..." "INFO"
        $self = Save-CascadeSelfCopy
        if ($global:CascadeMutex) {
            try { $global:CascadeMutex.ReleaseMutex() } catch { }
            try { $global:CascadeMutex.Dispose() } catch { }
            $global:CascadeMutex = $null
        }
        $argList = "-NoProfile -ExecutionPolicy Bypass -STA -File `"$self`" -Gui"
        if ($ResumeFromRestart) { $argList += " -ResumeFromRestart" }
        if ($MonitorOnly) { $argList += " -MonitorOnly" }
        Start-Process -FilePath "powershell.exe" -ArgumentList $argList
        exit 0
    }

    try {
        Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase -ErrorAction Stop
    } catch {
        [void][System.Reflection.Assembly]::LoadWithPartialName('presentationframework')
        [void][System.Reflection.Assembly]::LoadWithPartialName('presentationcore')
        [void][System.Reflection.Assembly]::LoadWithPartialName('windowsbase')
    }

    $xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="UpdateCascade - Autonomous Windows Update &amp; Driver Engine"
        Height="780" Width="1060" MinHeight="680" MinWidth="880"
        WindowStartupLocation="CenterScreen" Background="#0F172A"
        Foreground="#F8FAFC" FontFamily="Segoe UI, Segoe UI Variable, Arial">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="FontWeight" Value="SemiBold"/>
            <Setter Property="FontSize" Value="13"/>
            <Setter Property="Padding" Value="14,8"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="BorderThickness" Value="1"/>
        </Style>
    </Window.Resources>

    <Grid Margin="20">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/> <!-- Header -->
            <RowDefinition Height="Auto"/> <!-- Status Card -->
            <RowDefinition Height="*"/>    <!-- Updates Grid & Log -->
            <RowDefinition Height="Auto"/> <!-- Action Controls -->
        </Grid.RowDefinitions>

        <!-- HEADER -->
        <Border Grid.Row="0" Background="#1E293B" CornerRadius="8" Padding="16,14" BorderBrush="#334155" BorderThickness="1" Margin="0,0,0,14">
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="Auto"/>
                </Grid.ColumnDefinitions>
                <StackPanel Grid.Column="0">
                    <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                        <TextBlock Text=">>" FontSize="20" Margin="0,0,8,0" Foreground="#38BDF8"/>
                        <TextBlock Text="UPDATE CASCADE" FontSize="20" FontWeight="Bold" Foreground="#38BDF8"/>
                        <Border Background="#0EA5E9" CornerRadius="4" Padding="6,2" Margin="12,0,0,0" VerticalAlignment="Center">
                            <TextBlock Text="OOBE &amp; DESKTOP READY" FontSize="10" FontWeight="Bold" Foreground="#FFFFFF"/>
                        </Border>
                    </StackPanel>
                    <TextBlock Text="Autonomous multi-pass Windows Update and Driver cascade with 17-tier reboot persistence." FontSize="12" Foreground="#94A3B8" Margin="0,4,0,0"/>
                </StackPanel>

                <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Center">
                    <Border Name="PillStatus" Background="#1E3A8A" CornerRadius="12" Padding="12,4" Margin="0,0,10,0">
                        <TextBlock Name="TxtPillStatus" Text="READY" FontSize="11" FontWeight="Bold" Foreground="#93C5FD"/>
                    </Border>
                    <Border Name="BadgePass" Background="#064E3B" CornerRadius="12" Padding="12,4">
                        <TextBlock Name="TxtBadgePass" Text="Pass 1 of 5" FontSize="11" FontWeight="Bold" Foreground="#6EE7B7"/>
                    </Border>
                </StackPanel>
            </Grid>
        </Border>

        <!-- STATUS & PROGRESS CARD -->
        <Border Grid.Row="1" Background="#1E293B" CornerRadius="8" Padding="16" BorderBrush="#334155" BorderThickness="1" Margin="0,0,0,14">
            <StackPanel>
                <Grid Margin="0,0,0,8">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                    </Grid.ColumnDefinitions>
                    <TextBlock Name="TxtStatusMessage" Text="System ready. Click 'Start Autonomous Cascade' to begin." FontSize="13" FontWeight="SemiBold" Foreground="#F1F5F9"/>
                    <TextBlock Name="TxtTotalStats" Grid.Column="1" Text="Total Patches Installed: 0" FontSize="12" Foreground="#94A3B8"/>
                </Grid>

                <!-- Step Progress -->
                <ProgressBar Name="ProgCurrentStep" Height="10" Background="#0F172A" Foreground="#38BDF8" BorderThickness="0" Margin="0,4,0,10"/>

                <!-- Countdown Alert Banner (Hidden by default) -->
                <Border Name="BannerCountdown" Background="#7F1D1D" CornerRadius="6" Padding="12,8" Margin="0,4,0,0" Visibility="Collapsed">
                    <Grid>
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="*"/>
                            <ColumnDefinition Width="Auto"/>
                        </Grid.ColumnDefinitions>
                        <TextBlock Name="TxtCountdown" Text="[!] Reboot required to commit updates. Restarting automatically in 5 seconds..." FontSize="13" FontWeight="Bold" Foreground="#FCA5A5" VerticalAlignment="Center"/>
                        <StackPanel Grid.Column="1" Orientation="Horizontal">
                            <Button Name="BtnRestartNow" Content="Restart Now" Background="#DC2626" Foreground="#FFFFFF" BorderBrush="#EF4444" Margin="0,0,8,0" Padding="10,4"/>
                            <Button Name="BtnCancelCountdown" Content="Cancel Reboot" Background="#334155" Foreground="#F8FAFC" BorderBrush="#475569" Padding="10,4"/>
                        </StackPanel>
                    </Grid>
                </Border>
            </StackPanel>
        </Border>

        <!-- UPDATES GRID & REAL-TIME LOG -->
        <Grid Grid.Row="2" Margin="0,0,0,14">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="6*"/>
                <ColumnDefinition Width="5*"/>
            </Grid.ColumnDefinitions>

            <!-- Left: Updates List -->
            <Border Grid.Column="0" Background="#1E293B" CornerRadius="8" Padding="12" BorderBrush="#334155" BorderThickness="1" Margin="0,0,10,0">
                <Grid>
                    <Grid.RowDefinitions>
                        <RowDefinition Height="Auto"/>
                        <RowDefinition Height="*"/>
                    </Grid.RowDefinitions>
                    <Grid Grid.Row="0" Margin="0,0,0,8">
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="*"/>
                            <ColumnDefinition Width="Auto"/>
                        </Grid.ColumnDefinitions>
                        <TextBlock Text="PENDING UPDATES &amp; DRIVERS" FontSize="12" FontWeight="Bold" Foreground="#94A3B8" VerticalAlignment="Center"/>
                        <StackPanel Grid.Column="1" Orientation="Horizontal">
                            <Button Name="BtnSelectAll" Content="Select All" Background="Transparent" Foreground="#38BDF8" BorderThickness="0" Padding="4,2" FontSize="11"/>
                            <TextBlock Text="|" Foreground="#475569" Margin="4,0" VerticalAlignment="Center"/>
                            <Button Name="BtnDeselectAll" Content="Deselect All" Background="Transparent" Foreground="#94A3B8" BorderThickness="0" Padding="4,2" FontSize="11"/>
                        </StackPanel>
                    </Grid>

                    <ListView Name="LstUpdates" Grid.Row="1" Background="#0F172A" BorderBrush="#334155" BorderThickness="1" Foreground="#F8FAFC">
                        <ListView.View>
                            <GridView>
                                <GridViewColumn Width="40">
                                    <GridViewColumn.CellTemplate>
                                        <DataTemplate>
                                            <CheckBox IsChecked="{Binding IsSelected}" VerticalAlignment="Center"/>
                                        </DataTemplate>
                                    </GridViewColumn.CellTemplate>
                                </GridViewColumn>
                                <GridViewColumn Header="Title" Width="260" DisplayMemberBinding="{Binding Title}"/>
                                <GridViewColumn Header="KB" Width="80" DisplayMemberBinding="{Binding KB}"/>
                                <GridViewColumn Header="Size" Width="60" DisplayMemberBinding="{Binding SizeDisplay}"/>
                                <GridViewColumn Header="Type" Width="70" DisplayMemberBinding="{Binding TypeDisplay}"/>
                                <GridViewColumn Header="Status" Width="80" DisplayMemberBinding="{Binding Status}"/>
                            </GridView>
                        </ListView.View>
                    </ListView>
                </Grid>
            </Border>

            <!-- Right: Real-Time Log Console -->
            <Border Grid.Column="1" Background="#1E293B" CornerRadius="8" Padding="12" BorderBrush="#334155" BorderThickness="1">
                <Grid>
                    <Grid.RowDefinitions>
                        <RowDefinition Height="Auto"/>
                        <RowDefinition Height="*"/>
                        <RowDefinition Height="Auto"/>
                    </Grid.RowDefinitions>
                    <Grid Grid.Row="0" Margin="0,0,0,8">
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="*"/>
                            <ColumnDefinition Width="Auto"/>
                        </Grid.ColumnDefinitions>
                        <TextBlock Text="ACTIVITY LOG" FontSize="12" FontWeight="Bold" Foreground="#94A3B8" VerticalAlignment="Center"/>
                        <StackPanel Grid.Column="1" Orientation="Horizontal">
                            <Button Name="BtnClearLog" Content="Clear" Background="Transparent" Foreground="#94A3B8" BorderThickness="0" Padding="4,2" FontSize="11"/>
                            <TextBlock Text="|" Foreground="#475569" Margin="4,0" VerticalAlignment="Center"/>
                            <Button Name="BtnCopyLog" Content="Copy" Background="Transparent" Foreground="#38BDF8" BorderThickness="0" Padding="4,2" FontSize="11"/>
                        </StackPanel>
                    </Grid>

                    <TextBox Name="TxtLogConsole" Grid.Row="1" Background="#0A0F1D" Foreground="#A7F3D0" BorderBrush="#334155" BorderThickness="1"
                             FontFamily="Consolas, Cascadia Code, Courier New" FontSize="11" IsReadOnly="True"
                             TextWrapping="Wrap" VerticalScrollBarVisibility="Auto"/>

                    <!-- Options Bar under log -->
                    <StackPanel Grid.Row="2" Orientation="Horizontal" Margin="0,8,0,0" VerticalAlignment="Center">
                        <CheckBox Name="ChkIncludeDrivers" Content="Include Hardware Drivers" IsChecked="True" Foreground="#CBD5E1" FontSize="12" Margin="0,0,16,0" VerticalAlignment="Center"/>
                        <TextBlock Text="Max Passes:" Foreground="#94A3B8" FontSize="12" VerticalAlignment="Center" Margin="0,0,6,0"/>
                        <ComboBox Name="CmbMaxPasses" SelectedIndex="2" Width="60" Height="26" Background="#1E293B" Foreground="#000000">
                            <ComboBoxItem Content="1"/>
                            <ComboBoxItem Content="3"/>
                            <ComboBoxItem Content="5"/>
                            <ComboBoxItem Content="8"/>
                            <ComboBoxItem Content="10"/>
                        </ComboBox>
                    </StackPanel>
                </Grid>
            </Border>
        </Grid>

        <!-- ACTION CONTROLS -->
        <Border Grid.Row="3" Background="#1E293B" CornerRadius="8" Padding="14,10" BorderBrush="#334155" BorderThickness="1">
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="Auto"/>
                </Grid.ColumnDefinitions>

                <StackPanel Grid.Column="0" Orientation="Horizontal" VerticalAlignment="Center">
                    <Button Name="BtnStartCascade" Content=">> Start Autonomous Cascade" Background="#2563EB" Foreground="#FFFFFF" BorderBrush="#3B82F6" Margin="0,0,10,0"/>
                    <Button Name="BtnPauseCascade" Content="Pause Cascade" Background="#475569" Foreground="#F8FAFC" BorderBrush="#64748B" Margin="0,0,10,0" Visibility="Collapsed"/>
                    <Button Name="BtnScanOnly" Content=" Scan Only" Background="#1E293B" Foreground="#E2E8F0" BorderBrush="#475569" Margin="0,0,10,0"/>
                    <Button Name="BtnInstallSelected" Content="Install Selected" Background="#059669" Foreground="#FFFFFF" BorderBrush="#10B981" Margin="0,0,10,0"/>
                </StackPanel>

                <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Center">
                    <Button Name="BtnManualReboot" Content="[*] Reboot Now" Background="#DC2626" Foreground="#FFFFFF" BorderBrush="#EF4444" Margin="0,0,10,0"/>
                    <Button Name="BtnUnregisterAll" Content=" Cleanup Persistence" Background="#334155" Foreground="#94A3B8" BorderBrush="#475569"/>
                </StackPanel>
            </Grid>
        </Border>
    </Grid>
</Window>
"@

    $window = $null
    try {
        $reader = [System.Xml.XmlReader]::Create([System.IO.StringReader]::new($xaml))
        $window = [System.Windows.Markup.XamlReader]::Load($reader)
    } catch {
        Write-CascadeLog "Failed to load WPF XAML interface: $($_.Exception.Message)" "ERROR"
    }

    if (-not $window) {
        Write-CascadeLog "WPF GUI window could not be initialized. Falling back gracefully to autonomous CLI cascade..." "WARN"
        if (-not $MonitorOnly) {
            Start-AutonomousCascadeLoop -MaxPasses $MaxPasses -IncludeDrivers:$IncludeDrivers -RebootDelay $RebootDelay
        }
        return
    }

    # Bind UI Controls
    $txtPillStatus      = $window.FindName('TxtPillStatus')
    $pillStatus         = $window.FindName('PillStatus')
    $txtBadgePass       = $window.FindName('TxtBadgePass')
    $txtStatusMessage   = $window.FindName('TxtStatusMessage')
    $txtTotalStats      = $window.FindName('TxtTotalStats')
    $progCurrentStep    = $window.FindName('ProgCurrentStep')
    $bannerCountdown    = $window.FindName('BannerCountdown')
    $txtCountdown       = $window.FindName('TxtCountdown')
    $btnRestartNow      = $window.FindName('BtnRestartNow')
    $btnCancelCountdown = $window.FindName('BtnCancelCountdown')
    $lstUpdates         = $window.FindName('LstUpdates')
    $btnSelectAll       = $window.FindName('BtnSelectAll')
    $btnDeselectAll     = $window.FindName('BtnDeselectAll')
    $txtLogConsole      = $window.FindName('TxtLogConsole')
    $btnClearLog        = $window.FindName('BtnClearLog')
    $btnCopyLog         = $window.FindName('BtnCopyLog')
    $chkIncludeDrivers  = $window.FindName('ChkIncludeDrivers')
    $cmbMaxPasses       = $window.FindName('CmbMaxPasses')
    $btnStartCascade    = $window.FindName('BtnStartCascade')
    $btnPauseCascade    = $window.FindName('BtnPauseCascade')
    $btnScanOnly        = $window.FindName('BtnScanOnly')
    $btnInstallSelected = $window.FindName('BtnInstallSelected')
    $btnManualReboot    = $window.FindName('BtnManualReboot')
    $btnUnregisterAll   = $window.FindName('BtnUnregisterAll')

    # Observable Collection for Updates
    $observableUpdates = New-Object System.Collections.ObjectModel.ObservableCollection[Object]
    $lstUpdates.ItemsSource = $observableUpdates

    # UI Log Appender Callback
    $script:GuiLogCallback = {
        param($msg, $level)
        try {
            $window.Dispatcher.Invoke([Action]{
                $ts = (Get-Date).ToString('HH:mm:ss')
                $txtLogConsole.AppendText("[$ts] [$level] $msg`r`n")
                $txtLogConsole.ScrollToEnd()
            })
        } catch { }
    }

    # State Variables
    $uiState = [hashtable]::Synchronized(@{
        IsRunning       = $false
        CountdownActive = $false
        TotalInstalled  = 0
        CurrentPass     = 1
        MaxPasses       = 5
        RawUpdates      = @()
    })

    # Read persistent state if resuming
    $initState = Get-CascadeState
    if ($initState -and $initState.Active) {
        $uiState.CurrentPass = [int]$initState.CurrentPass
        $uiState.MaxPasses = [int]$initState.MaxPasses
        $uiState.TotalInstalled = [int]$initState.TotalInstalled
        $txtBadgePass.Text = "Pass $($uiState.CurrentPass) of $($uiState.MaxPasses)"
        $txtTotalStats.Text = "Total Patches Installed: $($uiState.TotalInstalled)"
        $chkIncludeDrivers.IsChecked = [bool]$initState.IncludeDrivers
        Write-CascadeLog "Resumed active cascade: Pass $($uiState.CurrentPass) of $($uiState.MaxPasses), $($uiState.TotalInstalled) updates already committed." "INFO"
    }

    # Helper: Update UI Status
    $fnSetStatus = {
        param($statusText, $pillText, $pillBgHex, $pillFgHex)
        $window.Dispatcher.Invoke([Action]{
            if ($statusText) { $txtStatusMessage.Text = $statusText }
            if ($pillText)   { $txtPillStatus.Text = $pillText }
            if ($pillBgHex)  { $pillStatus.Background = [System.Windows.Media.BrushConverter]::new().ConvertFromString($pillBgHex) }
            if ($pillFgHex)  { $txtPillStatus.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString($pillFgHex) }
        })
    }

    # Helper: Refresh Updates List
    $fnPopulateUpdates = {
        param($updateItems)
        $window.Dispatcher.Invoke([Action]{
            $observableUpdates.Clear()
            foreach ($u in $updateItems) {
                $item = New-Object PSObject -Property @{
                    IsSelected  = $true
                    Title       = $u.Title
                    KB          = if ($u.KB) { $u.KB } else { 'N/A' }
                    SizeDisplay = "$($u.SizeMB) MB"
                    TypeDisplay = if ($u.IsDriver) { 'Driver' } else { 'Software' }
                    Status      = $u.Status
                    Raw         = $u
                }
                $observableUpdates.Add($item)
            }
        })
    }

    # Real-Time Disk Log Poller (Streams cascade.log updates dynamically)
    $script:LogStreamOffset = 0
    if (Test-Path $script:LogFile) {
        try {
            $existingBytes = [System.IO.File]::ReadAllText($script:LogFile, [System.Text.Encoding]::UTF8)
            $txtLogConsole.AppendText($existingBytes)
            $txtLogConsole.ScrollToEnd()
            $script:LogStreamOffset = [System.IO.FileInfo]::new($script:LogFile).Length
        } catch { }
    }

    $timerLogPoller = New-Object System.Windows.Threading.DispatcherTimer
    $timerLogPoller.Interval = [TimeSpan]::FromMilliseconds(250)
    $timerLogPoller.Add_Tick({
        try {
            if (Test-Path $script:LogFile) {
                $fi = [System.IO.FileInfo]::new($script:LogFile)
                if ($fi.Length -gt $script:LogStreamOffset) {
                    $fs = [System.IO.File]::Open($script:LogFile, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
                    $fs.Seek($script:LogStreamOffset, [System.IO.SeekOrigin]::Begin) | Out-Null
                    $sr = New-Object System.IO.StreamReader($fs, [System.Text.Encoding]::UTF8)
                    $newLines = $sr.ReadToEnd()
                    $script:LogStreamOffset = $fs.Position
                    $sr.Dispose()
                    $fs.Dispose()
                    if ($newLines) {
                        $txtLogConsole.AppendText($newLines)
                        $txtLogConsole.ScrollToEnd()
                    }
                }
            }
            # Keep pass badge and total count in sync with state file
            $st = Get-CascadeState
            if ($st -and $st.Active) {
                $txtBadgePass.Text = "Pass $($st.CurrentPass) of $($st.MaxPasses)"
                $txtTotalStats.Text = "Total Patches Installed: $($st.TotalInstalled)"
            }
        } catch { }
    })
    $timerLogPoller.Start()

    # Action: Start Cascade Pass
    $fnExecuteCascadePass = {
        if ($uiState.IsRunning) { return }
        $uiState.IsRunning = $true
        $script:RebootAborted = $false
        $btnStartCascade.Visibility = [System.Windows.Visibility]::Collapsed
        $btnPauseCascade.Visibility = [System.Windows.Visibility]::Visible
        $btnScanOnly.IsEnabled = $false
        $btnInstallSelected.IsEnabled = $false
        $bannerCountdown.Visibility = [System.Windows.Visibility]::Collapsed

        $currPass = $uiState.CurrentPass
        $maxPasses = if ($cmbMaxPasses.SelectedItem) { [int]$cmbMaxPasses.SelectedItem.Content } else { 5 }
        $incDrivers = [bool]$chkIncludeDrivers.IsChecked
        $uiState.MaxPasses = $maxPasses

        & $fnSetStatus "Pass $currPass of ${maxPasses}: Scanning for updates..." "SCANNING" "#1E3A8A" "#93C5FD"
        Write-CascadeLog "Starting Cascade Pass $currPass of $maxPasses (Drivers: $incDrivers)..." "STEP"

        # Run Scan in configured Cascade Worker Runspace
        $rs = New-CascadeRunspace
        $ps = [powershell]::Create()
        $ps.Runspace = $rs
        [void]$ps.AddCommand('Get-CascadePendingUpdates').AddParameter('IncludeDrivers', $incDrivers)

        $scanResult = $ps.BeginInvoke()
        $timerScan = New-Object System.Windows.Threading.DispatcherTimer
        $timerScan.Interval = [TimeSpan]::FromMilliseconds(250)
        $timerScan.Add_Tick({
            if ($scanResult.IsCompleted) {
                $timerScan.Stop()
                $updates = @()
                try { $updates = $ps.EndInvoke($scanResult) } catch { }
                $ps.Dispose()
                $rs.Dispose()

                $uiState.RawUpdates = $updates
                & $fnPopulateUpdates $updates

                if (-not $updates -or $updates.Count -eq 0) {
                    & $fnSetStatus "System is 100% up to date! Zero pending updates found." "COMPLETED" "#064E3B" "#6EE7B7"
                    Write-CascadeLog "Pass $currPass found 0 pending updates. Cascade complete! Total installed: $($uiState.TotalInstalled)." "SUCCESS"
                    Unregister-CascadePersistence
                    Clear-CascadeState
                    $uiState.IsRunning = $false
                    $btnStartCascade.Visibility = [System.Windows.Visibility]::Visible
                    $btnPauseCascade.Visibility = [System.Windows.Visibility]::Collapsed
                    $btnScanOnly.IsEnabled = $true
                    $btnInstallSelected.IsEnabled = $true
                    return
                }

                # Step 2: Download & Install in configured Cascade Worker Runspace
                & $fnSetStatus "Pass $currPass of ${maxPasses}: Installing $($updates.Count) update package(s)..." "INSTALLING" "#7C2D12" "#FDBA74"
                Write-CascadeLog "Pass ${currPass}: Beginning installation of $($updates.Count) updates..." "STEP"

                $rsInst = New-CascadeRunspace
                $psInst = [powershell]::Create()
                $psInst.Runspace = $rsInst
                [void]$psInst.AddCommand('Install-CascadeUpdates').AddParameter('UpdatesToProcess', $updates)

                $instResult = $psInst.BeginInvoke()
                $timerInst = New-Object System.Windows.Threading.DispatcherTimer
                $timerInst.Interval = [TimeSpan]::FromMilliseconds(300)
                $timerInst.Add_Tick({
                    if ($instResult.IsCompleted) {
                        $timerInst.Stop()
                        $res = $null
                        try { $res = $psInst.EndInvoke($instResult) } catch { }
                        $psInst.Dispose()
                        $rsInst.Dispose()

                        $installedCount = if ($res -and $res.InstalledCount) { [int]$res.InstalledCount } else { 0 }
                        $rebootReq = if ($res -and $res.RebootRequired) { [bool]$res.RebootRequired } else { $false }
                        if (-not $rebootReq) { $rebootReq = ($installedCount -gt 0) -or (Test-CascadeSystemRebootPending) }

                        $uiState.TotalInstalled += $installedCount
                        $txtTotalStats.Text = "Total Patches Installed: $($uiState.TotalInstalled)"
                        Write-CascadeLog "Pass $currPass installation finished ($installedCount installed). Reboot required: $rebootReq" "INFO"

                        if ($rebootReq) {
                            $nextPass = $currPass + 1
                            if ($nextPass -le $maxPasses) {
                                & $fnSetStatus "Reboot required to commit updates. Pass $nextPass of $maxPasses scheduled." "REBOOTING" "#831843" "#F472B6"
                                Set-CascadeState -CurrentPass $nextPass -MaxPasses $maxPasses -IncludeDrivers:$incDrivers -TotalInstalled $uiState.TotalInstalled -Active $true -Autonomous $false
                                Register-CascadePersistence

                                # Show Countdown Banner
                                $bannerCountdown.Visibility = [System.Windows.Visibility]::Visible
                                $countSeconds = 5
                                $timerCount = New-Object System.Windows.Threading.DispatcherTimer
                                $timerCount.Interval = [TimeSpan]::FromSeconds(1)
                                $timerCount.Add_Tick({
                                    if ($script:RebootAborted) {
                                        $timerCount.Stop()
                                        $bannerCountdown.Visibility = [System.Windows.Visibility]::Collapsed
                                        & $fnSetStatus "Reboot cancelled by user. Cascade paused." "PAUSED" "#475569" "#CBD5E1"
                                        $uiState.IsRunning = $false
                                        $btnStartCascade.Visibility = [System.Windows.Visibility]::Visible
                                        $btnPauseCascade.Visibility = [System.Windows.Visibility]::Collapsed
                                        return
                                    }
                                    $txtCountdown.Text = "[!] Reboot required to commit updates. Restarting automatically in $countSeconds second(s)..."
                                    if ($countSeconds -le 0) {
                                        $timerCount.Stop()
                                        Invoke-CascadeReboot -DelaySeconds 0 -Reason "UpdateCascade Pass $currPass commit"
                                    }
                                    $countSeconds--
                                })
                                $timerCount.Start()
                            } else {
                                & $fnSetStatus "Reached MaxPasses ($maxPasses). System patched!" "COMPLETED" "#064E3B" "#6EE7B7"
                                Write-CascadeLog "Reached MaxPasses ($maxPasses). Cascade complete! Total installed: $($uiState.TotalInstalled)." "SUCCESS"
                                Unregister-CascadePersistence
                                Clear-CascadeState
                                $uiState.IsRunning = $false
                                $btnStartCascade.Visibility = [System.Windows.Visibility]::Visible
                                $btnPauseCascade.Visibility = [System.Windows.Visibility]::Collapsed
                            }
                        } else {
                            & $fnSetStatus "System is 100% up to date! Zero updates pending reboot." "COMPLETED" "#064E3B" "#6EE7B7"
                            Unregister-CascadePersistence
                            Clear-CascadeState
                            $uiState.IsRunning = $false
                            $btnStartCascade.Visibility = [System.Windows.Visibility]::Visible
                            $btnPauseCascade.Visibility = [System.Windows.Visibility]::Collapsed
                        }
                    }
                })
                $timerInst.Start()
            }
        })
        $timerScan.Start()
    }

    # Monitor Only Mode Handler
    if ($MonitorOnly) {
        $btnStartCascade.IsEnabled = $false
        $btnScanOnly.IsEnabled = $false
        $btnInstallSelected.IsEnabled = $false
        & $fnSetStatus "Connected to active background cascade (Pass $($uiState.CurrentPass) of $($uiState.MaxPasses))." "MONITORING" "#1E3A8A" "#93C5FD"
    }

    # Wire Button Events
    $btnStartCascade.Add_Click({ & $fnExecuteCascadePass })

    $btnPauseCascade.Add_Click({
        $script:RebootAborted = $true
        $uiState.IsRunning = $false
        $btnStartCascade.Visibility = [System.Windows.Visibility]::Visible
        $btnPauseCascade.Visibility = [System.Windows.Visibility]::Collapsed
        $bannerCountdown.Visibility = [System.Windows.Visibility]::Collapsed
        & $fnSetStatus "Cascade paused by operator." "PAUSED" "#475569" "#CBD5E1"
        Write-CascadeLog "Cascade paused by operator." "WARN"
    })

    $btnCancelCountdown.Add_Click({
        $script:RebootAborted = $true
        $bannerCountdown.Visibility = [System.Windows.Visibility]::Collapsed
        & $fnSetStatus "Reboot cancelled by operator. Cascade paused." "PAUSED" "#475569" "#CBD5E1"
        Write-CascadeLog "Reboot countdown cancelled by operator." "WARN"
    })

    $btnRestartNow.Add_Click({
        & $fnSetStatus "Initiating immediate system reboot..." "REBOOTING" "#7F1D1D" "#FCA5A5"
        Write-CascadeLog "Operator triggered immediate reboot from countdown banner." "WARN"
        Invoke-CascadeReboot -DelaySeconds 0 -Reason "Manual reboot confirmation"
    })

    $btnManualReboot.Add_Click({
        & $fnSetStatus "Initiating immediate system reboot..." "REBOOTING" "#7F1D1D" "#FCA5A5"
        Write-CascadeLog "Operator triggered manual immediate reboot." "WARN"
        Invoke-CascadeReboot -DelaySeconds 0 -Reason "Manual operator reboot"
    })

    $btnUnregisterAll.Add_Click({
        $cnt = Unregister-CascadePersistence
        & $fnSetStatus "Successfully disarmed and cleaned $cnt persistence artifact(s)." "CLEANED" "#065F46" "#6EE7B7"
        Write-CascadeLog "Persistence cleanup: successfully disarmed and cleaned $cnt persistence artifact(s)." "INFO"
    })

    $btnSelectAll.Add_Click({
        foreach ($item in $observableUpdates) { $item.IsSelected = $true }
        $lstUpdates.Items.Refresh()
        & $fnSetStatus "Selected all $($observableUpdates.Count) update package(s)." "READY" "#1E3A8A" "#93C5FD"
        Write-CascadeLog "Selected all $($observableUpdates.Count) update package(s)." "INFO"
    })

    $btnDeselectAll.Add_Click({
        foreach ($item in $observableUpdates) { $item.IsSelected = $false }
        $lstUpdates.Items.Refresh()
        & $fnSetStatus "Deselected all update packages." "READY" "#1E3A8A" "#93C5FD"
        Write-CascadeLog "Deselected all update packages." "INFO"
    })

    $btnClearLog.Add_Click({
        $txtLogConsole.Clear()
        if (Test-Path $script:LogFile) {
            try { $script:LogStreamOffset = [System.IO.FileInfo]::new($script:LogFile).Length } catch { }
        }
        & $fnSetStatus "Activity log console cleared." "CLEARED" "#1E3A8A" "#93C5FD"
    })

    $btnCopyLog.Add_Click({
        try {
            [System.Windows.Clipboard]::SetText($txtLogConsole.Text)
            & $fnSetStatus "Activity log copied to clipboard." "COPIED" "#065F46" "#6EE7B7"
            Write-CascadeLog "Log contents copied to clipboard." "INFO"
        } catch {
            & $fnSetStatus "Failed to copy log to clipboard: $($_.Exception.Message)" "WARNING" "#7C2D12" "#FDBA74"
            Write-CascadeLog "Failed to copy log to clipboard: $($_.Exception.Message)" "WARN"
        }
    })

    $btnScanOnly.Add_Click({
        & $fnSetStatus "Scanning for pending updates and drivers..." "SCANNING" "#1E3A8A" "#93C5FD"
        $incDrivers = [bool]$chkIncludeDrivers.IsChecked
        Write-CascadeLog "Starting manual scan for pending updates (Drivers: $incDrivers)..." "STEP"
        $btnScanOnly.IsEnabled = $false
        $btnStartCascade.IsEnabled = $false
        $btnInstallSelected.IsEnabled = $false

        $rsScan = New-CascadeRunspace
        $psScan = [powershell]::Create()
        $psScan.Runspace = $rsScan
        [void]$psScan.AddCommand('Get-CascadePendingUpdates').AddParameter('IncludeDrivers', $incDrivers)

        $async = $psScan.BeginInvoke()
        $t = New-Object System.Windows.Threading.DispatcherTimer
        $t.Interval = [TimeSpan]::FromMilliseconds(200)
        $t.Add_Tick({
            if ($async.IsCompleted) {
                $t.Stop()
                $res = @()
                try { $res = $psScan.EndInvoke($async) } catch { }
                $psScan.Dispose()
                $rsScan.Dispose()
                $btnScanOnly.IsEnabled = $true
                $btnStartCascade.IsEnabled = $true
                $btnInstallSelected.IsEnabled = $true
                & $fnPopulateUpdates $res
                $foundCnt = if ($res) { $res.Count } else { 0 }
                & $fnSetStatus "Scan complete: found $foundCnt pending update(s)." "READY" "#1E3A8A" "#93C5FD"
                Write-CascadeLog "Scan complete: found $foundCnt pending update(s)." "INFO"
            }
        })
        $t.Start()
    })

    $btnInstallSelected.Add_Click({
        $selected = @($observableUpdates | Where-Object { $_.IsSelected } | ForEach-Object { $_.Raw })
        if (-not $selected -or $selected.Count -eq 0) {
            & $fnSetStatus "No updates selected. Please select at least one update from the list to install." "WARNING" "#7C2D12" "#FDBA74"
            Write-CascadeLog "Manual install aborted: no updates selected in the update list." "WARN"
            return
        }

        & $fnSetStatus "Installing $($selected.Count) selected update(s)..." "INSTALLING" "#7C2D12" "#FDBA74"
        Write-CascadeLog "Manual installation started for $($selected.Count) selected update(s)..." "STEP"
        $btnInstallSelected.IsEnabled = $false
        $btnStartCascade.IsEnabled = $false
        $btnScanOnly.IsEnabled = $false

        $rsInst = New-CascadeRunspace
        $psInst = [powershell]::Create()
        $psInst.Runspace = $rsInst
        [void]$psInst.AddCommand('Install-CascadeUpdates').AddParameter('UpdatesToProcess', $selected)

        $async = $psInst.BeginInvoke()
        $t = New-Object System.Windows.Threading.DispatcherTimer
        $t.Interval = [TimeSpan]::FromMilliseconds(300)
        $t.Add_Tick({
            if ($async.IsCompleted) {
                $t.Stop()
                $res = $null
                try { $res = $psInst.EndInvoke($async) } catch { }
                $psInst.Dispose()
                $rsInst.Dispose()
                $btnInstallSelected.IsEnabled = $true
                $btnStartCascade.IsEnabled = $true
                $btnScanOnly.IsEnabled = $true

                $instCnt = if ($res -and $res.InstalledCount) { [int]$res.InstalledCount } else { 0 }
                $reb = if ($res -and $res.RebootRequired) { [bool]$res.RebootRequired } else { $false }
                if (-not $reb -and $instCnt -gt 0) {
                    $reb = Test-CascadeSystemRebootPending
                }

                $uiState.TotalInstalled += $instCnt
                $txtTotalStats.Text = "Total Patches Installed: $($uiState.TotalInstalled)"

                if ($reb) {
                    & $fnSetStatus "Manual install complete ($instCnt installed). System restart required to commit updates." "REBOOT REQ" "#831843" "#F472B6"
                    Write-CascadeLog "Manual install complete ($instCnt installed). System restart required to commit updates." "WARN"
                    $bannerCountdown.Visibility = [System.Windows.Visibility]::Visible
                    $script:RebootAborted = $false
                    $countSeconds = 5
                    $timerCount = New-Object System.Windows.Threading.DispatcherTimer
                    $timerCount.Interval = [TimeSpan]::FromSeconds(1)
                    $timerCount.Add_Tick({
                        if ($script:RebootAborted) {
                            $timerCount.Stop()
                            $bannerCountdown.Visibility = [System.Windows.Visibility]::Collapsed
                            & $fnSetStatus "Reboot cancelled by operator. Manual install committed." "READY" "#1E3A8A" "#93C5FD"
                            Write-CascadeLog "Reboot countdown cancelled by operator." "WARN"
                            return
                        }
                        $txtCountdown.Text = "[!] Reboot required to commit updates. Restarting automatically in $countSeconds second(s)..."
                        if ($countSeconds -le 0) {
                            $timerCount.Stop()
                            Invoke-CascadeReboot -DelaySeconds 0 -Reason "UpdateCascade manual install commit"
                        }
                        $countSeconds--
                    })
                    $timerCount.Start()
                } else {
                    & $fnSetStatus "Manual install complete ($instCnt installed). System is up to date." "COMPLETED" "#064E3B" "#6EE7B7"
                    Write-CascadeLog "Manual install complete: $instCnt update package(s) installed successfully." "SUCCESS"
                }
            }
        })
        $t.Start()
    })

    # If launched with -ResumeFromRestart, automatically start the pass!
    if ($ResumeFromRestart -and -not $MonitorOnly) {
        $window.Add_Loaded({
            Write-CascadeLog "Autonomous resume trigger active. Launching Pass $($uiState.CurrentPass) automatically..." "STEP"
            & $fnExecuteCascadePass
        })
    }

    $window.Add_Closed({
        try { $timerLogPoller.Stop() } catch { }
    })

    # Show Window
    $window.ShowDialog() | Out-Null
}

# --- 12. ENTRY POINT & CLI DISPATCH ---

# 1. Status Command (Pure read-only status inquiry - no mutex or elevation needed)
if ($Status) {
    $st = Get-CascadeState
    if ($st) {
        $st | ConvertTo-Json
    } else {
        [PSCustomObject]@{ Active = $false; Message = 'No active cascade state' } | ConvertTo-Json
    }
    exit 0
}

# 2. Unregister / Cleanup Command (Requires elevation, bypasses single-instance mutex to allow forced abort)
if ($Unregister) {
    Ensure-CascadeElevation
    $count = Unregister-CascadePersistence
    Write-Host "Unregistered $count persistence vectors." -ForegroundColor Green
    exit 0
}

# For active execution passes, check single-instance mutex to prevent overlapping process traps
$global:CascadeMutex = $null
$hasMutex = $false
try {
    $global:CascadeMutex = New-Object System.Threading.Mutex($false, $script:MutexName)
    $hasMutex = $global:CascadeMutex.WaitOne(200, $false)
} catch {
    $hasMutex = $true
}

if (-not $hasMutex) {
    $st = Get-CascadeState
    $ctx = Get-CascadeRuntimeContext
    if ($st -and $st.Active -and -not $Autonomous -and $ctx.Interactive -and (Get-Process -Id $PID).SessionId -ne 0) {
        Write-CascadeLog "Another instance of UpdateCascade is actively processing updates. Attaching GUI in live monitor mode..." "INFO"
        Start-CascadeGui -MonitorOnly
        exit 0
    }
    Write-CascadeLog "Another instance of UpdateCascade is already actively running. Exiting secondary process." "INFO"
    exit 0
}

# Elevation Check for active update passes
Ensure-CascadeElevation

# 3. BootWorker Trigger (Fired by SYSTEM Boot-Time Scheduled Task)
if ($BootWorker) {
    Write-CascadeLog "BootWorker trigger fired by Task Scheduler at system boot." "INFO"
    $st = Get-CascadeState
    if ($st -and $st.Active) {
        Write-CascadeLog "Active cascade detected at boot (Pass $($st.CurrentPass) of $($st.MaxPasses)). Resuming headless cascade loop..." "STEP"
        Start-AutonomousCascadeLoop -MaxPasses ([int]$st.MaxPasses) -IncludeDrivers:([bool]$st.IncludeDrivers) -RebootDelay 5
    } else {
        Write-CascadeLog "No active cascade state found at boot. Cleaning up boot task..." "INFO"
        Unregister-CascadePersistence | Out-Null
    }
    exit 0
}

# 4. ScanOnly Command
if ($ScanOnly) {
    Write-Host "`n=== UpdateCascade: Scanning for Pending Updates & Drivers ===" -ForegroundColor Cyan
    $results = Get-CascadePendingUpdates -IncludeDrivers:$IncludeDrivers -StatusCallback { param($m) Write-Host "  $m" -ForegroundColor Gray }
    Write-Host "`nFound $($results.Count) pending updates:" -ForegroundColor Green
    if ($results.Count -gt 0) {
        $results | Format-Table -Property Title, KB, SizeMB, IsDriver, RebootRequired -AutoSize
    } else {
        Write-Host "System is completely up to date!" -ForegroundColor Green
    }
    exit 0
}

# 5. Autonomous / Headless CLI Mode
if ($Autonomous -or $Cascade) {
    Write-Host "`n=== UpdateCascade: Autonomous Multi-Pass Patch Cascade Engine ===" -ForegroundColor Cyan
    Write-Host "MaxPasses: $MaxPasses | IncludeDrivers: $IncludeDrivers | RebootDelay: ${RebootDelay}s`n" -ForegroundColor DarkGray

    $loopRes = Start-AutonomousCascadeLoop -MaxPasses $MaxPasses `
                                           -IncludeDrivers:$IncludeDrivers `
                                           -RebootDelay $RebootDelay `
                                           -NoReboot:$NoReboot `
                                           -StatusCallback { param($m) Write-Host "  $m" -ForegroundColor Gray }

    if ($loopRes.Completed) {
        Write-Host "`nPatch Cascade completed successfully! Total updates installed: $($loopRes.TotalInstalled)" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`nCascade pass committed. Reboot sequence initiated." -ForegroundColor Yellow
        exit 0
    }
}

# 6. Resume From Restart Trigger
if ($ResumeFromRestart) {
    $activeState = Get-CascadeState
    if ($activeState -and $activeState.Active) {
        $isAutonomous = [bool]$activeState.Autonomous -or $Autonomous
        $ctx = Get-CascadeRuntimeContext
        if ($isAutonomous) {
            Write-CascadeLog "Resuming autonomous CLI cascade (Pass $($activeState.CurrentPass) of $($activeState.MaxPasses))..." "STEP"
            Start-AutonomousCascadeLoop -MaxPasses ([int]$activeState.MaxPasses) -IncludeDrivers:([bool]$activeState.IncludeDrivers) -RebootDelay 5
        } else {
            if ($ctx.Interactive -and (Get-Process -Id $PID).SessionId -ne 0) {
                Start-CascadeGui
            } else {
                Write-CascadeLog "Non-interactive session detected on restart. Running headless loop for Pass $($activeState.CurrentPass)..." "INFO"
                Start-AutonomousCascadeLoop -MaxPasses ([int]$activeState.MaxPasses) -IncludeDrivers:([bool]$activeState.IncludeDrivers) -RebootDelay 5
            }
        }
        exit 0
    }
}

# 7. Default Interactive Launch: WPF GUI
$ctx = Get-CascadeRuntimeContext
if ($ctx.Interactive -and (Get-Process -Id $PID).SessionId -ne 0) {
    Start-CascadeGui
} else {
    Write-CascadeLog "Non-interactive environment detected. Defaulting to autonomous CLI cascade..." "INFO"
    Start-AutonomousCascadeLoop -MaxPasses $MaxPasses -IncludeDrivers:$IncludeDrivers -RebootDelay $RebootDelay
}
