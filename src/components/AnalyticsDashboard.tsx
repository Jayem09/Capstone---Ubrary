import { useState } from 'react';
import { 
  TrendingUp, 
  Download, 
  Upload, 
  Users, 
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30days');

  // Mock analytics data
  const analyticsData = {
    totalDownloads: 15420,
    totalUploads: 856,
    activeUsers: 1247,
    totalViews: 48320,
    downloadGrowth: 12.5,
    uploadGrowth: 8.3,
    userGrowth: 15.2,
    viewGrowth: 22.1
  };

  const topDocuments = [
    { id: 1, title: 'Machine Learning Applications in Healthcare', downloads: 342, views: 1245, author: 'John Dinglasan' },
    { id: 2, title: 'Sustainable Energy Solutions for Rural Communities', downloads: 298, views: 987, author: 'James Rivera' },
    { id: 3, title: 'Digital Marketing Strategies for SMEs', downloads: 256, views: 876, author: 'Maria Lopez' },
    { id: 4, title: 'Innovative Teaching Methods in Mathematics', downloads: 234, views: 765, author: 'Patricia Valdez' },
    { id: 5, title: 'Blockchain Technology in Supply Chain', downloads: 201, views: 654, author: 'Michael Torres' },
  ];

  const departmentStats = [
    { name: 'Information Technology', documents: 342, downloads: 5420, color: 'bg-blue-500' },
    { name: 'Business Administration', documents: 234, downloads: 3210, color: 'bg-green-500' },
    { name: 'Engineering', documents: 156, downloads: 2890, color: 'bg-purple-500' },
    { name: 'Education', documents: 87, downloads: 1890, color: 'bg-orange-500' },
    { name: 'Nursing', documents: 145, downloads: 2010, color: 'bg-pink-500' },
  ];

  const monthlyData = [
    { month: 'Jan', uploads: 45, downloads: 1200 },
    { month: 'Feb', uploads: 52, downloads: 1350 },
    { month: 'Mar', uploads: 48, downloads: 1280 },
    { month: 'Apr', uploads: 61, downloads: 1450 },
    { month: 'May', uploads: 58, downloads: 1380 },
    { month: 'Jun', uploads: 67, downloads: 1520 },
  ];

  const userActivity = [
    { hour: '00:00', users: 12 },
    { hour: '02:00', users: 8 },
    { hour: '04:00', users: 5 },
    { hour: '06:00', users: 15 },
    { hour: '08:00', users: 45 },
    { hour: '10:00', users: 78 },
    { hour: '12:00', users: 89 },
    { hour: '14:00', users: 95 },
    { hour: '16:00', users: 82 },
    { hour: '18:00', users: 65 },
    { hour: '20:00', users: 42 },
    { hour: '22:00', users: 28 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">System usage statistics and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Downloads</p>
              <p className="text-2xl font-bold">{analyticsData.totalDownloads.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{analyticsData.downloadGrowth}%</span>
              </div>
            </div>
            <Download className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Uploads</p>
              <p className="text-2xl font-bold">{analyticsData.totalUploads.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{analyticsData.uploadGrowth}%</span>
              </div>
            </div>
            <Upload className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold">{analyticsData.activeUsers.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{analyticsData.userGrowth}%</span>
              </div>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{analyticsData.viewGrowth}%</span>
              </div>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Documents */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Documents
            </h3>
            <Badge variant="secondary">{timeRange}</Badge>
          </div>
          <div className="space-y-4">
            {topDocuments.map((doc, index) => (
              <div key={doc.id} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#8B0000] text-white flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.title}</p>
                  <p className="text-sm text-gray-500">by {doc.author}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{doc.downloads} downloads</p>
                  <p className="text-xs text-gray-500">{doc.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Department Statistics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Department Statistics
            </h3>
            <Badge variant="secondary">All time</Badge>
          </div>
          <div className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dept.name}</span>
                  <span className="text-sm text-gray-600">{dept.documents} docs</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${dept.color}`}
                    style={{ width: `${(dept.downloads / 5420) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{dept.downloads.toLocaleString()} downloads</span>
                  <span>{Math.round((dept.downloads / 15420) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Monthly Trends
          </h3>
          <Badge variant="secondary">Last 6 months</Badge>
        </div>
        <div className="grid grid-cols-6 gap-4">
          {monthlyData.map((data) => (
            <div key={data.month} className="text-center">
              <div className="space-y-2 mb-2">
                <div className="h-24 bg-gray-100 rounded flex flex-col justify-end p-2">
                  <div 
                    className="bg-blue-500 rounded-sm mb-1"
                    style={{ height: `${(data.uploads / 70) * 60}px` }}
                  />
                  <div 
                    className="bg-green-500 rounded-sm"
                    style={{ height: `${(data.downloads / 1600) * 60}px` }}
                  />
                </div>
              </div>
              <p className="text-xs font-medium">{data.month}</p>
              <div className="text-xs text-gray-500">
                <p>{data.uploads} uploads</p>
                <p>{data.downloads} downloads</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-sm" />
            <span className="text-sm">Uploads</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm" />
            <span className="text-sm">Downloads</span>
          </div>
        </div>
      </Card>

      {/* User Activity Heatmap */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Daily User Activity
          </h3>
          <Badge variant="secondary">24-hour pattern</Badge>
        </div>
        <div className="grid grid-cols-12 gap-2">
          {userActivity.map((activity) => (
            <div key={activity.hour} className="text-center">
              <div 
                className="h-12 bg-blue-500 rounded mb-2 flex items-end justify-center text-white text-xs font-medium"
                style={{ 
                  height: `${Math.max((activity.users / 100) * 48, 8)}px`,
                  opacity: activity.users / 100 
                }}
              >
                {activity.users > 50 ? activity.users : ''}
              </div>
              <p className="text-xs text-gray-500">{activity.hour}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4 text-center">
          Peak activity: 2:00 PM - 4:00 PM ({Math.max(...userActivity.map(a => a.users))} concurrent users)
        </p>
      </Card>
    </div>
  );
}
