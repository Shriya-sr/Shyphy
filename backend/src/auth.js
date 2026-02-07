import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { findUserByUsername, getUserPublicInfo } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';

// Login endpoint handler
export function handleLogin(req, res) {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Find user
  const user = findUserByUsername(username);
  if (!user) {
    // Don't reveal if user exists (security best practice)
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Check if user is blocked
  if (user.isBlocked) {
    return res.status(403).json({ error: 'User account is blocked' });
  }

  // Compare password with hash
  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatch) {
    // Increment failed attempts
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    
    // Block user after too many failed attempts
    if (user.failedAttempts >= 5) {
      user.isBlocked = true;
      return res.status(403).json({ 
        error: 'Too many failed login attempts. Account blocked.' 
      });
    }
    
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Reset failed attempts on successful login
  user.failedAttempts = 0;

  // Create JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Return token and public user info
  res.json({
    token,
    user: getUserPublicInfo(user),
  });
}

// Middleware to verify JWT token
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

// Middleware to check user role
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
