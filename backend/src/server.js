import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleLogin, verifyToken, requireRole } from './auth.js';
import { findUserById, getUserPublicInfo } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Shiphy backend is running' });
});

// Login endpoint - NO FRONTEND PASSWORDS INVOLVED
app.post('/api/auth/login', handleLogin);

// Protected route - verify user is authenticated
app.get('/api/auth/verify', verifyToken, (req, res) => {
  const user = findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: getUserPublicInfo(user) });
});

// Protected route - get current user info
app.get('/api/auth/me', verifyToken, (req, res) => {
  const user = findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: getUserPublicInfo(user) });
});

// Admin endpoint example
app.get('/api/admin/dashboard', verifyToken, requireRole('admin', 'boss'), (req, res) => {
  res.json({ message: 'Admin dashboard data' });
});

// HR endpoint example
app.get('/api/hr/dashboard', verifyToken, requireRole('hr'), (req, res) => {
  res.json({ message: 'HR dashboard data' });
});

// BlueTeam endpoint example
app.get('/api/blueteam/dashboard', verifyToken, requireRole('blueteam'), (req, res) => {
  res.json({ message: 'Blue team dashboard data' });
});

// Employee endpoint example
app.get('/api/employee/dashboard', verifyToken, requireRole('employee', 'intern'), (req, res) => {
  res.json({ message: 'Employee dashboard data' });
});

// Logout endpoint
app.post('/api/auth/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🔒 Shiphy backend running on http://localhost:${PORT}`);
  console.log('All passwords are securely hashed. Never sent over network.');
});
