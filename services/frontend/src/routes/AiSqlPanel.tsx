import { useState, useRef } from 'react';
import { api } from '../lib/api';
import { useMutation } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export default function AiSqlPanel(){
  const [question, setQuestion] = useState('Top 5 products by ROI');
  const [gridData, setGridData] = useState<any[]|null>(null);
  const [columns, setColumns] = useState<any[]|null>(null);
  const sqlRef = useRef<string>('');
  const mutation = useMutation({ mutationFn: async ()=> {
    const res = await api.aiSql(question);
    // Backend returns {sql, results: [[..],[..]]}; build simple columns/rows
    if(res.results && res.results.length){
      const first = res.results[0];
      const colDefs = first.map((_:any,i:number)=> ({ field: `c${i+1}` }));
      const rowData = res.results.map((row:any[]) => Object.fromEntries(row.map((v:any,i:number)=>[`c${i+1}`, v])));
      setColumns(colDefs); setGridData(rowData);
    } else { setColumns(null); setGridData(null); }
    sqlRef.current = res.sql;
    return res;
  }});
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">AI SQL</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-medium uppercase">Natural Language Question</label>
          <input className="w-full border rounded p-2 text-sm" value={question} onChange={e=>setQuestion(e.target.value)} />
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={()=>mutation.mutate()} disabled={mutation.isLoading}>Run</button>
          {mutation.isLoading && <div className="text-sm">Generating...</div>}
          {mutation.error && <div className="text-red-600 text-xs">Error: {(mutation.error as any).message}</div>}
          {mutation.data && (
            <div>
              <h2 className="font-medium text-sm mb-1">Generated SQL</h2>
              <div className="border rounded h-40">
                <Editor height="100%" defaultLanguage="sql" value={sqlRef.current} options={{ readOnly:true, minimap:{enabled:false}, fontSize:12 }} />
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <h2 className="font-medium text-sm">Results</h2>
          <div className="ag-theme-alpine h-64 w-full border rounded">
            {gridData && columns ? <AgGridReact rowData={gridData} columnDefs={columns} /> : <div className="p-2 text-xs text-gray-500">No data</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
