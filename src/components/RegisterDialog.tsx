import { useState, useEffect } from "react";
import { UserPlus, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types/auth";

interface RegisterDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterDialog({ isOpen, onClose }: RegisterDialogProps) {
  const { register, isLoading, error, clearError, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "" as UserRole,
    program: "",
    department: "",
    studentId: "",
    employeeId: ""
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    program?: string;
    department?: string;
    studentId?: string;
    employeeId?: string;
  }>({});

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        role: "" as UserRole,
        program: "",
        department: "",
        studentId: "",
        employeeId: ""
      });
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

  const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const validateName = (name: string, fieldName: string): string | null => {
    if (!name.trim()) return `${fieldName} is required`;
    if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    if (name.trim().length > 50) return `${fieldName} is too long`;
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    return null;
  };

  const validateRole = (role: string): string | null => {
    if (!role) return "Please select your role";
    return null;
  };

  const validateStudentId = (studentId: string): string | null => {
    if (!studentId.trim()) return null; // Optional field
    if (studentId.trim().length < 3) return "Student ID must be at least 3 characters";
    if (studentId.trim().length > 20) return "Student ID is too long";
    if (!/^[a-zA-Z0-9-]+$/.test(studentId.trim())) return "Student ID can only contain letters, numbers, and hyphens";
    return null;
  };

  const validateEmployeeId = (employeeId: string): string | null => {
    if (!employeeId.trim()) return null; // Optional field
    if (employeeId.trim().length < 3) return "Employee ID must be at least 3 characters";
    if (employeeId.trim().length > 20) return "Employee ID is too long";
    if (!/^[a-zA-Z0-9-]+$/.test(employeeId.trim())) return "Employee ID can only contain letters, numbers, and hyphens";
    return null;
  };

  const validateDepartment = (department: string): string | null => {
    if (!department.trim()) return null; // Optional field
    if (department.trim().length < 2) return "Department name must be at least 2 characters";
    if (department.trim().length > 100) return "Department name is too long";
    return null;
  };

  const validateProgram = (program: string, role: string): string | null => {
    if (role === 'student' && !program) return "Program is required for students";
    return null;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear any existing errors when user starts typing
    if (error) clearError();
    if (validationError) setValidationError(null);
    
    // Real-time validation with proper state updates
    setFieldErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      
      // Clear the current field error first
      newErrors[field as keyof typeof newErrors] = undefined;
      
      // Validate the field
      let fieldError: string | null = null;
      
      switch (field) {
        case 'email':
          fieldError = validateEmail(value);
          break;
        case 'password':
          fieldError = validatePassword(value);
          // Also validate confirm password if it exists
          if (formData.confirmPassword && value !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
          } else if (formData.confirmPassword && value === formData.confirmPassword) {
            newErrors.confirmPassword = undefined;
          }
          break;
        case 'confirmPassword':
          fieldError = validateConfirmPassword(formData.password, value);
          break;
        case 'firstName':
          fieldError = validateName(value, "First name");
          break;
        case 'lastName':
          fieldError = validateName(value, "Last name");
          break;
        case 'role':
          fieldError = validateRole(value);
          // Also validate program when role changes
          if (value === 'student' && formData.program) {
            const programError = validateProgram(formData.program, value);
            if (programError) {
              newErrors.program = programError;
            } else {
              newErrors.program = undefined;
            }
          }
          break;
        case 'studentId':
          fieldError = validateStudentId(value);
          break;
        case 'employeeId':
          fieldError = validateEmployeeId(value);
          break;
        case 'department':
          fieldError = validateDepartment(value);
          break;
        case 'program':
          fieldError = validateProgram(value, formData.role);
          break;
      }
      
      if (fieldError && (value.length > 0 || field === 'program' || field === 'role')) {
        newErrors[field as keyof typeof newErrors] = fieldError;
      }
      
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setFieldErrors({});

    // Trim inputs
    const email = formData.email.trim();
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;
    const role = formData.role;
    const program = formData.program.trim();
    const department = formData.department.trim();
    const studentId = formData.studentId.trim();
    const employeeId = formData.employeeId.trim();

    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
    const firstNameError = validateName(firstName, "First name");
    const lastNameError = validateName(lastName, "Last name");
    const roleError = validateRole(role);
    const programError = validateProgram(formData.program, role);
    const departmentError = validateDepartment(department);
    const studentIdError = validateStudentId(studentId);
    const employeeIdError = validateEmployeeId(employeeId);

    // Set field errors
    const newFieldErrors = {
      email: emailError || undefined,
      password: passwordError || undefined,
      confirmPassword: confirmPasswordError || undefined,
      firstName: firstNameError || undefined,
      lastName: lastNameError || undefined,
      role: roleError || undefined,
      program: programError || undefined,
      department: departmentError || undefined,
      studentId: studentIdError || undefined,
      employeeId: employeeIdError || undefined,
    };

    setFieldErrors(newFieldErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newFieldErrors).some(error => error !== undefined);

    if (hasErrors) {
      const errorCount = Object.values(newFieldErrors).filter(error => error !== undefined).length;
      if (errorCount === 1) {
        const firstError = Object.values(newFieldErrors).find(error => error !== undefined);
        setValidationError(firstError || "Please fix the error above");
      } else {
        setValidationError(`Please fix the ${errorCount} errors above before continuing`);
      }
      return;
    }

    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        role,
        program: program || undefined,
        department: department || undefined,
        studentId: studentId || undefined,
        employeeId: employeeId || undefined,
      });

      // Dialog will close automatically when isAuthenticated becomes true
    } catch (error: any) {
      // Error is already handled by AuthContext
      console.error('Registration error:', error);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto bg-white border shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-[#8B0000]" />
            <span>Create Account</span>
          </DialogTitle>
          <DialogDescription>
            Create a new account to access the UBrary system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Display */}
          {(error || validationError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validationError || error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="John"
                required
                className={fieldErrors.firstName ? "border-red-500 focus:border-red-500" : ""}
              />
              {fieldErrors.firstName && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.firstName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Doe"
                required
                className={fieldErrors.lastName ? "border-red-500 focus:border-red-500" : ""}
              />
              {fieldErrors.lastName && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="john.doe@ub.edu.ph"
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
            <Label htmlFor="role">Role *</Label>
            <Select onValueChange={(value) => handleInputChange("role", value)} required>
              <SelectTrigger className={fieldErrors.role ? "border-red-500 focus:border-red-500" : ""}>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="librarian">Librarian</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.role && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {fieldErrors.role}
              </p>
            )}
          </div>

          {formData.role === 'student' && (
            <>
              <div>
                <Label htmlFor="program">Program *</Label>
                <Select onValueChange={(value) => handleInputChange("program", value)}>
                  <SelectTrigger className={fieldErrors.program ? "border-red-500 focus:border-red-500" : ""}>
                    <SelectValue placeholder="Select your program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BS Information Technology">BS Information Technology</SelectItem>
                    <SelectItem value="BS Computer Science">BS Computer Science</SelectItem>
                    <SelectItem value="BS Electrical Engineering">BS Electrical Engineering</SelectItem>
                    <SelectItem value="BS Business Administration">BS Business Administration</SelectItem>
                    <SelectItem value="Bachelor of Secondary Education">Bachelor of Secondary Education</SelectItem>
                    <SelectItem value="BS Nursing">BS Nursing</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.program && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldErrors.program}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={formData.studentId}
                  onChange={(e) => handleInputChange("studentId", e.target.value)}
                  placeholder="2024-00001"
                  className={fieldErrors.studentId ? "border-red-500 focus:border-red-500" : ""}
                />
                {fieldErrors.studentId && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldErrors.studentId}
                  </p>
                )}
              </div>
            </>
          )}

          {(formData.role === 'faculty' || formData.role === 'librarian' || formData.role === 'admin') && (
            <>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  placeholder="Information Technology"
                  className={fieldErrors.department ? "border-red-500 focus:border-red-500" : ""}
                />
                {fieldErrors.department && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldErrors.department}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => handleInputChange("employeeId", e.target.value)}
                  placeholder="FAC-2024-001"
                  className={fieldErrors.employeeId ? "border-red-500 focus:border-red-500" : ""}
                />
                {fieldErrors.employeeId && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldErrors.employeeId}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className={fieldErrors.password ? "border-red-500 focus:border-red-500" : ""}
            />
            {fieldErrors.password && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              placeholder="Confirm your password"
              required
              className={fieldErrors.confirmPassword ? "border-red-500 focus:border-red-500" : ""}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#8B0000] hover:bg-red-800" 
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
