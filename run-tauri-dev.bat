@echo off
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" x64
set PATH=%PATH%;C:\Users\20544\.cargo\bin
cd /d D:\PROJECT\vicoo\apps\desktop
pnpm tauri dev
