# Run before the backend starts so each launch uses one version of the code.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)
try {
    if (-not (Get-Command git -ErrorAction SilentlyContinue) -or -not (Test-Path -LiteralPath '.git')) {
        Write-Host '[UPDATE] Install with git clone to receive automatic updates.'
        exit 0
    }
    $branch = git branch --show-current
    if ($LASTEXITCODE -ne 0 -or $branch -ne 'main') {
        Write-Host '[UPDATE] Update skipped. Switch to main to receive releases.'
        exit 0
    }
    $changes = git status --porcelain
    if ($LASTEXITCODE -ne 0 -or $changes) {
        Write-Host '[UPDATE] Local changes found. Update skipped to preserve your files.'
        exit 0
    }
    git -c http.connectTimeout=8 -c http.lowSpeedLimit=1 -c http.lowSpeedTime=10 fetch origin main
    if ($LASTEXITCODE -ne 0) { throw 'Could not download updates.' }
    $before = git rev-parse HEAD
    git merge --ff-only origin/main
    if ($LASTEXITCODE -ne 0) { throw 'Update needs a manual merge.' }
    $dependencyChanges = git diff --name-only $before HEAD -- requirements.txt
    if ($dependencyChanges) {
        python -m pip install -r requirements.txt
        if ($LASTEXITCODE -ne 0) {
            Write-Host '[UPDATE] Dependencies need installation. Run python -m pip install -r requirements.txt before launching.'
            exit 1
        }
    }
} catch {
    Write-Host ('[UPDATE] ' + $_.Exception.Message + ' Starting the installed version.')
}
exit 0
