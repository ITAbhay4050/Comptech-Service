import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Login Successful",
          description: `Logged in as ${data.user_type}`,
        });

        // Redirect based on user_type
        if (data.user_type === 'dealer') {
          navigate('/dealer/dashboard');
        } else if (data.user_type === 'company') {
          navigate('/company/dashboard');
        } else {
          navigate('/dashboard'); // fallback
        }

      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Server error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (role: string) => {
    switch (role) {
      case 'admin':
        setEmail('admin@system.com');
        setPassword('password');
        break;
      case 'company_admin':
        setEmail('admin@company.com');
        setPassword('password');
        break;
      case 'company_employee':
        setEmail('employee@company.com');
        setPassword('password');
        break;
      case 'dealer_admin':
        setEmail('admin@dealer.com');
        setPassword('password');
        break;
      case 'dealer_employee':
        setEmail('employee@dealer.com');
        setPassword('password');
        break;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md px-4">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">RBAC Machine Management</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4">
              <p className="text-center text-sm text-muted-foreground mb-2">
                Don't have an account? <Link to="/dealerregister" className="text-blue-600 hover:underline">Register</Link>
              </p>
              <p className="text-center text-sm text-muted-foreground mb-2">
                Create Company? <Link to="/register" className="text-blue-600 hover:underline">Create Company</Link>
              </p>

              <div className="border-t pt-4 mt-4">
                <p className="text-center text-sm text-muted-foreground mb-2">
                  Demo Accounts (Click to fill):
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => fillCredentials('admin')} type="button">
                    System Admin
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fillCredentials('company_admin')} type="button">
                    Company Admin
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fillCredentials('company_employee')} type="button">
                    Company Employee
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fillCredentials('dealer_admin')} type="button">
                    Dealer Admin
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fillCredentials('dealer_employee')} type="button">
                    Dealer Employee
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
