import { useEffect, useState } from "react";
import { Search, UserCheck, Trash2, Eye, User, CheckCircle, Clock, XCircle, Briefcase, Filter } from "lucide-react";

export default function ApplicantsList() {
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    document.title = "Applicants List | JPM Security Agency";

    const mockApplicants = [
      {
        _id: "1",
        name: "Juan Dela Cruz",
        email: "juan.delacruz@example.com",
        phone: "09171234567",
        position: "Security Guard",
        status: "Pending",
      },
      {
        _id: "2",
        name: "Maria Santos",
        email: "maria.santos@example.com",
        phone: "09987654321",
        position: "CCTV Operator",
        status: "Interview",
      },
      {
        _id: "3",
        name: "Jose Ramos",
        email: "jose.ramos@example.com",
        phone: "09081231234",
        position: "Security Guard",
        status: "Hired",
      },
      {
        _id: "4",
        name: "Ana Cruz",
        email: "ana.cruz@example.com",
        phone: "09175551234",
        position: "Security Supervisor",
        status: "Rejected",
      },
    ];

    setTimeout(() => setApplicants(mockApplicants), 500);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this applicant?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/applicants/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete applicant");
      setApplicants(applicants.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Delete applicant error:", err);
      alert("❌ Failed to delete applicant.");
    }
  };

  // Status badge renderer
  const getStatusBadge = (status) => {
    const base =
      "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition";
    switch (status) {
      case "Hired":
        return (
          <span className={`${base} bg-green-500/20 text-green-400 border-green-400/40`}>
            <CheckCircle size={12} /> Hired
          </span>
        );
      case "Interview":
        return (
          <span className={`${base} bg-blue-500/20 text-blue-400 border-blue-400/40`}>
            <Briefcase size={12} /> Interview
          </span>
        );
      case "Rejected":
        return (
          <span className={`${base} bg-red-500/20 text-red-400 border-red-400/40`}>
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className={`${base} bg-yellow-500/20 text-yellow-300 border-yellow-300/40`}>
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  // Filtering + search
  const filteredApplicants = applicants.filter((a) => {
    const matchesSearch =
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      {/* Header */}
      <main className="flex-1 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <User className="text-blue-500" />
            Applicants List
          </h1>
          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row justify-between mb-6 gap-3">
            <div className="flex items-center bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-blue-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-200 focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Interview">Interview</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
              {/* <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /> */}
              <input
                type="text"
                placeholder="Search applicant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#1e293b] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 w-full"
              />
          </div>
        </div>
        {/* Applicants Table */}
        <div className="overflow-x-auto bg-[#1e293b]/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg">
          <table className="w-full text-left">
            <thead className="bg-[#234C6A] text-white text-sm">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-400 italic">
                    No applicants found.
                  </td>
                </tr>
              ) : (
                filteredApplicants.map((a) => (
                  <tr
                    key={a._id}
                    className="border-t border-gray-700 hover:bg-[#2a3a4f]/40 transition"
                  >
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-gray-300">{a.email}</td>
                    <td className="px-4 py-3 text-gray-300">{a.phone}</td>
                    <td className="px-4 py-3 text-gray-200">{a.position || "Security Guard"}</td>
                    <td className="px-4 py-3">{getStatusBadge(a.status)}</td>
                    <td className="px-4 py-3 flex justify-center gap-2">
                      <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1 text-sm">
                        <Eye size={14} /> View
                      </button>
                      <button className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1 text-sm">
                        <UserCheck size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1 text-sm"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-xs border-t border-gray-800 pt-4">
          © {new Date().getFullYear()} JPM Security Agency — Applicant Management Portal
        </footer>
      </main>
    </div>
  );
}
