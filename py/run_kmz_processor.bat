@echo off
echo KMZ Polyline Processor
echo ======================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7 or higher and try again
    pause
    exit /b 1
)

REM Check if requirements are installed
echo Checking Python packages...
pip show mysql-connector-python >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo Error: Failed to install required packages
        pause
        exit /b 1
    )
)

REM Check if config file exists
if not exist "config.py" (
    echo Error: config.py file not found
    echo Please create the configuration file first
    pause
    exit /b 1
)

echo.
echo Starting KMZ Polyline Processor...
echo.

REM Run the processor
python kmz_processor_with_config.py

echo.
echo Processing complete. Check the log file for details.
pause



