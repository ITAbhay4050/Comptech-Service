
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Dealer, User, UserRole, UserStatus } from '@/types';

interface CreateDealerFormProps {
  onDealerCreated: (dealer: Dealer, adminUser: User) => void;
  onCancel: () => void;
  companies: Array<{ id: string; name: string }>;
}

const CreateDealerForm = ({ onDealerCreated, onCancel, companies }: CreateDealerFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    gstNumber: '',
    companyId: user?.companyId || '',
    adminUsername: '',
    adminPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.adminPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.address || !formData.contactPerson || !formData.contactEmail || 
        !formData.contactPhone || !formData.gstNumber || !formData.companyId || 
        !formData.adminUsername || !formData.adminPassword) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const newDealer: Dealer = {
      id: Date.now().toString(),
      name: formData.name,
      address: formData.address,
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      gstNumber: formData.gstNumber,
      companyId: formData.companyId,
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString(),
    };

    const adminUser: User = {
      id: (Date.now() + 1).toString(),
      name: formData.contactPerson,
      email: formData.contactEmail,
      phone: formData.contactPhone,
      username: formData.adminUsername,
      role: UserRole.DEALER_ADMIN,
      status: UserStatus.ACTIVE,
      companyId: formData.companyId,
      dealerId: newDealer.id,
      createdAt: new Date().toISOString(),
    };

    onDealerCreated(newDealer, adminUser);
    toast({
      title: "Success",
      description: "Dealer and admin user created successfully",
    });
  };

  const getFilteredCompanies = () => {
    if (user?.role === UserRole.COMPANY_ADMIN && user?.companyId) {
      return companies.filter(company => company.id === user.companyId);
    }
    return companies;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Dealer Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="gstNumber">GST Number *</Label>
          <Input
            id="gstNumber"
            value={formData.gstNumber}
            onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPerson">Contact Person Name *</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="contactPhone">Phone Number *</Label>
          <Input
            id="contactPhone"
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="contactEmail">Email ID *</Label>
        <Input
          id="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
          required
        />
      </div>

      {user?.role === UserRole.APPLICATION_ADMIN ? (
        <div>
          <Label htmlFor="companyId">Company *</Label>
          <Select value={formData.companyId} onValueChange={(value) => setFormData({...formData, companyId: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div>
          <Label>Company</Label>
          <div className="text-sm text-muted-foreground">
            {getFilteredCompanies().find(c => c.id === formData.companyId)?.name || 'No company selected'}
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <h3 className="font-medium mb-3">Dealer Admin Login Credentials</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="adminUsername">Username *</Label>
            <Input
              id="adminUsername"
              value={formData.adminUsername}
              onChange={(e) => setFormData({...formData, adminUsername: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adminPassword">Password *</Label>
              <Input
                id="adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Create Dealer</Button>
      </div>
    </form>
  );
};

export default CreateDealerForm;
