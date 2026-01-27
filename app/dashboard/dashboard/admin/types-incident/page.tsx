import AddTypeIncidentForm from "@/components/types-incident/AddTypeIncidentForm";

export default function TypesIncidentPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestion des Types d&apos;Incidents</h1>
      <AddTypeIncidentForm />
    </div>
  );
}
