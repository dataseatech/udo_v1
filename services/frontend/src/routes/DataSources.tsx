import { useState, useEffect } from 'react';
import { Plus, Database, RefreshCw, Settings, Trash2, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatBytes, formatDuration } from '../lib/utils';

interface DataSource {
  id: string;
  name: string;
  type: 'postgres' | 'mysql' | 'mongodb' | 's3' | 'api' | 'other';
  status: 'active' | 'inactive' | 'error' | 'syncing';
  lastSync: string;
  nextSync: string;
  records: number;
  size: number;
  schedule: string;
}

const mockDataSources: DataSource[] = [
  {
    id: '1',
    name: 'Customer Database',
    type: 'postgres',
    status: 'active',
    lastSync: '2 hours ago',
    nextSync: 'in 4 hours',
    records: 1250000,
    size: 2.4 * 1024 * 1024 * 1024, // 2.4 GB
    schedule: 'Every 6 hours'
  },
  {
    id: '2',
    name: 'Product Catalog',
    type: 'mysql',
    status: 'syncing',
    lastSync: 'currently syncing',
    nextSync: 'in 6 hours',
    records: 45000,
    size: 156 * 1024 * 1024, // 156 MB
    schedule: 'Every 6 hours'
  },
  {
    id: '3',
    name: 'Analytics Events',
    type: 'mongodb',
    status: 'active',
    lastSync: '1 hour ago',
    nextSync: 'in 5 hours',
    records: 8900000,
    size: 8.2 * 1024 * 1024 * 1024, // 8.2 GB
    schedule: 'Every hour'
  },
  {
    id: '4',
    name: 'Marketing Data',
    type: 's3',
    status: 'inactive',
    lastSync: '2 days ago',
    nextSync: 'paused',
    records: 320000,
    size: 890 * 1024 * 1024, // 890 MB
    schedule: 'Daily'
  }
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'postgres':
      return <Database className="w-5 h-5 text-blue-600" />;
    case 'mysql':
      return <Database className="w-5 h-5 text-orange-600" />;
    case 'mongodb':
      return <Database className="w-5 h-5 text-green-600" />;
    case 's3':
      return <Database className="w-5 h-5 text-purple-600" />;
    default:
      return <Database className="w-5 h-5 text-gray-600" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inactive</Badge>;
    case 'error':
      return <Badge variant="error">Error</Badge>;
    case 'syncing':
      return <Badge variant="warning">Syncing</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export default function DataSources() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDataSources(mockDataSources);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSync = (id: string) => {
    setDataSources(prev => 
      prev.map(ds => 
        ds.id === id 
          ? { ...ds, status: 'syncing' as const, lastSync: 'currently syncing' }
          : ds
      )
    );
    
    // Simulate sync completion
    setTimeout(() => {
      setDataSources(prev => 
        prev.map(ds => 
          ds.id === id 
            ? { ...ds, status: 'active' as const, lastSync: 'just now' }
            : ds
        )
      );
    }, 3000);
  };

  const handleToggleStatus = (id: string) => {
    setDataSources(prev => 
      prev.map(ds => 
        ds.id === id 
          ? { 
              ...ds, 
              status: ds.status === 'active' ? 'inactive' as const : 'active' as const,
              nextSync: ds.status === 'active' ? 'paused' : 'in 6 hours'
            }
          : ds
      )
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Data Sources</h1>
          <p className="text-gray-600 mt-1">Manage your data connections and ingestion pipelines</p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Data Source</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataSources.length}</div>
            <p className="text-xs text-muted-foreground">
              {dataSources.filter(ds => ds.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(dataSources.reduce((sum, ds) => sum + ds.records, 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">Across all sources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(dataSources.reduce((sum, ds) => sum + ds.size, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Data storage used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dataSources.filter(ds => ds.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Sources syncing normally</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>Manage your data connections and monitor sync status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataSources.map((source) => (
              <div key={source.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getTypeIcon(source.type)}
                    <div>
                      <h3 className="font-medium text-gray-900">{source.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{source.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatBytes(source.size)}</div>
                      <div className="text-xs text-gray-500">{source.records.toLocaleString()} records</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{source.lastSync}</div>
                      <div className="text-xs text-gray-500">{source.nextSync}</div>
                    </div>
                    
                    {getStatusBadge(source.status)}
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(source.id)}
                        disabled={source.status === 'syncing'}
                      >
                        <RefreshCw className={`w-4 h-4 ${source.status === 'syncing' ? 'animate-spin' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(source.id)}
                      >
                        {source.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Schedule: {source.schedule}</span>
                    <span>Last updated: {source.lastSync}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add New Source Modal Placeholder */}
      <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
        <CardContent className="p-8 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Data Source</h3>
          <p className="text-gray-600 mb-4">
            Connect to databases, APIs, or cloud storage to start ingesting data
          </p>
          <Button>Connect Data Source</Button>
        </CardContent>
      </Card>
    </div>
  );
}
