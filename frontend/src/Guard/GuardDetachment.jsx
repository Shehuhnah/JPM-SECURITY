import { MapPin, Building2, Clock, Phone, Users, ShieldCheck } from "lucide-react";

export default function GuardDetachment() {
  // Mock detachment data — you can later fetch this from backend via guardId
  const detachment = {
    name: "SM City Bacoor",
    client: "SM Supermalls",
    location: "Bacoor, Cavite",
    dutyShift: "Day Shift (07:00 - 19:00)",
    supervisor: "SPO1 Ramon Santos (Ret.)",
    contact: "+63 917 456 7890",
    guards: [
      "Mark Dela Cruz",
      "Jayson Villanueva",
      "Leo Tan",
      "Arvin Reyes",
      "Kyle Bautista",
    ],
    notes:
      "Guards are expected to report 30 minutes before shift change for proper turnover and inspection.",
  };

  return (
    <section className="min-h-screen bg-[#0f172a] text-gray-100 px-6 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white tracking-wide flex items-center justify-center gap-2">
          <ShieldCheck className="text-blue-500 w-7 h-7" />
          Guard Detachment Details
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          Information about your current duty assignment and detachment.
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-3xl mx-auto bg-[#1e293b]/90 border border-gray-700 rounded-2xl shadow-lg p-6 sm:p-8 backdrop-blur-sm">
        {/* Detachment Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Building2 className="text-blue-400 w-5 h-5" />
            <h2 className="text-xl font-semibold text-white">
              {detachment.client}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
            <div className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg p-3">
              <MapPin className="text-blue-400 w-5 h-5" />
              <div>
                <p className="text-gray-400 text-xs uppercase">Location</p>
                <p className="font-medium text-white">{detachment.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg p-3">
              <Clock className="text-blue-400 w-5 h-5" />
              <div>
                <p className="text-gray-400 text-xs uppercase">Duty Shift</p>
                <p className="font-medium text-white">{detachment.dutyShift}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg p-3">
              <Users className="text-blue-400 w-5 h-5" />
              <div>
                <p className="text-gray-400 text-xs uppercase">Supervisor</p>
                <p className="font-medium text-white">{detachment.supervisor}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg p-3">
              <Phone className="text-blue-400 w-5 h-5" />
              <div>
                <p className="text-gray-400 text-xs uppercase">Contact</p>
                <p className="font-medium text-white">{detachment.contact}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Guards */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
            <Users className="text-blue-400 w-5 h-5" /> Assigned Guards
          </h3>
          <ul className="space-y-2">
            {detachment.guards.map((guard, index) => (
              <li
                key={index}
                className="bg-[#0f172a]/40 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 hover:bg-[#243046] transition"
              >
                {guard}
              </li>
            ))}
          </ul>
        </div>

        {/* Notes */}
        <div className="mt-8 bg-[#0f172a]/50 border border-gray-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-2 text-white">Notes</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {detachment.notes}
          </p>
        </div>
      </div>
    </section>
  );
}
