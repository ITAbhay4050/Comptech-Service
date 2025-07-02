import { useState, useEffect, FormEvent } from "react";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Task, UserRole } from "@/types";

/* UI kit */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

/* Icons */
import {
  Plus,
  Search,
  FilterIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Config & helpers                                                   */
/* ------------------------------------------------------------------ */
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

const apiFetch = async (
  path: string,
  options: RequestInit = {},
  token?: string,
) => {
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(options.headers || {}),
  } as HeadersInit;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
};

const normaliseTask = (t: any): Task => ({
  id: String(t.id),
  title: t.title,
  description: t.description,
  created_at: t.created_at,
  deadline: t.deadline,
  priority: t.priority,
  status: t.status,
  assigner_id: String(t.assigner_id),
  assignee_id: String(t.assignee_id),
  machine_id: t.machine_id,
});

/* ------------------------------------------------------------------ */
/* Badges                                                             */
/* ------------------------------------------------------------------ */
const PriorityBadge = ({ p }: { p: Task["priority"] }) => {
  const map = {
    low: "bg-blue-100 text-blue-800 border-blue-300",
    medium: "bg-green-100 text-green-800 border-green-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    urgent: "bg-red-100 text-red-800 border-red-300",
  } as const;
  return <Badge className={map[p]}>{p.toUpperCase()}</Badge>;
};

const StatusBadge = ({ s }: { s: Task["status"] }) => {
  const badgeMap: Record<Task["status"], JSX.Element> = {
    pending: (
      <Badge className="flex items-center gap-1 bg-amber-100 text-amber-800 border-amber-300">
        <Clock className="h-3 w-3" /> Pending
      </Badge>
    ),
    "in-progress": (
      <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-300">
        <AlertTriangle className="h-3 w-3" /> In&nbsp;Progress
      </Badge>
    ),
    completed: (
      <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="h-3 w-3" /> Completed
      </Badge>
    ),
    cancelled: (
      <Badge className="flex items-center gap-1 bg-red-100 text-red-800 border-red-300">
        <XCircle className="h-3 w-3" /> Cancelled
      </Badge>
    ),
  };
  return badgeMap[s];
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
const Tasks = () => {
  const { user } = useAuth();
  const token = user?.token;

  /* ---------------- state --------------- */
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Task["status"] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const resetDraft = (): Partial<Task> => ({
    title: "",
    description: "",
    deadline: new Date().toISOString().split("T")[0],
    priority: "medium",
    status: "pending",
    assigner_id: String(user?.id),
    assignee_id: "",
    machine_id: "NA",
  });
  const [draft, setDraft] = useState<Partial<Task>>(resetDraft);

  const canAssign = [
    UserRole.APPLICATION_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.DEALER_ADMIN,
    UserRole.COMPANY_EMPLOYEE,
  ].includes(user?.role as UserRole);

  /* --------------- fetch list -------------- */
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/tasks/", {}, token);
      const list: Task[] = (Array.isArray(data) ? data : data.results).map(
        normaliseTask,
      );
      setTasks(list);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Fetch failed" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ------------- visible list ------------- */
  const visibleTasks = tasks.filter((t) => {
    const hitsSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const hitsStatus = statusFilter ? t.status === statusFilter : true;

    if ([UserRole.COMPANY_EMPLOYEE, UserRole.DEALER_EMPLOYEE].includes(user?.role as UserRole))
      return hitsSearch && hitsStatus && t.assignee_id === String(user?.id);

    if (user?.role === UserRole.DEALER_ADMIN)
      return (
        hitsSearch &&
        hitsStatus &&
        (t.assigner_id === String(user?.id) || t.assignee_id === String(user?.id))
      );

    return hitsSearch && hitsStatus;
  });

  /* --------------- create task ------------- */
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title || !draft.description || !draft.assignee_id) {
      toast({ title: "Error", description: "Fill all required fields", variant: "destructive" });
      return;
    }
    try {
      const newTask: Task = await apiFetch(
        "/tasks/",
        { method: "POST", body: JSON.stringify(draft) },
        token,
      );
      setTasks((prev) => [...prev, normaliseTask(newTask)]);
      toast({ title: "Success", description: "Task created." });
      setDialogOpen(false);
      setDraft(resetDraft());
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Create failed" });
    }
  };

  /* ---------------------------- JSX ------------------------ */
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-3xl font-bold">Tasks</h2>
          <Button
            disabled={!canAssign}
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>

        {/* ---------------- Table Card ---------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Task Management</CardTitle>
          </CardHeader>
          <CardContent>
            {/* filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Filter:</span>
                {['All', 'pending', 'in-progress', 'completed'].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={
                      statusFilter === (s === 'All' ? null : s) ? 'secondary' : 'outline'
                    }
                    onClick={() => setStatusFilter(s === 'All' ? null : (s as any))}
                  >
                    {s[0].toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* table */}
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Deadline</th>
                    <th className="px-4 py-3 text-left">Priority</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : visibleTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        No tasks found
                      </td>
                    </tr>
                  ) : (
                    visibleTasks.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        </td>
                        <td className="px-4 py-3">{t.deadline}</td>
                        <td className="px-4 py-3">
                          <PriorityBadge p={t.priority} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge s={t.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
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
          </CardContent>
        </Card>

        {/* ---------------- Create Task Dialog -------------- */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  value={draft.title}
                  onChange={({ target }) => setDraft((d) => ({ ...d, title: target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description *</Label>
                <Textarea
                  id="desc"
                  rows={3}
                  value={draft.description}
                  onChange={({ target }) =>
                    setDraft((d) => ({ ...d, description: target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={draft.deadline}
                    onChange={({ target }) =>
                      setDraft((d) => ({ ...d, deadline: target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <Select
                    value={draft.priority}
                    onValueChange={(v) => setDraft((d) => ({ ...d, priority: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {['low', 'medium', 'high', 'urgent'].map((p) => (
                        <SelectItem key={p} value={p}>
                          {p[0].toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign To *</Label>
                <Select
                  value={draft.assignee_id}
                  onValueChange={(v) => setDraft((d) => ({ ...d, assignee_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Company Employee</SelectItem>
                    <SelectItem value="5">Dealer Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
