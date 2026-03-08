import { 
  Users, Shield, Terminal, Settings, Lock, 
  AlertTriangle, Server, Activity, Key
} from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { currentUser, users, systemState, unlockFinalCtf } = useAuth();
  const [overrideCode, setOverrideCode] = useState('');

  if (!currentUser) return null;

  const activeUsers = users.filter(u => !u.isBlocked).length;
  const blockedUsers = users.filter(u => u.isBlocked).length;

  const submitOverride = () => {
    const result = unlockFinalCtf(overrideCode);
    if (result.success) {
      toast.success(result.message);
      return;
    }
    toast.error(result.message);
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Admin Control Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome, {currentUser.fullName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={systemState.emergencyMode ? 'destructive' : 'outline'} 
              className="gap-1"
            >
              <Lock className="h-3 w-3" />
              {systemState.emergencyMode ? 'Emergency Mode' : 'Normal Mode'}
            </Badge>
          </div>
        </div>

        {/* Security Alerts */}
        {systemState.securityAlerts.length > 0 && (
          <div className="alert-banner alert-danger">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {systemState.securityAlerts.length} Security Alert(s) Detected
              </span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-success">{activeUsers}</p>
                </div>
                <Activity className="h-8 w-8 text-success/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                  <p className="text-2xl font-bold text-destructive">{blockedUsers}</p>
                </div>
                <Lock className="h-8 w-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Security Level</p>
                  <p className="text-2xl font-bold capitalize">{systemState.securityLevel}</p>
                </div>
                <Shield className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage user accounts, roles, and permissions
              </p>
              <Button variant="outline" className="w-full">Access Users</Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure security policies and protocols
              </p>
              <Button variant="outline" className="w-full">Configure</Button>
            </CardContent>
          </Card>

          <Link to="/dashboard/admin/ssh">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-primary" />
                  SSH Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Secure shell access to production servers
                </p>
                <Button variant="outline" className="w-full">Open Terminal</Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { name: 'API Server', status: 'online' },
                { name: 'Database', status: 'online' },
                { name: 'Auth Service', status: 'online' },
                { name: 'Backup System', status: 'online' },
              ].map((service, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <div className={`status-indicator ${service.status === 'online' ? 'status-online' : 'status-offline'}`} />
                    <span className="text-xs capitalize text-muted-foreground">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-mono">{currentUser.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p>{currentUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="capitalize">{currentUser.role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Access Level</p>
                <p>Administrator</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Final CTF: Intern Override Console
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the override token to re-enable the frozen intern account.
              Token format hint: [ADMIN_MOTHER_4][ADMIN_DOB_DDMMYYYY]-ELEVATE
            </p>
            <div className="flex gap-2">
              <Input
                value={overrideCode}
                onChange={(e) => setOverrideCode(e.target.value)}
                placeholder="XXXXDDMMYYYY-ELEVATE"
              />
              <Button onClick={submitOverride}>Apply</Button>
            </div>

            {systemState.finalCtfUnlocked && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                <p className="text-sm font-medium">CTF Complete</p>
                <p className="font-mono text-sm mt-1">SHIPHY{'{intern_override_chain_complete}'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
