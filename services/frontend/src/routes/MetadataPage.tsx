import { MetadataTable } from '../components/MetadataTable';

export default function MetadataPage(){
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold mb-2">Metadata</h1>
      <MetadataTable />
    </div>
  );
}
