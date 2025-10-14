import { useParams, Link } from "react-router-dom";

export default function GuardSchedule({ guards = [] }) {
  const { id } = useParams();
  const guard = guards.find((g) => g.id === parseInt(id));

  if (!guard) {
    return (
      <div className="p-6 text-white">
        <p>Guard not found.</p>
        <Link to="/" className="text-blue-400 hover:underline">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">{guard.name} – Schedule</h2>
      <Link to="/" className="text-blue-400 hover:underline">
        ← Back
      </Link>

      {guard.deployments.length === 0 ? (
        <p className="text-gray-400 mt-4">No deployments assigned.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {guard.deployments.map((d) => (
            <li key={d.id} className="p-3 border rounded-lg bg-gray-700">
              📅 {d.date} ⏰ {d.time || "N/A"} 📍 {d.location}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
