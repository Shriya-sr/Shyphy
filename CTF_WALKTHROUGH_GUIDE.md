# ShiPhy CTF Project - Complete Walkthrough & Testing Guide

## Quick Start Setup

### Prerequisites
- Node.js 18+
- npm or bun
- Two terminals (one for backend, one for frontend)

### Installation & Running

**Backend Setup:**
```bash
cd backend
npm install
# or bun install
npm start
# Backend runs on http://localhost:5000
```

**Frontend Setup (in another terminal):**
```bash
npm install
# or bun install
npm run dev
# Frontend runs on http://localhost:5173
```

### Environment Variables
Create a `.env` file in the root:
```
VITE_API_URL=http://localhost:5000
```

For backend, create `backend/.env`:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
OTP_SECRET=otp_dev_secret
FLAG_SECRET=shi_core_secret
```

---

## Red Team CTF Flow - Complete Walkthrough

### Step 1: Intern Login & Dashboard
**Objective:** Get into the system as an intern

1. Navigate to `http://localhost:5173/login`
2. Login with credentials:
   - **Username:** `intern_001`
   - **Password:** `Password@123`
3. You'll land on the **Intern Dashboard** showing:
   - Welcome message
   - Profile info: Raj Kumar, INT-2024-001
   - Department: Development
   - Announcements section (initially empty)

**Timeline:**
- At 0 seconds: Welcome announcement appears
- At 2 minutes (120 seconds): **FTE Portal announcement** appears
  - This is the psychological trigger
  - Motivates attacker to try the FTE portal

---

### Step 2: FTE Portal - Rejection & Motivation
**Objective:** Experience the rejection that motivates the attack

1. After 2 minutes on the dashboard, you'll see the announcement:
   > "Selected FTE candidates must log in using the FTE portal"
2. Go to login page (`/login`)
3. Notice the new link: **"FTE Conversion Portal →"**
4. Click it to go to `/fte-login`
5. See rejection message:
   > "We regret to inform you that you have been rejected by the CEO..."
   > Reference: FTE-2025-REJ-XXXX

**Psychological Impact:** 
- Rejection triggers desire to bypass restrictions
- Sets up motivation for hacking attempts

---

### Step 3: NoSQL Injection Attack (Step 2 in original flow)
**Objective:** Bypass intern login to get employee access

1. Go to `/login`
2. Instead of normal credentials, use NoSQL injection in username field:
   ```
   {"$ne": "dummy"}
   ```
3. Password: anything
4. Click "Sign In"

**Result:** 
- You get employee access (emp_001 - Priya Sharma)
- Not full admin access (shows limited compromise)
- Token grants you `/dashboard/employee` access

**Why limited access?**
- CTF design: teaches that injection ≠ full compromise
- Real world: backend filters and access controls matter

---

### Step 4: Suspicious Activity & Blue Team Alert
**Note:** This step would be triggered by Blue Team (covered in blue team flow)
- Rapid login attempts, automated scripts, etc.
- Employee account gets flagged
- Emergency mode triggered

For now, you can simulate this by triggering the system state in DevTools.

---

### Step 5: HR Login & OTP Vulnerability (Critical Step!)
**Objective:** Access HR records to find admin credentials clues

1. Go to `/login` or click **"HR Portal"** link
2. Navigate to `/hr-login`
3. Login with HR credentials:
   - **Username:** `hr_team`
   - **Password:** `HR@9999`
4. You're now at OTP verification step

**Exploiting the OTP Vulnerability:**

**Option A: Bypass OTP via DevTools (Fastest)**
1. Open DevTools (Press F12)
2. Go to **Console** tab
3. Type and execute:
   ```javascript
   window.bypassOtp = true;
   ```
4. Enter any 6-digit number in OTP field (e.g., "000000")
5. Click "Verify OTP"
6. **Success!** You're in HR Dashboard

**Option B: Brute Force via Attempt Reset**
1. Open DevTools Console
2. Reset attempts:
   ```javascript
   window.otpAttempts = 0;
   ```
3. Try OTP multiple times
4. Eventually get correct OTP (time-based HMAC formula)

**Why This Works:**
- Client-side attempt counter is not validated by server
- Server accepts `bypassOtp` flag if sent
- Real vulnerability: trusting client-side validation

**Console Hints Exposed:**
The page logs to console explaining:
- OTP formula: HMAC-SHA256(username + 30s_window)
- Client-side weakness: attempt counter
- How to exploit it

---

### Step 5 Continued: HR Records & Admin Clues
**Objective:** Find admin's identity and personal data

Once logged into HR Dashboard at `/dashboard/hr`:

1. **You see employee records table with:**
   - Full Name
   - Email
   - Role
   - Department
   - **Mother's Name** ← KEY CLUE
   - **DOB** ← KEY CLUE
   - Status

2. **Find Admin Record - Abhishek Shemadi (ADM-2019-001):**
   - Full Name: Abhishek Shemadi
   - Email: abhishek.shemadi@shiphy.com
   - Role: admin
   - Department: Administration
   - **Mother's Name: Sheetal**
   - **DOB: 1985-03-22**

