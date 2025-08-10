import { useState, useEffect } from 'react';
import { HardDrive, Folder, File, Download, Upload, Trash2, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatBytes } from '../lib/utils';

interface Bucket {
  id: string;
  name: string;
  size: number;
  objects: number;
  lastModified: string;
  access: 'public' | 'private';
  tags: string[];
}

interface StorageObject {
  id: string;
  name: string;
  bucket: string;
  size: number;
  type: string;
  lastModified: string;
  path: string;
}

const mockBuckets: Bucket[] = [
  {
    id: '1',
    name: 'raw-data',
    size: 1.2 * 1024 * 1024 * 1024, // 1.2 GB
    objects: 450,
    lastModified: '2 hours ago',
    access: 'private',
    tags: ['raw', 'customer-data']
  },
  {
    id: '2',
    name: 'processed-data',
    size: 890 * 1024 * 1024, // 890 MB
    objects: 234,
    lastModified: '1 hour ago',
    access: 'private',
    tags: ['processed', 'analytics']
  },
  {
    id: '3',
    name: 'ml-models',
    size: 2.1 * 1024 * 1024 * 1024, // 2.1 GB
    objects: 67,
    lastModified: '3 hours ago',
    access: 'private',
    tags: ['ml', 'models']
  },
  {
    id: '4',
    name: 'public-assets',
    size: 156 * 1024 * 1024, // 156 MB
    objects: 89,
    lastModified: '5 hours ago',
    access: 'public',
    tags: ['public', 'assets']
  }
];

const mockObjects: StorageObject[] = [
  {
    id: '1',
    name: 'customers.csv',
    bucket: 'raw-data',
    size: 45 * 1024 * 1024, // 45 MB
    type: 'csv',
    lastModified: '2 hours ago',
    path: '/raw-data/customers/customers.csv'
  },
  {
    id: '2',
    name: 'orders.json',
    bucket: 'raw-data',
    size: 128 * 1024 * 1024, // 128 MB
    type: 'json',
    lastModified: '2 hours ago',
    path: '/raw-data/orders/orders.json'
  },
  {
    id: '3',
    name: 'customer_analytics.parquet',
    bucket: 'processed-data',
    size: 67 * 1024 * 1024, // 67 MB
    type: 'parquet',
    lastModified: '1 hour ago',
    path: '/processed-data/analytics/customer_analytics.parquet'
  },
  {
    id: '4',
    name: 'model_v1.pkl',
    bucket: 'ml-models',
    size: 89 * 1024 * 1024, // 89 MB
    type: 'pkl',
    lastModified: '3 hours ago',
    path: '/ml-models/customer-churn/model_v1.pkl'
  }
];

export default function Storage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<StorageObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setBuckets(mockBuckets);
      setObjects(mockObjects);
      setLoading(false);
    }, 1000);
  }, []);

  const totalStorage = buckets.reduce((sum, bucket) => sum + bucket.size, 0);
  const totalObjects = buckets.reduce((sum, bucket) => sum + bucket.objects, 0);

  const filteredObjects = objects.filter(obj => 
    !selectedBucket || obj.bucket === selectedBucket
  ).filter(obj =>
    !searchQuery || obj.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Storage</h1>
          <p className="text-gray-600 mt-1">Manage your object storage buckets and data</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload Files</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <Folder className="w-4 h-4" />
            <span>Create Bucket</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalStorage)}</div>
            <p className="text-xs text-muted-foreground">
              Across {buckets.length} buckets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Objects</CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalObjects.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Files and folders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buckets</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buckets.length}</div>
            <p className="text-xs text-muted-foreground">
              {buckets.filter(b => b.access === 'public').length} public
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Health</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <p className="text-xs text-muted-foreground">Available space</p>
          </CardContent>
        </Card>
      </div>

      {/* Buckets Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Buckets</CardTitle>
          <CardDescription>Overview of your data storage buckets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {buckets.map((bucket) => (
              <div 
                key={bucket.id} 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedBucket === bucket.name 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedBucket(selectedBucket === bucket.name ? null : bucket.name)}
              >
                <div className="flex items-center justify-between mb-3">
                  <Folder className="w-8 h-8 text-blue-600" />
                  <Badge variant={bucket.access === 'public' ? 'info' : 'secondary'}>
                    {bucket.access}
                  </Badge>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{bucket.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>{formatBytes(bucket.size)}</div>
                  <div>{bucket.objects.toLocaleString()} objects</div>
                  <div>Updated {bucket.lastModified}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {bucket.tags.map((tag, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Objects List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Storage Objects</CardTitle>
              <CardDescription>
                {selectedBucket ? `Files in ${selectedBucket}` : 'All storage objects'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search objects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredObjects.map((obj) => (
              <div key={obj.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{obj.name}</div>
                    <div className="text-sm text-gray-500">{obj.path}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatBytes(obj.size)}</div>
                    <div className="text-xs text-gray-500 capitalize">{obj.type}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{obj.bucket}</div>
                    <div className="text-xs text-gray-500">{obj.lastModified}</div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <File className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredObjects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No objects match your search' : 'No objects found'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Analytics</CardTitle>
          <CardDescription>Storage usage patterns and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {((buckets.find(b => b.name === 'raw-data')?.size || 0) / totalStorage * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Raw Data</div>
              <div className="text-xs text-gray-500">Largest bucket</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {((buckets.find(b => b.name === 'ml-models')?.size || 0) / totalStorage * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">ML Models</div>
              <div className="text-xs text-gray-500">AI/ML assets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {((buckets.find(b => b.name === 'processed-data')?.size || 0) / totalStorage * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Processed Data</div>
              <div className="text-xs text-gray-500">Analytics ready</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
