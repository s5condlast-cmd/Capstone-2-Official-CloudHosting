@echo off
echo ===================================================
echo   Pushing code to Web-Based-Practicum-System 2.0  
echo ===================================================
echo.

:: Stage all files including src/ and public/
echo Staging files...
git add .
if %errorlevel% neq 0 (
    echo Error staging files.
    pause
    exit /b %errorlevel%
)

:: Commit files
echo.
echo Committing files...
git commit -m "Restore source files and include latest local changes"
if %errorlevel% neq 0 (
    echo Note: No new changes to commit or commit failed.
)

:: Force-push to the upstream remote (which is mapped to the -2.0 repo)
echo.
echo Pushing to upstream/main (Web-Based-Practicum-System-With-AI-STI-MARIKINA-2.0)...
git push upstream main --force
if %errorlevel% neq 0 (
    echo.
    echo Pushing to upstream failed. Checking if upstream remote exists...
    git remote | findstr /i "upstream" >nul
    if %errorlevel% neq 0 (
        echo Upstream remote not found. Adding it now...
        git remote add upstream https://github.com/s5condlast-cmd/Web-Based-Practicum-System-With-AI-STI-MARIKINA-2.0.git
        git push upstream main --force
    )
)

echo.
echo ===================================================
echo   Done! Your Vercel deployment should start building.
echo ===================================================
pause
