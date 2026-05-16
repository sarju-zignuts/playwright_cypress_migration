@echo off
echo ========================================
echo Push Playwright Tests to GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Checking Git status...
git status
echo.

echo Step 2: Adding all files...
git add .
echo.

echo Step 3: Creating commit...
set /p commit_message="Enter commit message (or press Enter for default): "
if "%commit_message%"=="" set commit_message=Initial commit: Playwright test suite with CI/CD

git commit -m "%commit_message%"
echo.

echo Step 4: Adding remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/sarju-zignuts/playwright_cypress_migration.git
echo.

echo Step 5: Verifying remote...
git remote -v
echo.

echo Step 6: Renaming branch to main...
git branch -M main
echo.

echo Step 7: Pushing to GitHub...
echo.
echo NOTE: You may be prompted for GitHub credentials
echo Username: sarju-zignuts
echo Password: [Your GitHub Personal Access Token]
echo.
pause

git push -u origin main

echo.
echo ========================================
echo Push Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Go to: https://github.com/sarju-zignuts/playwright_cypress_migration
echo 2. Verify your files are there
echo 3. Click on "Actions" tab to see CI/CD running
echo.
pause
