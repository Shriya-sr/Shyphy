import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { findUserByUsername, getUserPublicInfo, users } from './database.js';

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

// Simulated vulnerable NoSQL login endpoint for CTF (intentional vulnerability)
export function handleNoSQLLogin(req, res) {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  // If username is JSON-like and contains a $ne operator, simulate a NoSQL injection
  if (typeof username === 'string' && username.trim().startsWith('{')) {
    try {
      const q = JSON.parse(username);
      if (q && q.$ne !== undefined) {
        // Attacker expects admin but only receives an employee account (CTF design)
        const victim = users.find(u => u.role === 'employee');
        if (!victim) return res.status(404).json({ error: 'No user found' });

        const token = jwt.sign({ userId: victim.id, username: victim.username, role: victim.role }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: getUserPublicInfo(victim), note: 'NoSQL injection returned limited employee access' });
      }
    } catch (e) {
      // fall through to normal handling
    }
  }

  // Fallback to regular find
  const user = findUserByUsername(username);
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });

  const passwordMatch = bcrypt.compareSync(password || '', user.passwordHash);
  if (!passwordMatch) return res.status(401).json({ error: 'Invalid username or password' });

  const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: getUserPublicInfo(user) });
}

// Emergency password login - allows emergency access when pattern matches (CTF flow)
export function handleEmergencyLogin(req, res) {
  const { username, emergencyPassword } = req.body;
  if (!username || !emergencyPassword) return res.status(400).json({ error: 'username and emergencyPassword required' });

  const user = findUserByUsername(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Construct expected emergency password: first 4 letters of mother's name (upper) + DOB ddmmyyyy
  const mom = (user.motherName || '').toUpperCase();
  const momPart = mom.substring(0, 4).padEnd(4, 'X');
  const dob = user.dob || user.joinDate || '';
  // Expect dob in YYYY-MM-DD
  const dobDigits = dob.replace(/-/g, '');
  let dobPart = '';
  if (dobDigits.length === 8) {
    // YYYYMMDD -> DDMMYYYY
    dobPart = dobDigits.substring(6, 8) + dobDigits.substring(4, 6) + dobDigits.substring(0, 4);
  }

  const expected = `${momPart}${dobPart}`;
  if (expected === emergencyPassword) {
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: getUserPublicInfo(user), note: 'Emergency login granted' });
  }

  return res.status(403).json({ error: 'Invalid emergency password' });
}

// Vulnerable HR login (client-side attempt counter + weak OTP logic) for CTF
export function handleHrLogin(req, res) {
  const { username, password, otp, clientAttemptCount, bypassOtp } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const user = findUserByUsername(username);
  if (!user || user.role !== 'hr') return res.status(401).json({ error: 'Invalid credentials' });

  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });

  // OTP formula (insecure example): take HMAC of username with a short-lived window
  const window = Math.floor(Date.now() / 30000); // 30s window
  const secret = process.env.OTP_SECRET || 'otp_dev_secret';
  const h = crypto.createHmac('sha256', secret).update(user.username + window).digest('hex');
  const expectedOtp = parseInt(h.substring(0, 6), 16).toString().slice(-6);

  // Vulnerability: if client sets bypassOtp=true (e.g., via devtools), server accepts it
  if (bypassOtp) {
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: getUserPublicInfo(user), note: 'OTP bypass accepted (vulnerable)' });
  }

  if (String(otp) === String(expectedOtp)) {
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: getUserPublicInfo(user) });
  }

  // Client-side attempt counter is ignored by server (vulnerability demonstration)
  return res.status(401).json({ error: 'Invalid OTP' });
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
