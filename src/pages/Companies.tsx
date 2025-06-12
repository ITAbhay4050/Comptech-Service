
import { useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, Building2, Users, MapPin, Phone, Mail, UserPlus, CheckCircle, X } from 'lucide-react';
import { Company, UserRole } from '@/types';
import { toast } from '@/hooks/use-toast';

// Enhanced Company interface
interface EnhancedCompany extends Company {
  city: string;
  state: string;
  country: string;
  pinCode: string;
  gstNo: string;
  panNo: string;
}

// Mock data - in a real app this would come from an API
const mockCompanies: EnhancedCompany[] = [
  {
    id: '1',
    name: 'TechCorp Industries',
    address: '123 Business Ave',
    city: 'Tech City',
    state: 'TC',
    country: 'India',
    pinCode: '12345',
    contactPerson: 'John Smith',
    contactEmail: 'john.smith@techcorp.com',
    contactPhone: '+1 (555) 123-4567',
    gstNo: '29ABCDE1234F1Z5',
    panNo: 'ABCDE1234F'
  },
  {
    id: '2',
    name: 'Manufacturing Solutions Ltd',
    address: '456 Industrial Blvd',
    city: 'Factory Town',
    state: 'FT',
    country: 'India',
    pinCode: '67890',
    contactPerson: 'Sarah Johnson',
    contactEmail: 'sarah.johnson@mansol.com',
    contactPhone: '+1 (555) 987-6543',
    gstNo: '29FGHIJ5678K2L6',
    panNo: 'FGHIJ5678K'
  }
];

