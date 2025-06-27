import { useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  UserCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { User, UserRole, Company, UserStatus } from "@/types";

/** ------------------------------------------------------------------
 * 1. ROLE HELPERS (single source of truth)
 * ------------------------------------------------------------------*/
export const roleOptions: { value: UserRole; label: string }[] = [
  { value: UserRole.APPLICATION_ADMIN, label: "System Admin" },
  { value: UserRole.COMPANY_ADMIN, label: "Company Admin" },
  { value: UserRole.COMPANY_EMPLOYEE, label: "Company Employee" },
  { value: UserRole.DEALER_ADMIN, label: "Dealer Admin" },
  { value: UserRole.DEALER_EMPLOYEE, label: "Dealer Employee" },
];

const getRoleName = (role: UserRole) =>
  roleOptions.find((r) => r.value === role)?.label ?? "User";

const getRoleBadgeColor = (role: UserRole) => {
  switch (role) {
    case UserRole.APPLICATION_ADMIN:
      return "bg-red-100 text-red-800";
    case UserRole.COMPANY_ADMIN:
      return "bg-blue-100 text-blue-800";
    case UserRole.COMPANY_EMPLOYEE:
      return "bg-green-100 text-green-800";
    case UserRole.DEALER_ADMIN:
      return "bg-purple-100 text-purple-800";
    case UserRole.DEALER_EMPLOYEE:
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/** ------------------------------------------------------------------
 * 2. MOCK DATA (combined superset from both files)
 * ------------------------------------------------------------------*/
const mockCompanies: Company[] = [
  {
    id: "1",
    name: "TechCorp Industries",
    address: "123 Business Ave",
    city: "Tech City",
    state: "TC",
    country: "USA",
    pinCode: "12345",
    contactPerson: "John Smith",
    contactEmail: "john.smith@techcorp.com",
    contactPhone: "+1 (555) 123-4567",
    gstNumber: "GST123456789",
    panNumber: "PAN123456789",
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Manufacturing Solutions Ltd",
    address: "456 Industrial Blvd",
    city: "Factory Town",
    state: "FT",
    country: "USA",
    pinCode: "67890",
    contactPerson: "Sarah Johnson",
    contactEmail: "sarah.johnson@mansol.com",
    contactPhone: "+1 (555) 987-6543",
    gstNumber: "GST987654321",
    panNumber: "PAN987654321",
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-02T00:00:00Z",
  },
  {
    id: "3",
    name: "Global Enterprises Inc",
    address: "789 Corporate Plaza",
    city: "Business District",
    state: "BD",
    country: "USA",
    pinCode: "13579",
    contactPerson: "Michael Brown",
    contactEmail: "michael.brown@globalent.com",
    contactPhone: "+1 (555) 456-7890",
    gstNumber: "GST135792468",
    panNumber: "PAN135792468",
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-03T00:00:00Z",
  },
];

const mockUsers: User[] = [
  {
    id: "1",
    name: "System Admin",
    email: "admin@system.com",
    phone: "+1-555-0001",
    username: "admin",
    role: UserRole.APPLICATION_ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Company Admin",
    email: "admin@company.com",
    phone: "+1-555-0002",
    username: "companyadmin",
    role: UserRole.COMPANY_ADMIN,
    companyId: "1",
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-02T00:00:00Z",
  },
  {
    id: "3",
    name: "John Doe",
    email: "john.doe@company.com",
    phone: "+1-555-0003",
    username: "johndoe",
    role: UserRole.COMPANY_EMPLOYEE,
    companyId: "1",
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-03T00:00:00Z",
  },
  {
    id: "4",
    name: "Jane Smith",
    email: "jane.smith@company.com",
    phone: "+1-555-0004",
    username: "janesmith",
    role: UserRole.COMPANY_EMPLOYEE,
    companyId: "1",
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-04T00:00:00Z",
  },
  {
    id: "5",
    name: "Dealer Admin",
    email: "admin@dealer.com",
    phone: "+1-555-0005",
    username: "dealeradmin",
    role: UserRole.DEALER_ADMIN,
    dealerId: "1",
    companyId: "1",
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-05T00:00:00Z",
  },
  {
    id: "6",
    name: "Mike Johnson",
    email: "mike.johnson@dealer.com",
    phone: "+1-555-0006",
    username: "mikejohnson",
    role: UserRole.DEALER_EMPLOYEE,
    dealerId: "1",
    companyId: "1",
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-06T00:00:00Z",
  },
  {
    id: "7",
    name: "Sarah Wilson",
    email: "sarah.wilson@mansol.com",
    phone: "+1-555-0007",
    username: "sarahwilson",
    role: UserRole.COMPANY_ADMIN,
    companyId: "2",
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-07T00:00:00Z",
  },
  {
    id: "8",
    name: "Tom Brown",
    email: "tom.brown@mansol.com",
    phone: "+1-555-0008",
    username: "tombrown",
    role: UserRole.COMPANY_EMPLOYEE,
    companyId: "2",
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-08T00:00:00Z",
  },
  {
    id: "9",
    name: "Lisa Davis",
    email: "lisa.davis@globalent.com",
    phone: "+1-555-0009",
    username: "lisadavis",
    role: UserRole.COMPANY_ADMIN,
    companyId: "3",
    status: UserStatus.ACTIVE,
    createdAt: "2023-01-09T00:00:00Z",
  },
];

/** ------------------------------------------------------------------
 * 3. COMPONENT
 * ------------------------------------------------------------------*/
const UsersPage = () => {
  const { user } = useAuth();

  // state ----------------------------------------------------------------
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: "",
    email: "",
    role: UserRole.COMPANY_EMPLOYEE,
  });

  // helpers --------------------------------------------------------------
  const toggleExpansion = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const canManageUsers =
    user?.role === UserRole.APPLICATION_ADMIN ||
    user?.role === UserRole.COMPANY_ADMIN ||
    user?.role === UserRole.DEALER_ADMIN;

  // filter + memo --------------------------------------------------------
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const match = (s?: string) => s?.toLowerCase().includes(term);
    return users.filter((u) => [u.name, u.email, u.username].some(match));
  }, [users, searchTerm]);

  const systemUsers = useMemo(
    () => filteredUsers.filter((u) => !u.companyId),
    [filteredUsers]
  );

  // handlers -------------------------------------------------------------
  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) return;

    const newUserData: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || "",
      username: newUser.email.split("@")[0],
      role: newUser.role,
      status: UserStatus.ACTIVE,
      companyId: newUser.companyId,
      dealerId: newUser.dealerId,
      createdAt: new Date().toISOString(),
    } as User;

    setUsers((u) => [...u, newUserData]);
    setNewUser({ name: "", email: "", role: UserRole.COMPANY_EMPLOYEE });
    setIsAddDialogOpen(false);
  };

  const handleDeleteUser = useCallback((id: string) => {
    setUsers((u) => u.filter((x) => x.id !== id));
  }, []);

  // rows -----------------------------------------------------------------
  const UserRow = ({ user: u, level = 0 }: { user: User; level?: number }) => (
    <TableRow>
      <TableCell className="font-medium" style={{ paddingLeft: `${level * 20 + 16}px` }}>
        <div className="flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          {u.name}
        </div>
      </TableCell>
      <TableCell>{u.email}</TableCell>
      <TableCell>
        <Badge className={getRoleBadgeColor(u.role)}>{getRoleName(u.role)}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          {canManageUsers && (
            <Button variant="outline" size="sm" onClick={() => handleDeleteUser(u.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  /** ------------------------------------------------------------------
   *  RENDER
   * ------------------------------------------------------------------*/
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER & ADD BUTTON */}
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
                  <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Enter the user details below.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {/* NAME */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newUser.name || ""}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="col-span-3"
                      placeholder="Full name"
                    />
                  </div>

                  {/* EMAIL */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email || ""}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="col-span-3"
                      placeholder="user@example.com"
                    />
                  </div>

                  {/* ROLE */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, role: value as UserRole })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions
                          .filter((o) =>
                            // APPLICATION_ADMIN can create anything, COMPANY_ADMIN cannot create SYSTEM ADMIN, etc.
                            user?.role === UserRole.APPLICATION_ADMIN
                              ? true
                              : o.value !== UserRole.APPLICATION_ADMIN
                          )
                          .map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* COMPANY select if needed */}
                  {[
                    UserRole.COMPANY_ADMIN,
                    UserRole.COMPANY_EMPLOYEE,
                    UserRole.DEALER_ADMIN,
                    UserRole.DEALER_EMPLOYEE,
                  ].includes(newUser.role as UserRole) && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="company" className="text-right">
                        Company
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setNewUser({ ...newUser, companyId: value })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCompanies.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
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

        {/* SEARCH */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" /> Search Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        {/* SYSTEM USERS */}
        {user?.role === UserRole.APPLICATION_ADMIN && systemUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" /> System Users ({systemUsers.length})
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
                  {systemUsers.map((u) => (
                    <UserRow key={u.id} user={u} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* COMPANY HIERARCHY */}
        {user?.role === UserRole.APPLICATION_ADMIN && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Company Hierarchy
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
                    const companyAdmins = filteredUsers.filter(
                      (u) => u.companyId === company.id && u.role === UserRole.COMPANY_ADMIN
                    );
                    const companyEmployees = filteredUsers.filter(
                      (u) => u.companyId === company.id && u.role === UserRole.COMPANY_EMPLOYEE
                    );
                    const dealerAdmins = filteredUsers.filter(
                      (u) => u.companyId === company.id && u.role === UserRole.DEALER_ADMIN
                    );

                    const totalUsers =
                      companyAdmins.length + companyEmployees.length + dealerAdmins.length;
                    const compKey = `company-${company.id}`;
                    if (totalUsers === 0) return null;

                    return (
                      <>
                        <TableRow key={compKey} className="bg-muted/30">
                          <TableCell
                            className="font-semibold cursor-pointer"
                            onClick={() => toggleExpansion(compKey)}
                          >
                            <div className="flex items-center gap-2">
                              {expanded[compKey] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <Building2 className="h-4 w-4" /> {company.name} ({totalUsers} users)
                            </div>
                          </TableCell>
                          <TableCell colSpan={3} className="text-muted-foreground">
                            {company.contactEmail}
                          </TableCell>
                        </TableRow>

                        {expanded[compKey] && (
                          <>
                            {/* Company Admins */}
                            {companyAdmins.map((u) => (
                              <UserRow key={u.id} user={u} level={1} />
                            ))}

                            {/* Company Employees */}
                            {companyEmployees.map((u) => (
                              <UserRow key={u.id} user={u} level={2} />
                            ))}

                            {/* Dealer Admins + employees */}
                            {dealerAdmins.map((dealerAdmin) => {
                              const dealerKey = `dealer-${dealerAdmin.dealerId}`;
                              const dealerEmployees = filteredUsers.filter(
                                (u) =>
                                  u.dealerId === dealerAdmin.dealerId &&
                                  u.role === UserRole.DEALER_EMPLOYEE
                              );

                              return (
                                <>
                                  <TableRow key={dealerAdmin.id}>
                                    <TableCell
                                      className="font-medium cursor-pointer"
                                      style={{ paddingLeft: "40px" }}
                                      onClick={() =>
                                        dealerAdmin.dealerId && toggleExpansion(dealerKey)
                                      }
                                    >
                                      <div className="flex items-center gap-2">
                                        {dealerEmployees.length > 0 && (
                                          expanded[dealerKey] ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )
                                        )}
                                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                                        {dealerAdmin.name}
                                        {dealerEmployees.length > 0 && (
                                          <> ({dealerEmployees.length} employees)</>
                                        )}
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

                                  {/* Dealer employees */}
                                  {expanded[dealerKey] &&
                                    dealerEmployees.map((emp) => (
                                      <UserRow key={emp.id} user={emp} level={3} />
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
