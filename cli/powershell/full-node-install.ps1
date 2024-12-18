param (
    [string]$PackageManager = "npm",
    [string]$InstallMethod = "URI"
)

# Check if node is already installed
try {
    if (node -v -gt $null 2>&1) {
        Write-Host "Node is already installed"
        exit 0
    }
    # Defining installer path
    $installPath = "$PSScriptRoot\nodejs-installer.msi"

    # Downloading nodejs LTS installer
    Write-Host "Downloading nodejs installer"
    $nodeUri = "https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi"
    Invoke-WebRequest -Uri $nodeUri -OutFile $installPath

    # Installing nodejs in silent mode
    Write-Host "Installing nodejs"
    Start-Process msiexec.exe -ArgumentList "/i $installPath /quiet" -Wait

    # Removing installer
    Remove-Item $installPath
}
catch {
    Write-Error "An error occurred while installing NodeJS v22.12.0: $($_.Exception.Message)"
}

try {
    if ($PackageManager -eq "yarn") {
        Write-Host "Installing Yarn"
        npm install -g yarn
    }
}
catch {
    Write-Error "An error occurred while installing Yarn: $($_.Exception.Message)"
}
