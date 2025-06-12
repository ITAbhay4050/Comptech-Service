import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";
import { UserRole } from "@/types";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";

// Dashboard Pages
import Dashboard from "./pages/Dashboard";
import MachineInstallation from "./pages/MachineInstallation";
import Machines from "./pages/Machines";
import MachineDetails from "./pages/MachineDetails";
import Tasks from "./pages/Tasks";
import Tickets from "./pages/Tickets";
import Companies from "./pages/Companies";
import Dealers from "./pages/Dealers";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Default redirect to dashboard if logged in */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Protected routes - accessible by all authenticated users */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/machines" element={<Machines />} />
              <Route path="/machines/:id" element={<MachineDetails />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            {/* Users management - only accessible by admins */}
            <Route 
              element={
                <PrivateRoute 
                  allowedRoles={[
                    UserRole.APPLICATION_ADMIN,
                    UserRole.COMPANY_ADMIN,
                    UserRole.DEALER_ADMIN
                  ]} 
                />
              }
            >
              <Route path="/users" element={<Users />} />
            </Route>
            
            {/* Companies and Dealers - only accessible by admins */}
            <Route 
              element={
                <PrivateRoute 
                  allowedRoles={[
                    UserRole.APPLICATION_ADMIN,
                    UserRole.COMPANY_ADMIN,
                    UserRole.DEALER_ADMIN
                  ]} 
                />
              }
            >
              <Route path="/companies" element={<Companies />} />
              <Route path="/dealers" element={<Dealers />} />
            </Route>
            
            {/* Machine installation - only accessible by employees */}
            <Route 
              element={
                <PrivateRoute 
                  allowedRoles={[
                    UserRole.COMPANY_EMPLOYEE,
                    UserRole.DEALER_EMPLOYEE,
                    UserRole.COMPANY_ADMIN,
                    UserRole.APPLICATION_ADMIN
                  ]} 
                />
              }
            >
              <Route path="/machine-installation" element={<MachineInstallation />} />
            </Route>
            
            {/* 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
