import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Search,
  UserCheck,
  Trash2,
  Eye,
  EyeOff,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Briefcase,
  Filter,
  FileDown,
  Mail,
  Phone,
  Save,
  RefreshCcw,
  Shield,
  ChevronLeft,
  ChevronRight 
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
const api = import.meta.env.VITE_API_URL;

export default function ApplicantsList() {
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [confirmModal, setConfirmModal] = useState({ open: false, applicant: null, status: null });
  const [pendingActionLabel, setPendingActionLabel] = useState("");
  const [interviewModal, setInterviewModal] = useState({ open: false, applicant: null });
  const [interviewType, setInterviewType] = useState("single");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewStart, setInterviewStart] = useState("");
  const [interviewEnd, setInterviewEnd] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewMessage, setInterviewMessage] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [hireModal, setHireModal] = useState({ open: false, applicant: null });
  const [hireMessage, setHireMessage] = useState("");
  const [sendingHire, setSendingHire] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [savingRemarks, setSavingRemarks] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [guardConfirmModalOpen , setGuardConfirmModalOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    guardId: "",
    address: "",
    position: "",
    phoneNumber: "",
    SSSID: "",
    PhilHealthID: "",
    PagibigID: "",
    EmergencyPerson: "",
    EmergencyContact: ""
  });

  const generateGuardPassword = () => {
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const randomNumber = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    return `JPM${randomLetter}${randomNumber}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "email" ? value.toLowerCase() : value,
    }));
  };

  const handleConfirmAndCreateGuard = async () => {
    if (!selectedApplicant) return;
    setSavingRemarks(true); // Reuse for loading state
    setErrorMsg("");

    try {
        const res = await fetch(`${api}/api/applicants/${selectedApplicant._id}/finalize-hiring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create guard and hire applicant.');
      }

      toast.success(data.message);
      fetchApplicants(); 
      setGuardConfirmModalOpen(false);
    } catch (err) {
      console.error("Error finalizing hiring:", err);
      setErrorMsg(err.message);
      toast.error(err.message);
    } finally {
      setSavingRemarks(false);
    }
  };

  const openAddGuardModal = () => {
    setForm((prev) => ({
      ...prev,
      password: generateGuardPassword(),
    }));
    setGuardConfirmModalOpen(true);
  };

  const openConfirmHireModal = () => {
    setErrorMsg("")
    if(!form.fullName || !form.email || !form.guardId || !form.address || !form.position || !form.phoneNumber || !form.EmergencyPerson || !form.EmergencyContact){
      return setErrorMsg("Please fill out all required fields.")
    } else {
      setErrorMsg("")
      setIsConfirmModalOpen(true)
    }
  }

  const openPanel = (applicant) => {
    setSelectedApplicant(applicant);
    setRemarks(applicant.interviewRemarks || "");
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setSelectedApplicant(null);
    setIsPanelOpen(false);
  };

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
      return;
    }
    document.title = "Applicants List | JPM Security Agency";
  }, [user, loading, navigate]);

  const fetchApplicants = async () => {
    setForm({ // Reset form state
      fullName: "",
      email: "",
      guardId: "",
      address: "",
      position: "",
      phoneNumber: "",
      SSSID: "",
      PhilHealthID: "",
      PagibigID: "",
      EmergencyPerson: "",
      EmergencyContact: ""
    });
    setErrorMsg("");
    try {
      const res = await fetch(`${api}/api/applicants`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setApplicants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch applicants error:", err);
      setApplicants([]);
      toast.error("Failed to fetch applicants.");
    }
  };

  useEffect(() => {
    if (user) fetchApplicants();
  }, [user]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${api}/api/applicants/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update applicant status");
      const updated = await res.json();
      setApplicants((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      // Also update the selected applicant if it's the one being changed
      if (selectedApplicant?._id === updated._id) {
        setSelectedApplicant(updated);
      }
      toast.success(`Applicant status updated to ${status}`);
    } catch (err) {
      console.error("Update applicant status error:", err);
      toast.error("❌ Failed to update applicant status.");
    }
  };

  const openConfirmModal = (applicant, status) => {
    const labelMap = {
      Review: "Mark this applicant for review?",
      Interview: "Move this applicant to interview stage?",
      Hired: "Confirm hiring this applicant?",
      Declined: "Mark this applicant as declined?",
    };
    setPendingActionLabel(labelMap[status] ?? "Confirm action?");
    setConfirmModal({ open: true, applicant, status });
  };

  const closeConfirmModal = () => setConfirmModal({ open: false, applicant: null, status: null });

  //FOR DECLINE STATUS
  const confirmStatusChange = async () => {
    const { applicant, status } = confirmModal;
    if (!applicant || !status) return;

    if (status === "Declined") {
      try {
        const res = await fetch(`${api}/api/applicants/${applicant._id}/decline`, {
          method: "PATCH",
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        // Assuming the backend returns the updated applicant
        setApplicants((prev) => prev.map((a) => (a._id === data._id ? data : a)));
        if (selectedApplicant?._id === data._id) {
          setSelectedApplicant(data);
        }
        toast.success("Applicant has been declined.");
      } catch (err) {
        console.error("Decline applicant error:", err);
        toast.error("Failed to decline applicant.");
      }
    } else {
      await updateStatus(applicant._id, status);
    }
    closeConfirmModal();
  };

  const openInterviewModal = (applicant) => {
    setInterviewModal({ open: true, applicant });
    setInterviewType("single");
    setInterviewDate("");
    setInterviewStart("");
    setInterviewEnd("");
    setInterviewTime("");
    setInterviewMessage("");
  };

  const closeInterviewModal = () => setInterviewModal({ open: false, applicant: null });

  const formatDate = (val) => {
    if (!val) return "N/A";
    try {
      return new Date(val).toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric", hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return val;
    }
  };

  const sendInterviewInvite = async () => {
    if (!interviewModal.applicant) return;
    const applicant = interviewModal.applicant;

    // --- Validation ---
    if (interviewType === "single" && !interviewDate) {
      toast.error("Please select a date for the interview.");
      return;
    }
    if (interviewType === "range" && (!interviewStart || !interviewEnd)) {
      toast.error("Please select a valid start and end date.");
      return;
    }

    try {
      setSendingInvite(true);

      // 1. Update applicant status to "Interview"
      await updateStatus(applicant._id, "Interview");

      // 2. Send the interview email with all details
      const emailBody = {
        type: interviewType,
        date: interviewDate || null,
        startDate: interviewStart || null,
        endDate: interviewEnd || null,
        time: interviewTime || null,
        message: interviewMessage,
      };

      const res = await fetch(`${api}/api/applicants/${applicant._id}/interview-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(emailBody),
      });

      if (!res.ok) {
        throw new Error('Failed to send interview email.');
      }

      toast.success(`Interview invitation sent to ${applicant.name}`);
      closeInterviewModal();
    } catch (err) {
      console.error("Failed to send interview invite:", err);
      toast.error("❌ Failed to send interview invitation.");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleSaveRemarks = async () => {
    if (!selectedApplicant) return;
    setSavingRemarks(true);
    try {
      const res = await fetch(`${api}/api/applicants/${selectedApplicant._id}/remarks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ remarks }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updatedApplicant = await res.json();

      setApplicants(prev => prev.map(a => a._id === updatedApplicant._id ? updatedApplicant : a));
      setSelectedApplicant(updatedApplicant);
      toast.success("Remarks saved successfully.");
    } catch (err) {
      console.error("Error saving remarks:", err);
      toast.error("Failed to save remarks.");
    } finally {
      setSavingRemarks(false);
    }
  };

  const handleViewResume = (applicant) => {
    const file = applicant?.resume?.file;
    if (!file) {
      toast.info("This applicant has not submitted a resume yet.");
      return;
    }
    window.open(`${api}${file}`, "_blank", "noopener,noreferrer");
  };

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition";
    switch (status) {
      case "Hired": return <span className={`${base} bg-green-500/20 text-green-400 border-green-400/40`}><CheckCircle size={12} /> Hired</span>;
      case "Interview": return <span className={`${base} bg-blue-500/20 text-blue-400 border-blue-400/40`}><Briefcase size={12} /> Interview</span>;
      case "Declined": return <span className={`${base} bg-red-500/20 text-red-400 border-red-400/40`}><XCircle size={12} /> Declined</span>;
      case "Review": return <span className={`${base} bg-yellow-500/20 text-yellow-300 border-yellow-300/40`}><Clock size={12} /> Review</span>;
      default: return <span className={`${base} bg-gray-500/20 text-gray-300 border-gray-300/40`}><Clock size={12} /> {status || "Unknown"}</span>;
    }
  };

  const filteredApplicants = applicants.filter((a) => {
    const matchesSearch = a.name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDownloadList = async () => {
    try {
      const res = await fetch(`${api}/api/applicants/download-hired-list?month=${selectedMonth}&year=${selectedYear}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to download PDF.' }));
        throw new Error(errorData.message);
      }

      const blob = await res.blob();
      console.log(blob)
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Hired_Applicants_${selectedMonth}_${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF downloaded successfully!");
      setDownloadModalOpen(false);
    } catch (error) {
      toast.error(error.message || "An error occurred while downloading the PDF.");
      console.error('Error downloading hired list:', error);
    }
  };
  const InfoRow = ({ label, value }) => (
    <p className="text-gray-300">
      <span className="font-semibold text-white">{label}:</span>{" "}
      <span className="font-normal text-gray-300">{value}</span>
    </p>
  );

  return (
    <>
      <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
        <ToastContainer theme="dark" />
        <main className="flex-1 p-4 md:p-6 bg-slate-900/50 min-h-screen">
            {/* --- Header Section --- */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mb-8 gap-6">
                
                {/* Title */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <User className="text-blue-500" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                            Applicants List
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Manage and track your recruitment pipeline.
                        </p>
                    </div>
                </div>

                {/* Controls Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    
                    {/* Search */}
                    <div className="relative flex-grow sm:max-w-xs group">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#1e293b] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 
                            text-sm text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition" size={18} />
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 z-10" size={16} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-auto bg-[#1e293b] border border-gray-700 rounded-lg pl-10 pr-8 py-2.5 
                            text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:bg-[#243046] transition"
                        >
                            <option value="All">All Status</option>
                            <option value="Review">Review</option>
                            <option value="Interview">Interview</option>
                            <option value="Hired">Hired</option>
                            <option value="Declined">Declined</option>
                        </select>
                    </div>

                    {/* Action Buttons Group */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setDownloadModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-[#243046] 
                            border border-gray-700 text-gray-200 px-4 py-2.5 rounded-lg text-sm transition"
                        >
                            <FileDown size={18} className="text-blue-400" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        
                        <button
                            onClick={fetchApplicants}
                            className="bg-[#1e293b] hover:bg-[#243046] border border-gray-700 text-gray-300 p-2.5 rounded-lg transition"
                            title="Refresh List"
                        >
                            <RefreshCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>


            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block overflow-hidden bg-[#1e293b]/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-slate-800/50 border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Candidate</th>
                            <th className="px-6 py-4 font-semibold">Contact Info</th>
                            <th className="px-6 py-4 font-semibold">Position</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {filteredApplicants.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search size={32} className="text-gray-600" />
                                        <p>No applicants found matching your criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredApplicants.map((a) => (
                                <tr key={a._id} className="group hover:bg-slate-800/50 transition duration-150">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{a.name}</div>
                                        <div className="text-xs text-gray-500">ID: {a._id.slice(-6)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-300">{a.email}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{a.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">{a.position || "—"}</td>
                                    <td className="px-6 py-4">{getStatusBadge(a.status)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openPanel(a)}
                                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 px-3 py-1.5 rounded-md text-sm font-medium transition"
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MOBILE VIEW: Cards (Replaces table on small screens) */}
            <div className="md:hidden grid gap-4">
                {filteredApplicants.map((a) => (
                    <div key={a._id} className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-semibold text-white text-lg">{a.name}</h3>
                                <p className="text-gray-400 text-sm">{a.position}</p>
                            </div>
                            {getStatusBadge(a.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-300 mb-4 border-t border-gray-700/50 pt-3">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Email:</span> {a.email}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Phone:</span> {a.phone}
                            </div>
                        </div>

                        <button
                            onClick={() => openPanel(a)}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition"
                        >
                            Manage Application
                        </button>
                    </div>
                ))}
            </div>

            {/* --- Pagination Footer --- */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-800 pt-6">
                <p className="text-sm text-gray-500">
                    Showing <span className="text-white font-medium">{filteredApplicants.length}</span> results
                </p>
                
                {/* Placeholder Pagination Controls */}
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-50">
                        <ChevronLeft size={16} />
                    </button>
                    <button className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <footer className="mt-8 text-center text-gray-600 text-xs">
                © {new Date().getFullYear()} JPM Security Agency — Portal
            </footer>
        </main>
        
        {/* Side Panel */}
        <Transition show={isPanelOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={closePanel}>
            <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-hidden">
              <div className="absolute inset-0 overflow-hidden">
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                  <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-300 sm:duration-500" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-300 sm:duration-500" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                    <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                      <div className="flex h-full flex-col overflow-y-scroll bg-[#0f172a] shadow-xl border-l border-gray-700">
                        { selectedApplicant && (
                          <>
                            <div className="bg-[#1e293b] px-4 py-6 sm:px-6">
                              <div className="flex items-start justify-between">
                                <Dialog.Title className="text-xl font-semibold leading-6 text-white">
                                  {selectedApplicant.name}
                                </Dialog.Title>
                                <div className="ml-3 flex h-7 items-center">
                                  <button type="button" className="relative rounded-md bg-[#1e293b] text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white" onClick={closePanel}>
                                    <span className="sr-only">Close panel</span>
                                    <XCircle className="h-6 w-6" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                              <div className="mt-1">
                                <p className="text-sm text-gray-400">
                                  {selectedApplicant.position}
                                </p>
                              </div>
                            </div>
                            
                            <div className="relative mt-6 flex-1 px-4 sm:px-6">
                              <div className="space-y-6">
                                {/* Details Section */}
                                <div>
                                  <h3 className="font-medium text-gray-200">Applicant Details</h3>
                                  <dl className="mt-2 divide-y divide-gray-700 border-y border-gray-700">
                                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                      <dt className="text-sm text-gray-400 flex items-center gap-2">
                                        <Mail size={14}/>Email
                                      </dt>
                                      <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                        {selectedApplicant.email}
                                      </dd>
                                    </div>
                                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                      <dt className="text-sm text-gray-400 flex items-center gap-2">
                                        <Phone size={14}/>Phone
                                      </dt>
                                      <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                        {selectedApplicant.phone}
                                      </dd>
                                    </div>
                                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                      <dt className="text-sm text-gray-400 flex items-center gap-2">
                                        <Clock size={14}/>Status
                                      </dt>
                                      <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                        {getStatusBadge(selectedApplicant.status)}
                                        </dd>
                                    </div>
                                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                      <dt className="text-sm text-gray-400">
                                        Applied On
                                      </dt>
                                      <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                        {formatDate(selectedApplicant.createdAt)}
                                        </dd>
                                    </div>
                                    { selectedApplicant.dateOfInterview && 
                                      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                        <dt className="text-sm text-gray-400">
                                          Interview Date
                                        </dt>
                                        <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                          {formatDate(selectedApplicant.dateOfInterview)}
                                          </dd>
                                      </div>
                                    }
                                    { selectedApplicant.dateOfHired && 
                                      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                        <dt className="text-sm text-gray-400">
                                          Date Hired
                                        </dt>
                                        <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                          {formatDate(selectedApplicant.dateOfHired)}
                                        </dd>
                                      </div>
                                    }
                                    { selectedApplicant.declinedDate && 
                                      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                        <dt className="text-sm text-gray-400">
                                          Date Declined
                                        </dt>
                                        <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                          {formatDate(selectedApplicant.declinedDate)}
                                        </dd>
                                      </div>
                                    }
                                  </dl>
                                </div>
                                
                                {user?.role === "Admin" && (
                                  <div className="mt-2 flex flex-col gap-2">
                                    <button 
                                      onClick={() => handleViewResume(selectedApplicant)} 
                                      className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center">
                                        <Eye size={14} /> View Resume
                                    </button>
                                    <div className="">
                                      <h3 className="font-medium text-gray-200">Interview Remarks</h3>
                                      <div className="mt-4">
                                          <h4 className="font-medium text-sm text-gray-400">Current Remarks:</h4>
                                          <p className="text-sm text-gray-300 italic mt-1 whitespace-pre-wrap">{selectedApplicant.interviewRemarks || "No remarks yet."}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {/* Actions Section */}
                                {user?.role === "Subadmin" && (
                                  <div>
                                    <h3 className="font-medium text-gray-200">Actions</h3>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                      <button 
                                        onClick={() => handleViewResume(selectedApplicant)} className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center">
                                        <Eye size={14} /> View Resume
                                      </button>
                                      <button 
                                        onClick={() => openInterviewModal(selectedApplicant)} className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center">
                                          <UserCheck size={14} /> Interview
                                      </button>
                                      <button 
                                        onClick={() => openAddGuardModal(true)} className="bg-green-600/20 hover:bg-green-600/40 text-green-300 px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center">
                                        <CheckCircle size={14} /> Hire
                                      </button>
                                      <button 
                                        onClick={() => openConfirmModal(selectedApplicant, "Declined")} className="bg-red-600/20 hover:bg-red-600/40 text-red-300 px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center">
                                          <Trash2 size={14} /> Decline
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Remarks Section */}
                                {user?.role === "Subadmin" && (
                                  <div>
                                    <h3 className="font-medium text-gray-200">Interview Remarks</h3>
                                    <div className="mt-2">
                                      <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={5} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/70" placeholder="Add interview notes, feedback, etc."/>
                                      <button onClick={handleSaveRemarks} disabled={savingRemarks} className="mt-2 w-full flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60">
                                        {savingRemarks ? "Saving..." : <><Save size={14} /> Save Remarks</>}
                                      </button>
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="font-medium text-sm text-gray-400">Current Remarks:</h4>
                                        <p className="text-sm text-gray-300 italic mt-1 whitespace-pre-wrap">{selectedApplicant.interviewRemarks || "No remarks yet."}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Existing Modals (Confirm, Interview, Hire) */}
        <Transition appear show={confirmModal.open} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={closeConfirmModal}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/60" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-white/10 p-6 shadow-xl text-gray-100">
                    <Dialog.Title className="text-lg font-semibold mb-2">
                      Confirm Action
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-300 mb-4">
                      {pendingActionLabel}
                    </Dialog.Description>
                    <div className="bg-[#1a2338] border border-white/10 rounded-lg p-3 text-sm mb-4">
                      <div className="font-semibold text-white">
                        {confirmModal.applicant?.name}
                      </div>
                      <div className="text-gray-300 text-xs mt-1">
                        {confirmModal.applicant?.email || "No email provided"}
                      </div>
                      <div className="text-gray-300 text-xs">
                        {confirmModal.applicant?.phone || "No phone provided"}
                      </div>
                      <div className="text-gray-400 text-xs mt-2">
                        Current status: {confirmModal.applicant?.status}
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={closeConfirmModal}
                        className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmStatusChange}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
                      >
                        Confirm
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Existing Modals (Confirm, Interview, Hire) */}
        <Transition appear show={interviewModal.open} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={closeInterviewModal}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/60" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-white/10 p-6 shadow-xl text-gray-100">
                    <Dialog.Title className="text-lg font-semibold mb-2">
                      Schedule Interview
                    </Dialog.Title>
                    <div className="text-sm text-gray-300 mb-4">
                      Send an interview invite to {interviewModal.applicant?.name}
                      .
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                          Type
                        </label>
                        <div className="flex gap-3">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              className="accent-blue-500"
                              checked={interviewType === "single"}
                              onChange={() => setInterviewType("single")}
                            />
                            Single date
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              className="accent-blue-500"
                              checked={interviewType === "range"}
                              onChange={() => setInterviewType("range")}
                            />
                            Date range
                          </label>
                        </div>
                      </div>

                      {interviewType === "single" ? (
                        <div>
                          <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                            Interview date
                          </label>
                          <input
                            type="date"
                            value={interviewDate}
                            onChange={(e) => setInterviewDate(e.target.value)}
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                          />
                          <div className="mt-3">
                            <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                              Time (optional)
                            </label>
                            <input
                              type="time"
                              value={interviewTime}
                              onChange={(e) => setInterviewTime(e.target.value)}
                              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                              Start date
                            </label>
                            <input
                              type="date"
                              value={interviewStart}
                              onChange={(e) => setInterviewStart(e.target.value)}
                              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                              End date
                            </label>
                            <input
                              type="date"
                              value={interviewEnd}
                              onChange={(e) => setInterviewEnd(e.target.value)}
                              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                              Time (optional)
                            </label>
                            <input
                              type="time"
                              value={interviewTime}
                              onChange={(e) => setInterviewTime(e.target.value)}
                              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                          Message (optional)
                        </label>
                        <textarea
                          value={interviewMessage}
                          onChange={(e) => setInterviewMessage(e.target.value)}
                          rows={4}
                          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                          placeholder="Add location, instructions, or preferred time."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={closeInterviewModal}
                        className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={sendInterviewInvite}
                        disabled={
                          sendingInvite ||
                          (interviewType === "single"
                            ? !interviewDate
                            : !(interviewStart && interviewEnd))
                        }
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-60"
                      >
                        {sendingInvite ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Enhanced Hire Confirmation Modal */}
        <Transition appear show={isConfirmModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsConfirmModalOpen(false)}>
            {/* Backdrop */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            </Transition.Child>

            {/* Modal Container */}
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-6">

                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-[#0d1528] border border-white/10 shadow-2xl p-7 text-gray-100">

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="text-green-400" size={28} />
                      <Dialog.Title className="text-xl font-semibold">
                        Confirm Applicant Hiring
                      </Dialog.Title>
                    </div>

                    <p className="text-gray-300 text-sm mb-5">
                      Make sure every credential is accurate before continuing.
                    </p>

                    {/* Applicant Summary */}
                    <div className="bg-[#131d33] border border-white/10 rounded-xl p-5 text-sm grid grid-cols-2 gap-6">

                      <div className="space-y-2">
                        <InfoRow label="Full Name" value={form.fullName} />
                        <InfoRow label="Guard ID" value={form.guardId} />
                        <InfoRow label="Email" value={form.email} />
                        <InfoRow label="Password" value={form.password} />
                        <InfoRow label="Position" value={form.position} />
                        <InfoRow label="Address" value={form.address} />
                      </div>

                      <div className="space-y-2">
                        <InfoRow label="Phone" value={form.phoneNumber} />
                        <InfoRow label="SSS ID" value={form.SSSID} />
                        <InfoRow label="PhilHealth ID" value={form.PhilHealthID} />
                        <InfoRow label="Pag-IBIG ID" value={form.PagibigID} />
                        <InfoRow label="Emergency Person" value={form.EmergencyPerson} />
                        <InfoRow label="Emergency Contact" value={form.EmergencyContact} />
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 mt-7">
                      <button
                        onClick={() => setIsConfirmModalOpen(false)}
                        className="px-4 py-2.5 rounded-lg border border-gray-600 text-gray-200 hover:bg-white/5 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmAndCreateGuard}
                        disabled={sendingHire}
                        className="px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white disabled:opacity-60 flex items-center gap-2 transition"
                      >
                        {sendingHire ? (
                          <span className="animate-pulse">Processing...</span>
                        ) : (
                          "🎉 Hire & Notify"
                        )}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
        
        {/* Download Hired List Modal */}
        <Transition appear show={downloadModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setDownloadModalOpen(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/60" /></Transition.Child>
            <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-white/10 p-6 shadow-xl text-gray-100">
                  <Dialog.Title className="text-lg font-semibold mb-4">Download Hired Applicants List</Dialog.Title>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Month</label>
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full mt-1 rounded-lg bg-[#0f172a] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70">
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Year</label>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full mt-1 rounded-lg bg-[#0f172a] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setDownloadModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-white/5">Cancel</button>
                    <button onClick={handleDownloadList} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white">Download</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div></div>
          </Dialog>
        </Transition>

        {/* Add Guard Modal for hired */}
        <Transition appear show={guardConfirmModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setGuardConfirmModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-[#1e293b] p-8 text-left align-middle shadow-xl border border-gray-700">
                    
                    {/* Header */}
                    <div className="flex gap-x-3">
                      <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-[#0f172a] rounded-full flex items-center justify-center border-2 border-gray-600">
                          <Shield className="text-blue-400 w-8 h-8" />
                        </div>
                      </div>

                      <div className="mt-3">
                        <Dialog.Title className="text-2xl font-bold text-white">
                          Add New Guard
                        </Dialog.Title>
                        <p className="text-gray-400 text-sm mb-6">
                          Fill out the guard’s information below.
                        </p>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-600/20 border border-red-500 text-red-400 text-sm rounded-md px-4 py-2 mb-6 text-center">
                        {errorMsg}
                      </div>
                    )}

                    {/* Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Full Name</label>
                          <input
                            type="text"
                            name="fullName"
                            required
                            value={form.fullName}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Guard ID</label>
                          <input
                            type="text"
                            name="guardId"
                            required
                            value={form.guardId}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Email</label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={form.email}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Password</label>
                          <div className="relative w-full">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              required
                              value={form.password}
                              onChange={handleChange}
                              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Position</label>
                          <input
                            type="text"
                            name="position"
                            required
                            value={form.position}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Address</label>
                          <input
                            type="text"
                            name="address"
                            required
                            value={form.address}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Phone Number</label>
                          <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                            <span className="text-gray-100 bg-[#2e3e58] px-3 py-2 select-none">+63</span>
                            <input
                              type="tel"
                              name="phoneNumber"
                              required
                              value={form.phoneNumber.replace(/^\+63/, "")}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, "");
                                if (value.length > 10) value = value.slice(0, 10);
                                setForm({ ...form, phoneNumber: "+63" + value });
                              }}
                              className="w-full bg-[#0f172a] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">SSS ID</label>
                          <input
                            type="text"
                            name="SSSID"
                            required
                            value={form.SSSID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">PhilHealth ID</label>
                          <input
                            type="text"
                            name="PhilHealthID"
                            required
                            value={form.PhilHealthID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Pag-IBIG ID</label>
                          <input
                            type="text"
                            name="PagibigID"
                            required
                            value={form.PagibigID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Emergency Contact Person</label>
                          <input
                            type="text"
                            name="EmergencyPerson"
                            required
                            value={form.EmergencyPerson}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Emergency Contact Number</label>
                          <input
                            type="tel"
                            name="EmergencyContact"
                            required
                            value={form.EmergencyContact}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex justify-end gap-4">
                      <button
                        onClick={() => setGuardConfirmModalOpen(false)}
                        className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg text-white w-1/4"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => openConfirmHireModal()}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-8 py-2 rounded-lg shadow text-white font-medium w-1/4 disabled:opacity-50"
                      >
                        {loading ? "Saving..." : "Save Guard"}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </>
  );
}