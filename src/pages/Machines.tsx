
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Machine, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { PlusCircle, Search, FilterIcon, CheckCircle2, Clock, WrenchIcon, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

// Mock data for machines
const mockMachines: Machine[] = [
  {
    id: '1',
    model: 'CLX-5000 Standard',
    serialNumber: 'CLX5000-12345-AB',
    installationDate: '2023-05-15',
    installedById: '3',
    location: '123 Main St, New York, NY',
    notes: 'Installed without issues',
    status: 'installed',
  },
  {
    id: '2',
    model: 'RVX-300 Advanced',
    serialNumber: 'RVX300-67890-CD',
    installationDate: '2023-06-22',
    installedById: '3',
    location: '456 Park Ave, Los Angeles, CA',
    notes: 'Client requested additional training',
    status: 'installed',
  },
  {
    id: '3',
    model: 'CLX-6000 Pro',
    serialNumber: 'CLX6000-24680-EF',
    status: 'pending',
  },
  {
    id: '4',
    model: 'RVX-200 Compact',
    serialNumber: 'RVX200-13579-GH',
    installationDate: '2023-04-10',
    installedById: '5',
    location: '789 Broadway, Chicago, IL',
    status: 'servicing',
  }
];

const Machines = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Check if user can add new machines
  const canAddMachine = user?.role === UserRole.APPLICATION_ADMIN || user?.role === UserRole.COMPANY_ADMIN;
  
  // Filter machines based on search term and status
  const filteredMachines = mockMachines.filter(machine => {
    const matchesSearch = 
      machine.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (machine.location && machine.location.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = statusFilter ? machine.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });
  
  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'installed':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Installed</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
      case 'servicing':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
            <WrenchIcon className="h-3 w-3" />
            <span>Servicing</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Unknown</span>
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Machines</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => navigate('/machine-installation')}
              disabled={!canAddMachine}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Installation</span>
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Machine Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search machines..."
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
                    variant={statusFilter === 'installed' ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter('installed')}
                  >
                    Installed
                  </Button>
                  <Button 
                    variant={statusFilter === 'pending' ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter('pending')}
                  >
                    Pending
                  </Button>
                  <Button 
                    variant={statusFilter === 'servicing' ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter('servicing')}
                  >
                    Servicing
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Machines Table */}
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">Model</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Serial Number</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Location</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Installation Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMachines.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          No machines found
                        </td>
                      </tr>
                    ) : (
                      filteredMachines.map(machine => (
                        <tr 
                          key={machine.id} 
                          className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigate(`/machines/${machine.id}`)}
                        >
                          <td className="p-4">{machine.model}</td>
                          <td className="p-4">{machine.serialNumber}</td>
                          <td className="p-4">{machine.location || 'N/A'}</td>
                          <td className="p-4">{machine.installationDate || 'Not installed'}</td>
                          <td className="p-4">{getStatusBadge(machine.status)}</td>
                          <td className="p-4 text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                navigate(`/machines/${machine.id}`);
                              }}
                            >
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
      </div>
    </DashboardLayout>
  );
};

export default Machines;
