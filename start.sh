#!/bin/bash

echo "======================================================================"
echo "    FRUITS & VEGETABLES FRESHNESS DETECTION - STARTUP SCRIPT"
echo "======================================================================"
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✓ Python is installed"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

echo "✓ Node.js is installed"

# Function to check if port is in use
check_port() {
    netstat -an | grep ":$1" > /dev/null 2>&1
    return $?
}

echo ""
echo "======================================================================"
echo "STEP 1: Checking Backend Setup"
echo "======================================================================"

cd backend

# Check if requirements are installed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

echo "Installing backend dependencies..."
pip install -q -r requirements.txt

# Check if model exists
if [ ! -f "../ml-model/models/freshness_detector.h5" ]; then
    echo ""
    echo "⚠️  WARNING: Model not found!"
    echo "Please train the model first by running:"
    echo "  cd ml-model"
    echo "  python train_model.py"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "======================================================================"
echo "STEP 2: Starting Backend Server"
echo "======================================================================"

# Check if port 5000 is available
if check_port 5000; then
    echo "⚠️  Port 5000 is already in use!"
    echo "Please stop the process using port 5000 or change the port in backend/app.py"
    exit 1
fi

echo "Starting Flask backend on http://localhost:5000..."
python app.py &
BACKEND_PID=$!

sleep 3

echo ""
echo "======================================================================"
echo "STEP 3: Starting Frontend"
echo "======================================================================"

cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Check if port 3000 is available
if check_port 3000; then
    echo "⚠️  Port 3000 is already in use!"
    echo "The frontend will try to use an alternative port."
fi

echo "Starting React frontend..."
npm run dev &
FRONTEND_PID=$!

sleep 5

echo ""
echo "======================================================================"
echo "✓ APPLICATION STARTED SUCCESSFULLY!"
echo "======================================================================"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "======================================================================"

# Wait for user interrupt
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

wait
