import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShowRegister: () => void;
}

export function LoginDialog({ isOpen, onClose, onShowRegister }: LoginDialogProps) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      
      toast.success("Login successful!");
      onClose();
      
      // Reset form
      setFormData({
        email: "",
        password: ""
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error("Login failed", {
        description: error.message || "Please check your credentials"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      // Try to login with demo credentials
      await login('john.dinglasan@ub.edu.ph', 'password');
      toast.success("Demo login successful!");
      onClose();
    } catch (error: any) {
      console.error('Demo login error:', error);
      toast.error("Demo login failed", {
        description: "Please use the registration form to create an account"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] bg-white border shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <LogIn className="w-5 h-5 text-[#8B0000]" />
            <span>Sign In</span>
          </DialogTitle>
          <DialogDescription>
            Sign in to your UBrary account to access the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="your.email@ub.edu.ph"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          <div className="flex flex-col space-y-2 pt-4">
            <Button 
              type="submit" 
              className="bg-[#8B0000] hover:bg-red-800 w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full"
            >
              Try Demo Login
            </Button>
          </div>
        </form>

        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={onShowRegister}
              className="text-[#8B0000] hover:underline font-medium"
            >
              Create Account
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
