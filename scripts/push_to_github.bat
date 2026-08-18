@echo off
echo ===================================================
echo   Pushing code to Capstone-2-Official-CloudHosting  
echo ===================================================
echo.

:: Stage all modified and added files
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
git commit -m "Update source files and include latest changes"
if %errorlevel% neq 0 (
    echo Note: No new changes to commit or commit already up to date.
)

:: Push to origin branch
echo.
echo Pushing to origin...
git push origin HEAD
if %errorlevel% neq 0 (
    echo.
    echo Pushing failed. Please verify your Git credentials and internet connection.
)

echo.
echo ===================================================
echo   Done! Your deployment should start building.
echo ===================================================
pause

