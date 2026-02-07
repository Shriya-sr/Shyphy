/**
 * Security Cleanup Utility
 * 
 * This runs IMMEDIATELY on app startup to clear any old vulnerable data
 * that may have been stored with plaintext passwords from earlier versions
 * 
 * IMPORTANT: This must be imported and called in main.tsx BEFORE rendering
 */

export function cleanupVulnerableData() {
  console.log('🔒 Running security cleanup...');
  
  const vulnerableKeys = [
    'shiphy_users',           // Old user list with passwords
    'shiphy_current_user',    // May contain plaintext password
    'users',                  // Generic users key
    'currentUser',            // Generic current user key
    'user',                   // Generic user key
    'password',               // Direct password storage
    'passwords',              // Multiple passwords
    'credentials',            // Credentials
    'auth',                   // Auth data (may contain password)
    'shiphy_auth',            // Auth data variant
  ];
  
  let cleanedCount = 0;
  const allKeys = Object.keys(localStorage);
  
  // First pass: remove keys that match vulnerable patterns
  for (const key of allKeys) {
    if (vulnerableKeys.some(vKey => key.toLowerCase().includes(vKey.toLowerCase()))) {
      const value = localStorage.getItem(key);
      console.warn(`🔒 SECURITY: Removing vulnerable key from localStorage: "${key}"`);
      if (value && value.length > 0) {
        console.warn(`   🔓 WARNING: This key contained ${value.length} bytes of data`);
      }
      localStorage.removeItem(key);
      cleanedCount++;
    }
  }
  
  // Second pass: check remaining keys for plaintext password objects
  const remainingKeys = Object.keys(localStorage);
  for (const key of remainingKeys) {
    try {
      const value = localStorage.getItem(key);
      if (!value) continue;
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(value);
        
        if (typeof parsed === 'object' && parsed !== null) {
          // Check for password fields in objects
          const hasPasswordField = Object.keys(parsed).some(objKey =>
            ['password', 'passwordHash', 'emergencyPassword', 'pwd', 'passwd', 'pass']
              .includes(objKey.toLowerCase())
          );
          
          if (hasPasswordField) {
            console.warn(`🔒 SECURITY: Found object with password field in localStorage key: "${key}"`);
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch {
        // Not JSON, skip
      }
    } catch (error) {
      console.error('Error during security cleanup:', error);
    }
  }
  
  // Check sessionStorage too
  const sessionKeys = Object.keys(sessionStorage);
  for (const key of sessionKeys) {
    if (vulnerableKeys.some(vKey => key.toLowerCase().includes(vKey.toLowerCase()))) {
      console.warn(`🔒 SECURITY: Removing vulnerable key from sessionStorage: "${key}"`);
      sessionStorage.removeItem(key);
      cleanedCount++;
    }
  }
  
  console.log(`🔒 Security cleanup complete. Removed ${cleanedCount} vulnerable storage entries.`);
  
  // Verification: Check if any password-like data remains
  const allStorageKeys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
  let suspiciousCount = 0;
  
  for (const key of allStorageKeys) {
    if (key.toLowerCase().includes('password') || 
        key.toLowerCase().includes('credential') ||
        key.toLowerCase().includes('auth') ||
        key.toLowerCase().includes('user')) {
      suspiciousCount++;
      console.log(`ℹ️  Storage key: "${key}" (review to ensure it doesn't contain passwords)`);
    }
  }
  
  if (suspiciousCount > 0) {
    console.log(`ℹ️  Found ${suspiciousCount} storage keys with potentially sensitive names - ensure they only contain tokens, not passwords`);
  }
}

/**
 * Clear all authentication tokens (safe to remove)
 * Only tokens should be in storage after cleanup, never passwords
 */
export function clearAuthTokens() {
  const tokenKeys = [
    'shiphy_auth_token',
    'auth_token',
    'token',
    'jwt',
    'access_token',
    'refresh_token',
  ];
  
  for (const key of tokenKeys) {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`🔓 Cleared auth token: ${key}`);
    }
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
    }
  }
}

/**
 * Verify that only safe data is in storage
 * (Tokens are safe, passwords are NOT)
 */
export function verifySafeStorage(): boolean {
  const dangerousPatterns = ['password', 'passwd', 'pwd', 'emergency'];
  let foundDangerous = false;
  
  const allKeys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
  
  for (const key of allKeys) {
    for (const pattern of dangerousPatterns) {
      if (key.toLowerCase().includes(pattern)) {
        try {
          const value = localStorage.getItem(key) || sessionStorage.getItem(key);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              if (typeof parsed === 'object' && parsed !== null) {
                for (const objKey of Object.keys(parsed)) {
                  if (dangerousPatterns.some(p => objKey.toLowerCase().includes(p))) {
                    console.error(`❌ SECURITY VIOLATION: Found password in storage at key "${key}".${objKey}`);
                    foundDangerous = true;
                  }
                }
              }
            } catch {
              // Not JSON
            }
          }
        } catch {
          // Skip
        }
      }
    }
  }
  
  return !foundDangerous;
}