3. **Additional Clue in HR Dashboard:**
   - Admin contact section mentions:
   - "System Administrator - Abhishek Shemadi"
   - Employee since 2019
   - Hidden comment references: Instagram @abhishek_shemadi_art

---

### Step 6: OSINT - Instagram Investigation
**Objective:** Confirm mother's name and find additional clues

1. In your browser, search for or navigate to the mock Instagram page
   - URL: `@abhishek_shemadi_art` (if available)
   - Or look for internal OSINT page reference

2. **Find information about:**
   - Mother's influence on art/life
   - Mother's name posts
   - Birthday/family references

3. **Confirmed Data:**
   - Mother's Name: Sheetal
   - Mother's Influence: Frequently posted about
   - Current understanding: Mom's name is SHEETAL

---

### Step 7: Emergency Password Discovery
**Objective:** Construct and use emergency password for admin access

Based on data gathered, the **emergency password pattern** is:
```
[First 4 letters of mother's name in UPPERCASE] + [DOB in DDMMYYYY format]
```

**For Abhishek Shemadi:**
- Mother: Sheetal → First 4 letters: SHEE
- DOB: 1985-03-22 → DDMMYYYY: 22031985
- **Emergency Password: SHEE22031985**

**Using Emergency Password:**
1. Go back to `/login`
2. Use username: `admin_abhishek`
3. Use password: `SHEE22031985`
4. Check the **"Emergency Lockdown Active"** checkbox (if visible) or it auto-checks in emergency mode
5. Click "Sign In"

**Result:** 
- ✅ Login as admin
- Access to `/dashboard/admin`
- Can access `/dashboard/admin/ssh`

---

### Step 8: SSH Panel & Rotating Flag
**Objective:** Capture the final rotating flag

1. Login as admin (Step 7)
2. Navigate to Admin Dashboard → SSH Panel
3. You see a terminal interface with:
   - Connection status: Connected
   - Security: Encrypted
   - Server: prod-server-01.shiphy.internal

4. **Live Flag Display (top of terminal):**
   - Shows current rotating flag
   - Updates every 10 seconds with new hash
   - Countdown timer shows seconds remaining

5. **Fetch Flag via Terminal Command:**
   ```bash
   fetch_flag
   ```
   This will output:
   ```
   Current Flag: SHI{XXXXXX}
   Valid for: X seconds
   ```

6. **Terminal Commands Available:**
   - `help` - Show available commands
   - `whoami` - Display current user
   - `status` - System status
   - `uptime` - Server uptime
   - `ls` - List directory
   - `pwd` - Current directory
   - `cat flag.txt` - View flag (shows victory message)
   - `clear` - Clear terminal
   - `exit` - Close connection

7. **Get the Flag!**
   - The flag rotates every 10 seconds
   - Format: `SHI{XXXXXXX}` (varies each cycle)
   - Example: `SHI{A7F3K2}`, `SHI{P9X1Q8}`, etc.
   - **Note:** Each flag is only valid for 10 seconds

---

## Complete Credentials Reference

### Account Credentials (for direct testing)

| Username | Password | Role | Use Case |
|----------|----------|------|----------|
| intern_001 | Password@123 | Intern | Starting point |
| emp_001 | EmpPass@456 | Employee | NoSQL injection target |
| hr_team | HR@9999 | HR | OTP vulnerability test |
| admin_abhishek | Admin@123 | Admin | Standard admin login |
| admin_abhishek | SHEE22031985 | Admin | Emergency password login |
| blueteam_lead | BlueTeam@123 | BlueTeam | Blue team dashboard |
| boss_shiphy | Boss@2024 | Boss | Executive access |

### Admin Details for CTF

- **Name:** Abhishek Shemadi
- **Employee ID:** ADM-2019-001
- **Email:** abhishek.shemadi@shiphy.com
- **Mother's Name:** Sheetal
- **Date of Birth:** 1985-03-22 (March 22, 1985)
- **Emergency Password:** SHEE22031985
- **Standard Password:** Admin@123

---

## Testing Checklist

### Backend Testing

- [ ] Health check endpoint works: `GET /api/health`
- [ ] Normal login works: `POST /api/auth/login`
- [ ] NoSQL injection endpoint works: `POST /api/auth/login-nosql`
- [ ] Emergency password login works: `POST /api/auth/emergency-login`
- [ ] HR login with OTP works: `POST /api/hr/login`
- [ ] HR login bypass (bypassOtp=true) works
- [ ] Announcements endpoint returns correct type field: `GET /api/announcements`
- [ ] HR records endpoint shows sensitive data: `GET /api/hr/records` (needs auth)
- [ ] Flag rotation endpoint works: `GET /api/ssh/fetch_flag` (needs admin auth)
- [ ] Token verification works: `GET /api/auth/verify`
- [ ] Role-based access control works (admin only endpoints)

### Frontend Testing - Intern Flow

