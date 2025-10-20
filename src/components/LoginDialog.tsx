import { useState, useEffect } from "react";
import { LogIn, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "../contexts/AuthContext";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShowRegister: () => void;
}

export function LoginDialog({ isOpen, onClose, onShowRegister }: LoginDialogProps) {
  const { login, isLoading, error, clearError, retry, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ email: "", password: "" });
      clearError();
      setValidationError(null);
      setFieldErrors({});
    }
  }, [isOpen, clearError]);

  // Close dialog when authentication is successful
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (email.length > 254) return "Email address is too long";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password.length > 128) return "Password is too long";
    return null;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear any existing errors when user starts typing
    if (error) clearError();
    if (validationError) setValidationError(null);
    
    // Validate the field immediately
    let fieldError: string | null = null;
    
    if (field === 'email') {
      fieldError = validateEmail(value);
    } else if (field === 'password') {
      fieldError = validatePassword(value);
    }
    
    // Update field errors
    setFieldErrors(prev => ({
      ...prev,
      [field]: fieldError || undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setFieldErrors({});

    // Trim inputs
    const email = formData.email.trim();
    const password = formData.password;

    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setFieldErrors({
        email: emailError || undefined,
        password: passwordError || undefined
      });
      
      if (emailError && passwordError) {
        setValidationError("Please fix the errors above before continuing");
      } else if (emailError) {
        setValidationError("Please enter a valid email address");
      } else if (passwordError) {
        setValidationError("Please enter a valid password");
      }
      return;
    }

    try {
      await login(email, password);
      // Success message is shown by AuthContext
      // Dialog will close automatically when isAuthenticated becomes true
    } catch (error: any) {
      // Error is already handled by AuthContext
      // Don't close dialog on error - let user see the error message
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
          {(error || validationError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{validationError || error}</span>
                {error && !validationError && (
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
                )}
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
              className={fieldErrors.email ? "border-red-500 focus:border-red-500" : ""}
            />
            {fieldErrors.email && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {fieldErrors.email}
              </p>
            )}
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
              className={fieldErrors.password ? "border-red-500 focus:border-red-500" : ""}
            />
            {fieldErrors.password && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {fieldErrors.password}
              </p>
            )}
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
