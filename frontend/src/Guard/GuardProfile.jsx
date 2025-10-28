import { useState } from "react";
import { ShieldUser, Mail, Phone, MapPin, Clock, BadgeCheck, Pencil } from "lucide-react";

export default function GuardProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [guard, setGuard] = useState({
    fullName: "Mark Dela Cruz",
    guardId: "G-1023",
    email: "mark.delacruz@jpmsecurity.com",
    phoneNumber: "+63 912 345 6789",
    address: "Imus, Cavite",
    dutyStation: "SM City Bacoor",
    shift: "Day Shift (07:00 - 19:00)",
    position: "Security Guard",
  });

  const handleChange = (e) => {
    setGuard({ ...guard, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setIsEditing(false);
    // You can later POST or PUT this data to backend API
    console.log("Updated Profile:", guard);
  };

  return (
    <section className="min-h-screen bg-[#0f172a] text-gray-100 px-6 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white tracking-wide flex items-center justify-center gap-2">
          <ShieldUser className="text-blue-500 w-7 h-7" />
          Manage Profile
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          View and update your guard profile information
        </p>
      </div>

      {/* Profile Card */}
      <div className="max-w-3xl mx-auto bg-[#1e293b]/90 border border-gray-700 rounded-2xl shadow-lg p-6 sm:p-8 backdrop-blur-sm space-y-6">
        {/* Header Info */}
        <div className="text-center border-b border-gray-700 pb-6">
          <div className="mx-auto mb-4 w-20 h-20 bg-[#0f172a] flex items-center justify-center rounded-full border border-gray-600">
            <ShieldUser size={42} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">{guard.fullName}</h2>
          <p className="text-gray-400 text-sm">{guard.position}</p>
          <p className="text-blue-400 text-xs font-mono mt-1">ID: {guard.guardId}</p>
        </div>

        {/* Information Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg p-3 border border-gray-700">
            <Mail className="text-blue-400 w-5 h-5" />
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={guard.email}
                onChange={handleChange}
                className="bg-transparent border-b border-gray-500 focus:outline-none focus:border-blue-400 w-full"
              />
            ) : (
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p>{guard.email}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg p-3 border border-gray-700">
            <Phone className="text-blue-400 w-5 h-5" />
            {isEditing ? (
              <input
                type="text"
                name="phoneNumber"
                value={guard.phoneNumber}
                onChange={handleChange}
                className="bg-transparent border-b border-gray-500 focus:outline-none focus:border-blue-400 w-full"
              />
            ) : (
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p>{guard.phoneNumber}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg p-3 border border-gray-700">
            <MapPin className="text-blue-400 w-5 h-5" />
            {isEditing ? (
              <input
                type="text"
                name="address"
                value={guard.address}
                onChange={handleChange}
                className="bg-transparent border-b border-gray-500 focus:outline-none focus:border-blue-400 w-full"
              />
            ) : (
              <div>
                <p className="text-xs text-gray-400">Address</p>
                <p>{guard.address}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg p-3 border border-gray-700">
            <BadgeCheck className="text-blue-400 w-5 h-5" />
            {isEditing ? (
              <input
                type="text"
                name="dutyStation"
                value={guard.dutyStation}
                onChange={handleChange}
                className="bg-transparent border-b border-gray-500 focus:outline-none focus:border-blue-400 w-full"
              />
            ) : (
              <div>
                <p className="text-xs text-gray-400">Duty Station</p>
                <p>{guard.dutyStation}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 bg-[#0f172a]/50 rounded-lg p-3 border border-gray-700 sm:col-span-2">
            <Clock className="text-blue-400 w-5 h-5" />
            {isEditing ? (
              <input
                type="text"
                name="shift"
                value={guard.shift}
                onChange={handleChange}
                className="bg-transparent border-b border-gray-500 focus:outline-none focus:border-blue-400 w-full"
              />
            ) : (
              <div>
                <p className="text-xs text-gray-400">Shift Schedule</p>
                <p>{guard.shift}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mt-6">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg mr-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-2 rounded-lg shadow"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg shadow transition"
            >
              <Pencil size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
