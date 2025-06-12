
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: "Success",
          description: "You have successfully logged in",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to pre-fill credentials for demo
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
                Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
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
