import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitBranch, 
  Database, 
  HardDrive, 
  Brain, 
  Activity, 
  DollarSign, 
  Settings as SettingsIcon,
  BarChart3,
  MessageSquare,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & Summary'
  },
  {
    path: '/pipelines',
    label: 'Pipelines',
    icon: GitBranch,
    description: 'Data Orchestration'
  },
  {
    path: '/data-sources',
    label: 'Data Sources',
    icon: Database,
    description: 'Connectors & Ingestion'
  },
  {
    path: '/storage',
    label: 'Storage',
    icon: HardDrive,
    description: 'Object Store & Data'
  },
  {
    path: '/ai-models',
    label: 'AI Models',
    icon: Brain,
    description: 'ML Models & RAG'
  },
  {
    path: '/ai-playground',
    label: 'AI Playground',
    icon: MessageSquare,
    description: 'Natural Language Queries'
  },
  {
    path: '/monitoring',
    label: 'Monitoring',
    icon: Activity,
    description: 'System Health & Metrics'
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Data Insights & Reports'
  },
  {
    path: '/costs',
    label: 'Costs',
    icon: DollarSign,
    description: 'Resource Optimization'
  },
  {
    path: '/metadata',
    label: 'Metadata',
    icon: FileText,
    description: 'Data Catalog & Lineage'
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: SettingsIcon,
    description: 'Configuration & Users'
  }
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">UDO</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Unified Data</h1>
            <p className="text-xs text-gray-500">Orchestration Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                )} 
              />
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className={cn(
                  "text-xs transition-colors",
                  isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-600"
                )}>
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>All Systems Operational</span>
          </div>
          <div>Powered by Airbyte, Prefect, MinIO, LangChain</div>
        </div>
      </div>
    </div>
  );
}
