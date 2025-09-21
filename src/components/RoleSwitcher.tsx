import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';
import { ROLE_LABELS } from '../types/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { User, Shield } from 'lucide-react';

export function RoleSwitcher() {
  const { user, switchRole } = useAuth();

  if (!user) return null;

  const handleRoleChange = (newRole: string) => {
    switchRole(newRole as UserRole);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'student':
        return 'default';
      case 'faculty':
        return 'secondary';
      case 'librarian':
        return 'outline';
      case 'admin':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="text-xs text-yellow-800 font-medium">Demo Mode:</div>
      <Select value={user.role} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-auto h-7 text-xs">
          <SelectValue>
            <div className="flex items-center gap-1">
              {getRoleIcon(user.role)}
              <span>{ROLE_LABELS[user.role]}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <SelectItem key={role} value={role}>
              <div className="flex items-center gap-2">
                {getRoleIcon(role as UserRole)}
                <span>{label}</span>
                <Badge variant={getRoleBadgeVariant(role as UserRole)} className="text-xs">
                  {role}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
