# Source Visual Studio environment
$vsPath = "C:\Program Files\Microsoft Visual Studio\2022\Community"
# Use MSVC 14.44 which has the full library set
$vcvars = "$vsPath\VC\Auxiliary\Build\vcvarsall.bat"
$vcvarsVersion = "14.44.35207"

# Run vcvarsall.bat and capture environment
$tempBat = "$env:TEMP\tauri_env_$PID.bat"
$tempOut = "$env:TEMP\tauri_env_$PID.txt"

# Set specific MSVC version before calling vcvarsall
$env:VCToolsVersion = "14.44.35207"
$env:VCToolsInstallDir = "D:\Visual Studio\Community\VC\Tools\MSVC\14.44.35207"

# Create batch file to call vcvarsall and export env
@"
@echo off
set VCToolsVersion=14.44.35207
set VCToolsInstallDir=D:\Visual Studio\Community\VC\Tools\MSVC\14.44.35207
call "$vcvars" x64
set > "$tempOut"
"@ | Out-File -FilePath $tempBat -Encoding ASCII

# Execute and get environment
cmd /c $tempBat
Get-Content $tempOut | ForEach-Object {
    if ($_ -match '^(.+?)=(.+)$') {
        $name = $matches[1]
        $value = $matches[2]
        if ($name -and $value) {
            Set-Item -Path "env:$name" -Value $value -ErrorAction SilentlyContinue
        }
    }
}

# Add cargo to path
$env:Path = "$env:Path;C:\Users\20544\.cargo\bin"

# Clean up
Remove-Item $tempBat -ErrorAction SilentlyContinue
Remove-Item $tempOut -ErrorAction SilentlyContinue

cd D:\PROJECT\vicoo\apps\desktop
pnpm tauri dev
