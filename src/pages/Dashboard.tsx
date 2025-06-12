
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Cell 
} from 'recharts';
import { UserRole } from '@/types';

// Mock data - in a real application this would come from an API
const taskData = [
  { name: 'Pending', count: 8 },
  { name: 'In Progress', count: 5 },
  { name: 'Completed', count: 12 },
];

const ticketData = [
  { name: 'Open', count: 4 },
  { name: 'In Progress', count: 2 },
  { name: 'Resolved', count: 7 },
  { name: 'Closed', count: 9 },
];

const machineData = [
  { name: 'Installed', count: 15 },
  { name: 'Pending', count: 3 },
  { name: 'Servicing', count: 2 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);
  
  // Get role-specific greeting
  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case UserRole.APPLICATION_ADMIN:
        return {
          title: 'System Overview',
          stats: [
            { title: 'Total Users', value: '28' },
            { title: 'Total Companies', value: '4' },
            { title: 'Total Dealers', value: '7' },
            { title: 'Total Machines', value: '45' }
          ]
        };
        
      case UserRole.COMPANY_ADMIN:
        return {
          title: 'Company Overview',
          stats: [
            { title: 'Total Employees', value: '12' },
            { title: 'Active Dealers', value: '5' },
            { title: 'Active Machines', value: '32' },
            { title: 'Open Tickets', value: '6' }
          ]
        };
        
      case UserRole.COMPANY_EMPLOYEE:
        return {
          title: 'Your Overview',
          stats: [
            { title: 'Assigned Tasks', value: '8' },
            { title: 'Machines Installed', value: '15' },
            { title: 'Open Tickets', value: '3' },
            { title: 'Pending Installation', value: '2' }
          ]
        };
        
      case UserRole.DEALER_ADMIN:
        return {
          title: 'Dealer Overview',
          stats: [
            { title: 'Total Employees', value: '6' },
            { title: 'Managed Machines', value: '18' },
            { title: 'Open Tasks', value: '4' },
            { title: 'Active Tickets', value: '2' }
          ]
        };
        
      case UserRole.DEALER_EMPLOYEE:
        return {
          title: 'Your Overview',
          stats: [
            { title: 'Assigned Tasks', value: '5' },
            { title: 'Installations Assisted', value: '8' },
            { title: 'Open Tickets', value: '2' },
            { title: 'Pending Tasks', value: '3' }
          ]
        };
        
      default:
        return {
          title: 'Dashboard',
          stats: [
            { title: 'Tasks', value: '0' },
            { title: 'Machines', value: '0' },
            { title: 'Tickets', value: '0' },
            { title: 'Users', value: '0' }
          ]
        };
    }
  };
  
  const { title, stats } = getRoleSpecificContent();
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{greeting}, {user?.name}</h2>
          <p className="text-muted-foreground">
            Here's an overview of your {title.toLowerCase()}
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Charts */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="machines">Machines</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Statistics</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={taskData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
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
          
          <TabsContent value="tickets" className="space-y-4">
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
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {ticketData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="machines" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Machine Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={machineData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
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
