import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState } from 'react';

export function MetadataTable(){
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({ queryKey:['tables', page], queryFn: ()=> api.metadata.tables(25, page)});
  const tables = (data?.data) || [];
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="font-medium">Tables</h2>
        <div className="flex gap-2 items-center text-xs">
          <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-2 py-1 bg-gray-200 rounded disabled:opacity-40">Prev</button>
          <span>Page {page}</span>
          <button disabled={(tables.length||0)<25} onClick={()=>setPage(p=>p+1)} className="px-2 py-1 bg-gray-200 rounded disabled:opacity-40">Next</button>
        </div>
      </div>
      {isLoading && <div className="text-sm">Loading...</div>}
      {error && <div className="text-sm text-red-600">Error loading tables</div>}
      <table className="min-w-full text-xs border">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="px-2 py-1 text-left">Name</th>
            <th className="px-2 py-1 text-left">Database</th>
            <th className="px-2 py-1 text-left">Schema</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((t:any)=> (
            <tr key={t.id} className="border-t hover:bg-gray-50">
              <td className="px-2 py-1">{t.name?.fullyQualifiedName || t.fullyQualifiedName}</td>
              <td className="px-2 py-1">{t.database?.name || t.database?.fullyQualifiedName}</td>
              <td className="px-2 py-1">{t.databaseSchema?.name}</td>
            </tr>
          ))}
          {!isLoading && tables.length===0 && <tr><td colSpan={3} className="px-2 py-4 text-center text-gray-500">No tables</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
