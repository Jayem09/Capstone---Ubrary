import { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Shield, 
  Settings, 
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Eye
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// import { UserManagement } from './UserManagement';
// import { SystemSettings } from './SystemSettings';
// import { AnalyticsDashboard } from './AnalyticsDashboard';
import { toast } from 'sonner';
import { DocumentService } from '../services/documentService';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for admin dashboard
  const stats = {
    totalUsers: 1247,
    totalDocuments: 856,
    pendingReviews: 23,
    monthlyUploads: 145,
    systemUptime: '99.8%',
    storageUsed: '2.4 TB',
    dailyDownloads: 342,
    activeUsers: 89
  };

  const recentActivity = [
    { id: 1, type: 'upload', user: 'John Dinglasan', action: 'uploaded thesis', document: 'Machine Learning Applications...', time: '2 minutes ago' },
    { id: 2, type: 'approval', user: 'Dr. Maria Santos', action: 'approved thesis', document: 'Sustainable Energy Solutions...', time: '15 minutes ago' },
    { id: 3, type: 'user', user: 'Admin', action: 'created new user', document: 'Jane Smith (Student)', time: '1 hour ago' },
    { id: 4, type: 'download', user: 'Multiple Users', action: '25 downloads', document: 'Various documents', time: '2 hours ago' },
  ];

  const systemAlerts = [
    { id: 1, type: 'warning', message: 'Storage usage at 85%', time: '30 minutes ago' },
    { id: 2, type: 'info', message: 'Backup completed successfully', time: '2 hours ago' },
    { id: 3, type: 'success', message: 'System update completed', time: '1 day ago' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="w-4 h-4 text-blue-500" />;
      case 'approval': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'user': return <Users className="w-4 h-4 text-purple-500" />;
      case 'download': return <Download className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'info': return <Activity className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System management and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Administrator
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">+12% from last month</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">+8% from last month</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold">{stats.pendingReviews}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Requires attention</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Uptime</p>
                  <p className="text-2xl font-bold">{stats.systemUptime}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{activity.document}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* System Alerts */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">System Alerts</h3>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
              <div className="space-y-4">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-gray-500">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => toast.info("Backup initiated", { description: "System backup is starting..." })}
              >
                <Database className="w-6 h-6" />
                <span>Backup System</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => toast.info("Maintenance mode", { description: "Entering maintenance mode..." })}
              >
                <Settings className="w-6 h-6" />
                <span>Maintenance Mode</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => toast.success("System check completed", { description: "All systems are running normally" })}
              >
                <Activity className="w-6 h-6" />
                <span>System Health Check</span>
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">User Management</h3>
            <p className="text-gray-600">User management features will be available here.</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
            <p className="text-gray-600">Analytics features will be available here.</p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">System Settings</h3>
            <p className="text-gray-600">System settings will be available here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
