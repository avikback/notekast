#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

# ── Helpers ────────────────────────────────────────────────────────────────────

function Write-Banner {
    Clear-Host
    Write-Host ''
    Write-Host '  ==========================================' -ForegroundColor Cyan
    Write-Host '          NoteKast  Installer               ' -ForegroundColor Cyan
    Write-Host '  ==========================================' -ForegroundColor Cyan
    Write-Host ''
}

function Write-Ok([string]$msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "  [!!] $msg" -ForegroundColor Red }
function Write-Note([string]$msg) { Write-Host "      $msg"  -ForegroundColor DarkGray }

function Confirm-Step([string]$prompt) {
    Write-Host ''
    Write-Host "  $prompt " -ForegroundColor Yellow -NoNewline
    $r = Read-Host
    return ($r -eq '' -or $r -match '^[Yy]')
}

function Invoke-WithSpinner([string]$label, [scriptblock]$work) {
    $frames = '|','/','-','\'
    $job = Start-Job -ScriptBlock $work
    $i   = 0
    while ($job.State -eq 'Running') {
        Write-Host ("`r  [$($frames[$i % 4])] $label   ") -NoNewline -ForegroundColor Cyan
        Start-Sleep -Milliseconds 80
        $i++
    }
    $ok = $job.State -eq 'Completed'
    Receive-Job $job -ErrorAction SilentlyContinue | Out-Null
    Remove-Job  $job
    if ($ok) { Write-Host "`r  [OK] $label   " -ForegroundColor Green }
    else     { Write-Host "`r  [!!] $label   " -ForegroundColor Red }
    return $ok
}

# ── Elevation ──────────────────────────────────────────────────────────────────

function Test-IsAdmin {
    ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Request-ElevationIfNeeded {
    if (-not (Test-IsAdmin)) {
        Write-Host ''
        Write-Note 'Installing software requires administrator rights.'
        Write-Note 'A UAC prompt will appear — please click Yes to continue.'
        Start-Sleep -Seconds 2
        Start-Process powershell.exe `
            -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" `
            -Verb RunAs
        exit 0
    }
}

# ── PATH refresh ───────────────────────────────────────────────────────────────

function Update-SessionPath {
    $machine = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user    = [System.Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user"
}

# ── Git install ────────────────────────────────────────────────────────────────

function Install-Git {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        $ok = Invoke-WithSpinner 'Installing Git via winget' {
            winget install Git.Git --silent --accept-package-agreements --accept-source-agreements | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "winget exited $LASTEXITCODE" }
        }
        if ($ok) { return $true }
        Write-Note 'winget failed — trying direct download...'
    }

    try {
        Write-Note 'Looking up latest Git for Windows release...'
        $release = Invoke-RestMethod 'https://api.github.com/repos/git-for-windows/git/releases/latest'
        $asset   = $release.assets | Where-Object { $_.name -match 'Git-.*-64-bit\.exe' } | Select-Object -First 1
        $url     = $asset.browser_download_url
        $dest    = Join-Path $env:TEMP 'git-installer.exe'

        $ok = Invoke-WithSpinner "Downloading Git $($release.tag_name)" {
            Invoke-WebRequest $using:url -OutFile $using:dest
        }
        if (-not $ok) { return $false }

        return Invoke-WithSpinner 'Running Git installer' {
            Start-Process $using:dest `
                -ArgumentList '/VERYSILENT', '/NORESTART', '/NOCANCEL', '/SP-', '/CLOSEAPPLICATIONS' `
                -Wait
        }
    } catch {
        Write-Fail "Download failed: $_"
        return $false
    }
}

# ── Node.js install ────────────────────────────────────────────────────────────

