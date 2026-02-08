# ShiPhy CTF - Quick Reference Card

## 🚀 Launch (2 commands)
```bash
# Terminal 1: Backend
cd backend && npm install && npm start

# Terminal 2: Frontend
npm install && npm run dev
```

---

## 📍 URLs
| Page | URL | Purpose |
|------|-----|---------|
| Landing | http://localhost:5173/ | Start |
| Login | http://localhost:5173/login | Main login |
| HR Login | http://localhost:5173/hr-login | HR System |
| FTE Portal | http://localhost:5173/fte-login | Special page |
| Dashboards | /dashboard/* | Role-specific |

---

## 🔐 Account Types to Try

Find credentials you can discover through:
- Default common passwords
- Environment hints in the app
- System messages and warnings
- Employee databases you access

**Hint:** Check if there's a password hints file or test data in the project.

---

## ⚡ Challenge Flow (General)

1. **Get inside the system** - Use an intern account to access the dashboard
2. **Wait for announcements** - The system will notify you of important events
3. **Explore alternate access** - Try the HR system to understand it
4. **Bypass limitations** - Check browser DevTools (F12) for vulnerabilities
5. **Access restricted data** - Employee records may be accessible
6. **Discover patterns** - Look for how passwords might be constructed
7. **Elevate privileges** - Use discovered information to gain higher access
8. **Reach the final goal** - Access the SSH panel and capture the rotating flag

---

## 🛠️ Key Tools & Techniques

### Browser DevTools (F12)
- **Console Tab:** Look for hints, debug messages, security notes
- **Network Tab:** Watch API calls and timing
- **Storage Tab:** Check localStorage for authentication data
- **Sources:** Understand the client-side code

### Common Vulnerabilities to Test
- Try unusual inputs in login fields
- Check if client-side checks can be bypassed
- Test for time-based triggers
- Look for exposed sensitive data in responses
- Examine how authentication tokens work

---

## 📓 Notes Section

Use this space to track:
```
Discovered usernames:
_________________

Account access achieved:
_________________

Interesting data found:
_________________

Pattern discovered:
_________________

Critical hint:
_________________
```

---

## 🔍 Investigation Checklist

- [ ] Can you login to at least one account?
- [ ] Do announcements appear over time?
- [ ] Can you access the HR system?
- [ ] What sensitive data is visible?
- [ ] Are there any patterns in the data?
- [ ] Can you find personal information that could be a password?
- [ ] Does the admin account have a special password format?
- [ ] Can you reach the SSH panel?

---

## 🐛 Troubleshooting

| Problem | Debug Step |
|---------|-----------|
| Backend won't start | Check if port 5000 is free |
| Can't reach frontend | Verify VITE_API_URL environment variable |
| DevTools shows errors | Check console tab for specific error messages |
| Feature not appearing | May depend on time (wait a couple minutes) or access level |
| Data not loading | Try refreshing, clear localStorage, re-authenticate |

---

## 📱 What to Observe

### Dashboard Behavior
- Watch the timer
- When does the announcement appear?
- What does the announcement say?

### HR System
- What fields are visible?
- What personal information is stored?
- How is data structured?

### Authentication
- What happens with invalid credentials?
- Does the system give hints after failures?
- Are there error messages that reveal information?

---

## 🔐 Security Concepts Being Tested

1. **Input Validation** - Does the system properly validate inputs?
2. **Client-Side Security** - Can client-side checks be bypassed?
3. **Data Protection** - Is sensitive data properly secured?
4. **Authentication** - Are passwords strong and unpredictable?
5. **Access Control** - Are permissions properly enforced?
6. **Information Disclosure** - Is too much data exposed?

---

## 📊 Progress Tracking

Track your journey:
- [ ] Level 1: Access any user account
- [ ] Level 2: Wait for system events
- [ ] Level 3: Access HR system
- [ ] Level 4: Find sensitive data
- [ ] Level 5: Identify patterns
- [ ] Level 6: Gain admin access
- [ ] Level 7: Access restricted systems
- [ ] Level 8: Capture the flag

---

## 💡 Tips (Spoiler-Free)

1. **Patience** - Some things take time to appear
2. **Observation** - Watch what the app tells you
3. **Curiosity** - Try accessing things you think you shouldn't
4. **DevTools** - F12 is your friend in CTF challenges
5. **Persistence** - If something doesn't work, try variations
6. **Documentation** - Write down what you discover
7. **Patterns** - Look for repeating formats in the data
8. **Social Engineering** - Information gathering is key

---

## 🎯 Success Indicators

You know you're on the right track when:
- You can login with multiple different accounts
- You see messages appearing in the announcements section
- You find employee records with personal information
- You notice patterns in how data is organized
- You can access restricted areas with exploited permissions
- You see a terminal-like interface with commands
- A flag appears that changes every few seconds

---

## 🎓 Think Like an Attacker

Ask yourself:
- What information is publicly available?
- How might personal data be used in passwords?
- What does the system tell me when I try something?
- Are there hints in the error messages?
- Can I manipulate client-side code with DevTools?
- What would a professional hacker look for?

---

## 📚 Documentation Available

For more detailed help, check:
- `CTF_WALKTHROUGH_GUIDE.md` - Full step-by-step (spoiler-heavy)
- `TESTING.md` - Test scenarios
- `API_REFERENCE.md` - Technical documentation

Start with this card, use DevTools, and only refer to walkthroughs if stuck!

---

**Remember:** The best learning comes from discovering vulnerabilities yourself, not reading about them.

Good luck! 🏁
