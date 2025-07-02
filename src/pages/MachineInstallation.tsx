import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import PurchaseVerification from "@/components/MachineInstallation/PurchaseVerification";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

import {
  CheckCircle2,
  AlertTriangle,
  Upload,
  X as Close,
} from "lucide-react";

import { UserRole } from "@/types";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------
const API_BASE = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE) console.warn("⚠️  Missing VITE_API_BASE_URL env var – falling back to localhost");

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

//   Type used by PurchaseVerification child
export type PurchasedMachine = {
  id: string;
  model: string;
  serialNumber: string;
  batchNumber: string;
  invoiceNumber: string;
  purchaseDate: string;
  isInstalled: boolean;
  dealerId: string;
};

// ---------------------------------------------------------------------------
export default function MachineInstallation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ----- role‑based access --------------------------------------------------
  const allowedRoles: UserRole[] = [
    UserRole.COMPANY_EMPLOYEE,
    UserRole.COMPANY_ADMIN,
    UserRole.DEALER_EMPLOYEE,
    UserRole.DEALER_ADMIN,
  ];
  const canAccess = allowedRoles.includes(user?.role as UserRole);
  const isDealerSide =
    user?.role === UserRole.DEALER_EMPLOYEE || user?.role === UserRole.DEALER_ADMIN;

  // ----- local state --------------------------------------------------------
  const [isSubmitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<PurchasedMachine | null>(null);
  const [form, setForm] = useState({
    installationDate: new Date().toISOString().split("T")[0],
    installedBy: user?.name ?? "Unknown Installer",

    // company‑side (client) info
    clientCompanyName: "",
    clientGstNumber: "",
    clientContactPerson: "",
    clientContactPhone: "",

    // company‑side machine info
    modelNumber: "",
    serialNumber: "",

    // shared
    location: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const accepted = files.filter(
      (f) => ["image/jpeg", "image/png"].includes(f.type) && f.size <= MAX_SIZE,
    );
    if (accepted.length !== files.length)
      toast({
        title: "Invalid file(s)",
        description: "Only JPEG/PNG up to 5 MB are allowed",
        variant: "destructive",
      });
    setPhotos((prev) => [...prev, ...accepted]);
  };
  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const validateUniqueSerial = async (serial: string) => {
    try {
      const res = await fetch(`${API_BASE ?? "http://127.0.0.1:8000"}/api/machines/check-serial/?serial=${encodeURIComponent(serial)}`);
      const data = await res.json();
      return data.isUnique;
    } catch {
      return true; // fallback: let backend decide
    }
  };

  // -------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // dealer must choose machine
    if (isDealerSide && !selectedMachine)
      return toast({ title: "Error", description: "Please select a machine first", variant: "destructive" });

    // company‑side required fields
    if (!isDealerSide) {
      const required = [
        "clientCompanyName",
        "clientGstNumber",
        "clientContactPerson",
        "clientContactPhone",
        "modelNumber",
        "serialNumber",
      ];
      const empty = required.find((f) => !(form as any)[f]);
      if (empty)
        return toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });

      if (!(await validateUniqueSerial(form.serialNumber)))
        return toast({ title: "Error", description: "Serial number already exists", variant: "destructive" });
    }

    if (!form.location)
      return toast({ title: "Error", description: "Installation location required", variant: "destructive" });

    if (!window.confirm("Submit installation details?")) return;

    setSubmitting(true);

    const fd = new FormData();
    fd.append("installation_date", form.installationDate);
    fd.append("installed_by", form.installedBy);
    fd.append("location", form.location);
    fd.append("notes", form.notes);

    if (!isDealerSide) {
      fd.append("client_company_name", form.clientCompanyName);
      fd.append("client_gst_number", form.clientGstNumber);
      fd.append("client_contact_person", form.clientContactPerson);
      fd.append("client_contact_phone", form.clientContactPhone);
      fd.append("model_number", form.modelNumber);
      fd.append("serial_number", form.serialNumber);
    } else if (selectedMachine) {
      fd.append("model_number", selectedMachine.model);
      fd.append("serial_number", selectedMachine.serialNumber);
      fd.append("batch_number", selectedMachine.batchNumber);
      fd.append("invoice_number", selectedMachine.invoiceNumber);
    }

    if (user?.companyId) fd.append("company", String(user.companyId));
    if (user?.dealerId) fd.append("dealer", String(user.dealerId));

    fd.append("submitted_by_id", String(user?.id));
    fd.append("submitted_by_name", user?.name ?? "");
    fd.append("submitted_by_role", user?.role ?? "");

    photos.forEach((p) => fd.append("photos", p));

    try {
      const res = await fetch(`${API_BASE ?? "http://127.0.0.1:8000"}/api/installations/create/`, {
        method: "POST",
        headers: user?.token ? { Authorization: `Token ${user.token}` } : undefined,
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());

      toast({ title: "Success", description: "Installation saved" });
      navigate("/machines");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Save failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  if (!canAccess)
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only authorised roles can access this form.</p>
          <p className="text-sm mt-2">Your role: <span className="font-medium">{user?.role}</span></p>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {isDealerSide && (
          <PurchaseVerification
            onMachineSelected={setSelectedMachine}
            selectedMachine={selectedMachine}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Machine Installation Form
              {(selectedMachine || !isDealerSide) && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </CardTitle>
            <CardDescription>
              {isDealerSide
                ? "Complete installation details for the selected machine"
                : "Record a new machine installation at client site"}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Company‑side machine details */}
              {!isDealerSide && (
                <div className="border-b pb-4 space-y-4">
                  <h3 className="font-medium">Machine Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modelNumber">Model Number *</Label>
                      <Input id="modelNumber" name="modelNumber" value={form.modelNumber} onChange={handleChange} disabled={isSubmitting} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">Serial Number *</Label>
                      <Input id="serialNumber" name="serialNumber" value={form.serialNumber} onChange={handleChange} disabled={isSubmitting} required />
                    </div>
                  </div>
                </div>
              )}

              {/* Company‑side client info */}
              {!isDealerSide && (
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
              )}

              {/* Shared installation details */}
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
                    <p className="text-xs text-muted-foreground">Auto‑filled with your name</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Installation Address *</Label>
                  <Textarea id="location" name="location" rows={3} value={form.location} onChange={handleChange} disabled={isSubmitting} required />
                </div>
              </div>

              {/* Photos upload */}
              <div className="space-y-2">
                <Label>Installation Photos (JPEG/PNG ≤ 5 MB each)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">Upload installation photos</p>
                  <input id="photos" type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handlePhotoUpload} disabled={isSubmitting} />
                  <Button type="button" variant="outline" onClick={() => document.getElementById("photos")?.click()} disabled={isSubmitting}>Choose Photos</Button>

                  {photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {photos.map((p, idx) => (
                        <div key={idx} className="relative bg-gray-100 rounded p-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[140px]" title={p.name}>{p.name}</span>
                            <Button type="button" size="icon" variant="ghost" onClick={() => removePhoto(idx)} disabled={isSubmitting}>
                              <Close className="h-4 w-4" />
                            </Button>
                          </div>
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
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || (isDealerSide && !selectedMachine)}>
                {isSubmitting ? "Submitting…" : "Submit Installation"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
