import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleLogin, verifyToken, requireRole, handleNoSQLLogin, handleEmergencyLogin, handleHrLogin } from './auth.js';
import { findUserById, getUserPublicInfo, users } from './database.js';
import { getRotatingFlag } from './flag.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'], // Vite dev server
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Shiphy backend is running' });
});

// Announcements - some announcements are scheduled in the future
const announcements = [
  { id: 1, title: 'Welcome Intern', body: 'Dashboard updated with your intern information.', type: 'general', visibleAt: Date.now() },
  // FTE portal open in 1 minute
  { id: 2, title: 'FTE Portal', body: 'Selected FTE candidates must log in using the FTE portal.', type: 'fte', visibleAt: Date.now() + 1 * 60 * 1000 }, // 1 minute later
  // Decision announcement - direct to FTE portal
  { id: 3, title: 'Your FTE Decision Is Ready', body: 'Logout and check the FTE portal to see if you have been hired for full-time employment.', type: 'fte_decision', visibleAt: Date.now() + 1 * 60 * 1000 },
];

app.get('/api/announcements', (req, res) => {
  const now = Date.now();
  const visible = announcements.filter(a => a.visibleAt <= now).map(a => ({ id: a.id, title: a.title, body: a.body, type: a.type }));
  res.json({ announcements: visible });
});

// Login endpoint - NO FRONTEND PASSWORDS INVOLVED
app.post('/api/auth/login', handleLogin);

// Vulnerable NoSQL-style login (CTF demo)
app.post('/api/auth/login-nosql', handleNoSQLLogin);

// Emergency password login
app.post('/api/auth/emergency-login', handleEmergencyLogin);

// HR vulnerable login (OTP logic/client-side weakness)
app.post('/api/hr/login', handleHrLogin);

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

// HR records - return all employee records (sensitive) - hr role only
app.get('/api/hr/records', verifyToken, requireRole('hr'), (req, res) => {
  // Intentionally include more fields for the CTF scenario
  const records = users.map(u => ({ id: u.id, username: u.username, fullName: u.fullName, email: u.email, employeeId: u.employeeId, motherName: u.motherName, dob: u.dob || null, role: u.role }));
  res.json({ records });
});

// Admin endpoint example
app.get('/api/admin/dashboard', verifyToken, requireRole('admin', 'boss'), (req, res) => {
  res.json({ message: 'Admin dashboard data' });
});

// SSH / Flag endpoint - admin-only, rotating flag
app.get('/api/ssh/fetch_flag', verifyToken, requireRole('admin'), (req, res) => {
  const secret = process.env.FLAG_SECRET || 'shi_core_secret';
  const { flag, secondsRemaining } = getRotatingFlag(secret);
  res.json({ flag, validForSeconds: secondsRemaining });
});

// HR endpoint example
app.get('/api/hr/dashboard', verifyToken, requireRole('hr'), (req, res) => {
  res.json({ message: 'HR dashboard data' });
});

// BlueTeam endpoint example
app.get('/api/blueteam/dashboard', verifyToken, requireRole('blueteam'), (req, res) => {
  res.json({ message: 'Blue team dashboard data' });
});

// Simple alerting store for CTF (in-memory)
const alerts = [];

// Endpoint for blue team to fetch alerts
app.get('/api/blueteam/alerts', verifyToken, requireRole('blueteam'), (req, res) => {
  res.json({ alerts });
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
