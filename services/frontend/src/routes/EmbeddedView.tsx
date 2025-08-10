export default function EmbeddedView(){
  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Embedded Service</h1>
      <div className="border rounded h-[70vh]">
        <iframe title="Embedded" src="/api/v1/embed/placeholder" className="w-full h-full" />
      </div>
    </div>
  );
}
