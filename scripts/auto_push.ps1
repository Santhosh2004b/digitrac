# ============================================================================
# DIGITRAC ENTERPRISE AUTO-SYNC ENGINE
# ============================================================================
# Purpose  : Automated Git change detection, commit, and push to GitHub
# Repo     : https://github.com/Santhosh2004b/digitrac.git
# Author   : DigiTrac Platform Engineering
# Schedule : Daily via Windows Task Scheduler (configurable)
# ============================================================================

# --- CONFIGURATION ---
$DIGITRAC_ROOT  = "C:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac"
$REMOTE_NAME    = "origin"
$BRANCH_NAME    = "main"
$LOG_DIR        = Join-Path $DIGITRAC_ROOT "logs"
$LOG_FILE       = Join-Path $LOG_DIR "git-sync.log"
$MAX_RETRIES    = 3
$RETRY_DELAY_S  = 5
$MAX_LOG_LINES  = 5000  # Rotate log after this many lines

# --- ENSURE GIT IS ON PATH ---
$machPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
$usrPath  = [System.Environment]::GetEnvironmentVariable("Path", "User")
$env:Path = "$machPath;$usrPath"

# --- LOGGING FUNCTIONS ---
function Write-SyncLog {
    param(
        [string]$Level,   # INFO | WARN | ERROR | SUCCESS
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry     = "[$timestamp] [$Level] $Message"

    # Ensure log directory exists
    if (-not (Test-Path $LOG_DIR)) {
        New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null
    }

    # Write to log file
    Add-Content -Path $LOG_FILE -Value $entry -ErrorAction SilentlyContinue

    # Console output with color
    switch ($Level) {
        "INFO"    { Write-Host $entry -ForegroundColor Cyan }
        "WARN"    { Write-Host $entry -ForegroundColor Yellow }
        "ERROR"   { Write-Host $entry -ForegroundColor Red }
        "SUCCESS" { Write-Host $entry -ForegroundColor Green }
        default   { Write-Host $entry }
    }
}

function Rotate-LogIfNeeded {
    if (Test-Path $LOG_FILE) {
        $lineCount = (Get-Content $LOG_FILE -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
        if ($lineCount -gt $MAX_LOG_LINES) {
            $archiveName = "git-sync_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
            $archivePath = Join-Path $LOG_DIR $archiveName
            Move-Item -Path $LOG_FILE -Destination $archivePath -Force
            Write-SyncLog "INFO" "Log rotated. Archived to $archiveName"
        }
    }
}

# --- CONNECTIVITY CHECK ---
function Test-InternetConnection {
    try {
        $response = Test-Connection -ComputerName "github.com" -Count 1 -Quiet -ErrorAction SilentlyContinue
        return $response
    }
    catch {
        return $false
    }
}

# --- GIT COMMAND WRAPPER ---
function Invoke-GitCommand {
    param([string]$Arguments)
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName               = "git"
    $pinfo.Arguments              = $Arguments
    $pinfo.WorkingDirectory       = $DIGITRAC_ROOT
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError  = $true
    $pinfo.UseShellExecute        = $false
    $pinfo.CreateNoWindow         = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $pinfo
    $process.Start() | Out-Null
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()

    return @{
        ExitCode = $process.ExitCode
        Output   = $stdout.Trim()
        Error    = $stderr.Trim()
    }
}

# ============================================================================
# MAIN SYNC EXECUTION
# ============================================================================

Write-SyncLog "INFO" "=========================================="
Write-SyncLog "INFO" "DIGITRAC AUTO-SYNC ENGINE STARTING"
Write-SyncLog "INFO" "=========================================="

Rotate-LogIfNeeded

# Step 1: Validate project directory
if (-not (Test-Path (Join-Path $DIGITRAC_ROOT ".git"))) {
    Write-SyncLog "ERROR" "No .git repository found at $DIGITRAC_ROOT. Aborting."
    exit 1
}
Write-SyncLog "INFO" "Git repository verified at $DIGITRAC_ROOT"

# Step 2: Check internet connectivity
if (-not (Test-InternetConnection)) {
    Write-SyncLog "ERROR" "No internet connection detected. Cannot push to GitHub. Aborting."
    exit 1
}
Write-SyncLog "INFO" "Internet connectivity confirmed."

# Step 3: Detect file changes
$statusResult = Invoke-GitCommand "status --porcelain"
if ($statusResult.ExitCode -ne 0) {
    Write-SyncLog "ERROR" "git status failed: $($statusResult.Error)"
    exit 1
}

$changedFiles = $statusResult.Output
if ([string]::IsNullOrWhiteSpace($changedFiles)) {
    Write-SyncLog "INFO" "No file changes detected. Skipping sync cycle."
    Write-SyncLog "INFO" "=========================================="
    exit 0
}

# Count changed files
$fileCount = ($changedFiles -split "`n" | Where-Object { $_.Trim() -ne "" }).Count
Write-SyncLog "INFO" "$fileCount file(s) modified. Preparing commit..."

# Step 4: Stage all changes
$addResult = Invoke-GitCommand "add ."
if ($addResult.ExitCode -ne 0) {
    Write-SyncLog "ERROR" "git add failed: $($addResult.Error)"
    exit 1
}
Write-SyncLog "SUCCESS" "All changes staged successfully."

# Step 5: Generate commit message and commit
$commitTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage   = "Auto Sync: $commitTimestamp | $fileCount file(s) updated"

$commitResult = Invoke-GitCommand "commit -m `"$commitMessage`""
if ($commitResult.ExitCode -ne 0) {
    if ($commitResult.Output -match "nothing to commit") {
        Write-SyncLog "INFO" "Nothing to commit after staging. Skipping."
        exit 0
    }
    Write-SyncLog "ERROR" "git commit failed: $($commitResult.Error)"
    exit 1
}
Write-SyncLog "SUCCESS" "Committed: $commitMessage"

# Step 6: Push to GitHub with retry logic
$pushSuccess = $false
for ($attempt = 1; $attempt -le $MAX_RETRIES; $attempt++) {
    Write-SyncLog "INFO" "Push attempt $attempt of $MAX_RETRIES..."

    $pushResult = Invoke-GitCommand "push $REMOTE_NAME $BRANCH_NAME"

    if ($pushResult.ExitCode -eq 0) {
        $pushSuccess = $true
        Write-SyncLog "SUCCESS" "Push to $REMOTE_NAME/$BRANCH_NAME completed successfully!"
        break
    }
    else {
        Write-SyncLog "WARN" "Push attempt $attempt failed: $($pushResult.Error)"
        if ($attempt -lt $MAX_RETRIES) {
            Write-SyncLog "INFO" "Retrying in $RETRY_DELAY_S seconds..."
            Start-Sleep -Seconds $RETRY_DELAY_S
        }
    }
}

if (-not $pushSuccess) {
    Write-SyncLog "ERROR" "All $MAX_RETRIES push attempts failed. Changes committed locally but NOT pushed."
    Write-SyncLog "ERROR" "Manual intervention required: git push origin main"
    exit 1
}

# Step 7: Final summary
Write-SyncLog "SUCCESS" "=========================================="
Write-SyncLog "SUCCESS" "SYNC COMPLETE | $fileCount file(s) pushed to GitHub"
Write-SyncLog "SUCCESS" "Repository: https://github.com/Santhosh2004b/digitrac.git"
Write-SyncLog "SUCCESS" "=========================================="
exit 0
