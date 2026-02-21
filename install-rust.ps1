$ProgressPreference = 'SilentlyContinue'
Write-Host "Downloading Rustup..."
Invoke-WebRequest -Uri https://win.rustup.rs -OutFile "$env:TEMP\rustup-init.exe"

Write-Host "Installing Rust (this may take a few minutes)..."
Start-Process -FilePath "$env:TEMP\rustup-init.exe" -ArgumentList "-y", "default" -Wait

Write-Host "Rust installed! Adding to PATH..."
$env:Path = "$env:Path;$env:USERPROFILE\.cargo\bin"

Write-Host "Verifying installation..."
& "$env:USERPROFILE\.cargo\bin\rustc" --version
& "$env:USERPROFILE\.cargo\bin\cargo" --version
