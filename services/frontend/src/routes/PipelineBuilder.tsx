import ReactFlow, { Background, Controls, addEdge, Connection, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { useState, useCallback, useEffect } from 'react';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function PipelineBuilder(){
  const [nodes, setNodes] = useState<Node[]>(() => JSON.parse(localStorage.getItem('pipeline_nodes')||'[]'));
  const [edges, setEdges] = useState<Edge[]>(() => JSON.parse(localStorage.getItem('pipeline_edges')||'[]'));

  useEffect(()=>{ localStorage.setItem('pipeline_nodes', JSON.stringify(nodes)); }, [nodes]);
  useEffect(()=>{ localStorage.setItem('pipeline_edges', JSON.stringify(edges)); }, [edges]);

  const onConnect = useCallback((connection: Connection) => setEdges(eds => addEdge(connection, eds)), []);

  return (
    <div className="h-full w-full" style={{height:'calc(100vh - 4rem)'}}>
      <ReactFlow nodes={nodes} edges={edges} onConnect={onConnect}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
