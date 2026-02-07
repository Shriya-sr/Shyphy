import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, UserRole, Announcement, SecurityAlert, SystemState } from '@/types/auth';
import { toast } from 'sonner';

// API configuration - update this to match your backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  systemState: SystemState;
  login: (username: string, password: string, isEmergency?: boolean) => { success: boolean; message: string };
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('shiphy_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('shiphy_auth_token');
  });

  const [systemState, setSystemState] = useState<SystemState>(() => {
    const saved = localStorage.getItem('shiphy_system_state');
    return saved ? JSON.parse(saved) : {
      emergencyMode: false,
      fteLoginAvailable: false,
      blockedUsers: [],
      securityLevel: 'normal',
      announcements: [],
      securityAlerts: [],
    };
  });

  const [currentOtp, setCurrentOtp] = useState<string>('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [maxOtpAttempts, setMaxOtpAttempts] = useState(3);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [hrVerified, setHrVerified] = useState(false);

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

  useEffect(() => {
    localStorage.setItem('shiphy_current_user', JSON.stringify(currentUser));
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
      
      setAuthToken(token);
      setCurrentUser(user);

      // HR requires 2FA (this can be extended based on backend response)
      if (user.role === 'hr') {
        generateNewOtp();
        return { success: true, message: '2FA_REQUIRED' };
      }

      return { success: true, message: 'Login successful' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Connection error. Please try again.' };
    }
  }, [generateNewOtp]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setAuthToken(null);
    setHrVerified(false);
  }, []);

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
        login,
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
