$ErrorActionPreference = "Stop"

# Define the repository path
$repoPath = "C:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac"

# Define the GitHub Remote URL
$remoteUrl = "https://github.com/Santhosh2004b/digitrac.git"

Write-Host "========================================="
Write-Host "🚀 Starting Auto-Sync DevOps Script"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================="

Set-Location -Path $repoPath

# Check if it's a git repository, if not initialize it
if (!(Test-Path ".git")) {
    Write-Host "Initializing new Git repository..."
    git init
    git remote add origin $remoteUrl
    # Set the main branch
    git branch -M main
} else {
    # Check if the remote origin exists, if not, add it
    $remotes = git remote
    if ($remotes -notcontains "origin") {
        git remote add origin $remoteUrl
    } else {
        # Update the URL just in case
        git remote set-url origin $remoteUrl
    }
}

# Check for changes
$status = git status --porcelain

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ NoNew changes detected. Everything is up to date."
} else {
    Write-Host "📌 Changes detected. Staging files..."
    git add .
    
    $commitMessage = "Automated DevOps Sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "📝 Committing with message: '$commitMessage'"
    git commit -m $commitMessage
    
    Write-Host "☁️ Pushing to GitHub repository..."
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 Successfully pushed to GitHub!"
    } else {
        Write-Host "❌ Failed to push. Please check your GitHub credentials."
    }
}

Write-Host "========================================="
Write-Host "Mission Complete."
