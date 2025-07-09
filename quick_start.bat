@echo off
REM === PeerQuest Quick Start Script ===

REM Clean Next.js build cache
cd /d "d:\Downloads\Downloads\adminquest\PeerQuestWebsite\PeerQuestFrontEnd"
echo Cleaning Next.js build cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Start Next.js frontend
start cmd /k "npm run dev"

echo.
echo =============================================
echo  Now start your backend in a separate window:
echo  cd /d d:\Downloads\Downloads\adminquest\PeerQuestWebsite\PeerQuestBackEnd
echo  python manage.py runserver 8000
echo =============================================
echo.
pause
