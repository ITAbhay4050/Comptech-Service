
// Role definitions
export enum UserRole {
  APPLICATION_ADMIN = "APPLICATION_ADMIN",
  COMPANY_ADMIN = "COMPANY_ADMIN",
  COMPANY_EMPLOYEE = "COMPANY_EMPLOYEE",
  DEALER_ADMIN = "DEALER_ADMIN",
  DEALER_EMPLOYEE = "DEALER_EMPLOYEE"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  dealerId?: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

export interface Dealer {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  companyId: string; // Associated company
}

export interface Machine {
  id: string;
  model: string;
  serialNumber: string;
  installationDate?: string;
  installedById?: string;
  location?: string;
  notes?: string;
  status: 'pending' | 'installed' | 'servicing' | 'decommissioned';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignerId: string;
  assigneeId: string;
  machineId?: string; // Optional, if task is related to a specific machine
}

export interface Ticket {
  id: string;
  machineId: string;
  issueDescription: string;
  dateReported: string;
  reportedById: string;
  assignedToId?: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  resolutionNotes?: string;
}

// Access control type
export interface RoleAccess {
  role: UserRole;
  canAccessPages: string[];
  canManageUsers: boolean;
  canAssignTasks: boolean;
  canCreateTickets: boolean;
  canCloseTickets: boolean;
  canInstallMachines: boolean;
}
