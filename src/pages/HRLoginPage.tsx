import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function HRLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const navigate = useNavigate();

  // Cooldown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // Log OTP vulnerability info to console (CTF hint)
  useEffect(() => {
    if (isOtpStep) {
      console.log('%c=== HR OTP SYSTEM DEBUG INFO ===', 'color: red; font-weight: bold; font-size: 14px');
      console.log('%cThe OTP is generated using: HMAC-SHA256(username + 30s_window, secret_key)', 'color: yellow');
      console.log('%cYou can inspect the OTP verification logic in the browser.', 'color: cyan');
      console.log('%cClient-side attempt counter can be modified via devtools!', 'color: orange; font-weight: bold');
      console.log('%cTry: window.otpAttempts = 0 to reset attempts', 'color: lime; font-weight: bold');
      console.groupCollapsed('📋 HR OTP Vulnerability Details');
      console.log('- OTP window: 30 seconds');
      console.log('- Max attempts (client-side): 3');
      console.log('- Server validates: username + time-window HMAC');
      console.log('- Weakness: Attempt counter is client-side only!');
      console.log('- Exploitation: Edit window.attempts in devtools to bypass limit');
      console.groupEnd();
    }
  }, [isOtpStep]);

  // Make attempts available globally for devtools bypass
  useEffect(() => {
    (window as any).otpAttempts = attempts;
  }, [attempts]);

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/hr/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Store token for OTP verification
      setAuthToken(data.token);
      setIsOtpStep(true);
      setAttempts(0);
      toast.info('OTP verification required');
    } catch (error) {
      toast.error('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vulnerability: Check client-side attempt counter (can be bypassed via devtools)
    if (attempts >= 3) {
      if (otpCooldown === 0) {
        setOtpCooldown(30);
        setAttempts(0);
        toast.info('Cooldown reset. Try again.');
      } else {
        toast.error(`Please wait ${otpCooldown} seconds`);
      }
      return;
    }

    setIsLoading(true);

    try {
      // Vulnerability: If client sends bypassOtp=true (via devtools console), server accepts it
      const bypassOtp = (window as any).bypassOtp || false;

      const res = await fetch(`${API_URL}/api/hr/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          otp,
          clientAttemptCount: attempts,
          bypassOtp, // Vulnerability: attacker can set this via devtools
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAttempts(attempts + 1);
        toast.error(data.error || 'Invalid OTP');
        setIsLoading(false);
        return;
      }

      // Success
      localStorage.setItem('shiphy_auth_token', data.token);
      localStorage.setItem('shiphy_current_user', JSON.stringify(data.user));
      localStorage.setItem('shiphy_hr_verified', 'true');
      toast.success('HR access granted');
      navigate('/dashboard/hr');
    } catch (error) {
      toast.error('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-6">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        <div className="corporate-card glow-border">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="relative">
                <Shield className="h-12 w-12 text-primary" />
                <div className="absolute -inset-2 bg-primary/20 blur-xl" />
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold">HR Portal Access</h1>
            <p className="text-sm text-muted-foreground mt-2">Employee Management System</p>
          </div>

          {!isOtpStep ? (
            <form onSubmit={handleInitialLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm">
                  HR Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. hr_team"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm">
                  <strong>Two-Factor Authentication</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check your authenticator app or email for the 6-digit OTP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm">
                  One-Time Password
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  placeholder="000000"
                  className="text-center font-mono text-2xl tracking-widest"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Attempts: {attempts}/3</p>
                {otpCooldown > 0 && <p className="text-destructive">Cooldown: {otpCooldown}s</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || otpCooldown > 0}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsOtpStep(false);
                  setOtp('');
                  setAttempts(0);
                  setOtpCooldown(0);
                }}
              >
                Back
              </Button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>HR Employee Access Portal</p>
          <p className="mt-1">
            {/* 
              CTF HINT FOR ATTACKER:
              - Open DevTools (F12)
              - Go to Console tab
              - Type: window.bypassOtp = true
              - Type: window.otpAttempts = 0
              - Submit the form with any OTP
              OR
              - Brute force the OTP by resetting attempts in console
              - The OTP is based on HMAC of username + 30s window
            */}
            <span className="opacity-50">Secured by ShiPhy 2FA v3.1</span>
          </p>
        </div>
      </div>
    </div>
  );
}
