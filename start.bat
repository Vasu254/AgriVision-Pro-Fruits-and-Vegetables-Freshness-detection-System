@echo off
echo ======================================================================
echo     FRUITS ^& VEGETABLES FRESHNESS DETECTION - STARTUP SCRIPT
echo ======================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)
echo [OK] Python is installed

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)
echo [OK] Node.js is installed

echo.
echo ======================================================================
echo STEP 1: Setting Up Backend
echo ======================================================================

cd backend

REM Install backend dependencies
echo Installing backend dependencies...
pip install -q -r requirements.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo Warning: Some packages might have failed to install
)

REM Check if model exists
if not exist "..\ml-model\models\freshness_detector.h5" (
    echo.
    echo WARNING: Model not found!
    echo Please train the model first by running:
    echo   cd ml-model
    echo   python train_model.py
    echo.
    choice /C YN /M "Do you want to continue anyway"
    if errorlevel 2 exit /b 1
)

echo.
echo ======================================================================
echo STEP 2: Starting Backend Server
echo ======================================================================
echo Starting Flask backend on http://localhost:5000...

start "Backend Server" cmd /k "python app.py"
timeout /t 5 /nobreak >nul

echo.
echo ======================================================================
echo STEP 3: Starting Frontend
echo ======================================================================

cd ..\frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo Starting React frontend on http://localhost:3000...
start "Frontend Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ======================================================================
echo APPLICATION STARTED SUCCESSFULLY!
echo ======================================================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Two command windows have been opened:
echo   1. Backend Server (Flask)
echo   2. Frontend Server (Vite + React)
echo.
echo Close those windows to stop the servers.
echo ======================================================================
echo.
echo Press any key to exit this window...
pause >nul
