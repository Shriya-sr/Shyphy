import { useEffect } from 'react';
import { Shield, AlertTriangle, ArrowLeft, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function FteLoginPage() {
  const { currentUser, systemState } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!systemState.fteDecisionReady && !currentUser) {
      navigate('/login');
    }
  }, [systemState.fteDecisionReady, currentUser, navigate]);

  if (!systemState.fteDecisionReady) {
    return (
      <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-6">
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative w-full max-w-md">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>

          <div className="corporate-card border-primary/30">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="relative">
                  <Clock className="h-16 w-16 text-primary" />
                  <div className="absolute -inset-2 bg-primary/20 blur-xl" />
                </div>
              </div>

              <h1 className="font-display text-2xl font-bold mb-4">
                FTE Portal Not Available
              </h1>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mb-6">
                <p className="text-sm text-foreground leading-relaxed">
                  The FTE conversion portal opens only after your decision notification appears.
                  Please log in as an intern and wait for the decision popup.
                </p>
              </div>

              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            ShiPhy HR Portal
          </div>
        </div>
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-6">
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative w-full max-w-md">
          <Link 
            to="/dashboard/intern" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="corporate-card border-primary/30">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="relative">
                  <Clock className="h-16 w-16 text-primary" />
                  <div className="absolute -inset-2 bg-primary/20 blur-xl" />
                </div>
              </div>

              <h1 className="font-display text-2xl font-bold mb-4">
                Logout Required
              </h1>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mb-6">
                <p className="text-sm text-foreground leading-relaxed">
                  Please log out from your intern account and then open the FTE portal to view your decision.
                </p>
              </div>

              <Link to="/dashboard/intern">
                <Button variant="outline" className="w-full">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            ShiPhy HR Portal
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-grid flex items-center justify-center p-6">
      <div className="fixed inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative w-full max-w-md">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        <div className="corporate-card border-destructive/30">
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <AlertTriangle className="h-16 w-16 text-destructive" />
                <div className="absolute -inset-2 bg-destructive/20 blur-xl" />
              </div>
            </div>
            
            <h1 className="font-display text-2xl font-bold text-destructive mb-4">
              Access Denied
            </h1>
            
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 mb-6">
              <p className="text-sm text-foreground leading-relaxed">
                We're sorry to inform you that you've been <strong>rejected</strong> by the CEO 
                as per criteria of qualification and advice of the Vice CEO.
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Decision made by:</strong> Administration
              </p>
              <p>
                <strong>Reference:</strong> FTE-2025-REJ-{Math.floor(Math.random() * 9000) + 1000}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-4">
                If you believe this is an error, please contact HR department.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4" />
          ShiPhy HR Portal
        </div>
      </div>
    </div>
  );
}
