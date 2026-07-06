# SetTrackr healthcheck
#   .\healthcheck.ps1          - check both services are up + backend runs the pushed commit
#   .\healthcheck.ps1 -Wait    - poll up to 5 min until the backend serves local HEAD (use after git push)
param(
    [switch]$Wait
)

$backendUrl = "https://settrackr.onrender.com/"
$frontendUrl = "https://settrackr.vercel.app/"

function Get-BackendInfo {
    try {
        $res = Invoke-RestMethod -Uri $backendUrl -TimeoutSec 60
        return $res
    } catch {
        return $null
    }
}

# Frontend
try {
    $res = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 15 -UseBasicParsing
    Write-Host "Frontend (Vercel): UP ($($res.StatusCode))"
} catch {
    Write-Host "Frontend (Vercel): DOWN - $($_.Exception.Message)"
}

# Local HEAD for comparison (empty if git unavailable)
$localHead = ""
try { $localHead = (git rev-parse HEAD 2>$null).Trim() } catch {}

# Backend (long timeout: Render free tier cold-starts in 30-60s)
$info = Get-BackendInfo
if ($null -eq $info) {
    Write-Host "Backend  (Render): DOWN (may be a cold start - retry in 30-60s)"
    if (-not $Wait) { exit 1 }
} else {
    $commit = $info.commit
    if (-not $commit) { $commit = "unknown (old build without commit field)" }
    Write-Host "Backend  (Render): UP - commit $commit"
    if ($localHead -and $commit -eq $localHead) {
        Write-Host "Deploy check: LIVE code matches local HEAD ($($localHead.Substring(0,7)))"
        exit 0
    } elseif ($localHead) {
        Write-Host "Deploy check: MISMATCH - local HEAD is $($localHead.Substring(0,7)), live is $commit"
        Write-Host "  (If you just pushed, Render may still be building. Use -Wait to poll.)"
        if (-not $Wait) { exit 1 }
    }
}

if ($Wait) {
    if (-not $localHead) { Write-Host "No local git HEAD available - cannot wait for match"; exit 1 }
    $deadline = (Get-Date).AddMinutes(5)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 20
        $info = Get-BackendInfo
        if ($null -ne $info -and $info.commit -eq $localHead) {
            Write-Host "Deploy check: LIVE - backend now serves $($localHead.Substring(0,7))"
            exit 0
        }
        $now = Get-Date -Format HH:mm:ss
        if ($null -eq $info) {
            Write-Host "$now - backend not responding yet..."
        } else {
            Write-Host "$now - still serving $($info.commit)..."
        }
    }
    Write-Host "TIMED OUT after 5 min - deploy has not gone live. Check Render dashboard -> Deploys (may need Manual Deploy)."
    exit 1
}