- [ ] Intern can login with correct credentials
- [ ] Dashboard displays profile info correctly
- [ ] Timer counts up on dashboard
- [ ] Welcome announcement appears immediately
- [ ] FTE announcement appears after ~2 minutes
- [ ] FTE link becomes visible in login page
- [ ] FTE rejection page shows correct message
- [ ] Browser console is clean (no major errors)

### Frontend Testing - HR OTP Flow

- [ ] HR login page loads correctly
- [ ] Password login validation works
- [ ] OTP verification step appears after correct password
- [ ] Console shows OTP vulnerability hints
- [ ] `window.bypassOtp = true` allows OTP bypass
- [ ] `window.otpAttempts = 0` resets attempt counter
- [ ] HR Dashboard loads after successful auth
- [ ] Employee records table shows all columns
- [ ] Mother's Name and DOB visible in table
- [ ] Sensitive admin data exposed (Sheetal, 1985-03-22)

### Frontend Testing - Admin SSH

- [ ] Admin can login with emergency password: SHEE22031985
- [ ] SSH panel loads correctly
- [ ] Terminal responds to commands
- [ ] `help` command lists available commands
- [ ] `fetch_flag` command displays rotating flag
- [ ] Flag updates every 10 seconds with new hash
- [ ] Countdown timer works correctly
- [ ] Live flag display shows current flag with validity
- [ ] Flag format is correct: SHI{XXXXXX}

### Frontend Testing - Navigation

- [ ] All routes are accessible
- [ ] Role-based dashboard redirects work
- [ ] Back buttons navigate correctly
- [ ] HR Portal link appears in login page
- [ ] FTE link appears conditionally
- [ ] No dead links

---

## Vulnerability Summary

### 1. **NoSQL Injection (Step 3)**
- **Location:** Login endpoint
- **Payload:** `{"$ne": "dummy"}` in username field
- **Impact:** Bypass to employee access
- **Lesson:** Not all injections = full compromise

### 2. **HR OTP Bypass (Step 5)**
- **Type:** Client-side validation weakness
- **Method 1:** Set `window.bypassOtp = true`
- **Method 2:** Reset `window.otpAttempts = 0`
- **Impact:** Access to sensitive HR records
- **Lesson:** Client-side security is security theater

### 3. **Exposed Sensitive Data (Step 5)**
- **Location:** HR Dashboard
- **Data:** Mother's name, Date of birth
- **Why:** HR systems often exposed in real breaches
- **Impact:** Enables password recovery/emergency access

### 4. **Weak Emergency Password Pattern (Step 7)**
- **Pattern:** Predictable format based on personal data
- **Formula:** [Mother's Name (4 chars)] + [DOB DDMMYYYY]
- **Impact:** Once you have personal data, password is derivable
- **Why:** Real organizations sometimes use this pattern

### 5. **Time-Based Flag Rotation (Step 8)**
- **Type:** Social engineering prevention
- **Mechanism:** HMAC-SHA256 of timestamp
- **Impact:** Cannot be shared/reused
- **Lesson:** Flag must be captured live

---

## Common Issues & Troubleshooting

### Backend Won't Start
```bash
# Check port 5000 is free
# Kill process using port 5000
# Or change PORT in .env
```

### Frontend Can't Connect to Backend
```bash
# Ensure VITE_API_URL is set correctly
# Check backend is running on 5000
# Clear browser cache and CORS cache
```

### OTP Not Working
```
- Make sure time is synced on your machine
- OTP window is 30 seconds
- Try within the correct window
- Or use bypass: window.bypassOtp = true
```

### Flag Not Showing
```
- Make sure you're logged in as admin
- Check Authorization header is sent
- Flag rotates every 10 seconds
- Token must be valid
```

### HR Records Not Loading
```
- Make sure HR login was successful
- Check localStorage for shiphy_hr_verified
- Try refreshing page
- Check console for API errors
```

---

## Performance Notes

- **Announcement Polling:** Frontend polls every 5 seconds
- **Flag Polling:** Frontend polls every 1 second while on SSH page
- **OTP Window:** 30 seconds (matches backend)
- **Flag Rotation:** 10 seconds (anti-sharing mechanism)

---

## Security Notes (for Red Team - Operator)

DO NOT use in production:
- These credentials are test-only
- Vulnerabilities are intentional for CTF
- This is not a real security system
- Use proper frameworks in production

---

## Next Steps (Blue Team Implementation)

When implementing the Blue Team side:

1. **Suspicious Activity Detection**
   - Monitor login attempt frequency
   - Track IP addresses
   - Flag brute force patterns
   - Watch for NoSQL injection attempts

2. **Incident Response**
   - Block suspicious accounts
   - Trigger emergency mode
   - Force password reset
   - Log all actions

3. **Countermeasures**
   - Rate limiting
   - Server-side OTP validation
   - Proper access controls
   - Data masking in HR records

---

## References

- **Main CTF Flow:** Steps 1-8 above
- **Vulnerabilities:** See vulnerability summary
- **Credentials:** See credentials reference
- **API Endpoints:** Check backend/src/server.js
- **Frontend Routes:** Check src/App.tsx
