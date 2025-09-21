import { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Shield,
  GraduationCap,
  Building
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import type { User, UserRole } from '../types/auth';
import { ROLE_LABELS } from '../types/auth';
import { toast } from 'sonner';

// Mock users data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.dinglasan@ub.edu.ph',
    firstName: 'John Mark',
    lastName: 'Dinglasan',
    role: 'student',
    program: 'BS Information Technology',
    studentId: '2021-00001',
    avatar: 'JD',
    isActive: true,
    createdAt: '2021-08-15T00:00:00Z',
    lastLoginAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    email: 'maria.santos@ub.edu.ph',
    firstName: 'Dr. Maria',
    lastName: 'Santos',
    role: 'faculty',
    department: 'Information Technology',
    employeeId: 'FAC-2020-001',
    avatar: 'MS',
    isActive: true,
    createdAt: '2020-01-15T00:00:00Z',
    lastLoginAt: '2024-01-15T08:45:00Z',
  },
  {
    id: '3',
    email: 'librarian@ub.edu.ph',
    firstName: 'Ana',
    lastName: 'Cruz',
    role: 'librarian',
    department: 'Library Services',
    employeeId: 'LIB-2019-001',
    avatar: 'AC',
    isActive: true,
    createdAt: '2019-03-01T00:00:00Z',
    lastLoginAt: '2024-01-15T09:15:00Z',
  },
  {
    id: '4',
    email: 'admin@ub.edu.ph',
    firstName: 'Roberto',
    lastName: 'Admin',
    role: 'admin',
    department: 'IT Administration',
    employeeId: 'ADM-2018-001',
    avatar: 'RA',
    isActive: true,
    createdAt: '2018-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T07:30:00Z',
  },
  // Add more mock users
  {
    id: '5',
    email: 'jane.smith@ub.edu.ph',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'student',
    program: 'BS Computer Science',
    studentId: '2022-00045',
    avatar: 'JS',
    isActive: false,
    createdAt: '2022-09-01T00:00:00Z',
    lastLoginAt: '2024-01-10T14:20:00Z',
  },
];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'student' as UserRole,
    program: '',
    department: '',
    studentId: '',
    employeeId: ''
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'faculty': return 'secondary';
      case 'librarian': return 'outline';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'faculty': return <GraduationCap className="w-4 h-4" />;
      case 'librarian': return <Building className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName) {
      toast.error("Required fields missing", {
        description: "Please fill in all required fields"
      });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      program: newUser.program || undefined,
      department: newUser.department || undefined,
      studentId: newUser.studentId || undefined,
      employeeId: newUser.employeeId || undefined,
      avatar: `${newUser.firstName[0]}${newUser.lastName[0]}`.toUpperCase(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setUsers([...users, user]);
    setNewUser({
      email: '',
      firstName: '',
      lastName: '',
      role: 'student',
      program: '',
      department: '',
      studentId: '',
      employeeId: ''
    });
    setIsCreateDialogOpen(false);
    
    toast.success("User created successfully", {
      description: `${user.firstName} ${user.lastName} has been added to the system`
    });
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive }
        : user
    ));
    
    const user = users.find(u => u.id === userId);
    toast.success(`User ${user?.isActive ? 'deactivated' : 'activated'}`, {
      description: `${user?.firstName} ${user?.lastName} is now ${user?.isActive ? 'inactive' : 'active'}`
    });
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setUsers(users.filter(u => u.id !== userId));
    
    toast.success("User deleted", {
      description: `${user?.firstName} ${user?.lastName} has been removed from the system`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#8B0000] hover:bg-red-800">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="john.doe@ub.edu.ph"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty/Adviser</SelectItem>
                    <SelectItem value="librarian">Library Staff</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newUser.role === 'student' && (
                <>
                  <div>
                    <Label htmlFor="program">Program</Label>
                    <Input
                      id="program"
                      value={newUser.program}
                      onChange={(e) => setNewUser({...newUser, program: e.target.value})}
                      placeholder="BS Information Technology"
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      value={newUser.studentId}
                      onChange={(e) => setNewUser({...newUser, studentId: e.target.value})}
                      placeholder="2024-00001"
                    />
                  </div>
                </>
              )}
              
              {(newUser.role === 'faculty' || newUser.role === 'librarian' || newUser.role === 'admin') && (
                <>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      placeholder="Information Technology"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={newUser.employeeId}
                      onChange={(e) => setNewUser({...newUser, employeeId: e.target.value})}
                      placeholder="FAC-2024-001"
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateUser} className="flex-1 bg-[#8B0000] hover:bg-red-800">
                  Create User
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="librarian">Library Staff</SelectItem>
            <SelectItem value="admin">Administrators</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Program/Department</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Last Login</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-[#8B0000] text-white text-sm">
                          {user.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.studentId && (
                          <p className="text-xs text-gray-400">ID: {user.studentId}</p>
                        )}
                        {user.employeeId && (
                          <p className="text-xs text-gray-400">ID: {user.employeeId}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                      {getRoleIcon(user.role)}
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{user.program || user.department || 'N/A'}</p>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-600">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user.id)}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info("Edit user", { description: "User editing functionality" })}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
            <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
}
