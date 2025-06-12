
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Building2, UserCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { User, UserRole, Company } from '@/types';

// Mock companies data
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp Industries',
    address: '123 Business Ave, Tech City, TC 12345',
    contactPerson: 'John Smith',
    contactEmail: 'john.smith@techcorp.com',
    contactPhone: '+1 (555) 123-4567'
  },
  {
    id: '2',
    name: 'Manufacturing Solutions Ltd',
    address: '456 Industrial Blvd, Factory Town, FT 67890',
    contactPerson: 'Sarah Johnson',
    contactEmail: 'sarah.johnson@mansol.com',
    contactPhone: '+1 (555) 987-6543'
  },
  {
    id: '3',
    name: 'Global Enterprises Inc',
    address: '789 Corporate Plaza, Business District, BD 13579',
    contactPerson: 'Michael Brown',
    contactEmail: 'michael.brown@globalent.com',
    contactPhone: '+1 (555) 456-7890'
  }
];

// Mock users data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'System Admin',
    email: 'admin@system.com',
    role: UserRole.APPLICATION_ADMIN,
  },
  {
    id: '2',
    name: 'Company Admin',
    email: 'admin@company.com',
    role: UserRole.COMPANY_ADMIN,
    companyId: '1',
  },
  {
    id: '3',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: UserRole.COMPANY_EMPLOYEE,
    companyId: '1',
  },
  {
    id: '4',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    role: UserRole.COMPANY_EMPLOYEE,
    companyId: '1',
  },
  {
    id: '5',
    name: 'Dealer Admin',
    email: 'admin@dealer.com',
    role: UserRole.DEALER_ADMIN,
    dealerId: '1',
    companyId: '1',
  },
  {
    id: '6',
    name: 'Mike Johnson',
    email: 'mike.johnson@dealer.com',
    role: UserRole.DEALER_EMPLOYEE,
    dealerId: '1',
    companyId: '1',
  },
  {
    id: '7',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@mansol.com',
    role: UserRole.COMPANY_ADMIN,
    companyId: '2',
  },
  {
    id: '8',
    name: 'Tom Brown',
    email: 'tom.brown@mansol.com',
    role: UserRole.COMPANY_EMPLOYEE,
    companyId: '2',
  },
  {
    id: '9',
    name: 'Lisa Davis',
    email: 'lisa.davis@globalent.com',
    role: UserRole.COMPANY_ADMIN,
    companyId: '3',
  }
];

const UsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCompanies, setExpandedCompanies] = useState<{ [key: string]: boolean }>({});
  const [expandedDealers, setExpandedDealers] = useState<{ [key: string]: boolean }>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: UserRole.COMPANY_EMPLOYEE
  });

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.APPLICATION_ADMIN:
        return 'System Admin';
      case UserRole.COMPANY_ADMIN:
        return 'Company Admin';
      case UserRole.COMPANY_EMPLOYEE:
        return 'Company Employee';
      case UserRole.DEALER_ADMIN:
        return 'Dealer Admin';
      case UserRole.DEALER_EMPLOYEE:
        return 'Dealer Employee';
      default:
        return 'User';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.APPLICATION_ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRole.COMPANY_ADMIN:
        return 'bg-blue-100 text-blue-800';
      case UserRole.COMPANY_EMPLOYEE:
        return 'bg-green-100 text-green-800';
      case UserRole.DEALER_ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.DEALER_EMPLOYEE:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleCompanyExpansion = (companyId: string) => {
    setExpandedCompanies(prev => ({ ...prev, [companyId]: !prev[companyId] }));
  };

  const toggleDealerExpansion = (dealerId: string) => {
    setExpandedDealers(prev => ({ ...prev, [dealerId]: !prev[dealerId] }));
  };

  // Filter users based on search term
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const UserRow = ({ user: userData, level = 0 }: { user: User; level?: number }) => (
    <TableRow>
      <TableCell className="font-medium" style={{ paddingLeft: `${level * 20 + 16}px` }}>
        <div className="flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          {userData.name}
        </div>
      </TableCell>
      <TableCell>{userData.email}</TableCell>
      <TableCell>
        <Badge className={getRoleBadgeColor(userData.role)}>
          {getRoleName(userData.role)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          {canManageUsers && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDeleteUser(userData.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      return;
    }

    const newUserData: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      companyId: newUser.companyId,
      dealerId: newUser.dealerId
    };

    setUsers([...users, newUserData]);
    setNewUser({
      name: '',
      email: '',
      role: UserRole.COMPANY_EMPLOYEE
    });
    setIsAddDialogOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  // Check if current user can manage users
  const canManageUsers = user?.role === UserRole.APPLICATION_ADMIN || 
                        user?.role === UserRole.COMPANY_ADMIN || 
                        user?.role === UserRole.DEALER_ADMIN;

  // System users (no company)
  const systemUsers = filteredUsers.filter(u => !u.companyId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Users Management</h2>
            <p className="text-muted-foreground">
              {user?.role === UserRole.APPLICATION_ADMIN 
                ? "Manage all users across companies in hierarchical structure" 
                : "Manage users in your organization"}
            </p>
          </div>
          {canManageUsers && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Enter the user details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input
                      id="name"
                      value={newUser.name || ''}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      className="col-span-3"
                      placeholder="Full name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email || ''}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="col-span-3"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">Role</Label>
                    <Select onValueChange={(value) => setNewUser({...newUser, role: value as UserRole})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {user?.role === UserRole.APPLICATION_ADMIN && (
                          <>
                            <SelectItem value={UserRole.APPLICATION_ADMIN}>System Admin</SelectItem>
                            <SelectItem value={UserRole.COMPANY_ADMIN}>Company Admin</SelectItem>
                          </>
                        )}
                        <SelectItem value={UserRole.COMPANY_EMPLOYEE}>Company Employee</SelectItem>
                        <SelectItem value={UserRole.DEALER_ADMIN}>Dealer Admin</SelectItem>
                        <SelectItem value={UserRole.DEALER_EMPLOYEE}>Dealer Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(newUser.role === UserRole.COMPANY_ADMIN || newUser.role === UserRole.COMPANY_EMPLOYEE) && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="company" className="text-right">Company</Label>
                      <Select onValueChange={(value) => setNewUser({...newUser, companyId: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCompanies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleAddUser}>Add User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        {/* System Users */}
        {user?.role === UserRole.APPLICATION_ADMIN && systemUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                System Users ({systemUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemUsers.map((userData) => (
                    <UserRow key={userData.id} user={userData} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Hierarchical Company Structure */}
        {user?.role === UserRole.APPLICATION_ADMIN && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCompanies.map((company) => {
                    const companyAdmins = filteredUsers.filter(u => 
                      u.companyId === company.id && u.role === UserRole.COMPANY_ADMIN
                    );
                    const companyEmployees = filteredUsers.filter(u => 
                      u.companyId === company.id && u.role === UserRole.COMPANY_EMPLOYEE
                    );
                    const dealerAdmins = filteredUsers.filter(u => 
                      u.companyId === company.id && u.role === UserRole.DEALER_ADMIN
                    );
                    
                    const totalUsers = companyAdmins.length + companyEmployees.length + dealerAdmins.length;
                    const isExpanded = expandedCompanies[company.id];

                    if (totalUsers === 0) return null;

                    return (
                      <>
                        <TableRow key={company.id} className="bg-muted/30">
                          <TableCell 
                            className="font-semibold cursor-pointer"
                            onClick={() => toggleCompanyExpansion(company.id)}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <Building2 className="h-4 w-4" />
                              {company.name} ({totalUsers} users)
                            </div>
                          </TableCell>
                          <TableCell colSpan={3} className="text-muted-foreground">
                            {company.contactEmail}
                          </TableCell>
                        </TableRow>
                        
                        {isExpanded && (
                          <>
                            {/* 1) Company Admins */}
                            {companyAdmins.map((userData) => (
                              <UserRow key={userData.id} user={userData} level={1} />
                            ))}
                            
                            {/* 1.1) Company Employees */}
                            {companyEmployees.map((userData) => (
                              <UserRow key={userData.id} user={userData} level={2} />
                            ))}
                            
                            {/* 1.2) Dealer Admins and their employees */}
                            {dealerAdmins.map((dealerAdmin) => {
                              const dealerEmployees = filteredUsers.filter(u => 
                                u.dealerId === dealerAdmin.dealerId && u.role === UserRole.DEALER_EMPLOYEE
                              );
                              const isDealerExpanded = expandedDealers[dealerAdmin.dealerId || ''];
                              
                              return (
                                <>
                                  <TableRow key={`dealer-${dealerAdmin.id}`}>
                                    <TableCell 
                                      className="font-medium cursor-pointer"
                                      style={{ paddingLeft: '40px' }}
                                      onClick={() => dealerAdmin.dealerId && toggleDealerExpansion(dealerAdmin.dealerId)}
                                    >
                                      <div className="flex items-center gap-2">
                                        {dealerEmployees.length > 0 && (
                                          isDealerExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )
                                        )}
                                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                                        {dealerAdmin.name} {dealerEmployees.length > 0 && `(${dealerEmployees.length} employees)`}
                                      </div>
                                    </TableCell>
                                    <TableCell>{dealerAdmin.email}</TableCell>
                                    <TableCell>
                                      <Badge className={getRoleBadgeColor(dealerAdmin.role)}>
                                        {getRoleName(dealerAdmin.role)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm">
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleDeleteUser(dealerAdmin.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  
                                  {/* 1.2.1) Dealer Employees */}
                                  {isDealerExpanded && dealerEmployees.map((userData) => (
                                    <UserRow key={userData.id} user={userData} level={3} />
                                  ))}
                                </>
                              );
                            })}
                          </>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
