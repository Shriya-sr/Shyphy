# ShiPhy CTF - Quick Testing Guide

## 🚀 Quick Start (2 minutes)

### Terminal 1: Backend
```bash
cd backend
npm install && npm start
```

### Terminal 2: Frontend  
```bash
npm install && npm run dev
```

Then open: `http://localhost:5173`

---

## ✅ Quick Test Scenarios

### Test 1: Basic Intern Flow (2 min)
1. Login: `intern_001` / `Password@123`
2. ✅ See dashboard
3. Wait 30 seconds to see FTE announcement
4. ✅ Click FTE link, see rejection
5. **Expected:** Page shows rejection message

### Test 2: NoSQL Injection (30 sec)
1. Go to login
2. Username: `{"$ne": "dummy"}`  
3. Password: anything
4. ✅ Get employee access
5. **Expected:** Logged in as emp_001 (Priya Sharma)

### Test 3: HR OTP Bypass (1 min)
1. Go to `/hr-login`
2. Login: `hr_team` / `HR@9999`
3. Press F12, go to Console
4. Type: `window.bypassOtp = true` → Enter
5. Enter any OTP (e.g., "000000")
6. ✅ Access HR Dashboard
7. **Expected:** See employee records with Mother's Name and DOB
8. **Find Admin:** Abhishek Shemadi - Mother: Sheetal, DOB: 1985-03-22

### Test 4: Emergency Password Login (30 sec)
1. Go to login
2. Username: `admin_abhishek`
3. Password: `SHEE22031985` (constructed from Sheetal + 22031985)
4. ✅ Login as admin
5. **Expected:** Redirected to admin dashboard

### Test 5: SSH Panel & Rotating Flag (1 min)
1. After admin login, go to `/dashboard/admin/ssh`
2. Type: `fetch_flag`
3. ✅ See rotating flag: `SHI{XXXXXX}`
4. Wait 10 seconds
5. ✅ Flag changes to new value
6. **Expected:** Flag updates every 10 seconds

---

## 🔍 Key Verification Points

### Backend Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Announcements (check type field)
curl http://localhost:5000/api/announcements

# Normal login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"intern_001","password":"Password@123"}'

# NoSQL injection
curl -X POST http://localhost:5000/api/auth/login-nosql \
  -H "Content-Type: application/json" \
  -d '{"username":"{\"$ne\":\"dummy\"}","password":"x"}'
```

### Frontend Pages
- [ ] `http://localhost:5173/` - Landing page
- [ ] `http://localhost:5173/login` - Login (with HR link)
- [ ] `http://localhost:5173/hr-login` - HR login
- [ ] `http://localhost:5173/fte-login` - FTE rejection
- [ ] `http://localhost:5173/dashboard/intern` - Intern dashboard
- [ ] `http://localhost:5173/dashboard/hr` - HR dashboard (needs HR auth)
- [ ] `http://localhost:5173/dashboard/admin/ssh` - SSH panel (needs admin auth)

### Console Checks
- [ ] HR Login page logs OTP vulnerability hints
- [ ] No critical errors in console
- [ ] DevTools commands work: `window.bypassOtp = true`

---

## 📋 Complete Test Checklist

### Authentication Tests
- [ ] Intern login works (Password@123)
- [ ] Employee login works (EmpPass@456)
- [ ] HR login works (HR@9999)
- [ ] Admin login works (Admin@123)
- [ ] Emergency password works (SHEE22031985)
- [ ] NoSQL injection bypasses to employee
- [ ] Invalid login shows error
- [ ] Expired tokens are rejected

### Frontend Tests
- [ ] InternDashboard loads correctly
- [ ] Timer counts up every second
- [ ] Welcome announcement appears immediately
- [ ] FTE announcement appears after 2+ minutes
- [ ] FTE link becomes visible after announcement
- [ ] HR login page loads at /hr-login
- [ ] HR login requires OTP after password
- [ ] HR Dashboard shows employee records
- [ ] HR records include Mother's Name and DOB columns
- [ ] Admin data shows: Sheetal, 1985-03-22
- [ ] SSH panel loads for admin users
- [ ] SSH panel shows live flag countdown

### Vulnerability Tests
- [ ] NoSQL injection in username field works
- [ ] OTP bypass: window.bypassOtp = true works
- [ ] Attempt reset: window.otpAttempts = 0 works
- [ ] Emergency password formula is discoverable
- [ ] Sensitive HR data is exposed in table
- [ ] Flag rotates every 10 seconds
- [ ] Flag is time-based and non-repeating

### API Tests
- [ ] GET /api/health returns 200
- [ ] POST /api/auth/login returns token
- [ ] POST /api/auth/login-nosql returns employee token
- [ ] POST /api/auth/emergency-login returns admin token
- [ ] POST /api/hr/login supports bypassOtp parameter
- [ ] GET /api/announcements returns array with type field
- [ ] GET /api/hr/records returns sensitive employee data
- [ ] GET /api/ssh/fetch_flag returns rotating flag
- [ ] All authenticated endpoints reject invalid tokens

### Navigation Tests
- [ ] Login page has HR Portal link
- [ ] FTE announcement triggers FTE link
- [ ] Admin can access SSH panel
- [ ] HR can access employee records
- [ ] Role-based redirects work
- [ ] 404 page works for invalid routes

---

## 🐛 Expected Issues & Fixes

| Issue | Solution |
|-------|----------|
| Backend won't connect | Check VITE_API_URL in .env |
| OTP not working | Make sure 30s window is Active |
| Flag not updating | Refresh page, check auth token |
| HR records not loading | Clear localStorage, log in again |
| FTE link not showing | Wait 2+ minutes on dashboard |
| Emergency login fails | Check password format: SHEE22031985 |

---

## 📊 Test Pass Criteria

**Red Team Flow Duration:** ~10-15 minutes (Steps 1-8)

**Minimum Passing Tests:**
- ✅ Intern can login and see dashboard
- ✅ FTE announcement appears after 2 minutes
- ✅ NoSQL injection gets employee access
- ✅ HR OTP can be bypassed via devtools
- ✅ Admin data (Mother's name, DOB) is visible in HR records
- ✅ Emergency password login works
- ✅ SSH panel shows rotating flag
- ✅ Flag updates every 10 seconds

**All tests pass = CTF is fully functional!**

---

## 🎯 Performance Targets

- Page load < 2 seconds
- Dashboard renders < 1 second
- Login response < 500ms
- Flag endpoint < 100ms
- Announcement poll < 5 seconds interval
- No console errors

---

## 📝 Notes for Testing

1. **Time-sensitive features:**
   - FTE announcement: 2 minute delay
   - OTP window: 30 seconds
   - Flag rotation: 10 seconds

2. **Devtools will show:**
   - OTP formula in console
   - Bypass hints
   - Attack vectors

3. **Sensitive data exposure:**
   - HR records will show personal data
   - This is intentional for CTF

4. **Non-production:**
   - These are test credentials
   - Do not deploy to production
   - Security is intentionally weak
