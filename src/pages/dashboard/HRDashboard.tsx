import { Users, FileText, Search, Download, Eye, UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function HRDashboard() {
  const { currentUser, authToken } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch HR records from backend
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const token = authToken || localStorage.getItem('shiphy_auth_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/hr/records`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        setEmployees(data.records || []);
      } catch (e) {
        console.error('Failed to fetch HR records:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [authToken]);

  const user = currentUser || JSON.parse(localStorage.getItem('shiphy_current_user') || '{}');
  const hrVerified = localStorage.getItem('shiphy_hr_verified') === 'true';

  if (!user || !hrVerified) {
    return null;
  }


  return (
    <DashboardLayout requiredRole="hr">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">HR Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Employee Management System
            </p>
          </div>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{employees.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interns</p>
                  <p className="text-2xl font-bold">{employees.filter(u => u.role === 'intern').length}</p>
                </div>
                <UserCog className="h-8 w-8 text-blue-400/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Records Visible</p>
                  <p className="text-2xl font-bold">{loading ? '...' : employees.length}</p>
                </div>
                <div className="status-indicator status-online h-4 w-4" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-2xl font-bold">{loading ? 'Loading...' : 'Ready'}</p>
                </div>
                <div className="status-indicator status-online h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employees..." className="pl-10" />
          </div>
        </div>

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Employee Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Mother's Name</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      Loading employee records...
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No employee records found
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp: any) => (
                    <TableRow key={emp.username}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{emp.fullName}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{emp.employeeId}</TableCell>
                      <TableCell className="text-sm">{emp.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {emp.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{emp.department || 'N/A'}</TableCell>
                      <TableCell className="text-sm font-medium text-primary">{emp.motherName || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{emp.dob || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="status-indicator status-online" />
                          Active
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Admin Details - Important for CTF */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Administration Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <p className="font-medium">System Administrator</p>
                <p className="text-sm text-muted-foreground mt-1">Abhishek Shemadi</p>
                <p className="text-xs text-muted-foreground">admin_abhishek@shiphy.com</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {/* Hidden clue for CTF */}
                  {/* Mother's name: SHEETAL, DOB: 22/03/1985 */}
                  {/* Check Instagram @abhishek_shemadi_art for more info */}
                  Employee since 2019
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <p className="font-medium">CEO</p>
                <p className="text-sm text-muted-foreground mt-1">Prakash Deshmukh</p>
                <p className="text-xs text-muted-foreground">ceo@shiphy.com</p>
                <p className="text-xs text-muted-foreground mt-2">Executive Office</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 
          ================================================
          HR CONFIDENTIAL RECORDS - DO NOT SHARE
          ================================================
          
          Admin Profile - Abhishek Shemadi:
          - Full Name: Abhishek Shemadi
          - Mother's Maiden Name: SHEETAL
          - Date of Birth: March 22, 1985 (22/03/1985)
          - Emergency Password Pattern: [First 4 chars of mother's name][DDMMYYYY]
          - Instagram (personal hobby): @abhishek_shemadi_art
          
          Note: For painting references, check his Instagram - 
          he posts about his mother's influence on his art
          
          ================================================
        */}
      </div>
    </DashboardLayout>
  );
}
