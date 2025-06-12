
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User, UserRole } from "@/types";

// Mock data for demo purposes - in a real app this would come from an API
const MOCK_USERS = [
  {
    id: "1",
    name: "System Admin",
    email: "admin@system.com",
    role: UserRole.APPLICATION_ADMIN,
  },
  {
    id: "2",
    name: "Company Admin",
    email: "admin@company.com",
    role: UserRole.COMPANY_ADMIN,
    companyId: "1",
  },
  {
    id: "3",
    name: "Company Employee",
    email: "employee@company.com",
    role: UserRole.COMPANY_EMPLOYEE,
    companyId: "1",
  },
  {
    id: "4",
    name: "Dealer Admin",
    email: "admin@dealer.com",
    role: UserRole.DEALER_ADMIN,
    dealerId: "1",
    companyId: "1",
  },
  {
    id: "5",
    name: "Dealer Employee",
    email: "employee@dealer.com",
    role: UserRole.DEALER_EMPLOYEE,
    dealerId: "1",
    companyId: "1",
  },
];

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (user: Partial<User>) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in using local storage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // In a real app, this would be an API call
    // For demo purposes, we're just checking against our mock users
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundUser = MOCK_USERS.find(u => u.email === email);
      
      if (foundUser) {
        // For demo purposes, we're not checking the password
        setUser(foundUser);
        localStorage.setItem("user", JSON.stringify(foundUser));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const register = async (newUser: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes - in a real app this would create a new user in the database
      // and apply proper validation
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      setIsLoading(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
