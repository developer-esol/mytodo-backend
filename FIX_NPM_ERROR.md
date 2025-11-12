# 🚨 NPM ERROR FIX GUIDE

## Problem

```
ReferenceError: npm is not defined
at servicesN/tasks/tasks.services.js:173:3
```

## Root Cause

There's a typo on **line 173** of `tasks.services.js` on your **production server** (`/var/www/mytodoo/mytodo-backend/`).

Someone accidentally typed `npm;` (probably a typo or accidental keypress).

---

## ✅ Solution Options

### Option 1: SSH into Server and Fix Manually

```bash
# 1. SSH into your production server
ssh your-server

# 2. Edit the file
nano /var/www/mytodoo/mytodo-backend/servicesN/tasks/tasks.services.js

# 3. Go to line 173 (in nano: Ctrl+_ then type 173)
# 4. Find and DELETE the line that says: npm;
# 5. Save (Ctrl+O, Enter, Ctrl+X)

# 6. Restart the server
pm2 restart mytodo-backend

# 7. Check logs
pm2 logs mytodo-backend
```

### Option 2: Use the Fix Script

```bash
# 1. Copy fix-npm-error.sh to your server
scp fix-npm-error.sh your-server:/var/www/mytodoo/mytodo-backend/

# 2. SSH into server
ssh your-server

# 3. Run the script
cd /var/www/mytodoo/mytodo-backend
chmod +x fix-npm-error.sh
bash fix-npm-error.sh
```

### Option 3: Deploy Fresh Code (Recommended)

```bash
# On your local machine:
git add .
git commit -m "Fix npm typo in tasks.services.js"
git push origin main

# On your server:
ssh your-server
cd /var/www/mytodoo/mytodo-backend
git pull origin main
pm2 restart mytodo-backend
```

---

## 🔍 What to Look For

On line 173 of `/var/www/mytodoo/mytodo-backend/servicesN/tasks/tasks.services.js`:

**BAD (Current):**

```javascript
const getMyTasksWithOffers = async (userId, options = {}) => {
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }
  npm;  // ❌ THIS LINE - DELETE IT!

  const { section, subsection, subSection, status, role } = options;
```

**GOOD (After Fix):**

```javascript
const getMyTasksWithOffers = async (userId, options = {}) => {
  if (!isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }

  const { section, subsection, subSection, status, role } = options;
```

---

## ✅ Verify Fix

After applying the fix, test the endpoint:

```bash
# Check server logs
pm2 logs mytodo-backend --lines 50

# Test the API
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.com/api/tasks/my-tasks
```

You should no longer see the "npm is not defined" error.

---

## 📝 Prevention

- Always test locally before deploying
- Use a proper deployment pipeline
- Enable git hooks to prevent typos
- Use ESLint to catch undefined variables

---

## Need Help?

If the error persists after fixing:

1. Make sure you restarted the server: `pm2 restart mytodo-backend`
2. Check you edited the correct file: `ls -la /var/www/mytodoo/mytodo-backend/servicesN/tasks/tasks.services.js`
3. Verify line 173: `sed -n '170,176p' /var/www/mytodoo/mytodo-backend/servicesN/tasks/tasks.services.js`
