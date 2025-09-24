import { useState, useEffect } from "react";
import { LogIn, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShowRegister: () => void;
}

export function LoginDialog({ isOpen, onClose, onShowRegister }: LoginDialogProps) {
  const { login, isLoading, error, clearError, retry } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ email: "", password: "" });
      clearError();
    }
  }, [isOpen, clearError]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear any existing errors when user starts typing
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Trim inputs
    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await login(email, password);
      toast.success("Login successful!");
      onClose();
      // Form will be reset by useEffect when dialog closes
    } catch (error: any) {
      // Error is already handled by AuthContext
      console.error('Login error:', error);
    }
  };


  const handleRetry = async () => {
    if (error) {
      await retry();
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
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="h-auto p-1 ml-2"
                  disabled={isLoading}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="your.email@ub.edu.ph"
              disabled={isLoading}
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
              disabled={isLoading}
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
          </div>
        </form>

        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={onShowRegister}
              className="text-[#8B0000] hover:underline font-medium"
              disabled={isLoading}
            >
              Create Account
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
