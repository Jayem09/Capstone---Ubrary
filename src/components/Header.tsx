import { Bell, Settings, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "../contexts/AuthContext";
import { ROLE_LABELS } from "../types/auth";
import { Badge } from "./ui/badge";

export function Header() {
  const { user, logout } = useAuth();

  const handleNotificationClick = () => {
    toast.info("No new notifications", {
      description: "You're all caught up!"
    });
  };

  const handleProfileClick = () => {
    toast.info("Profile", {
      description: "Opening profile settings..."
    });
  };

  const handleSettingsClick = () => {
    toast.info("Settings", {
      description: "Opening application settings..."
    });
  };

  const handleSignOut = () => {
    logout();
    toast.success("Signed out successfully", {
      description: "You have been logged out of UBrary"
    });
  };

  if (!user) return null;

  return (
    <header className="bg-[#8B0000] text-white shadow-lg relative z-10">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        {/* Left side - Logo and Title */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* UB Logo placeholder */}
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-[#8B0000] font-bold text-sm lg:text-lg">UB</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg lg:text-xl font-semibold">UBrary</h1>
            <p className="text-xs lg:text-sm text-red-100">University of Batangas Repository</p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-lg font-semibold">UBrary</h1>
          </div>
        </div>

        {/* Right side - User info and actions */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-white hover:bg-red-700" onClick={handleNotificationClick}>
            <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-red-700">
                <Avatar className="w-7 h-7 lg:w-8 lg:h-8">
                  <AvatarFallback className="bg-yellow-400 text-[#8B0000] text-xs lg:text-sm">
                    {user.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-red-100">{ROLE_LABELS[user.role]}</p>
                    {user.role === 'admin' && (
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="lg:hidden px-2 py-1.5">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
                  {user.role === 'admin' && (
                    <Badge variant="destructive" className="text-xs px-1 py-0">
                      Admin
                    </Badge>
                  )}
                </div>
                {user.program && (
                  <p className="text-xs text-muted-foreground">{user.program}</p>
                )}
                {user.department && (
                  <p className="text-xs text-muted-foreground">{user.department}</p>
                )}
              </div>
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}