const Companies = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<EnhancedCompany[]>(mockCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [isAdminUserDialogOpen, setIsAdminUserDialogOpen] = useState(false);
  const [createdCompany, setCreatedCompany] = useState<EnhancedCompany | null>(null);
  const [adminUsers, setAdminUsers] = useState([{ name: '', email: '', password: '' }]);
  
  const [newCompany, setNewCompany] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    gstNo: '',
    panNo: ''
  });

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCompany = () => {
    if (!newCompany.name || !newCompany.address || !newCompany.city || 
        !newCompany.state || !newCompany.country || !newCompany.pinCode ||
        !newCompany.contactPerson || !newCompany.contactEmail || 
        !newCompany.contactPhone || !newCompany.gstNo || !newCompany.panNo) {
      toast({
        title: "Error",
        description: "Please fill in all company fields",
        variant: "destructive",
      });
      return;
    }

    // Create new company
    const company: EnhancedCompany = {
      id: Date.now().toString(),
      ...newCompany
    };
    
    setCompanies([...companies, company]);
    setCreatedCompany(company);
    
    // Reset form
    setNewCompany({
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pinCode: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      gstNo: '',
      panNo: ''
    });
    
    setIsAddDialogOpen(false);
    setIsVerificationDialogOpen(true);
  };

  const handleVerificationComplete = () => {
    setIsVerificationDialogOpen(false);
    setIsAdminUserDialogOpen(true);
  };

  const addAdminUser = () => {
    setAdminUsers([...adminUsers, { name: '', email: '', password: '' }]);
  };

  const removeAdminUser = (index: number) => {
    if (adminUsers.length > 1) {
      setAdminUsers(adminUsers.filter((_, i) => i !== index));
    }
  };

  const updateAdminUser = (index: number, field: string, value: string) => {
    const updated = [...adminUsers];
    updated[index] = { ...updated[index], [field]: value };
    setAdminUsers(updated);
  };

  const handleCreateAdminUsers = () => {
    const validUsers = adminUsers.filter(user => user.name && user.email && user.password);
    
    if (validUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in at least one complete admin user",
        variant: "destructive",
      });
      return;
    }

    // In a real app, you would create these users in the database
    validUsers.forEach(user => {
      console.log('Creating Company Admin:', {
        ...user,
        role: UserRole.COMPANY_ADMIN,
        companyId: createdCompany?.id
      });
    });

    toast({
      title: "Success",
      description: `Company "${createdCompany?.name}" created successfully with ${validUsers.length} admin user(s)`,
    });

    // Reset state
    setAdminUsers([{ name: '', email: '', password: '' }]);
    setCreatedCompany(null);
    setIsAdminUserDialogOpen(false);
  };

  const handleDeleteCompany = (id: string) => {
    setCompanies(companies.filter(company => company.id !== id));
    toast({
      title: "Company Deleted",
      description: "Company and associated users have been removed",
    });
  };

  // Only System Admins can access this page
  if (user?.role !== UserRole.APPLICATION_ADMIN) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">Only System Administrators can manage companies.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
            <p className="text-muted-foreground">
              Create and manage companies with their admin users
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Create New Company
                </DialogTitle>
                <DialogDescription>
                  Enter complete company details to register a new company.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={newCompany.contactPerson}
                      onChange={(e) => setNewCompany({...newCompany, contactPerson: e.target.value})}
                      placeholder="Contact person name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={newCompany.address}
                    onChange={(e) => setNewCompany({...newCompany, address: e.target.value})}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={newCompany.city}
                      onChange={(e) => setNewCompany({...newCompany, city: e.target.value})}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={newCompany.state}
                      onChange={(e) => setNewCompany({...newCompany, state: e.target.value})}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={newCompany.country}
                      onChange={(e) => setNewCompany({...newCompany, country: e.target.value})}
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pinCode">Pin Code *</Label>
                    <Input
                      id="pinCode"
                      value={newCompany.pinCode}
                      onChange={(e) => setNewCompany({...newCompany, pinCode: e.target.value})}
                      placeholder="Pin/Zip code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone *</Label>
                    <Input
                      id="contactPhone"
                      value={newCompany.contactPhone}
                      onChange={(e) => setNewCompany({...newCompany, contactPhone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={newCompany.contactEmail}
                    onChange={(e) => setNewCompany({...newCompany, contactEmail: e.target.value})}
                    placeholder="contact@company.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstNo">GST No *</Label>
                    <Input
                      id="gstNo"
                      value={newCompany.gstNo}
                      onChange={(e) => setNewCompany({...newCompany, gstNo: e.target.value})}
                      placeholder="29ABCDE1234F1Z5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panNo">PAN No *</Label>
                    <Input
                      id="panNo"
                      value={newCompany.panNo}
                      onChange={(e) => setNewCompany({...newCompany, panNo: e.target.value})}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCompany}>Register Company</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Company Verification Dialog */}
        <Dialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                Company Registered
              </DialogTitle>
              <DialogDescription className="text-center">
                {createdCompany?.name} has been successfully registered!
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <div className="text-6xl">✓</div>
            </div>
            <DialogFooter>
              <Button onClick={handleVerificationComplete} className="w-full">
                Create Admin Users
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Admin Users Creation Dialog */}
        <Dialog open={isAdminUserDialogOpen} onOpenChange={setIsAdminUserDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create Company Admin Users
              </DialogTitle>
              <DialogDescription>
                Create admin users for {createdCompany?.name}. You can add multiple admin users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {adminUsers.map((user, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Admin User {index + 1}</h4>
                    {adminUsers.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAdminUser(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={user.name}
                        onChange={(e) => updateAdminUser(index, 'name', e.target.value)}
                        placeholder="Admin full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={user.email}
                        onChange={(e) => updateAdminUser(index, 'email', e.target.value)}
                        placeholder="admin@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input
                        type="password"
                        value={user.password}
                        onChange={(e) => updateAdminUser(index, 'password', e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" onClick={addAdminUser} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Another Admin User
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateAdminUsers}>Create Admin Users</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Search Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by company name, contact person, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Companies ({filteredCompanies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Details</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Tax Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">{company.name}</div>
                          <div className="text-sm text-muted-foreground">{company.address}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {company.contactPerson}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {company.contactEmail}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {company.contactPhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>{company.city}, {company.state}</div>
                        <div>{company.country} - {company.pinCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>GST: {company.gstNo}</div>
                        <div>PAN: {company.panNo}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCompany(company.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Companies;
