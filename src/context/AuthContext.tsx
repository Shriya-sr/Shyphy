import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { User, UserRole, Announcement, SecurityAlert, SystemState } from '@/types/auth';
import { toast } from 'sonner';

// API configuration - update this to match your backend URL
const API_URL = import.meta.env.VITE_API_URL || '';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  systemState: SystemState;
  login: (username: string, password: string, isEmergency?: boolean) => Promise<{ success: boolean; message: string; user?: User }>;
  nosqlLogin: (username: string, password?: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  blockUser: (username: string) => void;
  unblockUser: (username: string) => void;
  kickAllUsers: () => void;
  triggerEmergencyMode: () => void;
  disableEmergencyMode: () => void;
  enableFteLogin: () => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'timestamp'>) => void;
  addSecurityAlert: (alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => void;
  clearSecurityAlerts: () => void;
  updateSecurityLevel: (level: 'normal' | 'elevated' | 'lockdown') => void;
  verifyOtp: (otp: string) => boolean;
  currentOtp: string;
  otpAttempts: number;
  maxOtpAttempts: number;
  setMaxOtpAttempts: (attempts: number) => void;
  otpCooldown: number;
  generateNewOtp: () => void;
  hrVerified: boolean;
  setHrVerified: (verified: boolean) => void;
  authToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: Remove password field from user object
function stripPasswordFromUser(user: any): User {
  const { password, passwordHash, emergencyPassword, ...safeUser } = user;
  return safeUser as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // SECURITY: On mount, clear all old vulnerable localStorage entries
  useEffect(() => {
    // List of vulnerable storage keys that may contain passwords
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
    ];
    
    // Clear any localStorage entry matching vulnerable patterns
    const keysToClean = Object.keys(localStorage).filter(key => {
      // Check if key matches vulnerable patterns
      return vulnerableKeys.some(vKey => 
        key.toLowerCase().includes(vKey.toLowerCase())
      );
    });
    
    // Also check localStorage values for plaintext passwords
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (!value) return;
        
        // Try to parse as JSON and check for password fields
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed === 'object' && parsed !== null) {
            // If object contains plaintext password/credentials, flag for cleanup
            if ('password' in parsed || 'passwordHash' in parsed || 'emergencyPassword' in parsed) {
              keysToClean.push(key);
            }
          }
        } catch {
          // Not JSON, skip
        }
      } catch {
        // Skip on error
      }
    });
    
    // Remove duplicates and clean
    const uniqueKeysToClean = [...new Set(keysToClean)];
    uniqueKeysToClean.forEach(key => {
      console.warn(`🔒 SECURITY: Clearing vulnerable localStorage key: ${key}`);
      localStorage.removeItem(key);
    });
    
    if (uniqueKeysToClean.length > 0) {
      console.log(`🔒 SECURITY: Cleared ${uniqueKeysToClean.length} vulnerable localStorage entries`);
    }
  }, []);

  const [users, setUsers] = useState<User[]>([]);
  const internSessionStartRef = useRef<number | null>(null);
  const internFteTimerRef = useRef<number | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('shiphy_current_user');
    if (!saved) return null;
    
    try {
      const parsed = JSON.parse(saved);
      // SECURITY: Never trust user data from localStorage - remove password if somehow present
      return stripPasswordFromUser(parsed);
    } catch {
      localStorage.removeItem('shiphy_current_user');
      return null;
    }
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    const token = localStorage.getItem('shiphy_auth_token');
    // SECURITY: Only store token, not passwords
    return token;
  });

  const [systemState, setSystemState] = useState<SystemState>(() => {
    const defaults: SystemState = {
      emergencyMode: false,
      fteLoginAvailable: false,
      fteDecisionReady: false,
      blockedUsers: [],
      securityLevel: 'normal',
      announcements: [],
      securityAlerts: [],
    };

    const saved = localStorage.getItem('shiphy_system_state');
    if (!saved) return defaults;

    try {
      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
        announcements: Array.isArray(parsed?.announcements) ? parsed.announcements : [],
        securityAlerts: Array.isArray(parsed?.securityAlerts) ? parsed.securityAlerts : [],
      };
    } catch {
      return defaults;
    }
  });

  const [currentOtp, setCurrentOtp] = useState<string>('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [maxOtpAttempts, setMaxOtpAttempts] = useState(3);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [hrVerified, setHrVerified] = useState(false);

  const clearInternFteTimer = useCallback(() => {
    if (internFteTimerRef.current !== null) {
      window.clearTimeout(internFteTimerRef.current);
      internFteTimerRef.current = null;
    }
  }, []);

  const scheduleInternFteDecision = useCallback(() => {
    clearInternFteTimer();
    internFteTimerRef.current = window.setTimeout(() => {
      setSystemState(prev => {
        const alreadyDecision = prev.announcements.some(a => a.type === 'fte_decision');
        const nextAnnouncements = alreadyDecision
          ? prev.announcements
          : [
              {
                id: `ann_${Date.now()}`,
                title: 'Your FTE Decision Is Ready',
                message: 'Logout and check the FTE portal to see if you have been hired for full-time employment.',
                type: 'fte_decision',
                timestamp: new Date(),
              },
              ...prev.announcements,
            ];
        return {
          ...prev,
          fteLoginAvailable: true,
          fteDecisionReady: true,
          announcements: nextAnnouncements,
        };
      });
    }, 60 * 1000);
  }, [clearInternFteTimer]);

  // Generate OTP
  const generateNewOtp = useCallback(() => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOtp(otp);
    setOtpAttempts(0);
    console.log(`[SHIPHY 2FA] New OTP generated for verification`);
    // Intentionally log OTP in a hidden way for CTF
    console.log(`%c`, 'background: transparent; color: transparent;', `OTP: ${otp}`);
  }, []);

  // Verify OTP
  const verifyOtp = useCallback((otp: string): boolean => {
    if (otpCooldown > 0) {
      toast.error(`Please wait ${otpCooldown} seconds before trying again`);
      return false;
    }

    if (otpAttempts >= maxOtpAttempts) {
      toast.error('Maximum OTP attempts exceeded. Please wait 30 seconds.');
      setOtpCooldown(30);
      const interval = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setOtpAttempts(0);
            generateNewOtp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return false;
    }

    setOtpAttempts(prev => prev + 1);

    if (otp === currentOtp) {
      setHrVerified(true);
      return true;
    }

    toast.error(`Invalid OTP. ${maxOtpAttempts - otpAttempts - 1} attempts remaining.`);
    return false;
  }, [currentOtp, otpAttempts, maxOtpAttempts, otpCooldown, generateNewOtp]);

  // Persist tokens
  useEffect(() => {
    if (authToken) {
      localStorage.setItem('shiphy_auth_token', authToken);
    } else {
      localStorage.removeItem('shiphy_auth_token');
    }
  }, [authToken]);

  // Poll backend announcements and merge into system state (keeps CTF server-driven announcements)
  useEffect(() => {
    let cancelled = false;
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${API_URL}/api/announcements`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.announcements && Array.isArray(data.announcements)) {
          const shouldDelayFte =
            currentUser?.role === 'intern' &&
            internSessionStartRef.current !== null &&
            Date.now() - internSessionStartRef.current < 60 * 1000;

          setSystemState(prev => {
            const existingIds = new Set(prev.announcements.map(a => a.id));
            const hasLocalDecision = prev.announcements.some(a => a.type === 'fte_decision');
            const newOnes = data.announcements
              .filter((a: any) => !existingIds.has(a.id))
              .filter((a: any) => {
                if (a.type === 'fte' || a.type === 'fte_decision') {
                  if (shouldDelayFte || hasLocalDecision) return false;
                }
                return true;
              })
              .map((a: any) => ({
                ...a,
                message: a.message ?? a.body ?? '',
                timestamp: new Date(),
              }));
            if (newOnes.length === 0) return prev;
            const hasNewDecision = newOnes.some(a => a.type === 'fte_decision');
            return {
              ...prev,
              fteDecisionReady: hasNewDecision || prev.fteDecisionReady,
              fteLoginAvailable: hasNewDecision ? true : prev.fteLoginAvailable,
              announcements: [...newOnes, ...prev.announcements],
            };
          });
        }
      } catch (e) {
        // ignore
      }
    };

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser?.role]);

  useEffect(() => {
    // SECURITY: Only store user info WITHOUT password
    if (currentUser) {
      const safeUser = stripPasswordFromUser(currentUser);
      localStorage.setItem('shiphy_current_user', JSON.stringify(safeUser));
    } else {
      localStorage.removeItem('shiphy_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('shiphy_system_state', JSON.stringify(systemState));
  }, [systemState]);

  // Login via Backend API - passwords are only sent to backend, never stored in frontend
  const login = useCallback(async (username: string, password: string, isEmergency = false): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        addSecurityAlert({
          type: 'login_attempt',
          severity: 'low',
          message: `Failed login attempt for user: ${username}`,
          username,
          details: data.error || 'Invalid credentials',
        });
        return { success: false, message: data.error || 'Login failed' };
      }

      // Backend returns token and user info
      const { token, user } = data;

      // SECURITY: Store token for future requests, strip password from user
      setAuthToken(token);
      const safeUser = stripPasswordFromUser(user);
      setCurrentUser(safeUser);

      if (user.role === 'intern') {
        internSessionStartRef.current = Date.now();
        setSystemState(prev => ({
          ...prev,
          fteLoginAvailable: false,
          fteDecisionReady: false,
          announcements: prev.announcements.filter(a => a.type !== 'fte' && a.type !== 'fte_decision'),
        }));
        scheduleInternFteDecision();
      } else {
        internSessionStartRef.current = null;
        clearInternFteTimer();
      }

      // HR requires 2FA (this can be extended based on backend response)
      if (user.role === 'hr') {
        generateNewOtp();
        return { success: true, message: '2FA_REQUIRED', user: safeUser };
      }

      return { success: true, message: 'Login successful', user: safeUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Connection error. Please try again.' };
    }
  }, [clearInternFteTimer, generateNewOtp, scheduleInternFteDecision]);

  // NoSQL vulnerable login (CTF demo)
  const nosqlLogin = useCallback(async (username: string, password: string = ''): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login-nosql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        addSecurityAlert({
          type: 'login_attempt',
          severity: 'low',
          message: `Failed NoSQL login attempt: ${username}`,
          username,
          details: data.error || 'NoSQL login failed',
        });
        return { success: false, message: data.error || 'NoSQL login failed' };
      }

      const { token, user } = data;
      setAuthToken(token);
      const safeUser = stripPasswordFromUser(user);
      setCurrentUser(safeUser);
      return { success: true, message: data.note || 'NoSQL login successful', user: safeUser };
    } catch (e) {
      console.error('NoSQL login error', e);
      return { success: false, message: 'Connection error' };
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setAuthToken(null);
    setHrVerified(false);
    internSessionStartRef.current = null;
    clearInternFteTimer();
  }, [clearInternFteTimer]);

  const blockUser = useCallback((username: string) => {
    setSystemState(prev => ({
      ...prev,
      blockedUsers: [...prev.blockedUsers, username],
    }));
    setUsers(prev => prev.map(u => 
      u.username === username ? { ...u, isBlocked: true } : u
    ));
    addSecurityAlert({
      type: 'unauthorized_access',
      severity: 'medium',
      message: `User blocked by Blue Team: ${username}`,
      username,
    });
  }, []);

  const unblockUser = useCallback((username: string) => {
    setSystemState(prev => ({
      ...prev,
      blockedUsers: prev.blockedUsers.filter(u => u !== username),
    }));
    setUsers(prev => prev.map(u => 
      u.username === username ? { ...u, isBlocked: false } : u
    ));
  }, []);

  const kickAllUsers = useCallback(() => {
    setCurrentUser(null);
    setHrVerified(false);
    toast.error('SECURITY ALERT: All sessions terminated. Please login with emergency credentials.');
  }, []);

  const triggerEmergencyMode = useCallback(() => {
    setSystemState(prev => ({
      ...prev,
      emergencyMode: true,
      securityLevel: 'lockdown',
    }));
    kickAllUsers();
    addAnnouncement({
      title: 'EMERGENCY SECURITY LOCKDOWN',
      message: 'All employees must re-authenticate using emergency passwords provided during onboarding.',
      type: 'security',
    });
  }, [kickAllUsers]);

  const disableEmergencyMode = useCallback(() => {
    setSystemState(prev => ({
      ...prev,
      emergencyMode: false,
      securityLevel: 'normal',
    }));
  }, []);

  const enableFteLogin = useCallback(() => {
    setSystemState(prev => ({
      ...prev,
      fteLoginAvailable: true,
      fteDecisionReady: true,
    }));
    addAnnouncement({
      title: 'FTE Conversion Portal Now Open',
      message: 'Interns selected for Full-Time Employment can now access the FTE Login portal to complete their conversion process.',
      type: 'fte',
    });
  }, []);

  const addAnnouncement = useCallback((announcement: Omit<Announcement, 'id' | 'timestamp'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: `ann_${Date.now()}`,
      timestamp: new Date(),
    };
    setSystemState(prev => ({
      ...prev,
      announcements: [newAnnouncement, ...prev.announcements],
    }));
  }, []);

  const addSecurityAlert = useCallback((alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => {
    const newAlert: SecurityAlert = {
      ...alert,
      id: `alert_${Date.now()}`,
      timestamp: new Date(),
    };
    setSystemState(prev => ({
      ...prev,
      securityAlerts: [newAlert, ...prev.securityAlerts],
    }));
  }, []);

  const clearSecurityAlerts = useCallback(() => {
    setSystemState(prev => ({
      ...prev,
      securityAlerts: [],
    }));
  }, []);

  const updateSecurityLevel = useCallback((level: 'normal' | 'elevated' | 'lockdown') => {
    setSystemState(prev => ({
      ...prev,
      securityLevel: level,
    }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        systemState,
        authToken,
        login,
        nosqlLogin,
        logout,
        blockUser,
        unblockUser,
        kickAllUsers,
        triggerEmergencyMode,
        disableEmergencyMode,
        enableFteLogin,
        addAnnouncement,
        addSecurityAlert,
        clearSecurityAlerts,
        updateSecurityLevel,
        verifyOtp,
        currentOtp,
        otpAttempts,
        maxOtpAttempts,
        setMaxOtpAttempts,
        otpCooldown,
        generateNewOtp,
        hrVerified,
        setHrVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
