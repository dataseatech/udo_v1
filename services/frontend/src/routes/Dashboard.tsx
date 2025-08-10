import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function Dashboard() {
  const { data: pipelines } = useQuery({ queryKey: ['pipelines'], queryFn: api.pipelines.list });
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="p-4 bg-white shadow rounded">
          <h2 className="font-medium mb-2">Pipelines</h2>
          <ul className="text-sm space-y-1">
            {pipelines?.slice(0,5).map((p:any)=> <li key={p.id}>{p.name}</li>) || <li>Loading...</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
