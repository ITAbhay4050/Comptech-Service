import { useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Ticket, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FilterIcon, PlusCircle, AlertCircle, Clock, RotateCw, CheckCircle, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

// Mock data for tickets
const initialMockTickets: Ticket[] = [
  {
    id: '1',
    machineId: '1',
    issueDescription: 'Display showing error code E-501',
    dateReported: '2023-06-10',
    reportedById: '5', // Dealer Employee
    assignedToId: '3', // Company Employee
    status: 'resolved',
    urgency: 'medium',
    resolutionNotes: 'Replaced display module and recalibrated',
  },
  {
    id: '2',
    machineId: '2',
    issueDescription: 'Machine not powering on after installation',
    dateReported: '2023-07-05',
    reportedById: '5', // Dealer Employee
    assignedToId: '3', // Company Employee
    status: 'in-progress',
    urgency: 'high',
  },
  {
    id: '3',
    machineId: '4',
    issueDescription: 'Overheating during extended operation',
    dateReported: '2023-04-12',
    reportedById: '4', // Dealer Admin
    status: 'open',
    urgency: 'critical',
  },
];

// Mock machine data for dropdown
const mockMachines = [
  { id: '1', model: 'CLX-5000 Standard', serialNumber: 'CLX5000-12345-AB' },
  { id: '2', model: 'RVX-300 Advanced', serialNumber: 'RVX300-67890-CD' },
  { id: '4', model: 'RVX-200 Compact', serialNumber: 'RVX200-13579-GH' },
];

// Mock employees for assignment
const mockEmployees = [
  { id: '3', name: 'Company Employee', role: 'Company Employee' },
  { id: '6', name: 'Tech Support 1', role: 'Company Employee' },
  { id: '7', name: 'Tech Support 2', role: 'Company Employee' },
];

const Tickets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(initialMockTickets);
  const [newTicket, setNewTicket] = useState<Partial<Ticket>>({
    dateReported: new Date().toISOString().split('T')[0],
    reportedById: user?.id,
    status: 'open',
    urgency: 'medium',
  });
  const [assignmentData, setAssignmentData] = useState({
    assigneeId: '',
    notes: ''
  });
  const [resolutionData, setResolutionData] = useState({
    resolutionNotes: ''
  });
  
  // Check user permissions
  const isSystemAdmin = user?.role === UserRole.APPLICATION_ADMIN;
  const isCompanyAdmin = user?.role === UserRole.COMPANY_ADMIN;
  const isCompanyEmployee = user?.role === UserRole.COMPANY_EMPLOYEE;
  
  // Admin users, dealer admins, and dealer employees can create tickets
  const canCreateTickets = 
    isSystemAdmin ||
    isCompanyAdmin ||
    user?.role === UserRole.DEALER_ADMIN ||
    user?.role === UserRole.DEALER_EMPLOYEE;
  
  // Company roles and system admin can assign/resolve tickets
  const canManageTickets = isSystemAdmin || isCompanyAdmin || isCompanyEmployee;
  
  // Only system admin can close tickets
  const canCloseTickets = isSystemAdmin;
  
  // Filter tickets based on search term and status
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.issueDescription.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter ? ticket.status === statusFilter : true;
    
    // Admin users and company employees see all tickets
    if (isSystemAdmin || isCompanyAdmin || isCompanyEmployee) {
      return matchesSearch && matchesStatus;
    }
    
    // Dealer admins and employees only see their own tickets or tickets from their organization
    if (user?.role === UserRole.DEALER_ADMIN || user?.role === UserRole.DEALER_EMPLOYEE) {
      return matchesSearch && 
        matchesStatus && 
        ticket.reportedById === user.id;
    }
    
    return matchesSearch && matchesStatus;
  });
  
  // Ticket urgency badge styling
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Low</Badge>;
      case 'medium':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">High</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Critical</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Ticket status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Open</span>
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
            <RotateCw className="h-3 w-3" />
            <span>In Progress</span>
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Resolved</span>
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Closed</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const handleTicketChange = (field: string, value: string) => {
    setNewTicket(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleCreateTicket = () => {
    if (!newTicket.machineId || !newTicket.issueDescription || !newTicket.urgency) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    const ticketId = (tickets.length + 1).toString();
    const createdTicket: Ticket = {
      id: ticketId,
      machineId: newTicket.machineId!,
      issueDescription: newTicket.issueDescription!,
      dateReported: newTicket.dateReported!,
      reportedById: newTicket.reportedById!,
      status: 'open',
      urgency: newTicket.urgency!,
    };
    
    setTickets(prev => [createdTicket, ...prev]);
    
    toast({
      title: "Success",
      description: "Ticket has been created successfully",
    });
    
    setIsCreateTicketDialogOpen(false);
    setNewTicket({
      dateReported: new Date().toISOString().split('T')[0],
      reportedById: user?.id,
      status: 'open',
      urgency: 'medium',
    });
  };

  const handleAssignTicket = () => {
    if (!assignmentData.assigneeId || !selectedTicket) {
      toast({
        title: "Error",
        description: "Please select an employee to assign the ticket",
        variant: "destructive",
      });
      return;
    }

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return { 
          ...t, 
          status: 'in-progress' as const, 
          assignedToId: assignmentData.assigneeId 
        };
      }
      return t;
    }));

    toast({
      title: "Success",
      description: "Ticket has been assigned successfully",
    });

    setIsAssignDialogOpen(false);
    setSelectedTicket(null);
    setAssignmentData({ assigneeId: '', notes: '' });
  };

  const handleResolveTicket = () => {
    if (!resolutionData.resolutionNotes.trim() || !selectedTicket) {
      toast({
        title: "Error",
        description: "Please provide resolution notes",
        variant: "destructive",
      });
      return;
    }

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return { 
          ...t, 
          status: 'resolved' as const, 
          resolutionNotes: resolutionData.resolutionNotes 
        };
      }
      return t;
    }));

    toast({
      title: "Success",
      description: "Ticket has been resolved successfully",
    });

    setIsResolveDialogOpen(false);
    setSelectedTicket(null);
    setResolutionData({ resolutionNotes: '' });
  };

  const handleCloseTicket = (ticket: Ticket) => {
    if (!canCloseTickets) {
      toast({
        title: "Access Denied",
        description: "Only System Admins can close tickets",
        variant: "destructive",
      });
      return;
    }

    setTickets(prev => prev.map(t => {
      if (t.id === ticket.id) {
        return { ...t, status: 'closed' as const };
      }
      return t;
    }));

    toast({
      title: "Success",
      description: "Ticket has been closed successfully",
    });
  };

  const openAssignDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsAssignDialogOpen(true);
  };

  const openResolveDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsResolveDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Service Tickets</h2>
            {isSystemAdmin && (
              <p className="text-sm text-green-600 font-medium">System Admin - Full ticket management and closing rights</p>
            )}
            {isCompanyAdmin && (
              <p className="text-sm text-blue-600 font-medium">Company Admin - Can assign, review, and resolve tickets</p>
            )}
            {isCompanyEmployee && (
              <p className="text-sm text-purple-600 font-medium">Company Employee - Can assign, review, and resolve tickets</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => setIsCreateTicketDialogOpen(true)}
              disabled={!canCreateTickets}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Ticket</span>
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Ticket Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Filter:</span>
                <div className="flex gap-2">
                  <Button 
                    variant={statusFilter === null ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter(null)}
                  >
                    All
                  </Button>
                  <Button 
                    variant={statusFilter === 'open' ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter('open')}
                  >
                    Open
                  </Button>
                  <Button 
                    variant={statusFilter === 'in-progress' ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter('in-progress')}
                  >
                    In Progress
                  </Button>
                  <Button 
                    variant={statusFilter === 'resolved' ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter('resolved')}
                  >
                    Resolved
                  </Button>
                  <Button 
                    variant={statusFilter === 'closed' ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter('closed')}
                  >
                    Closed
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Tickets Table */}
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">Issue</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Machine</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Date Reported</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Assigned To</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Urgency</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">
                          No tickets found
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map(ticket => {
                        const machine = mockMachines.find(m => m.id === ticket.machineId);
                        const assignee = mockEmployees.find(e => e.id === ticket.assignedToId);
                        
                        return (
                          <tr 
                            key={ticket.id} 
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <td className="p-4">
                              <p className="line-clamp-2">{ticket.issueDescription}</p>
                            </td>
                            <td className="p-4">
                              <p>{machine?.model || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{machine?.serialNumber}</p>
                            </td>
                            <td className="p-4">{ticket.dateReported}</td>
                            <td className="p-4">
                              {assignee ? (
                                <div>
                                  <p className="font-medium">{assignee.name}</p>
                                  <p className="text-xs text-muted-foreground">{assignee.role}</p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Unassigned</span>
                              )}
                            </td>
                            <td className="p-4">{getUrgencyBadge(ticket.urgency)}</td>
                            <td className="p-4">{getStatusBadge(ticket.status)}</td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(`/machines/${ticket.machineId}`)}
                                >
                                  View
                                </Button>
                                {canManageTickets && (
                                  <>
                                    {ticket.status === 'open' && (
                                      <Button 
                                        size="sm" 
                                        variant="secondary"
                                        onClick={() => openAssignDialog(ticket)}
                                        className="flex items-center gap-1"
                                      >
                                        <Users className="h-3 w-3" />
                                        Assign
                                      </Button>
                                    )}
                                    {ticket.status === 'in-progress' && (
                                      <Button 
                                        size="sm"
                                        onClick={() => openResolveDialog(ticket)}
                                        className="flex items-center gap-1"
                                      >
                                        <FileText className="h-3 w-3" />
                                        Resolve
                                      </Button>
                                    )}
                                    {ticket.status === 'resolved' && canCloseTickets && (
                                      <Button 
                                        size="sm"
                                        onClick={() => handleCloseTicket(ticket)}
                                      >
                                        Close
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Create Ticket Dialog */}
        <Dialog open={isCreateTicketDialogOpen} onOpenChange={setIsCreateTicketDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Service Ticket</DialogTitle>
              <DialogDescription>
                Submit a service or warranty ticket for a machine.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="machineId">Machine *</Label>
                <Select
                  onValueChange={(value) => handleTicketChange('machineId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockMachines.map(machine => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.model} ({machine.serialNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueDescription">Issue Description *</Label>
                <Textarea
                  id="issueDescription"
                  value={newTicket.issueDescription || ''}
                  onChange={(e) => handleTicketChange('issueDescription', e.target.value)}
                  placeholder="Describe the issue in detail"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level *</Label>
                <Select
                  value={newTicket.urgency}
                  onValueChange={(value) => handleTicketChange('urgency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateTicketDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTicket}>
                Submit Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Ticket Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Ticket</DialogTitle>
              <DialogDescription>
                Assign this ticket to an employee for resolution.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Ticket Details</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedTicket?.issueDescription}</p>
                  <p className="text-sm text-muted-foreground">
                    Urgency: {selectedTicket?.urgency} | 
                    Reported: {selectedTicket?.dateReported}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigneeId">Assign to Employee *</Label>
                <Select
                  value={assignmentData.assigneeId}
                  onValueChange={(value) => setAssignmentData(prev => ({ ...prev, assigneeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEmployees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignmentNotes">Assignment Notes (Optional)</Label>
                <Textarea
                  id="assignmentNotes"
                  value={assignmentData.notes}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any specific instructions or notes for the assignee..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignTicket}>
                Assign Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resolve Ticket Dialog */}
        <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Resolve Ticket</DialogTitle>
              <DialogDescription>
                Mark this ticket as resolved and provide details about the resolution.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Ticket Details</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedTicket?.issueDescription}</p>
                  <p className="text-sm text-muted-foreground">
                    Urgency: {selectedTicket?.urgency} | 
                    Reported: {selectedTicket?.dateReported}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolutionNotes">Resolution Description *</Label>
                <Textarea
                  id="resolutionNotes"
                  value={resolutionData.resolutionNotes}
                  onChange={(e) => setResolutionData(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                  placeholder="Describe how the issue was resolved, what steps were taken, parts replaced, etc..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleResolveTicket}>
                Resolve Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Tickets;
