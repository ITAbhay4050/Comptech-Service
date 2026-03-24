import { useEffect, useState } from "react";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { UserRole } from "@/types";

/* ----------  static demo data for charts  ---------- */
const taskData = [
  { name: "Pending", count: 8 },
  { name: "In Progress", count: 5 },
  { name: "Completed", count: 12 },
];

const ticketData = [
  { name: "Open", count: 4 },
  { name: "In Progress", count: 2 },
  { name: "Resolved", count: 7 },
  { name: "Closed", count: 9 },
];

const machineData = [
  { name: "Installed", count: 15 },
  { name: "Pending", count: 3 },
  { name: "Servicing", count: 2 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

/* ----------  component  ---------- */
const Dashboard = () => {
  const { user } = useAuth();

  const [dealerCount, setDealerCount] = useState<number | null>(null);
  const [greeting, setGreeting] = useState("");

  /* ----------  greeting  ---------- */
  useEffect(() => {
    const hour = new Date().getHours();
    const text =
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    setGreeting(text);
  }, []);

  /* ----------  dealer-count (dynamic)  ---------- */
  useEffect(() => {
    if (!user) return;

    const fetchDealerCount = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        let url = "http://127.0.0.1:8000/api/dealers/count/";

        // Restrict to company when required
        if (
          user.role === UserRole.COMPANY_ADMIN ||
          user.role === UserRole.COMPANY_EMPLOYEE
        ) {
          url += `?company_id=${user.companyId}`;
        }

        const res = await fetch(url, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setDealerCount(data.dealer_count);
      } catch (err) {
        console.error("Dealer-count fetch failed:", err);
        setDealerCount(null);
      }
    };

    fetchDealerCount();
  }, [user]);

  /* ----------  role-specific stats  ---------- */
  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case UserRole.APPLICATION_ADMIN:
        return {
          title: "System Overview",
          stats: [
            { title: "Total Users", value: "28" },
            { title: "Total Companies", value: "4" },
            {
              title: "Total Dealers",
              value: dealerCount !== null ? dealerCount.toString() : "...",
            },
            { title: "Total Machines", value: "45" },
          ],
        };

      case UserRole.COMPANY_ADMIN:
        return {
          title: "Company Overview",
          stats: [
            { title: "Total Employees", value: "12" },
            {
              title: "Active Dealers",
              value: dealerCount !== null ? dealerCount.toString() : "...",
            },
            { title: "Active Machines", value: "32" },
            { title: "Open Tickets", value: "6" },
          ],
        };

      case UserRole.COMPANY_EMPLOYEE:
        return {
          title: "Your Overview",
          stats: [
            { title: "Assigned Tasks", value: "8" },
            { title: "Machines Installed", value: "15" },
            { title: "Open Tickets", value: "3" },
            { title: "Pending Installation", value: "2" },
          ],
        };

      case UserRole.DEALER_ADMIN:
        return {
          title: "Dealer Overview",
          stats: [
            { title: "Total Employees", value: "6" },
            { title: "Managed Machines", value: "18" },
            { title: "Open Tasks", value: "4" },
            { title: "Active Tickets", value: "2" },
          ],
        };

      case UserRole.DEALER_EMPLOYEE:
        return {
          title: "Your Overview",
          stats: [
            { title: "Assigned Tasks", value: "5" },
            { title: "Installations Assisted", value: "8" },
            { title: "Open Tickets", value: "2" },
            { title: "Pending Tasks", value: "3" },
          ],
        };

      default:
        return {
          title: "Dashboard",
          stats: [
            { title: "Tasks", value: "0" },
            { title: "Machines", value: "0" },
            { title: "Tickets", value: "0" },
            { title: "Users", value: "0" },
          ],
        };
    }
  };

  const { title, stats } = getRoleSpecificContent();

  /* ----------  render  ---------- */
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* greeting */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {greeting}
            {user?.name ? `, ${user.name}` : ""}
          </h2>
          <p className="text-muted-foreground">
            Here’s an overview of your {title.toLowerCase()}
          </p>
        </div>

        {/* stat cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, idx) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* charts */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="machines">Machines</TabsTrigger>
          </TabsList>

          {/* tasks bar chart */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Task Statistics</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* tickets pie chart */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ticketData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {ticketData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* machines bar chart */}
          <TabsContent value="machines">
            <Card>
              <CardHeader>
                <CardTitle>Machine Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={machineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#22c55e" name="Machines" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
