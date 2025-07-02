import {
  useState,
  useEffect,
  FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Cog as Gear, Wrench, Cpu, ShieldCheck } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Login page – uses AuthContext.login                                 */
/* ------------------------------------------------------------------ */
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeGear, setActiveGear] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  /* ---------- rotating gear animation ---------- */
  useEffect(() => {
    const interval = setInterval(() =>
      setActiveGear((prev) => (prev + 1) % 3),
    3_000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (
    title: string,
    description: string,
    variant: "destructive" | "default" = "default",
  ) => toast({ title, description, variant });

  /* ---------- form submit ---------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Validation Error", "Please enter both email and password.", "destructive");
      return;
    }

    setIsSubmitting(true);
    const ok = await login(email, password);
    setIsSubmitting(false);

    if (ok) {
      showToast("Login Successful", "Welcome back!");
      navigate("/dashboard");
    } else {
      showToast("Login Failed", "Invalid credentials", "destructive");
    }
  };

  /* ---------- demo autofill ---------- */
  const fillCredentials = (preset: string) => {
    switch (preset) {
      case "admin":
        setEmail("admin@system.com");
        setPassword("password");
        break;
      case "company_admin":
        setEmail("admin@company.com");
        setPassword("password");
        break;
      case "company_employee":
        setEmail("employee@company.com");
        setPassword("password");
        break;
      case "dealer_admin":
        setEmail("admin@dealer.com");
        setPassword("password");
        break;
      case "dealer_employee":
        setEmail("employee@dealer.com");
        setPassword("password");
        break;
    }
  };

  /* ------------------------------------------------------------------ */
  /* JSX                                                                */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden">
      {/* background pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-geometric.png')] opacity-10" />

      {/* animated gears */}
      <div className="absolute -left-20 -top-20 w-64 h-64">
        <Gear
          className={`w-full h-full text-blue-500/20 transition-all duration-1000 ${
            activeGear === 0 ? "animate-spin" : ""
          }`}
        />
      </div>
      <div className="absolute -right-20 -bottom-20 w-72 h-72">
        <Gear
          className={`w-full h-full text-orange-500/20 transition-all duration-1000 ${
            activeGear === 1 ? "animate-spin-reverse" : ""
          }`}
        />
      </div>
      <div className="absolute right-1/4 top-1/3 w-48 h-48">
        <Gear
          className={`w-full h-full text-green-500/20 transition-all duration-1000 ${
            activeGear === 2 ? "animate-spin" : ""
          }`}
        />
      </div>

      {/* blueprint overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy-dark.png')] opacity-5" />

      {/* main card */}
      <div className="w-full max-w-md px-4 relative z-10">
        <Card className="shadow-2xl backdrop-blur-sm bg-gray-800/80 border-gray-700 hover:shadow-blue-500/20 hover:border-blue-500/30 transition-all duration-300">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
              <div className="relative">
                <Cpu className="w-10 h-10 text-white" />
                <Wrench className="absolute -bottom-1 -right-1 w-5 h-5 text-orange-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                COMPTECH GEAR UP
              </span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Machine Installation & Service Management System
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* email */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-400"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="technician@comptech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* password */}
              <div className="space-y-3">
                <Label htmlFor="password" className="text-gray-300 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-400"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* submit */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-300 shadow-lg hover:shadow-blue-500/30 group"
                disabled={isSubmitting}
              >
                <div className="flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Sign In
                    </>
                  )}
                </div>
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center text-sm">
              <p className="mb-2 text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/dealerregister"
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
                >
                  Register
                </Link>
              </p>
              <p className="text-gray-400">
                Create Company?{' '}
                <Link
                  to="/register"
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
                >
                  Create Company
                </Link>
              </p>
            </div>

            {/* Demo buttons */}
            <div className="border-t border-gray-700 pt-5 mt-6">
              <p className="text-center text-sm text-gray-400 mb-3">
                Demo Accounts (click to autofill):
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  ["System Admin", "admin", "blue"],
                  ["Company Admin", "company_admin", "cyan"],
                  ["Company Employee", "company_employee", "green"],
                  ["Dealer Admin", "dealer_admin", "orange"],
                  ["Dealer Employee", "dealer_employee", "purple"],
                ].map(([label, key, color]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => fillCredentials(key as string)}
                    className={`border-${color}-500 text-${color}-400 hover:bg-${color}-900/50 hover:border-${color}-400 hover:text-${color}-300`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
