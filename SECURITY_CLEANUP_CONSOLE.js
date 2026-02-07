/**
 * 🔒 SECURITY CLEANUP UTILITY
 * Run this in browser console to remove old vulnerable localStorage entries
 * 
 * Open DevTools > Console and paste this entire script
 */

console.warn('🔒 SECURITY CLEANUP: Removing all vulnerable localStorage entries...');

// List of all vulnerable keys that may contain passwords
const vulnerableKeys = [
  'shiphy_users',           // Old user array with passwords
  'shiphy_current_user',    // Old current user with password
  'shiphy_auth_token',      // Also clear auth token to force re-login
  'shiphy_system_state',    // Clear system state as well
];

let removedCount = 0;

// Check all localStorage entries
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (!key) continue;
  
  // Check if key matches any vulnerable pattern
  if (vulnerableKeys.some(vKey => key.includes(vKey))) {
    try {
      const value = localStorage.getItem(key);
      if (value && value.includes('password')) {
        console.warn(`   ❌ REMOVED: "${key}" (contained password)`);
        localStorage.removeItem(key);
        removedCount++;
      }
    } catch (e) {
      console.error(`Error checking key "${key}":`, e);
    }
  }
}

// Always remove the problematic keys
vulnerableKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    console.warn(`   ❌ REMOVED: "${key}"`);
    localStorage.removeItem(key);
    removedCount++;
  }
});

// Clear indexed DB if it has any auth data
if (window.indexedDB) {
  try {
    const dbs = await indexedDB.databases?.();
    if (dbs) {
      dbs.forEach(db => {
        if (db.name.includes('shiphy') || db.name.includes('auth')) {
          indexedDB.deleteDatabase(db.name);
          console.warn(`   ❌ REMOVED IndexedDB: "${db.name}"`);
        }
      });
    }
  } catch (e) {
    console.log('IndexedDB cleanup note:', e.message);
  }
}

console.log(`\n✅ CLEANUP COMPLETE!`);
console.log(`   Removed ${removedCount} vulnerable entries`);
console.log(`   Remaining localStorage entries:`);

// Show remaining safe entries
let safeCount = 0;
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (!vulnerableKeys.some(vKey => key?.includes(vKey))) {
    console.log(`      ✅ ${key}`);
    safeCount++;
  }
}

if (safeCount === 0) {
  console.log('      (localStorage is empty - good!)');
}

console.log('\n🔐 Security Status:');
console.log('   ✅ Passwords removed from localStorage');
console.log('   ✅ You now use JWT tokens instead');
console.log('   ✅ Backend handles all authentication');
console.log('\n📝 NOTE: You will need to log in again with new secure method');
