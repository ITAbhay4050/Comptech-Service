
import { useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Task, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FilterIcon, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

// Mock data for tasks
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Install CLX-5000 at Client HQ',
    description: 'New machine installation at client headquarters',
    createdAt: '2023-05-10',
    deadline: '2023-05-15',
    priority: 'high',
    status: 'completed',
    assignerId: '2', // Company Admin
    assigneeId: '3', // Company Employee
    machineId: '1',
  },
  {
    id: '2',
    title: 'Verify RVX-300 installation',
    description: 'Perform quality check on recent installation',
    createdAt: '2023-06-18',
    deadline: '2023-06-22',
    priority: 'medium',
    status: 'completed',
    assignerId: '2', // Company Admin
    assigneeId: '3', // Company Employee
    machineId: '2',
  },
  {
    id: '3',
    title: 'Prepare site for CLX-6000 installation',
    description: 'Visit client site and ensure all requirements are met',
    createdAt: '2023-07-01',
    deadline: '2023-07-10',
    priority: 'low',
    status: 'pending',
    assignerId: '4', // Dealer Admin
    assigneeId: '5', // Dealer Employee
    machineId: '3',
  },
  {
    id: '4',
    title: 'Repair RVX-200 cooling system',
    description: 'Client reported overheating issues',
    createdAt: '2023-04-05',
    deadline: '2023-04-10',
    priority: 'urgent',
    status: 'in-progress',
    assignerId: '2', // Company Admin
    assigneeId: '3', // Company Employee
    machineId: '4',
  },
];

// Mock user data for assignment dropdown
const mockUsers = [
  { id: '3', name: 'Company Employee', role: UserRole.COMPANY_EMPLOYEE },
  { id: '5', name: 'Dealer Employee', role: UserRole.DEALER_EMPLOYEE },
];

const Tasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    deadline: new Date().toISOString().split('T')[0],
    priority: 'medium',
    status: 'pending',
    assignerId: user?.id,
  });
  
  // Check if user can assign tasks
  const canAssignTasks = 
    user?.role === UserRole.APPLICATION_ADMIN || 
    user?.role === UserRole.COMPANY_ADMIN || 
    user?.role === UserRole.DEALER_ADMIN ||
    user?.role === UserRole.COMPANY_EMPLOYEE;
  
  // Filter tasks based on search term and status
  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter ? task.status === statusFilter : true;
    
    // Show only assigned tasks for employees
    if (user?.role === UserRole.COMPANY_EMPLOYEE || user?.role === UserRole.DEALER_EMPLOYEE) {
      return matchesSearch && matchesStatus && task.assigneeId === user.id;
    }
    
    // For dealer admin, only show their tasks or tasks assigned by them
    if (user?.role === UserRole.DEALER_ADMIN) {
      return matchesSearch && 
        matchesStatus && 
        (task.assignerId === user.id || task.assigneeId === user.id);
    }
    
    return matchesSearch && matchesStatus;
  });
  
  // Task priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Low</Badge>;
      case 'medium':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">High</Badge>;
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Urgent</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Task status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>In Progress</span>
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const handleTaskChange = (field: string, value: string) => {
    setNewTask(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleCreateTask = () => {
    if (!newTask.title || !newTask.description || !newTask.assigneeId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would be an API call
    toast({
      title: "Success",
      description: "Task has been created successfully",
    });
    
    setIsCreateTaskDialogOpen(false);
    setNewTask({
      title: '',
      description: '',
      deadline: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending',
      assignerId: user?.id,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => setIsCreateTaskDialogOpen(true)}
              disabled={!canAssignTasks}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Task Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
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
                    variant={statusFilter === 'pending' ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter('pending')}
                  >
                    Pending
                  </Button>
                  <Button 
                    variant={statusFilter === 'in-progress' ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter('in-progress')}
                  >
                    In Progress
                  </Button>
                  <Button 
                    variant={statusFilter === 'completed' ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter('completed')}
                  >
                    Completed
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Tasks Table */}
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">Title</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Deadline</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Priority</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          No tasks found
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map(task => (
                        <tr 
                          key={task.id} 
                          className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                        >
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                            </div>
                          </td>
                          <td className="p-4">{task.deadline}</td>
                          <td className="p-4">{getPriorityBadge(task.priority)}</td>
                          <td className="p-4">{getStatusBadge(task.status)}</td>
                          <td className="p-4 text-right">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
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
        
        {/* Create Task Dialog */}
        <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Assign a task to a company or dealer employee.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => handleTaskChange('title', e.target.value)}
                  placeholder="Enter task title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => handleTaskChange('description', e.target.value)}
                  placeholder="Provide detailed instructions"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => handleTaskChange('deadline', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => handleTaskChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignee">Assign To *</Label>
                <Select
                  onValueChange={(value) => handleTaskChange('assigneeId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role.replace('_', ' ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
