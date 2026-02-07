import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { verifySafeStorage, clearAuthTokens } from '@/lib/securityCleanup';

/**
 * 🔒 Security Cleanup Component
 * 
 * Displays alert if vulnerable localStorage data is detected
 * Provides one-click cleanup option
 */
export function SecurityCleanupAlert() {
  const [isVulnerable, setIsVulnerable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check for vulnerable data using comprehensive scan
    const vulnerableKeys = [
      'shiphy_users',
      'shiphy_current_user',
      'users',
      'currentUser',
      'user',
      'password',
      'passwords',
      'credentials',
      'auth',
    ];

    let foundVulnerable = false;

    // First check: look for vulnerable keys
    for (const key of vulnerableKeys) {
      const localValue = localStorage.getItem(key);
      const sessionValue = sessionStorage.getItem(key);

      if (localValue) {
        console.warn(`🔒 SECURITY ALERT: Found vulnerable key in localStorage: ${key}`);
        foundVulnerable = true;
        break;
      }
      
      if (sessionValue) {
        console.warn(`🔒 SECURITY ALERT: Found vulnerable key in sessionStorage: ${key}`);
        foundVulnerable = true;
        break;
      }
    }

    // Second check: scan for password objects
    if (!foundVulnerable) {
      const allKeys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
      
      for (const key of allKeys) {
        try {
          const value = localStorage.getItem(key) || sessionStorage.getItem(key);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              if (typeof parsed === 'object' && parsed !== null) {
                const hasPasswordField = Object.keys(parsed).some(k =>
                  ['password', 'passwordHash', 'emergencyPassword', 'pwd', 'passwd']
                    .includes(k.toLowerCase())
                );
                if (hasPasswordField) {
                  console.warn(`🔒 SECURITY ALERT: Found password object in storage key: ${key}`);
                  foundVulnerable = true;
                  break;
                }
              }
            } catch {
              // Not JSON, skip
            }
          }
        } catch {
          // Skip
        }
      }
    }

    setIsVulnerable(foundVulnerable);

    // Check if user has already been warned this session
    const hasBeenWarned = sessionStorage.getItem('security_cleanup_warned');
    if (hasBeenWarned === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const performCleanup = () => {
    const vulnerableKeys = [
      'shiphy_users',
      'shiphy_current_user',
      'users',
      'currentUser',
      'user',
      'password',
      'passwords',
      'credentials',
      'auth',
    ];

    let removedCount = 0;
    
    // Remove vulnerable keys
    vulnerableKeys.forEach(key => {
      const localItem = localStorage.getItem(key);
      const sessionItem = sessionStorage.getItem(key);
      
      if (localItem) {
        localStorage.removeItem(key);
        console.log(`🔓 Removed from localStorage: ${key}`);
        removedCount++;
      }
      if (sessionItem) {
        sessionStorage.removeItem(key);
        console.log(`🔓 Removed from sessionStorage: ${key}`);
        removedCount++;
      }
    });
    
    // Also scan for objects containing password fields
    const allKeys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
    for (const key of allKeys) {
      try {
        const localValue = localStorage.getItem(key);
        if (localValue) {
          try {
            const parsed = JSON.parse(localValue);
            if (typeof parsed === 'object' && parsed !== null) {
              const hasPasswordField = Object.keys(parsed).some(k =>
                ['password', 'passwordHash', 'emergencyPassword', 'pwd', 'passwd']
                  .includes(k.toLowerCase())
              );
              if (hasPasswordField) {
                localStorage.removeItem(key);
                console.log(`🔓 Removed object with password from localStorage: ${key}`);
                removedCount++;
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

    console.log(`✅ Cleaned up ${removedCount} vulnerable storage entries`);
    setIsVulnerable(!verifySafeStorage());
    sessionStorage.setItem('security_cleanup_warned', 'true');

    // Refresh page to clean state
    if (!isVulnerable) {
      window.location.reload();
    }
  };

  if (!isVulnerable || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert variant="destructive" className="bg-red-50 border-red-300">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>🔒 Security Alert: Old Vulnerable Data Detected</AlertTitle>
        <AlertDescription className="mt-2 text-sm">
          <p className="mb-3">
            We detected old password data in your browser's localStorage. This is no longer used
            - we now use secure JWT tokens instead.
          </p>
          <p className="mb-4 font-semibold">
            Please clean up this data immediately:
          </p>
          <div className="grid gap-2">
            <Button
              onClick={performCleanup}
              className="bg-red-600 hover:bg-red-700"
              size="sm"
            >
              ✅ Clean Up Now
            </Button>
            <Button
              onClick={() => {
                setIsDismissed(true);
                sessionStorage.setItem('security_cleanup_warned', 'true');
              }}
              variant="outline"
              size="sm"
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
