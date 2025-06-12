
import { useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import PurchaseVerification from '@/components/MachineInstallation/PurchaseVerification';

interface PurchasedMachine {
  id: string;
  model: string;
  serialNumber: string;
  batchNumber: string;
  invoiceNumber: string;
  purchaseDate: string;
  isInstalled: boolean;
  dealerId: string;
}

const MachineInstallation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<PurchasedMachine | null>(null);
  const [formData, setFormData] = useState({
    installationDate: new Date().toISOString().split('T')[0],
    installedBy: user?.name || '',
    location: '',
    notes: '',
  });

  // Check if user has permission to fill this form
  const canFillForm = user?.role === UserRole.COMPANY_EMPLOYEE || user?.role === UserRole.DEALER_EMPLOYEE;
  const isDealerEmployee = user?.role === UserRole.DEALER_EMPLOYEE;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMachineSelected = (machine: PurchasedMachine) => {
    setSelectedMachine(machine);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMachine) {
      toast({
        title: "Error",
        description: "Please select a machine from your purchase records",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.location) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // In a real app, this would be an API call to update the machine installation
    setTimeout(() => {
      toast({
        title: "Success",
        description: `Machine ${selectedMachine.serialNumber} installation recorded successfully`,
      });
      setIsSubmitting(false);
      navigate('/machines');
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Purchase Verification Section - Only for Dealer Employees */}
        {isDealerEmployee && (
          <PurchaseVerification
            onMachineSelected={handleMachineSelected}
            selectedMachine={selectedMachine}
          />
        )}

        {/* Installation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Machine Installation Form
              {selectedMachine && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </CardTitle>
            <CardDescription>
              {isDealerEmployee 
                ? "Complete installation details for the selected machine from your purchase records"
                : "Record a new machine installation for client sites"
              }
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Machine Information Display */}
              {selectedMachine ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Selected Machine Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Model:</span> {selectedMachine.model}
                    </div>
                    <div>
                      <span className="font-medium">Serial Number:</span> {selectedMachine.serialNumber}
                    </div>
                    <div>
                      <span className="font-medium">Batch Number:</span> {selectedMachine.batchNumber}
                    </div>
                    <div>
                      <span className="font-medium">Invoice Number:</span> {selectedMachine.invoiceNumber}
                    </div>
                  </div>
                </div>
              ) : isDealerEmployee ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Please select a machine from your purchase records above</span>
                  </div>
                </div>
              ) : null}

              {/* Installation Date */}
              <div className="space-y-2">
                <Label htmlFor="installationDate">Installation Date *</Label>
                <Input
                  id="installationDate"
                  name="installationDate"
                  type="date"
                  value={formData.installationDate}
                  onChange={handleChange}
                  disabled={!canFillForm || isSubmitting}
                  required
                />
              </div>

              {/* Installed By */}
              <div className="space-y-2">
                <Label htmlFor="installedBy">Installed By *</Label>
                <Input
                  id="installedBy"
                  name="installedBy"
                  value={formData.installedBy}
                  onChange={handleChange}
                  disabled={true} // Automatically filled with current user
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Client Site Location *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g. 123 Main St, Suite 200, New York, NY 10001"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={!canFillForm || isSubmitting}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Installation Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Enter any additional notes about the installation..."
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={!canFillForm || isSubmitting}
                  rows={4}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canFillForm || isSubmitting || (isDealerEmployee && !selectedMachine)}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Installation'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MachineInstallation;
