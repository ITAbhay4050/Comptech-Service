
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  MapPin, 
  User, 
  FileText, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  History
} from 'lucide-react';

// Mock data for machine details and history
const mockMachineDetails = {
  '1': {
    id: '1',
    model: 'CLX-5000 Standard',
    serialNumber: 'CLX5000-12345-AB',
    batchNumber: 'BTH-2024-001',
    invoiceNumber: 'INV-2024-0001',
    purchaseDate: '2024-01-15',
    installationDate: '2023-05-15',
    installedById: '3',
    installedBy: 'John Smith',
    location: '123 Main St, New York, NY',
    notes: 'Installed without issues',
    status: 'installed',
    condition: 'Excellent',
    dealerName: 'TechSolutions Inc.',
    companyName: 'ABC Manufacturing',
    serviceHistory: [
      {
        id: 'srv1',
        date: '2023-08-15',
        type: 'Routine Maintenance',
        technician: 'Mike Johnson',
        description: 'Regular maintenance check and cleaning',
        partsReplaced: ['Air Filter', 'Oil Filter'],
        notes: 'All systems functioning normally',
        status: 'completed'
      },
      {
        id: 'srv2',
        date: '2023-11-20',
        type: 'Repair',
        technician: 'Sarah Wilson',
        description: 'Fixed hydraulic pump issue',
        partsReplaced: ['Hydraulic Pump', 'Seal Kit'],
        notes: 'Pump was making unusual noise, replaced with new unit',
        status: 'completed'
      }
    ]
  },
  '2': {
    id: '2',
    model: 'RVX-300 Advanced',
    serialNumber: 'RVX300-67890-CD',
    batchNumber: 'BTH-2024-002',
    invoiceNumber: 'INV-2024-0002',
    purchaseDate: '2024-01-20',
    installationDate: '2023-06-22',
    installedById: '3',
    installedBy: 'John Smith',
    location: '456 Park Ave, Los Angeles, CA',
    notes: 'Client requested additional training',
    status: 'installed',
    condition: 'Good',
    dealerName: 'WestCoast Equipment',
    companyName: 'XYZ Industries',
    serviceHistory: [
      {
        id: 'srv3',
        date: '2023-09-10',
        type: 'Software Update',
        technician: 'Alex Brown',
        description: 'Updated control system firmware',
        partsReplaced: [],
        notes: 'Firmware updated to version 2.1.3',
        status: 'completed'
      }
    ]
  }
};

const MachineDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const machine = id ? mockMachineDetails[id as keyof typeof mockMachineDetails] : null;

  if (!machine) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900">Machine Not Found</h2>
          <p className="text-gray-600 mt-2">The requested machine could not be found.</p>
          <Button onClick={() => navigate('/machines')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Machines
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'installed':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Installed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'servicing':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            <Wrench className="h-3 w-3 mr-1" />
            Servicing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const getConditionBadge = (condition: string) => {
    const colorMap = {
      'Excellent': 'bg-green-100 text-green-800 border-green-300',
      'Good': 'bg-blue-100 text-blue-800 border-blue-300',
      'Fair': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Poor': 'bg-red-100 text-red-800 border-red-300'
    };
    
    return (
      <Badge variant="outline" className={colorMap[condition as keyof typeof colorMap] || 'bg-gray-100 text-gray-800 border-gray-300'}>
        {condition}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/machines')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Machines
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{machine.model}</h1>
              <p className="text-muted-foreground">Serial: {machine.serialNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(machine.status)}
            {getConditionBadge(machine.condition)}
          </div>
        </div>

        {/* Machine Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Machine Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Model</label>
                  <p className="font-medium">{machine.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                  <p className="font-medium">{machine.serialNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Batch Number</label>
                  <p className="font-medium">{machine.batchNumber}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Purchase Date</label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(machine.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Installation Date</label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(machine.installationDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                  <p className="font-medium">{machine.invoiceNumber}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Location</label>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {machine.location}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Installed By</label>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {machine.installedBy}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Condition</label>
                  <div>{getConditionBadge(machine.condition)}</div>
                </div>
              </div>
            </div>
            
            {machine.notes && (
              <>
                <Separator className="my-4" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Installation Notes</label>
                  <p className="mt-1 text-sm">{machine.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Company & Dealer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company & Dealer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Company</label>
                <p className="font-medium">{machine.companyName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dealer</label>
                <p className="font-medium">{machine.dealerName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Service History ({machine.serviceHistory.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {machine.serviceHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No service records found</p>
            ) : (
              <div className="space-y-4">
                {machine.serviceHistory.map((service, index) => (
                  <div key={service.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          {service.type}
                        </h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(service.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {service.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-muted-foreground">Technician</label>
                        <p className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {service.technician}
                        </p>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Description</label>
                        <p>{service.description}</p>
                      </div>
                    </div>
                    
                    {service.partsReplaced.length > 0 && (
                      <div className="mt-3">
                        <label className="font-medium text-muted-foreground text-sm">Parts Replaced</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {service.partsReplaced.map((part, partIndex) => (
                            <Badge key={partIndex} variant="secondary" className="text-xs">
                              {part}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {service.notes && (
                      <div className="mt-3">
                        <label className="font-medium text-muted-foreground text-sm">Service Notes</label>
                        <p className="text-sm mt-1 flex items-start gap-2">
                          <FileText className="h-3 w-3 mt-0.5" />
                          {service.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MachineDetails;
