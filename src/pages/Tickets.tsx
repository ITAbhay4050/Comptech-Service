import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { PlusCircle, Eye, Play, Users, FileText } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

// API functions
import {
  getTickets,
  getTicketCategories,
  getUsers,
  createTicket,
  updateTicket
} from '../services/api';

// Types
import {
  TicketStatus,
  TicketUrgency,
  UserRole,
} from '../types';

// Auth Context
import { useAuth } from '../context/AuthContext';

// API base URL – using Vite environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

// Helper to render status badge
const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };
  return (
    <Badge className={variants[status] || 'bg-gray-100'}>
      {status.replace('_', ' ')}
    </Badge>
  );
};

// Helper to render urgency badge
const getUrgencyBadge = (urgency: string) => {
  const variants: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  return (
    <Badge className={variants[urgency] || 'bg-gray-100'}>
      {urgency}
    </Badge>
  );
};

const Tickets = () => {
  const { user: currentUser } = useAuth();

  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  // NEW: state for Start Progress confirmation
  const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false);
  const [ticketToStart, setTicketToStart] = useState<any>(null);

  // Dialog data states
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 0,
    batch_number: '',
    item_name: '',
    item_code: '',
    invoice_number: '',
    purchase_date: '',
    remarks: '',
    urgency: TicketUrgency.MEDIUM,
    assigned_to: null as { content_type: string; object_id: number } | null,
    created_by: { content_type: 'employee', object_id: currentUser?.id || 0 },
  });

  // Batch search states
  const [batchSearch, setBatchSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [fetchedMachineDetails, setFetchedMachineDetails] = useState<null | {
    item_name: string;
    item_code: string;
    invoice_number: string;
    purchase_date: string;
    remarks: string;
  }>(null);
  const [searchError, setSearchError] = useState('');

  // Manual entry states
  const [manualEntry, setManualEntry] = useState({
    batch_number: '',
    item_name: '',
    item_code: '',
    invoice_number: '',
    purchase_date: '',
    remarks: '',
  });
  const [entryMode, setEntryMode] = useState<'batch' | 'manual'>('batch');

  const [selectedTicket, setSelectedTicket] = useState<any>(null); // for actions
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<any>(null); // for details view
  const [assignmentData, setAssignmentData] = useState({ assigneeId: 0, notes: '' });
  const [resolutionData, setResolutionData] = useState({ resolutionNotes: '' });
  const [feedbackData, setFeedbackData] = useState({ feedbackNotes: '', rating: 0 });

  // Permissions (same as before)
  const canCreateTickets = useMemo(
    () =>
      currentUser &&
      [
        UserRole.APPLICATION_ADMIN,
        UserRole.COMPANY_EMPLOYEE,
        UserRole.COMPANY_ADMIN,
        UserRole.DEALER_ADMIN,
        UserRole.DEALER_EMPLOYEE,
      ].includes(currentUser.role),
    [currentUser]
  );

  const canManageTickets = useMemo(
    () =>
      currentUser &&
      [
        UserRole.APPLICATION_ADMIN,
        UserRole.COMPANY_ADMIN,
        UserRole.COMPANY_EMPLOYEE,
        UserRole.DEALER_ADMIN,
      ].includes(currentUser.role),
    [currentUser]
  );

  const canCloseTickets = useMemo(
    () =>
      currentUser &&
      [
        UserRole.APPLICATION_ADMIN,
        UserRole.COMPANY_ADMIN,
        UserRole.DEALER_ADMIN,
      ].includes(currentUser.role),
    [currentUser]
  );

  const isSystemAdmin = useMemo(
    () => currentUser?.role === UserRole.APPLICATION_ADMIN,
    [currentUser]
  );

  const isCompanyAdmin = useMemo(
    () => currentUser?.role === UserRole.COMPANY_ADMIN,
    [currentUser]
  );

  const isDealerUser = useMemo(
    () => [UserRole.DEALER_ADMIN, UserRole.DEALER_EMPLOYEE].includes(currentUser?.role as UserRole),
    [currentUser]
  );

  // Filter tickets based on user role (using profile ID)
  const filterTickets = useCallback((allTickets: any[]) => {
    if (!currentUser) return [];
    if (isDealerUser) {
      const profileId = currentUser.id;
      return allTickets.filter((ticket) => {
        const createdById = ticket.created_by?.object_id ?? ticket.created_by;
        const assignedToId = ticket.assigned_to?.object_id ?? ticket.assigned_to;
        // Note: original code returned allTickets unconditionally – this preserves that logic.
        // Adjust if actual filtering is needed.
        return allTickets;
      });
    }
    return allTickets;
  }, [currentUser, isDealerUser]);

  // Fetch initial data (tickets, categories, users)
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ticketsData, categoriesData, usersData] = await Promise.all([
          getTickets(),
          getTicketCategories(),
          getUsers(),
        ]);

        // Enhance tickets with category name and user display info
        const enhancedTickets = ticketsData.map((ticket: any) => {
          let createdByUser = null;

          if (ticket.created_by?.content_type === 'employee') {
            createdByUser = usersData.find(
              (u: any) =>
                u.id === ticket.created_by.object_id &&
                (u.role === 'COMPANY_ADMIN' || u.role === 'COMPANY_EMPLOYEE')
            );
          } else if (ticket.created_by?.content_type === 'dealer') {
            createdByUser = usersData.find(
              (u: any) =>
                u.id === ticket.created_by.object_id &&
                (u.role === 'DEALER_ADMIN' || u.role === 'DEALER_EMPLOYEE')
            );
          }
          const assignedToUser = ticket.assigned_to?.object_id
            ? usersData.find((u: any) => u.id === ticket.assigned_to.object_id)
            : null;

          let createdByDisplay;
          if (currentUser && createdByUser?.id === currentUser.id) {
            createdByDisplay = {
              name: currentUser.name,
              role: currentUser.role,
            };
          } else {
            createdByDisplay = createdByUser
              ? {
                  name: createdByUser.name,
                  role: createdByUser.role,
                }
              : undefined;
          }

          return {
            ...ticket,
            category_name:
              categoriesData.find((c: any) => c.id === ticket.category)?.name || 'Unknown Category',
            created_by_display: createdByDisplay,
            assigned_to_display: assignedToUser
              ? {
                  name: assignedToUser.name,
                  role: assignedToUser.role,
                }
              : null,
          };
        });

        setTickets(enhancedTickets);
        setFilteredTickets(filterTickets(enhancedTickets));
        setCategories(categoriesData);
        setUsers(usersData);
      } catch (err: any) {
        setError(`Failed to load tickets or categories. Please try again. ${err?.message || ''}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [filterTickets, currentUser]);

  // Update filtered tickets when tickets or user changes
  useEffect(() => {
    if (tickets.length > 0) {
      setFilteredTickets(filterTickets(tickets));
    }
  }, [tickets, currentUser, filterTickets]);

  // Change handlers
  const handleNewTicketChange = useCallback((field: string, value: any) => {
    setNewTicket((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleManualEntryChange = useCallback((field: string, value: string) => {
    setManualEntry((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Batch search handler
  const handleFetchMachineDetails = async () => {
    if (!batchSearch.trim()) {
      setSearchError('Please enter a batch number');
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    setFetchedMachineDetails(null);
    try {
      const storedUser = localStorage.getItem('user');
      let token = '';
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          token = user?.token || '';
        } catch (e) {
          console.error('Failed to parse user from localStorage', e);
        }
      }

      const response = await fetch(
        `${API_BASE_URL}/machine-details-by-batch/?batch=${encodeURIComponent(batchSearch)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch machine details');
      }
      const data = await response.json();
      setFetchedMachineDetails(data);
      setNewTicket((prev) => ({
        ...prev,
        batch_number: batchSearch,
        item_name: data.item_name,
        item_code: data.item_code,
        invoice_number: data.invoice_number,
        purchase_date: data.purchase_date,
        remarks: data.remarks || '',
      }));
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Create ticket handler
  const handleCreateTicket = async () => {
    if (entryMode === 'batch') {
      if (!fetchedMachineDetails) {
        alert('Please fetch machine details first or switch to manual entry.');
        return;
      }
    } else {
      setNewTicket((prev) => ({
        ...prev,
        batch_number: manualEntry.batch_number,
        item_name: manualEntry.item_name,
        item_code: manualEntry.item_code,
        invoice_number: manualEntry.invoice_number,
        purchase_date: manualEntry.purchase_date,
        remarks: manualEntry.remarks,
      }));
    }

    if (
      !newTicket.title ||
      !newTicket.description ||
      !newTicket.category ||
      newTicket.category === 0 ||
      !newTicket.urgency
    ) {
      alert('Please fill in all required fields (Title, Description, Category, Urgency).');
      return;
    }

    if (entryMode === 'manual') {
      if (
        !newTicket.batch_number ||
        !newTicket.item_name ||
        !newTicket.item_code ||
        !newTicket.invoice_number ||
        !newTicket.purchase_date
      ) {
        alert('Please fill in all required machine details in manual entry.');
        return;
      }
    }

    // ----- AUTO-ASSIGNMENT FOR COMPANY EMPLOYEE -----
    let finalAssignedTo = newTicket.assigned_to;
    if (
      currentUser?.role === UserRole.COMPANY_EMPLOYEE &&
      !finalAssignedTo // no manual assignee selected
    ) {
      const dealerAdmin = users.find(u => u.role === UserRole.DEALER_ADMIN);
      if (dealerAdmin) {
        finalAssignedTo = {
          content_type: 'dealer',   // dealer admin uses 'dealer' content_type
          object_id: dealerAdmin.id,
        };
      }
    }
    // ------------------------------------------------

    try {
      let createdByContentType: string;
      let createdById = currentUser?.id || 0;

      if (isCompanyAdmin) {
        createdByContentType = 'employee';
      } else {
        switch (currentUser?.role) {
          case UserRole.COMPANY_EMPLOYEE:
            createdByContentType = 'employee';
            break;
          case UserRole.DEALER_ADMIN:
          case UserRole.DEALER_EMPLOYEE:
            createdByContentType = 'dealer';
            break;
          case UserRole.APPLICATION_ADMIN:
            createdByContentType = 'employee';
            break;
          default:
            createdByContentType = 'employee';
        }
      }

      const ticketPayload = {
        title: newTicket.title,
        description: newTicket.description,
        category: Number(newTicket.category),
        batch_number: newTicket.batch_number,
        item_name: newTicket.item_name,
        item_code: newTicket.item_code,
        invoice_number: newTicket.invoice_number,
        purchase_date: newTicket.purchase_date,
        remarks: newTicket.remarks,
        machine_installation: null,
        urgency: newTicket.urgency,
        created_by: {
          content_type: createdByContentType,
          object_id: createdById,
        },
        assigned_to: finalAssignedTo
          ? { ...finalAssignedTo, object_id: Number(finalAssignedTo.object_id) }
          : null,
      };

      const createdTicketResponse = await createTicket(ticketPayload as any);

      const assignedUser = users.find((u) => u.id === createdTicketResponse.assigned_to?.object_id);
      const newlyAddedTicket = {
        ...createdTicketResponse,
        category_name:
          categories.find((c) => c.id === createdTicketResponse.category)?.name || 'Unknown',
        created_by_display: {
          name: currentUser?.name || 'Current User',
          role: currentUser?.role || 'Unknown',
        },
        assigned_to_display: assignedUser
          ? {
              name: assignedUser.name,
              role: assignedUser.role,
            }
          : null,
      };

      setTickets((prev) => [newlyAddedTicket, ...prev]);
      setIsCreateTicketDialogOpen(false);
      // Reset form
      setNewTicket({
        title: '',
        description: '',
        category: 0,
        batch_number: '',
        item_name: '',
        item_code: '',
        invoice_number: '',
        purchase_date: '',
        remarks: '',
        urgency: TicketUrgency.MEDIUM,
        assigned_to: null,
        created_by: { content_type: 'employee', object_id: currentUser?.id || 0 },
      });
      setBatchSearch('');
      setFetchedMachineDetails(null);
      setManualEntry({
        batch_number: '',
        item_name: '',
        item_code: '',
        invoice_number: '',
        purchase_date: '',
        remarks: '',
      });
      setEntryMode('batch');
      alert('Ticket created successfully!');
    } catch (err: any) {
      alert(`Failed to create ticket: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Assign ticket handler
  const handleAssignTicket = async () => {
    if (!selectedTicket || !assignmentData.assigneeId || assignmentData.assigneeId === 0) {
      alert('Please select an assignee.');
      return;
    }
    try {
      const assignedUser = users.find((u) => u.id === assignmentData.assigneeId);
      if (!assignedUser) {
        throw new Error('Assignee user not found in local data.');
      }
      let assignedToContentType = 'employee';
      switch (assignedUser.role) {
        case UserRole.COMPANY_ADMIN:
        case UserRole.COMPANY_EMPLOYEE:
          assignedToContentType = 'employee';
          break;
        case UserRole.DEALER_ADMIN:
        case UserRole.DEALER_EMPLOYEE:
          assignedToContentType = 'dealer';
          break;
        default:
          assignedToContentType = 'employee';
      }

      const updatedTicket = await updateTicket(selectedTicket.id, {
        assigned_to: {
          content_type: assignedToContentType,
          object_id: assignedUser.id,
        },
        status: TicketStatus.IN_PROGRESS,
      });

      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? {
                ...t,
                assigned_to: updatedTicket.assigned_to,
                assigned_to_display: {
                  name: assignedUser.name,
                  role: assignedUser.role,
                },
                status: updatedTicket.status,
              }
            : t
        )
      );
      setIsAssignDialogOpen(false);
      setSelectedTicket(null);
      setAssignmentData({ assigneeId: 0, notes: '' });
      alert('Ticket assigned successfully!');
    } catch (err: any) {
      alert(`Failed to assign ticket: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Direct close ticket handler
  const handleDirectCloseTicket = async (ticketToClose: any) => {
    try {
      const updatedTicket = await updateTicket(ticketToClose.id, {
        status: TicketStatus.CLOSED,
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketToClose.id
            ? {
                ...t,
                status: updatedTicket.status,
              }
            : t
        )
      );
      setSelectedTicket(null);
      alert('Ticket closed successfully!');
    } catch (err: any) {
      alert(`Failed to close ticket: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handler: Start Progress (Open → In Progress)
  const handleStartProgress = async (ticket: any) => {
    try {
      let updateData: any = {
        status: TicketStatus.IN_PROGRESS,
      };

      // If ticket is unassigned, assign to current user
      if (!ticket.assigned_to?.object_id) {
        let assignedToContentType = 'employee';
        switch (currentUser?.role) {
          case UserRole.COMPANY_ADMIN:
          case UserRole.COMPANY_EMPLOYEE:
            assignedToContentType = 'employee';
            break;
          case UserRole.DEALER_ADMIN:
          case UserRole.DEALER_EMPLOYEE:
            assignedToContentType = 'dealer';
            break;
          // Application Admin falls back to 'employee'
        }
        updateData.assigned_to = {
          content_type: assignedToContentType,
          object_id: currentUser?.id,
        };
      }

      const updatedTicket = await updateTicket(ticket.id, updateData);

      // Find assigned user for display update
      let assignedUser = null;
      if (updatedTicket.assigned_to?.object_id) {
        assignedUser = users.find((u) => u.id === updatedTicket.assigned_to.object_id);
      }

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticket.id
            ? {
                ...t,
                status: updatedTicket.status,
                assigned_to: updatedTicket.assigned_to,
                assigned_to_display: assignedUser
                  ? {
                      name: assignedUser.name,
                      role: assignedUser.role,
                    }
                  : null,
              }
            : t
        )
      );

      alert('Ticket status updated to In Progress');
    } catch (err: any) {
      alert(`Failed to update ticket: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Close ticket handler (with feedback for dealer)
  const handleCloseTicket = useCallback(
    (ticket: any) => {
      setSelectedTicket(ticket);

      const isDealer = [
        UserRole.DEALER_ADMIN,
        UserRole.DEALER_EMPLOYEE,
      ].includes(currentUser?.role as UserRole);

      if (isDealer) {
        setIsFeedbackDialogOpen(true);
        setFeedbackData({ feedbackNotes: '', rating: 0 });
        return;
      }

      if (
        currentUser?.role === UserRole.COMPANY_EMPLOYEE &&
        ticket.status === TicketStatus.RESOLVED
      ) {
        setIsFeedbackDialogOpen(true);
        setFeedbackData({ feedbackNotes: '', rating: 0 });
      } else {
        handleDirectCloseTicket(ticket);
      }
    },
    [currentUser]
  );

  // Feedback submit handler
  const handleFeedbackSubmit = async () => {
    if (!selectedTicket || !feedbackData.feedbackNotes || feedbackData.rating === 0) {
      alert('Please provide feedback notes and a rating.');
      return;
    }
    try {
      const updatedTicket = await updateTicket(selectedTicket.id, {
        status: TicketStatus.CLOSED,
        feedback_notes: feedbackData.feedbackNotes,
        rating: feedbackData.rating,
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? {
                ...t,
                status: updatedTicket.status,
                feedback_notes: updatedTicket.feedback_notes,
                rating: updatedTicket.rating,
              }
            : t
        )
      );
      setIsFeedbackDialogOpen(false);
      setSelectedTicket(null);
      setFeedbackData({ feedbackNotes: '', rating: 0 });
      alert('Feedback submitted and ticket closed!');
    } catch (err: any) {
      alert(`Failed to submit feedback and close ticket: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Assign dialog open
  const openAssignDialog = useCallback((ticket: any) => {
    setSelectedTicket(ticket);
    setAssignmentData({
      assigneeId: ticket.assigned_to?.object_id || 0,
      notes: '',
    });
    setIsAssignDialogOpen(true);
  }, []);

  // Resolve dialog open
  const openResolveDialog = useCallback((ticket: any) => {
    setSelectedTicket(ticket);
    setResolutionData({ resolutionNotes: '' });
    setIsResolveDialogOpen(true);
  }, []);

  // Resolve ticket handler
  const handleResolveTicket = async () => {
    if (!selectedTicket || !resolutionData.resolutionNotes.trim()) {
      alert('Please provide resolution notes.');
      return;
    }

    try {
      // Cast payload to any to avoid TypeScript error about resolved_at
      const updatedTicket = await updateTicket(selectedTicket.id, {
        status: TicketStatus.RESOLVED,
        resolution_notes: resolutionData.resolutionNotes,
        resolved_at: new Date().toISOString(),
      } as any);

      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? {
                ...t,
                status: updatedTicket.status,
                resolution_notes: updatedTicket.resolution_notes,
                resolved_at: updatedTicket.resolved_at,
              }
            : t
        )
      );

      setIsResolveDialogOpen(false);
      setSelectedTicket(null);
      setResolutionData({ resolutionNotes: '' });

      alert('Ticket marked as resolved!');
    } catch (err: any) {
      alert(
        `Failed to resolve ticket: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    }
  };

  // Open details dialog
  const openDetailsDialog = useCallback((ticket: any) => {
    setSelectedTicketDetails(ticket);
    setIsDetailsDialogOpen(true);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <h2 className="text-3xl font-bold tracking-tight">Service Tickets</h2>
          <Card>
            <CardContent className="p-4 text-center">Loading tickets...</CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <h2 className="text-3xl font-bold tracking-tight">Service Tickets</h2>
          <Card>
            <CardContent className="p-4 text-center text-destructive">{error}</CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Service Tickets</h2>
          <div className="flex items-center space-x-2">
            {canCreateTickets && (
              <Button onClick={() => setIsCreateTicketDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Ticket
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Tickets</CardTitle>
            <CardDescription>
              {isDealerUser
                ? 'Tickets assigned to you or created by you'
                : 'Manage all service and warranty tickets'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">Title</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Urgency</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Created By</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Assigned To</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Created Time</th>
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
                      filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 font-medium">{ticket.title}</td>
                          <td className="p-4">{getStatusBadge(ticket.status)}</td>
                          <td className="p-4">{getUrgencyBadge(ticket.urgency)}</td>
                          <td className="p-4">
                            {ticket.created_by_display ? (
                              <div>
                                <p className="font-medium">{ticket.created_by_display.name}</p>
                                <p className="text-xs text-muted-foreground">{ticket.created_by_display.role}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="p-4">
                            {ticket.assigned_to_display ? (
                              <div>
                                <p className="font-medium">{ticket.assigned_to_display.name}</p>
                                <p className="text-xs text-muted-foreground">{ticket.assigned_to_display.role}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </td>
                          <td className="p-4">{format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDetailsDialog(ticket)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                              {canManageTickets && (
                                <>
                                  {/* NEW: Start Progress button with confirmation */}
                                  {ticket.status === TicketStatus.OPEN && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setTicketToStart(ticket);
                                        setIsStartConfirmOpen(true);
                                      }}
                                      className="flex items-center gap-1"
                                    >
                                      <Play className="h-3 w-3" />
                                      Start Progress
                                    </Button>
                                  )}
                                  {(ticket.status === TicketStatus.OPEN ||
                                    ticket.status === TicketStatus.RESOLVED) &&
                                    !ticket.assigned_to?.object_id && (
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
                                  {ticket.status === TicketStatus.IN_PROGRESS && (
                                    <Button
                                      size="sm"
                                      onClick={() => openResolveDialog(ticket)}
                                      className="flex items-center gap-1"
                                    >
                                      <FileText className="h-3 w-3" />
                                      Resolve
                                    </Button>
                                  )}
                                </>
                              )}
                              {(ticket.status === TicketStatus.RESOLVED ||
                                ticket.status === TicketStatus.IN_PROGRESS ||
                                ticket.status === TicketStatus.OPEN) &&
                                canCloseTickets && (
                                  <Button
                                    size="sm"
                                    variant={isSystemAdmin ? 'default' : 'secondary'}
                                    onClick={() => handleCloseTicket(ticket)}
                                  >
                                    Close
                                  </Button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Ticket Dialog */}
        <Dialog open={isCreateTicketDialogOpen} onOpenChange={setIsCreateTicketDialogOpen}>
          <DialogContent className="sm:max-w-[600px] p-0 flex flex-col max-h-[90vh]">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>Create Service Ticket</DialogTitle>
              <DialogDescription>
                Submit a service or warranty ticket for a machine. You can search by batch number or enter details manually.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6">
              <Tabs defaultValue="batch" onValueChange={(value) => setEntryMode(value as 'batch' | 'manual')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="batch">Search by Batch</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                <TabsContent value="batch" className="space-y-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="batchSearch" className="text-right">Batch Number</Label>
                    <div className="col-span-3 flex gap-2">
                      <Input
                        id="batchSearch"
                        value={batchSearch}
                        onChange={(e) => setBatchSearch(e.target.value)}
                        placeholder="Enter batch number"
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleFetchMachineDetails} disabled={searchLoading}>
                        {searchLoading ? 'Fetching...' : 'Fetch'}
                      </Button>
                    </div>
                  </div>
                  {searchError && <div className="col-span-4 text-sm text-destructive text-center">{searchError}</div>}
                  {fetchedMachineDetails && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Machine Name</Label>
                        <div className="col-span-3 p-2 bg-muted rounded">{fetchedMachineDetails.item_name}</div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Item Code</Label>
                        <div className="col-span-3 p-2 bg-muted rounded">{fetchedMachineDetails.item_code}</div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Invoice Number</Label>
                        <div className="col-span-3 p-2 bg-muted rounded">{fetchedMachineDetails.invoice_number}</div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Purchase Date</Label>
                        <div className="col-span-3 p-2 bg-muted rounded">{fetchedMachineDetails.purchase_date}</div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Remarks</Label>
                        <div className="col-span-3 p-2 bg-muted rounded">{fetchedMachineDetails.remarks || 'N/A'}</div>
                      </div>
                    </>
                  )}
                </TabsContent>
                <TabsContent value="manual" className="space-y-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="manualBatchNumber" className="text-right">Batch Number *</Label>
                    <Input
                      id="manualBatchNumber"
                      value={manualEntry.batch_number}
                      onChange={(e) => handleManualEntryChange('batch_number', e.target.value)}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="manualItemName" className="text-right">Machine Name *</Label>
                    <Input
                      id="manualItemName"
                      value={manualEntry.item_name}
                      onChange={(e) => handleManualEntryChange('item_name', e.target.value)}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="manualItemCode" className="text-right">Item Code *</Label>
                    <Input
                      id="manualItemCode"
                      value={manualEntry.item_code}
                      onChange={(e) => handleManualEntryChange('item_code', e.target.value)}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="manualInvoiceNumber" className="text-right">Invoice Number *</Label>
                    <Input
                      id="manualInvoiceNumber"
                      value={manualEntry.invoice_number}
                      onChange={(e) => handleManualEntryChange('invoice_number', e.target.value)}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="manualPurchaseDate" className="text-right">Purchase Date *</Label>
                    <Input
                      id="manualPurchaseDate"
                      type="date"
                      value={manualEntry.purchase_date}
                      onChange={(e) => handleManualEntryChange('purchase_date', e.target.value)}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="manualRemarks" className="text-right">Remarks</Label>
                    <Textarea
                      id="manualRemarks"
                      value={manualEntry.remarks}
                      onChange={(e) => handleManualEntryChange('remarks', e.target.value)}
                      className="col-span-3"
                      placeholder="Optional remarks"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              <div className="grid gap-4 py-4 border-t">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title *</Label>
                  <Input
                    id="title"
                    value={newTicket.title}
                    onChange={(e) => handleNewTicketChange('title', e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description *</Label>
                  <Textarea
                    id="description"
                    value={newTicket.description}
                    onChange={(e) => handleNewTicketChange('description', e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category *</Label>
                  <Select
                    value={newTicket.category.toString() || '0'}
                    onValueChange={(value) => handleNewTicketChange('category', Number(value))}
                    required
                  >
                    <SelectTrigger id="category" className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" disabled>Select a Category</SelectItem>
                      {categories.length === 0 ? (
                        <SelectItem value="-1" disabled>No categories available</SelectItem>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id.toString()} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="urgency" className="text-right">Urgency *</Label>
                  <Select
                    value={newTicket.urgency}
                    onValueChange={(value) => handleNewTicketChange('urgency', value as TicketUrgency)}
                    required
                  >
                    <SelectTrigger id="urgency" className="col-span-3">
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TicketUrgency).map((urgency) => (
                        <SelectItem key={urgency} value={urgency}>
                          {urgency.charAt(0).toUpperCase() + urgency.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {canManageTickets && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="assigned_to" className="text-right">Assign To</Label>
                    <Select
                      value={
  newTicket.assigned_to
    ? `${users.find(u => u.id === newTicket.assigned_to?.object_id)?.role}-${newTicket.assigned_to.object_id}`
    : '0'
}
                      onValueChange={(value) => {
                        if (value === '0') {
                          handleNewTicketChange('assigned_to', null);
                        } else {
                          const [role, id] = value.split('-');

const selectedUser = users.find(
  (u) => u.id === Number(id) && u.role === role
);
                          if (!selectedUser) return;
                          let assignedToContentType = 'employee';
                          switch (selectedUser.role) {
                            case UserRole.COMPANY_ADMIN:
                            case UserRole.COMPANY_EMPLOYEE:
                              assignedToContentType = 'employee';
                              break;
                            case UserRole.DEALER_ADMIN:
                            case UserRole.DEALER_EMPLOYEE:
                              assignedToContentType = 'dealer';
                              break;
                            default:
                              assignedToContentType = 'employee';
                          }
                          handleNewTicketChange('assigned_to', {
  content_type: role === 'DEALER_ADMIN' || role === 'DEALER_EMPLOYEE' 
    ? 'dealer' 
    : 'employee',
  object_id: Number(id),
});
                        }
                      }}
                    >
                      <SelectTrigger id="assigned_to" className="col-span-3">
                        <SelectValue placeholder="Select an assignee (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Unassigned</SelectItem>
                        {users.length === 0 ? (
                          <SelectItem value="-1" disabled>No users available</SelectItem>
                        ) : (
                          users.map((user) => (
                            <SelectItem 
  key={`${user.role}-${user.id}`} 
  value={`${user.role}-${user.id}`}
>
                              {user.name} ({user.role})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="px-6 pb-6 pt-2 border-t">
              <Button type="submit" onClick={handleCreateTicket}>Create Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Ticket Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assign Ticket</DialogTitle>
              <DialogDescription>Assign ticket #{selectedTicket?.id} to a user.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignee" className="text-right">Assignee</Label>
                <Select
                  value={assignmentData.assigneeId.toString()}
                  onValueChange={(value) => setAssignmentData((prev) => ({ ...prev, assigneeId: Number(value) }))}
                >
                  <SelectTrigger id="assignee" className="col-span-3">
                    <SelectValue placeholder="Select an assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" disabled>Select an Assignee</SelectItem>
                    {users.map((user) => (
                      <SelectItem 
  key={`${user.role}-${user.id}`} 
  value={`${user.role}-${user.id}`}
>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignmentNotes" className="text-right">Notes</Label>
                <Textarea
                  id="assignmentNotes"
                  value={assignmentData.notes}
                  onChange={(e) => setAssignmentData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3"
                  placeholder="Optional notes for assignment"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAssignTicket}>Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resolve Ticket Dialog */}
        <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Resolve Ticket</DialogTitle>
              <DialogDescription>Mark ticket #{selectedTicket?.id} as resolved.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resolutionNotes" className="text-right">Resolution Notes</Label>
                <Textarea
                  id="resolutionNotes"
                  value={resolutionData.resolutionNotes}
                  onChange={(e) => setResolutionData((prev) => ({ ...prev, resolutionNotes: e.target.value }))}
                  className="col-span-3"
                  placeholder="Describe the resolution"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleResolveTicket}>Mark as Resolved</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Provide Feedback</DialogTitle>
              <DialogDescription>Provide feedback for ticket #{selectedTicket?.id} and close it.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="feedbackNotes" className="text-right">Feedback Notes</Label>
                <Textarea
                  id="feedbackNotes"
                  value={feedbackData.feedbackNotes}
                  onChange={(e) => setFeedbackData((prev) => ({ ...prev, feedbackNotes: e.target.value }))}
                  className="col-span-3"
                  placeholder="Share your feedback on the resolution"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rating" className="text-right">Rating</Label>
                <Slider
                  id="rating"
                  min={1}
                  max={5}
                  step={1}
                  value={[feedbackData.rating]}
                  onValueChange={(value) => setFeedbackData((prev) => ({ ...prev, rating: value[0] }))}
                  className="col-span-3"
                />
                <div className="col-span-4 text-center text-sm">Current Rating: {feedbackData.rating || 'N/A'}</div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleFeedbackSubmit}>Submit Feedback & Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ticket Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ticket Details</DialogTitle>
              <DialogDescription>Complete information for ticket #{selectedTicketDetails?.id}</DialogDescription>
            </DialogHeader>
            {selectedTicketDetails && (
              <div className="space-y-4 py-4">
                {/* Title & Description */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-semibold">Title:</div>
                  <div className="col-span-2">{selectedTicketDetails.title}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-semibold">Description:</div>
                  <div className="col-span-2">{selectedTicketDetails.description}</div>
                </div>

                {/* Category & Status & Urgency */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-semibold">Category:</div>
                  <div className="col-span-2">{selectedTicketDetails.category_name || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-semibold">Status:</div>
                  <div className="col-span-2">{getStatusBadge(selectedTicketDetails.status)}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-semibold">Urgency:</div>
                  <div className="col-span-2">{getUrgencyBadge(selectedTicketDetails.urgency)}</div>
                </div>

                {/* Machine Details (from ticket fields) */}
                <div className="border-t pt-2">
                  <h4 className="font-semibold mb-2">Machine Information</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-semibold">Item Name:</div>
                    <div className="col-span-2">{selectedTicketDetails.item_name || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-semibold">Item Code:</div>
                    <div className="col-span-2">{selectedTicketDetails.item_code || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-semibold">Batch Number:</div>
                    <div className="col-span-2">{selectedTicketDetails.batch_number || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-semibold">Invoice Number:</div>
                    <div className="col-span-2">{selectedTicketDetails.invoice_number || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-semibold">Purchase Date:</div>
                    <div className="col-span-2">
                      {selectedTicketDetails.purchase_date
                        ? format(new Date(selectedTicketDetails.purchase_date), 'PPP')
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-semibold">Remarks:</div>
                    <div className="col-span-2">{selectedTicketDetails.remarks || 'N/A'}</div>
                  </div>
                </div>

                {/* People */}
                <div className="border-t pt-2">
                  <h4 className="font-semibold mb-2">People</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-semibold">Created By:</div>
                    <div className="col-span-2">
                      {selectedTicketDetails.created_by_display
                        ? `${selectedTicketDetails.created_by_display.name} (${selectedTicketDetails.created_by_display.role})`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-semibold">Assigned To:</div>
                    <div className="col-span-2">
                      {selectedTicketDetails.assigned_to_display
                        ? `${selectedTicketDetails.assigned_to_display.name} (${selectedTicketDetails.assigned_to_display.role})`
                        : 'Unassigned'}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="border-t pt-2">
                  <h4 className="font-semibold mb-2">Timeline</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-semibold">Created At:</div>
                    <div className="col-span-2">
                      {format(new Date(selectedTicketDetails.created_at), 'PPP p')}
                    </div>
                  </div>
                  {/* NEW: Show started_at if exists */}
                  {selectedTicketDetails.started_at && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-semibold">Started At:</div>
                      <div className="col-span-2">
                        {format(new Date(selectedTicketDetails.started_at), 'PPP p')}
                      </div>
                    </div>
                  )}
                  {selectedTicketDetails.resolved_at && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-semibold">Resolved At:</div>
                      <div className="col-span-2">
                        {format(new Date(selectedTicketDetails.resolved_at), 'PPP p')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Feedback */}
                {(selectedTicketDetails.feedback_notes || selectedTicketDetails.rating) && (
                  <div className="border-t pt-2">
                    <h4 className="font-semibold mb-2">Feedback</h4>
                    {selectedTicketDetails.feedback_notes && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="font-semibold">Notes:</div>
                        <div className="col-span-2">{selectedTicketDetails.feedback_notes}</div>
                      </div>
                    )}
                    {selectedTicketDetails.rating && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="font-semibold">Rating:</div>
                        <div className="col-span-2">{selectedTicketDetails.rating} / 5</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* NEW: Confirm Start Progress Dialog */}
        <Dialog open={isStartConfirmOpen} onOpenChange={setIsStartConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Start Progress</DialogTitle>
              <DialogDescription>
                Are you sure you want to start progress on ticket #{ticketToStart?.id}?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                This will change the ticket status to <strong>In Progress</strong> and record the start time.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStartConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setIsStartConfirmOpen(false);
                  if (ticketToStart) {
                    handleStartProgress(ticketToStart);
                  }
                }}
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Tickets;