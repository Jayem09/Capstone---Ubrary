import { useState } from 'react';
import { 
  Settings, 
  Database, 
  Shield, 
  Mail, 
  Globe,
  HardDrive,
  Bell,
  Key,
  Server,
  Archive,
  AlertTriangle,
  CheckCircle,
  Save
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner';

export function SystemSettings() {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'UBrary - University of Batangas Repository',
    siteDescription: 'Academic repository for theses and capstone projects',
    maintenanceMode: false,
    registrationEnabled: true,
    
    // Email Settings
    emailEnabled: true,
    smtpHost: 'smtp.ub.edu.ph',
    smtpPort: '587',
    smtpUsername: 'noreply@ub.edu.ph',
    smtpPassword: '••••••••',
    
    // Storage Settings
    maxFileSize: '50',
    allowedFileTypes: '.pdf,.doc,.docx',
    storageQuota: '1000',
    autoBackup: true,
    backupFrequency: 'daily',
    
    // Security Settings
    sessionTimeout: '60',
    passwordMinLength: '8',
    requireTwoFactor: false,
    ipWhitelist: '',
    
    // Notification Settings
    emailNotifications: true,
    systemAlerts: true,
    userRegistrationNotify: true,
    documentUploadNotify: true,
  });

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = (section: string) => {
    toast.success(`${section} settings saved`, {
      description: 'Settings have been updated successfully'
    });
  };

  const systemInfo = {
    version: '1.0.0',
    uptime: '15 days, 8 hours',
    diskUsage: '2.4 TB / 5.0 TB',
    memoryUsage: '8.2 GB / 16 GB',
    cpuUsage: '23%',
    activeConnections: 89,
    lastBackup: '2024-01-15 02:00:00',
    nextBackup: '2024-01-16 02:00:00'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        <Badge variant="destructive" className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Admin Only
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            System Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Version</span>
              <span className="text-sm font-medium">{systemInfo.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium">{systemInfo.uptime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Disk Usage</span>
              <span className="text-sm font-medium">{systemInfo.diskUsage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Memory</span>
              <span className="text-sm font-medium">{systemInfo.memoryUsage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">CPU Usage</span>
              <span className="text-sm font-medium">{systemInfo.cpuUsage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-sm font-medium">{systemInfo.activeConnections}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-sm font-medium">{systemInfo.lastBackup}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Next Backup</span>
              <span className="text-sm font-medium">{systemInfo.nextBackup}</span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => toast.info("Backup initiated", { description: "System backup is starting..." })}
            >
              <Archive className="w-4 h-4 mr-2" />
              Run Backup Now
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => toast.success("Cache cleared", { description: "System cache has been cleared" })}
            >
              <Database className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => toast.info("Maintenance mode", { description: "Entering maintenance mode..." })}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Maintenance Mode
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => toast.success("System check completed", { description: "All systems are running normally" })}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              System Health Check
            </Button>
          </div>
        </Card>

        {/* System Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">File Storage</span>
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Service</span>
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Backup Service</span>
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Search Index</span>
              <Badge variant="secondary">Updating</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5" />
              General Settings
            </h3>
            <Button size="sm" onClick={() => handleSaveSettings('General')}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="registrationEnabled">User Registration</Label>
              <Switch
                id="registrationEnabled"
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => handleSettingChange('registrationEnabled', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Email Settings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Settings
            </h3>
            <Button size="sm" onClick={() => handleSaveSettings('Email')}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailEnabled">Email Service</Label>
              <Switch
                id="emailEnabled"
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => handleSettingChange('emailEnabled', checked)}
              />
            </div>
            <div>
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={settings.smtpHost}
                onChange={(e) => handleSettingChange('smtpHost', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  value={settings.smtpPort}
                  onChange={(e) => handleSettingChange('smtpPort', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="smtpUsername">Username</Label>
                <Input
                  id="smtpUsername"
                  value={settings.smtpUsername}
                  onChange={(e) => handleSettingChange('smtpUsername', e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Storage Settings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Storage Settings
            </h3>
            <Button size="sm" onClick={() => handleSaveSettings('Storage')}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                value={settings.allowedFileTypes}
                onChange={(e) => handleSettingChange('allowedFileTypes', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="storageQuota">Storage Quota (GB)</Label>
              <Input
                id="storageQuota"
                type="number"
                value={settings.storageQuota}
                onChange={(e) => handleSettingChange('storageQuota', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="autoBackup">Auto Backup</Label>
              <Switch
                id="autoBackup"
                checked={settings.autoBackup}
                onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
              />
            </div>
            <div>
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select value={settings.backupFrequency} onValueChange={(value) => handleSettingChange('backupFrequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Key className="w-5 h-5" />
              Security Settings
            </h3>
            <Button size="sm" onClick={() => handleSaveSettings('Security')}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="passwordMinLength">Min Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => handleSettingChange('passwordMinLength', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="requireTwoFactor">Require 2FA</Label>
              <Switch
                id="requireTwoFactor"
                checked={settings.requireTwoFactor}
                onCheckedChange={(checked) => handleSettingChange('requireTwoFactor', checked)}
              />
            </div>
            <div>
              <Label htmlFor="ipWhitelist">IP Whitelist (comma-separated)</Label>
              <Textarea
                id="ipWhitelist"
                value={settings.ipWhitelist}
                onChange={(e) => handleSettingChange('ipWhitelist', e.target.value)}
                placeholder="192.168.1.1, 10.0.0.1"
                rows={3}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Notification Settings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </h3>
          <Button size="sm" onClick={() => handleSaveSettings('Notifications')}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications">Email Notifications</Label>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="systemAlerts">System Alerts</Label>
            <Switch
              id="systemAlerts"
              checked={settings.systemAlerts}
              onCheckedChange={(checked) => handleSettingChange('systemAlerts', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="userRegistrationNotify">User Registration</Label>
            <Switch
              id="userRegistrationNotify"
              checked={settings.userRegistrationNotify}
              onCheckedChange={(checked) => handleSettingChange('userRegistrationNotify', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="documentUploadNotify">Document Upload</Label>
            <Switch
              id="documentUploadNotify"
              checked={settings.documentUploadNotify}
              onCheckedChange={(checked) => handleSettingChange('documentUploadNotify', checked)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
