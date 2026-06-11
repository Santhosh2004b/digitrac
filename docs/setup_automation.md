# DigiTrac Automated GitHub Sync — Setup Guide

This document covers how to configure the automated daily GitHub push system for DigiTrac using PowerShell + Windows Task Scheduler.

---

## 1. Architecture Overview

```
[VS Code Workspace] → [File Changes Detected]
        ↓
[scripts/auto_push.ps1]
        ↓
  git status --porcelain  →  No changes?  →  Skip & Exit
        ↓ (changes found)
  git add .
  git commit -m "Auto Sync: <timestamp>"
  git push origin main  (with 3 retries)
        ↓
  [logs/git-sync.log]  ←  SUCCESS / ERROR logged
```

---

## 2. Files Created

| File | Purpose |
|---|---|
| `scripts/auto_push.ps1` | Main automation script — detects changes, commits, pushes |
| `logs/git-sync.log` | Timestamped sync history with success/failure tracking |
| `setup_automation.md` | This setup guide |

---

## 3. Test Locally (Before Scheduling)

Open PowerShell in your DigiTrac folder and run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Then test the script:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\scripts\auto_push.ps1"
```

You should see colored console output showing:
- ✅ `[SUCCESS]` — if changes were committed and pushed
- ℹ️ `[INFO]` — if no changes were detected (skip)
- ❌ `[ERROR]` — if push failed (with retry attempts logged)

---

## 4. Windows Task Scheduler Setup

### Step-by-Step:

1. **Open Task Scheduler**
   - Press `Win + R` → type `taskschd.msc` → press Enter

2. **Create a New Task**
   - Click **"Create Task"** (not "Create Basic Task")

3. **General Tab**
   - **Name**: `DigiTrac Auto GitHub Sync`
   - **Description**: `Automated daily code push to GitHub repository`
   - Check: **"Run whether user is logged on or not"**
   - Check: **"Run with highest privileges"**

4. **Triggers Tab**
   - Click **"New..."**
   - **Begin the task**: On a schedule
   - **Daily** → Set your preferred time (e.g., `11:00 PM`)
   - Check: **"Enabled"**
   - Click **OK**

5. **Actions Tab**
   - Click **"New..."**
   - **Action**: Start a program
   - **Program/script**:
     ```
     powershell.exe
     ```
   - **Add arguments**:
     ```
     -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\scripts\auto_push.ps1"
     ```
   - Click **OK**

6. **Conditions Tab**
   - Uncheck: "Start the task only if the computer is on AC power"
   - This ensures the sync runs on laptops even on battery

7. **Settings Tab**
   - Check: **"Allow task to be run on demand"**
   - Check: **"Run task as soon as possible after a scheduled start is missed"**
   - Check: **"If the task fails, restart every" → 5 minutes** (up to 3 times)
   - Click **OK**

8. **Save the Task**
   - Enter your Windows password when prompted
   - The task is now active!

---

## 5. Change Sync Timing

To modify when the auto-sync runs:

1. Open **Task Scheduler**
2. Find **"DigiTrac Auto GitHub Sync"** in the task list
3. Right-click → **Properties** → **Triggers** tab
4. Double-click the trigger and change the time
5. Click **OK**

### Run Multiple Times Per Day:
Add additional triggers (e.g., 9:00 AM + 1:00 PM + 11:00 PM) for more frequent syncs.

---

## 6. Checking Logs

View the sync history anytime:

```powershell
Get-Content "C:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\logs\git-sync.log" -Tail 30
```

Or open `logs/git-sync.log` directly in VS Code.

### Example Log Entries:
```
[2026-05-25 23:00:01] [INFO] DIGITRAC AUTO-SYNC ENGINE STARTING
[2026-05-25 23:00:01] [INFO] Git repository verified
[2026-05-25 23:00:02] [INFO] Internet connectivity confirmed.
[2026-05-25 23:00:02] [INFO] 5 file(s) modified. Preparing commit...
[2026-05-25 23:00:03] [SUCCESS] All changes staged successfully.
[2026-05-25 23:00:03] [SUCCESS] Committed: Auto Sync: 2026-05-25 23:00:03 | 5 file(s) updated
[2026-05-25 23:00:05] [SUCCESS] Push to origin/main completed successfully!
[2026-05-25 23:00:05] [SUCCESS] SYNC COMPLETE | 5 file(s) pushed to GitHub
```

---

## 7. Troubleshooting

| Problem | Solution |
|---|---|
| `git is not recognized` | Run: `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")` — the script handles this automatically |
| Push fails with auth error | Run `git push` manually once in terminal to re-authenticate via browser |
| Empty commits | Script automatically skips if `git status --porcelain` returns empty |
| Task doesn't run | Check Task Scheduler → right-click task → "Run" to test manually |
| Log file too large | Script auto-rotates logs after 5,000 lines |

---

## 8. PowerShell Execution Policy

If you see a "script cannot be loaded" error, run this **once** as Administrator:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

The Task Scheduler action already uses `-ExecutionPolicy Bypass` so this is only needed for manual testing.

---

## 9. Future DevOps Extensions

This automation is designed to be extensible:

| Extension | How to Add |
|---|---|
| **GitHub Actions CI/CD** | Add `.github/workflows/ci.yml` to run tests on every push |
| **Docker auto-build** | Add a GitHub Action that builds the Docker image on push |
| **Azure deployment** | Add Azure Web App deployment step in GitHub Actions |
| **Slack notifications** | Add a webhook call at the end of `auto_push.ps1` |
| **Health check after push** | Add `curl http://localhost:8000/healthz` at script end |
