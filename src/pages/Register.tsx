import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pin_code: '',
    contact_phone: '',
    contact_email: '',
    gst_no: '',
    pan_no: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Registration Successful",
          description: "Company has been registered.",
        });
        navigate("/login");
      } else {
        const errorData = await response.json();
        toast({
          title: "Registration Failed",
          description: JSON.stringify(errorData),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md px-4">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Company Registration</CardTitle>
            <CardDescription className="text-center">
              Fill in all details to register your company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: 'gst_no', label: 'GST Number' },
                { name: 'name', label: 'Company Name' },
                { name: 'contact_person', label: 'Contact Person' },
                { name: 'address', label: 'Address' },
                { name: 'city', label: 'City' },
                { name: 'state', label: 'State' },
                { name: 'country', label: 'Country' },
                { name: 'pin_code', label: 'PIN Code' },
                { name: 'contact_phone', label: 'Phone' },
                { name: 'contact_email', label: 'Email', type: 'email' },
                { name: 'pan_no', label: 'PAN Number' }
              ].map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type || 'text'}
                    placeholder={field.label}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    required
                  />
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">
                Already registered? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
