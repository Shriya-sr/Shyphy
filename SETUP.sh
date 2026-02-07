#!/bin/bash
# Quick setup script for Shiphy with secure backend

echo "🔒 Setting up Shiphy with secure authentication..."

# Setup backend
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cp .env.example .env
echo "✅ Backend setup complete"

# Back to root
cd ..

# Setup frontend
echo ""
echo "📦 Frontend dependencies should already be installed"
echo "✅ Frontend ready"

echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 - Backend Server:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 - Frontend Server:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "  - Security Fix Details: SECURITY_FIX.md"
echo "  - Backend API Docs: backend/README.md"
echo ""