function Install-Node {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        $ok = Invoke-WithSpinner 'Installing Node.js via winget' {
            winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "winget exited $LASTEXITCODE" }
        }
        if ($ok) { return $true }
        Write-Note 'winget failed — trying direct download...'
    }

    try {
        Write-Note 'Looking up latest Node.js LTS version...'
        $lts     = (Invoke-RestMethod 'https://nodejs.org/dist/index.json') | Where-Object { $_.lts } | Select-Object -First 1
        $version = $lts.version
        $url     = "https://nodejs.org/dist/$version/node-$version-x64.msi"
        $dest    = Join-Path $env:TEMP 'node-installer.msi'

        $ok = Invoke-WithSpinner "Downloading Node.js $version" {
            Invoke-WebRequest $using:url -OutFile $using:dest
        }
        if (-not $ok) { return $false }

        return Invoke-WithSpinner 'Running Node.js installer' {
            Start-Process msiexec.exe -ArgumentList "/i `"$using:dest`" /qn /norestart" -Wait
        }
    } catch {
        Write-Fail "Download failed: $_"
        return $false
    }
}

# ── Main ───────────────────────────────────────────────────────────────────────

$repoRoot = $PSScriptRoot
Write-Banner

Write-Host '  Welcome to NoteKast.' -ForegroundColor White
Write-Note 'This script will check for everything NoteKast needs and get you running.'
Write-Host ''

# ── Git ────────────────────────────────────────────────────────────────────────

Write-Host '  Checking for Git...' -ForegroundColor DarkGray

if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Ok 'Git is already installed'
} else {
    Write-Host ''
    Write-Host '  Git is not installed.' -ForegroundColor Yellow
    Write-Host ''
    Write-Note 'NoteKast uses Git to persist your notes. Every time you hit "commit",'
    Write-Note 'Git quietly snapshots your work into a local history on your machine —'
    Write-Note 'no cloud account, no syncing, just a reliable local record you own.'
    Write-Host ''

    if (-not (Confirm-Step 'Install Git now? [Y/n]')) {
        Write-Fail 'Git is required to run NoteKast. Exiting.'
        exit 1
    }

    Request-ElevationIfNeeded

    if (-not (Install-Git)) {
        Write-Fail 'Git installation failed.'
        Write-Note 'Install manually from https://git-scm.com and run this script again.'
        exit 1
    }

    Update-SessionPath

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Fail 'Git installed but not found on PATH — please restart this script.'
        exit 1
    }
}

# ── Node.js ────────────────────────────────────────────────────────────────────

Write-Host ''
Write-Host '  Checking for Node.js...' -ForegroundColor DarkGray

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Ok 'Node.js is already installed'
} else {
    Write-Host ''
    Write-Host '  Node.js is not installed.' -ForegroundColor Yellow
    Write-Host ''
    Write-Note 'Node.js is needed to build and run NoteKast.'
    Write-Host ''

    if (-not (Confirm-Step 'Install Node.js now? [Y/n]')) {
        Write-Fail 'Node.js is required. Exiting.'
        exit 1
    }

    Request-ElevationIfNeeded

    if (-not (Install-Node)) {
        Write-Fail 'Node.js installation failed.'
        Write-Note 'Install manually from https://nodejs.org and run this script again.'
        exit 1
    }

    Update-SessionPath

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Fail 'Node.js installed but not found on PATH — please restart this script.'
        exit 1
    }
}

# ── Launch ─────────────────────────────────────────────────────────────────────

Write-Host ''
Write-Host '  All prerequisites met.' -ForegroundColor Green
Write-Host ''

if (-not (Confirm-Step 'Install dependencies and launch NoteKast? [Y/n]')) {
    Write-Note 'Run this script again whenever you are ready.'
    exit 0
}

Write-Host ''

$depsOk = Invoke-WithSpinner 'Installing dependencies (this may take a minute)' {
    Set-Location $using:repoRoot
    npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
}

if (-not $depsOk) {
    Write-Fail 'npm install failed. Check the output above and try again.'
    exit 1
}

Write-Host ''
Write-Ok 'All done! Launching NoteKast...'
Write-Host ''

Set-Location $repoRoot
npm run dev
