import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Machine, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, FilterIcon, CheckCircle2, Clock, WrenchIcon, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const Machines = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);

  const canAddMachine = user?.role === UserRole.APPLICATION_ADMIN || user?.role === UserRole.COMPANY_ADMIN;

  // Fetch machines from backend
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/installations/`, {
          headers: user?.token ? { Authorization: `Token ${user.token}` } : undefined
        });
        const data = await res.json();
        setMachines(data);
      } catch (error) {
        console.error("Error fetching machines:", error);
      }
    };

    fetchMachines();
  }, [user?.token]);

  // Filtered list
  const filteredMachines = machines.filter((machine) => {
    const matchesSearch =
      machine.model_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? machine.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'installed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Installed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'servicing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1"><WrenchIcon className="h-3 w-3" />Servicing</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 flex items-center gap-1"><AlertCircle className="h-3 w-3" />Unknown</Badge>;
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
              New Installation
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Machine Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search machines..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Filter:</span>
                <div className="flex gap-2">
                  {['All', 'installed', 'pending', 'servicing'].map((s) => (
                    <Button
                      key={s}
                      variant={statusFilter === (s === 'All' ? null : s) ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(s === 'All' ? null : s)}
                    >
                      {s[0].toUpperCase() + s.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b">
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left">Model</th>
                      <th className="h-12 px-4 text-left">Serial Number</th>
                      <th className="h-12 px-4 text-left">Location</th>
                      <th className="h-12 px-4 text-left">Installation Date</th>
                      <th className="h-12 px-4 text-left">Status</th>
                      <th className="h-12 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMachines.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">No machines found</td>
                      </tr>
                    ) : (
                      filteredMachines.map((machine) => (
                        <tr key={machine.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/machines/${machine.id}`)}>
                          <td className="p-4">{machine.model_number}</td>
                          <td className="p-4">{machine.serial_number}</td>
                          <td className="p-4">{machine.location || 'N/A'}</td>
                          <td className="p-4">{machine.installation_date || 'Not installed'}</td>
                          <td className="p-4">{getStatusBadge(machine.status)}</td>
                          <td className="p-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
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
