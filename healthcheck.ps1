$checks = @(
    @{ name = "Backend  (Render)"; url = "https://settrackr.onrender.com/" },
    @{ name = "Frontend (Vercel)"; url = "https://settrackr.vercel.app/" }
)

foreach ($check in $checks) {
    try {
        $res = Invoke-WebRequest -Uri $check.url -TimeoutSec 15 -UseBasicParsing
        Write-Host "$($check.name): UP ($($res.StatusCode))"
    } catch {
        Write-Host "$($check.name): DOWN - $($_.Exception.Message)"
    }
}
