import { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  HardDrive, 
  Brain, 
  GitBranch, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatBytes } from '../lib/utils';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  lastCheck: string;
  metrics?: any;
}

interface PipelineSummary {
  total: number;
  running: number;
  completed: number;
  failed: number;
  lastRun: string;
}

interface StorageSummary {
  totalUsed: number;
  totalCapacity: number;
  buckets: number;
  objects: number;
}

interface AIModelSummary {
  models: number;
  active: number;
  lastTraining: string;
  accuracy: number;
}

export default function Dashboard() {
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary | null>(null);
  const [storageSummary, setStorageSummary] = useState<StorageSummary | null>(null);
  const [aiModelSummary, setAiModelSummary] = useState<AIModelSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Mock data for now - replace with actual API calls
        setServiceStatuses([
          { name: 'Airbyte', status: 'healthy', lastCheck: '2 minutes ago' },
          { name: 'Prefect', status: 'healthy', lastCheck: '1 minute ago' },
          { name: 'MinIO', status: 'healthy', lastCheck: '30 seconds ago' },
          { name: 'LangChain', status: 'warning', lastCheck: '5 minutes ago' },
          { name: 'Weaviate', status: 'healthy', lastCheck: '1 minute ago' },
          { name: 'OpenMetadata', status: 'healthy', lastCheck: '2 minutes ago' },
          { name: 'Komiser', status: 'healthy', lastCheck: '3 minutes ago' },
          { name: 'MLflow', status: 'healthy', lastCheck: '1 minute ago' }
        ]);

        setPipelineSummary({
          total: 24,
          running: 3,
          completed: 18,
          failed: 3,
          lastRun: '10 minutes ago'
        });

        setStorageSummary({
          totalUsed: 2.4 * 1024 * 1024 * 1024, // 2.4 GB
          totalCapacity: 10 * 1024 * 1024 * 1024, // 10 GB
          buckets: 8,
          objects: 1247
        });

        setAiModelSummary({
          models: 12,
          active: 8,
          lastTraining: '2 hours ago',
          accuracy: 94.2
        });

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Unified overview of your data orchestration platform</p>
        </div>
        <Button>Refresh Data</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pipeline Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipelines</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineSummary?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {pipelineSummary?.running || 0} running, {pipelineSummary?.failed || 0} failed
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <Badge variant="success">{pipelineSummary?.completed || 0} completed</Badge>
              {pipelineSummary?.running && pipelineSummary.running > 0 && (
                <Badge variant="warning">{pipelineSummary.running} running</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(storageSummary?.totalUsed || 0)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatBytes(storageSummary?.totalCapacity || 0)} used
            </p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${((storageSummary?.totalUsed || 0) / (storageSummary?.totalCapacity || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Models */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiModelSummary?.models || 0}</div>
            <p className="text-xs text-muted-foreground">
              {aiModelSummary?.active || 0} active, {aiModelSummary?.accuracy || 0}% accuracy
            </p>
            <div className="mt-2">
              <Badge variant="info">Last trained: {aiModelSummary?.lastTraining || 'Unknown'}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <p className="text-xs text-muted-foreground">
              All core services operational
            </p>
            <div className="mt-2">
              <Badge variant="success">Healthy</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Real-time status of all platform services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceStatuses.map((service) => (
              <div key={service.name} className="flex items-center space-x-3 p-3 border rounded-lg">
                {getStatusIcon(service.status)}
                <div className="flex-1">
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-xs text-gray-500">{service.lastCheck}</div>
                </div>
                <Badge variant={getStatusBadgeVariant(service.status)}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest pipeline runs and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Data sync completed successfully</span>
              </div>
              <span className="text-xs text-gray-500">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">New pipeline "customer_analytics" created</span>
              </div>
              <span className="text-xs text-gray-500">15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">AI model training started</span>
              </div>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <GitBranch className="h-6 w-6" />
              <span>Create Pipeline</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Database className="h-6 w-6" />
              <span>Add Data Source</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Brain className="h-6 w-6" />
              <span>Train Model</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
