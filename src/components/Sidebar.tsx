import { Home, Upload, Star, Clock, FileText, Shield, BarChart3, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import { useAuth } from "../contexts/AuthContext";
import { PermissionGuard } from "./PermissionGuard";
import { useSidebarStats } from "../hooks/useSidebarStats";

interface SidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onUploadClick: () => void;
  onClose?: () => void;
}

const categoryConfig = [
  { id: "it", label: "Information Technology", icon: FileText, dbKey: "information technology" },
  { id: "engineering", label: "Engineering", icon: FileText, dbKey: "engineering" },
  { id: "business", label: "Business", icon: FileText, dbKey: "business" },
  { id: "education", label: "Education", icon: FileText, dbKey: "education" },
  { id: "nursing", label: "Nursing", icon: FileText, dbKey: "nursing" },
];

export function Sidebar({ selectedCategory, onCategoryChange, onUploadClick, onClose }: SidebarProps) {
  const { user, hasPermission } = useAuth();
  const { stats, loading } = useSidebarStats();

  // Role-specific sidebar items
  const getAdditionalItems = () => {
    const items = [];
    
    if (hasPermission('canViewAnalytics')) {
      items.push({
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        count: 0,
        roleSpecific: true,
      });
    }
    
    if (hasPermission('canManageUsers')) {
      items.push({
        id: 'users',
        label: 'User Management',
        icon: Users,
        count: 0,
        roleSpecific: true,
      });
    }
    
    if (user?.role === 'admin') {
      items.push({
        id: 'admin',
        label: 'Admin Panel',
        icon: Shield,
        count: 0,
        roleSpecific: true,
      });
    }
    
    return items;
  };

  const additionalItems = getAdditionalItems();

  // Create sidebar items with real data
  const sidebarItems = [
    { id: "all", label: "All Documents", icon: Home, count: stats.totalDocuments },
    { id: "recent", label: "Recent", icon: Clock, count: stats.recentDocuments },
    { id: "starred", label: "Starred", icon: Star, count: 0 }, // TODO: Implement starred functionality
    { id: "my-uploads", label: "My Uploads", icon: Upload, count: stats.myUploads },
    { id: "workflow", label: "Workflow", icon: FileText, count: stats.workflowDocuments },
  ];

  // Create categories with real data
  const categories = categoryConfig.map(category => ({
    ...category,
    count: stats.categoryCounts[category.dbKey] || 0
  }));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-6">
        {/* Upload Button */}
        <PermissionGuard permission="canUpload">
          <Button 
            className="w-full bg-[#8B0000] hover:bg-red-800 text-white mb-6"
            onClick={onUploadClick}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Thesis
          </Button>
        </PermissionGuard>

        {/* Navigation */}
        <nav className="space-y-2">
          <div className="mb-4">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start mb-1 h-auto py-2 px-3",
                  selectedCategory === item.id 
                    ? "bg-red-50 text-[#8B0000] hover:bg-red-50" 
                    : "hover:bg-gray-100"
                )}
                onClick={() => {
                  onCategoryChange(item.id);
                  onClose?.();
                }}
              >
                <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="flex-1 text-left font-medium truncate">{item.label}</span>
                <Badge variant="secondary" className="ml-2 flex-shrink-0 text-xs font-semibold">
                  {item.count}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-600 mb-3 px-3">Categories</p>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start mb-1 h-auto py-2 px-3",
                  selectedCategory === category.id 
                    ? "bg-red-50 text-[#8B0000] hover:bg-red-50" 
                    : "hover:bg-gray-100"
                )}
                onClick={() => {
                  onCategoryChange(category.id);
                  onClose?.();
                }}
              >
                <category.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="flex-1 text-left text-sm font-medium truncate">{category.label}</span>
                <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs font-semibold">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Role-specific items */}
          {additionalItems.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-600 mb-3 px-3">Management</p>
              {additionalItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start mb-1 h-auto py-2 px-3",
                    selectedCategory === item.id 
                      ? "bg-red-50 text-[#8B0000] hover:bg-red-50" 
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => {
                    onCategoryChange(item.id);
                    onClose?.();
                  }}
                >
                  <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span className="flex-1 text-left text-sm font-medium truncate">{item.label}</span>
                  {user?.role === 'admin' && item.id === 'admin' && (
                    <Badge variant="destructive" className="ml-2 flex-shrink-0 text-xs font-semibold">
                      Admin
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </nav>

        {/* University Links - Show for students, hide for admin roles */}
        {(!user || user.role === 'student') && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">University Links</h3>
            <div className="space-y-2">
              <a 
                href="https://ub.edu.ph/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm text-[#8B0000] hover:text-red-800 hover:underline"
              >
                UB Main Website
              </a>
              <a 
                href="https://ubian.ub.edu.ph/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm text-[#8B0000] hover:text-red-800 hover:underline"
              >
                UBian LMS Portal
              </a>
              <a 
                href="https://ebrahman.ub.edu.ph/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm text-[#8B0000] hover:text-red-800 hover:underline"
              >
                eBrahman System
              </a>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                University of Batangas<br />
                Educational Excellence
              </p>
            </div>
          </div>
        )}

        {/* Repository Stats - Show for admin/faculty roles */}
        {(user && (user.role === 'admin' || user.role === 'faculty' || user.role === 'librarian')) && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Repository Stats</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total Theses</span>
                <span>{loading ? '...' : stats.repositoryStats.totalTheses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>This Month</span>
                <span>{loading ? '...' : stats.repositoryStats.thisMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Downloads</span>
                <span>{loading ? '...' : stats.repositoryStats.totalDownloads.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}