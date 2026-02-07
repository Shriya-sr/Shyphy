# Shiphy Backend - Secure Authentication Server

## Security Fix Overview

This backend implements **secure password handling** and fixes the critical vulnerability where passwords were stored in plaintext in frontend code.

## What Changed

### Before (❌ VULNERABLE):
```javascript
// Frontend code exposed ALL passwords
const user = {
  username: 'admin_abhishek',
  password: 'Admin@123'  // ⚠️ VISIBLE IN JAVASCRIPT!
};
```

### After (✅ SECURE):
- Passwords are **hashed with bcrypt** on the backend
- Frontend only sends username/password to `/api/auth/login`
- Backend returns **JWT token** (not password)
- JWT token is used for all subsequent requests
- Passwords NEVER stored in browser localStorage

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Create `.env` file

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

**IMPORTANT:** Change `JWT_SECRET` to a long, random string in production!

### 3. Start Backend Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run at: `http://localhost:5000`

### 4. Configure Frontend

Update frontend `.env.local`:

```env
VITE_API_URL=http://localhost:5000
```

## API Endpoints

### Login (No Backend Required)
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "username": "admin_abhishek",
  "password": "Admin@123"
}

Response (Success):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "ADM-2019-001",
    "username": "admin_abhishek",
    "role": "admin",
    "fullName": "Abhishek Shemadi",
    "email": "abhishek.shemadi@shiphy.com"
  }
}
```

### Verify Token (Protected)
```
GET /api/auth/verify
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### Protected Endpoints
All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

## Test Users

| Username | Password | Role |
|----------|----------|------|
| `intern_001` | `Password@123` | intern |
| `emp_001` | `EmpPass@456` | employee |
| `hr_team` | `HR@9999` | hr |
| `admin_abhishek` | `Admin@123` | admin |
| `blueteam_lead` | `BlueTeam@123` | blueteam |
| `boss_shiphy` | `Boss@2024` | boss |

## How JWT Authentication Works

```
1. User submits login form
   ↓
2. Frontend sends POST /api/auth/login (username + password)
   ↓
3. Backend:
   - Finds user by username
   - Compares password with bcrypt hash
   - Creates JWT token if password matches
   ↓
4. Frontend receives JWT token
   ↓
5. Frontend stores token in localStorage
   ↓
6. For protected routes, frontend sends: "Authorization: Bearer <token>"
   ↓
7. Backend verifies JWT signature and expiration
   ↓
8. Access granted if token is valid
```

## Security Benefits

✅ **Passwords never in frontend code**
✅ **Passwords hashed with bcrypt** (salt rounds: 10)
✅ **JWT tokens expire** after 24 hours
✅ **Brute force protection** (failed attempt tracking)
✅ **No plaintext password transmission** (use HTTPS in production)
✅ **Failed login attempts tracked**
✅ **User blocking capability**

## Production Deployment

Before deploying to production:

1. **Change JWT_SECRET** to a strong, random value
2. **Set NODE_ENV=production**
3. **Enable HTTPS** (use SSL/TLS certificate)
4. **Use a real database** (MongoDB, PostgreSQL, etc.) instead of in-memory
5. **Update CORS** to only allow your frontend domain
6. **Add rate limiting** to prevent brute force attacks
7. **Add logging** for security audits
8. **Use environment variables** for all secrets

## File Structure

```
backend/
├── src/
│   ├── server.js       # Express server setup
│   ├── auth.js         # JWT and password verification logic
│   └── database.js     # User data with hashed passwords
├── package.json
├── .env.example        # Environment variables template
├── .gitignore
└── README.md
```

## Next Steps

1. Replace in-memory users with a real database
2. Add rate limiting middleware
3. Implement refresh tokens for better security
4. Add password change/reset functionality
5. Add multi-factor authentication (MFA) support
6. Add audit logging for all authentication events

## Questions?

This setup implements the OWASP Authentication Cheat Sheet best practices.
