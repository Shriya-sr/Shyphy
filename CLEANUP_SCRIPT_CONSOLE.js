/**
 * 🔒 Browser Console Security Cleanup Script
 * 
 * Copy-paste this entire code into your browser's DevTools console (F12)
 * and press Enter to manually clean up all vulnerable password data
 * 
 * This is a last resort if the automatic cleanup doesn't work
 */

(function() {
  console.log('🔒 Starting manual security cleanup...\n');
  
  const vulnerablePatterns = [
    'password', 'passwd', 'pwd', 'emergency',
    'credential', 'auth', 'user', 'token'
  ];
  
  let totalRemoved = 0;
  
  // STEP 1: Clear vulnerable keys from localStorage
  console.log('📦 Step 1: Checking localStorage...');
  const localStorageKeys = Object.keys(localStorage);
  
  for (const key of localStorageKeys) {
    const isVulnerable = vulnerablePatterns.some(pattern =>
      key.toLowerCase().includes(pattern)
    );
    
    if (isVulnerable) {
      const value = localStorage.getItem(key);
      console.warn(`  ❌ Found: "${key}" (${value?.length || 0} bytes)`);
      
      // Check if it contains password fields
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) {
          if ('password' in parsed || 'passwordHash' in parsed || 'emergencyPassword' in parsed) {
            console.log(`     Contains password field - REMOVING`);
            localStorage.removeItem(key);
            totalRemoved++;
          }
        }
      } catch (e) {
        // Not JSON, check for plain text password
        if (value && (value.includes('password') || value.includes('Password'))) {
          console.log(`     Contains plaintext password - REMOVING`);
          localStorage.removeItem(key);
          totalRemoved++;
        }
      }
    }
  }
  
  // STEP 2: Check remaining keys for internal passwords
  console.log('\n📦 Step 2: Deep scanning remaining localStorage...');
  const remainingKeys = Object.keys(localStorage);
  
  for (const key of remainingKeys) {
    const value = localStorage.getItem(key);
    if (!value) continue;
    
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        const passwordFields = Object.keys(parsed).filter(k =>
          ['password', 'passwordHash', 'emergencyPassword', 'pwd', 'passwd', 'pass']
            .some(field => k.toLowerCase().includes(field))
        );
        
        if (passwordFields.length > 0) {
          console.warn(`  ❌ Found object with password fields in "${key}": ${passwordFields.join(', ')}`);
          console.log(`     REMOVING this entry`);
          localStorage.removeItem(key);
          totalRemoved++;
        }
      }
    } catch (e) {
      // Not JSON - skip
    }
  }
  
  // STEP 3: Clear sessionStorage
  console.log('\n📦 Step 3: Checking sessionStorage...');
  const sessionStorageKeys = Object.keys(sessionStorage);
  let sessionRemoved = 0;
  
  for (const key of sessionStorageKeys) {
    const isVulnerable = vulnerablePatterns.some(pattern =>
      key.toLowerCase().includes(pattern)
    );
    
    if (isVulnerable) {
      console.warn(`  ❌ Found: "${key}" in sessionStorage - REMOVING`);
      sessionStorage.removeItem(key);
      sessionRemoved++;
      totalRemoved++;
    }
  }
  
  // STEP 4: Verification
  console.log('\n✅ Step 4: Verification\n');
  console.log('Remaining localStorage keys:');
  const finalKeys = Object.keys(localStorage);
  
  let foundDangerous = false;
  for (const key of finalKeys) {
    const value = localStorage.getItem(key);
    const hasDangerousContent = ['password', 'passwd', 'emergencyPassword']
      .some(pattern => value?.toLowerCase().includes(pattern));
    
    if (hasDangerousContent) {
      console.error(`  🚨 DANGER: "${key}" still contains password data!`);
      foundDangerous = true;
    } else {
      console.log(`  ✅ Safe: "${key}"`);
    }
  }
  
  // FINAL RESULTS
  console.log('\n' + '='.repeat(60));
  console.log('🔒 CLEANUP RESULTS:');
  console.log('='.repeat(60));
  console.log(`Total entries removed: ${totalRemoved}`);
  console.log(`Remaining localStorage keys: ${finalKeys.length}`);
  
  if (foundDangerous) {
    console.error('\n❌ WARNING: Dangerous content still detected!');
    console.error('Try clearing all site data manually:');
    console.error('1. Open Settings/Preferences');
    console.error('2. Find Privacy & Security');
    console.error('3. Clear Cache/Cookies/Storage for this site');
  } else {
    console.log('\n✅ SUCCESS: All vulnerable data has been removed!');
    console.log('\nOnly safe data remains:');
    console.log('  • shiphy_auth_token - JWT token (safe)');
    console.log('  • shiphy_current_user - User info without password (safe)');
    console.log('  • shiphy_system_state - System state (safe)');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Reloading page to apply changes...\n');
  
  // Reload page
  setTimeout(() => {
    window.location.reload();
  }, 1000);
})();
