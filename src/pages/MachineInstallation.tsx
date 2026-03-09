import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle2, AlertTriangle, Upload, X as Close, Search } from "lucide-react";
import { UserRole } from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
const API_URL = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png"];

type FormData = {
  installationDate: string;
  installedBy: string;
  clientCompanyName: string;
  clientGstNumber: string;
  clientContactPerson: string;
  clientContactPhone: string;
  location: string;
  notes: string;
  itemName: string;
  itemCode: string;
  batchNumber: string;
  invoiceNumber: string;
  purchaseDate: string;
};

export default function MachineInstallation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const allowedRoles: UserRole[] = [
    UserRole.COMPANY_EMPLOYEE,
    UserRole.COMPANY_ADMIN,
    UserRole.DEALER_EMPLOYEE,
    UserRole.DEALER_ADMIN,
    UserRole.SYSTEM_ADMIN,
  ];
  
  // Fix: Check if user exists and has a role that's in the allowedRoles array
  const canAccess = user && allowedRoles.includes(user.role as UserRole);

  const [isSubmitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [batchInput, setBatchInput] = useState<string>("");
  const [detailsFetched, setDetailsFetched] = useState(false);

  // Check user roles for editing permissions
  const isDealerUser = user?.role === UserRole.DEALER_EMPLOYEE || user?.role === UserRole.DEALER_ADMIN;
  const isCompanyUser = user?.role === UserRole.COMPANY_EMPLOYEE || user?.role === UserRole.COMPANY_ADMIN || user?.role === UserRole.SYSTEM_ADMIN;

  const [form, setForm] = useState<FormData>({
    installationDate: new Date().toISOString().split("T")[0],
    installedBy: user?.name ?? "Unknown Installer",
    clientCompanyName: "",
    clientGstNumber: "",
    clientContactPerson: "",
    clientContactPhone: "",
    location: "",
    notes: "",
    itemName: "",
    itemCode: "",
    batchNumber: "",
    invoiceNumber: "",
    purchaseDate: "",
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  useEffect(() => {
    if (detailsFetched && batchInput !== form.batchNumber) {
      setDetailsFetched(false);
      if (isDealerUser) {
        setForm((prev) => ({
          ...prev,
          itemName: "",
          itemCode: "",
          invoiceNumber: "",
          purchaseDate: "",
        }));
      }
    }
  }, [batchInput, detailsFetched, form.batchNumber, isDealerUser]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const accepted: File[] = [];

    files.forEach((f) => {
      const isTypeValid = ALLOWED_FILE_TYPES.includes(f.type);
      const isSizeValid = f.size <= MAX_SIZE;
      const isDuplicate = photos.some((p) => p.name === f.name && p.size === f.size);
      if (isTypeValid && isSizeValid && !isDuplicate) accepted.push(f);
    });

    if (accepted.length !== files.length) {
      toast({
        title: "Invalid file(s)",
        description: "Only JPEG/PNG up to 5 MB are allowed and no duplicates",
        variant: "destructive",
      });
    }
    setPhotos((prev) => [...prev, ...accepted]);
  };

  const removePhoto = useCallback(
    (index: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== index)),
    []
  );

  const fetchMachineDetails = useCallback(async () => {
    if (!batchInput) {
      toast({ title: "Missing Batch Number", description: "Enter batch number.", variant: "destructive" });
      return;
    }

    if (!user?.token) {
      toast({ title: "Authentication Error", description: "Please log in again.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const url = `${API_URL}/dealers/get-data-by-batch/?batch=${encodeURIComponent(batchInput)}`;
      const res = await fetch(url, {
        headers: { 
          'Authorization': `Token ${user.token}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.status === 401 || res.status === 403) {
        const data = await res.json();
        toast({
          title: "Authentication Failed",
          description: data.error || "Please log in again.",
          variant: "destructive",
        });
        setDetailsFetched(false);
        if (isDealerUser) {
          setForm((prev) => ({
            ...prev,
            itemName: "",
            itemCode: "",
            invoiceNumber: "",
            purchaseDate: "",
          }));
        }
        setSubmitting(false);
        return;
      }

      if (!res.ok) throw new Error("Could not fetch machine details.");
      const data = await res.json();

      if (!data) {
        toast({ title: "Not Found", description: "No machine found.", variant: "destructive" });
        setDetailsFetched(false);
        return;
      }

      setForm((prev) => ({
        ...prev,
        itemName: data.item_name || "",
        itemCode: data.item_code || "",
        batchNumber: batchInput,
        invoiceNumber: data.invoice_number || "",
        purchaseDate: data.purchase_date ? new Date(data.purchase_date).toISOString().split("T")[0] : "",
      }));
      setDetailsFetched(true);
      toast({ title: "Success", description: "Machine details fetched." });
    } catch (error: any) {
      toast({ title: "Fetch Error", description: error.message, variant: "destructive" });
      setDetailsFetched(false);
    } finally {
      setSubmitting(false);
    }
  }, [batchInput, user?.token, isDealerUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user?.token) {
      toast({ 
        title: "Authentication Error", 
        description: "Please log in again to submit the form.", 
        variant: "destructive" 
      });
      return;
    }
    
    const requiredFields = {
      clientCompanyName: "Client Company Name",
      clientGstNumber: "Client GST Number",
      clientContactPerson: "Contact Person",
      clientContactPhone: "Contact Phone",
      batchNumber: "Batch Number",
      location: "Installation location",
      itemName: "Item Name",
      itemCode: "Item Code",
      invoiceNumber: "Invoice Number",
      purchaseDate: "Purchase Date",
    };
    
    const missingField = Object.entries(requiredFields).find(([f]) => !form[f as keyof FormData]);
    if (missingField) {
      toast({ title: "Error", description: `${missingField[1]} is required`, variant: "destructive" });
      return;
    }

    if (!window.confirm("Submit installation details?")) return;

    setSubmitting(true);
    const fd = new FormData();
    
    // Format dates properly for the API
    const formattedInstallationDate = new Date(form.installationDate).toISOString().split('T')[0];
    const formattedPurchaseDate = form.purchaseDate ? new Date(form.purchaseDate).toISOString().split('T')[0] : '';
    
    fd.append("installation_date", formattedInstallationDate);
    fd.append("installed_by", form.installedBy);
    fd.append("location", form.location);
    fd.append("notes", form.notes);
    fd.append("client_company_name", form.clientCompanyName);
    fd.append("client_gst_number", form.clientGstNumber);
    fd.append("client_contact_person", form.clientContactPerson);
    fd.append("client_contact_phone", form.clientContactPhone);
    fd.append("batch_number", form.batchNumber);
    fd.append("item_name", form.itemName);
    fd.append("item_code", form.itemCode);
    fd.append("invoice_number", form.invoiceNumber);
    
    if (form.purchaseDate) {
      fd.append("purchase_date", formattedPurchaseDate);
    }

    if (user?.companyId) fd.append("company", String(user.companyId));
    if (user?.dealerId) fd.append("dealer", String(user.dealerId));

    fd.append("submitted_by", String(user?.id));
    fd.append("submitted_by_name", user?.name ?? "");
    fd.append("submitted_by_role", user?.role ?? "");
    photos.forEach((p) => fd.append("photo_files", p));

    try {
      const res = await fetch(`${API_URL}/installations/create/`, {
        method: "POST",
        headers: { 
          'Authorization': `Token ${user.token}`
        },
        body: fd,
      });
      
      // Check if response is JSON before trying to parse it
      const contentType = res.headers.get("content-type");
      let responseData;
      
      if (contentType && contentType.includes("application/json")) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }
      
      if (!res.ok) {
        console.error("API Error Response:", responseData);
        throw new Error(
          typeof responseData === 'object' 
            ? responseData.detail || responseData.message || "Failed to submit installation"
            : "Failed to submit installation"
        );
      }

      toast({ title: "Success", description: "Installation saved successfully" });
      navigate("/machines");
    } catch (err: any) {
      console.error("Submission error:", err);
      toast({ 
        title: "Error", 
        description: err.message || "Failed to submit installation. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Fix: Show access denied only if user exists but doesn't have permission
  if (user && !canAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only authorized roles can access this form.</p>
          <p className="text-sm mt-2">Your role: <span className="font-medium">{user?.role}</span></p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Machine Installation Form
              {detailsFetched && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </CardTitle>
            <CardDescription>Record a new machine installation at the client site.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Batch Number Lookup */}
              <div className="border-b pb-4 space-y-4">
                <h3 className="font-medium">Machine Verification</h3>
                <div className="flex items-end gap-4">
                  <div className="flex-grow space-y-2">
                    <Label htmlFor="batchInput">Batch Number *</Label>
                    <Input
                      id="batchInput"
                      name="batchInput"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      disabled={isSubmitting}
                      required
                      placeholder="Enter machine batch number"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={fetchMachineDetails}
                    disabled={isSubmitting || !batchInput || !user?.token}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" /> Get Details
                  </Button>
                </div>
                {detailsFetched && (
                  <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                    <CheckCircle2 className="h-4 w-4" /> Details fetched for batch:{" "}
                    <span className="font-semibold">{form.batchNumber}</span>
                  </p>
                )}
                {isCompanyUser && (
                  <p className="text-sm text-blue-600 mt-2">
                    As a company user, you can edit machine details below.
                  </p>
                )}
                {isDealerUser && (
                  <p className="text-sm text-blue-600 mt-2">
                    As a dealer user, machine details are auto-filled and cannot be edited.
                  </p>
                )}
                {!user?.token && (
                  <p className="text-sm text-red-600 mt-2">
                    Authentication error. Please refresh the page or log in again.
                  </p>
                )}
              </div>

              {/* Machine Details */}
              <div className="border-b pb-4 space-y-4">
                <h3 className="font-medium">Machine Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemName">Item Name *</Label>
                    <Input 
                      id="itemName" 
                      name="itemName" 
                      value={form.itemName} 
                      onChange={handleChange} 
                      disabled={isSubmitting || (isDealerUser && detailsFetched)}
                      required 
                      placeholder="Auto-filled after batch lookup" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemCode">Item Code *</Label>
                    <Input 
                      id="itemCode" 
                      name="itemCode" 
                      value={form.itemCode} 
                      onChange={handleChange} 
                      disabled={isSubmitting || (isDealerUser && detailsFetched)}
                      required 
                      placeholder="Auto-filled after batch lookup" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                    <Input 
                      id="invoiceNumber" 
                      name="invoiceNumber" 
                      value={form.invoiceNumber} 
                      onChange={handleChange} 
                      disabled={isSubmitting || (isDealerUser && detailsFetched)}
                      required 
                      placeholder="Auto-filled after batch lookup" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input 
                      id="purchaseDate" 
                      name="purchaseDate" 
                      type="date" 
                      value={form.purchaseDate} 
                      onChange={handleChange} 
                      disabled={isSubmitting || (isDealerUser && detailsFetched)}
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="border-b pb-4 space-y-4">
                <h3 className="font-medium">Client Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientCompanyName">Client Company Name *</Label>
                    <Input id="clientCompanyName" name="clientCompanyName" value={form.clientCompanyName} onChange={handleChange} disabled={isSubmitting} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientGstNumber">Client GST Number *</Label>
                    <Input id="clientGstNumber" name="clientGstNumber" value={form.clientGstNumber} onChange={handleChange} disabled={isSubmitting} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientContactPerson">Contact Person *</Label>
                    <Input id="clientContactPerson" name="clientContactPerson" value={form.clientContactPerson} onChange={handleChange} disabled={isSubmitting} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientContactPhone">Contact Phone *</Label>
                    <Input id="clientContactPhone" name="clientContactPhone" value={form.clientContactPhone} onChange={handleChange} disabled={isSubmitting} required />
                  </div>
                </div>
              </div>

              {/* Installation Details */}
              <div className="border-b pb-4 space-y-4">
                <h3 className="font-medium">Installation Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="installationDate">Installation Date *</Label>
                    <Input id="installationDate" name="installationDate" type="date" value={form.installationDate} onChange={handleChange} disabled={isSubmitting} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="installedBy">Installed By *</Label>
                    <Input id="installedBy" name="installedBy" value={form.installedBy} disabled />
                    <p className="text-xs text-muted-foreground">Auto-filled with your name</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Installation Address *</Label>
                  <Textarea id="location" name="location" rows={3} value={form.location} onChange={handleChange} disabled={isSubmitting} required />
                </div>
              </div>

              {/* Photos Upload */}
              <div className="border-b pb-4 space-y-4">
                <h3 className="font-medium">Installation Photos</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <Label
                      htmlFor="photos"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">JPEG, PNG (MAX. 5MB each)</p>
                      </div>
                      <Input
                        id="photos"
                        name="photos"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                    </Label>
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Preview ${index + 1}`}
                            className="h-40 w-full object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                            onClick={() => removePhoto(index)}
                            disabled={isSubmitting}
                          >
                            <Close className="h-3 w-3" />
                          </Button>
                          <p className="text-xs truncate mt-1">{photo.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea id="notes" name="notes" rows={4} value={form.notes} onChange={handleChange} disabled={isSubmitting} />
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => navigate("/machines")} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || (!detailsFetched && isDealerUser) || !user?.token}>
                {isSubmitting ? "Submitting..." : "Submit Installation"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}