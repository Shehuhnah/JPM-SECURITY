import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Search,
  UserCheck,
  Trash2,
  Eye,
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
  FileText,
  RefreshCcw
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

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

  const { user, loading } = useAuth();
  const role = user?.role;
  const isSubadmin = role === "Subadmin"; 
  const navigate = useNavigate();

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
    try {
      const res = await fetch("http://localhost:5000/api/applicants", { credentials: "include" });
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
      const res = await fetch(`http://localhost:5000/api/applicants/${id}`, {
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

  const confirmStatusChange = async () => {
    const { applicant, status } = confirmModal;
    if (!applicant || !status) return;

    if (status === "Declined") {
      try {
        const res = await fetch(`http://localhost:5000/api/applicants/${applicant._id}/decline`, {
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

  const openHireModal = (applicant) => {
    setHireModal({ open: true, applicant });
    setHireMessage("");
  };

  const closeHireModal = () => setHireModal({ open: false, applicant: null });

  const sendHireNotification = async () => {
    if (!hireModal.applicant) return;
    const applicant = hireModal.applicant;

    try {
      setSendingHire(true);
      await updateStatus(applicant._id, "Hired");
      toast.success(`${applicant.name} has been hired!`);
      // Other notifications (email, etc.) can be added here
      closeHireModal();
    } catch (err) {
      console.error("Failed to send hire notification:", err);
      toast.error("❌ Failed to send hire notification.");
    } finally {
      setSendingHire(false);
    }
  };

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
    // This function can be simplified or removed if interview scheduling is handled differently
    if (!interviewModal.applicant) return;
    try {
      setSendingInvite(true);
      await updateStatus(interviewModal.applicant._id, "Interview");
      // The rest of the email/messaging logic can be kept or adapted as needed
      toast.success(`Interview scheduled for ${interviewModal.applicant.name}`);
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
      const res = await fetch(`http://localhost:5000/api/applicants/${selectedApplicant._id}/remarks`, {
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
    window.open(`http://localhost:5000${file}`, "_blank", "noopener,noreferrer");
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

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-100">
      <ToastContainer theme="dark" />
      <main className="flex-1 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <User className="text-blue-500" size={32} />
            Applicants List
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => fetchApplicants()}
              className="px-4 py-3 bg-[#1e293b] border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-[#243046] transition"
              title="Refresh List"
            >
              <RefreshCcw className="size-4" />
            </button>
            <div className="flex items-center bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
              <Filter className="w-4 h-4 text-blue-400 mr-2" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#1e293b] text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded">
                <option value="All">All Status</option>
                <option value="Review">Review</option>
                <option value="Interview">Interview</option>
                <option value="Hired">Hired</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
            <div className="relative flex-1">
              <input type="text" placeholder="Search applicant..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-[#1e293b] border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 w-full transition" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16} /></span>
            </div>
          </div>
        </div>
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
                <tr><td colSpan="6" className="text-center py-6 text-gray-400 italic">No applicants found.</td></tr>
              ) : (
                filteredApplicants.map((a) => (
                  <tr key={a._id} className="border-t border-gray-700 hover:bg-[#2a3a4f]/40 transition">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-gray-300">{a.email}</td>
                    <td className="px-4 py-3 text-gray-300">{a.phone}</td>
                    <td className="px-4 py-3 text-gray-200">{a.position || "—"}</td>
                    <td className="px-4 py-3">{getStatusBadge(a.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openPanel(a)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm w-full justify-center">Manage</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <footer className="mt-8 text-center text-gray-500 text-xs border-t border-gray-800 pt-4">© {new Date().getFullYear()} JPM Security Agency — Applicant Management Portal</footer>
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
                      {selectedApplicant && (
                        <>
                          <div className="bg-[#1e293b] px-4 py-6 sm:px-6">
                            <div className="flex items-start justify-between">
                              <Dialog.Title className="text-xl font-semibold leading-6 text-white">{selectedApplicant.name}</Dialog.Title>
                              <div className="ml-3 flex h-7 items-center">
                                <button type="button" className="relative rounded-md bg-[#1e293b] text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white" onClick={closePanel}>
                                  <span className="sr-only">Close panel</span>
                                  <XCircle className="h-6 w-6" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-1"><p className="text-sm text-gray-400">{selectedApplicant.position}</p></div>
                          </div>
                          
                          <div className="relative mt-6 flex-1 px-4 sm:px-6">
                            <div className="space-y-6">
                              {/* Details Section */}
                              <div>
                                <h3 className="font-medium text-gray-200">Applicant Details</h3>
                                <dl className="mt-2 divide-y divide-gray-700 border-y border-gray-700">
                                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm text-gray-400 flex items-center gap-2"><Mail size={14}/>Email</dt><dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">{selectedApplicant.email}</dd></div>
                                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm text-gray-400 flex items-center gap-2"><Phone size={14}/>Phone</dt><dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">{selectedApplicant.phone}</dd></div>
                                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm text-gray-400 flex items-center gap-2"><Clock size={14}/>Status</dt><dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">{getStatusBadge(selectedApplicant.status)}</dd></div>
                                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm text-gray-400">Applied On</dt><dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">{formatDate(selectedApplicant.createdAt)}</dd></div>
                                  {selectedApplicant.dateOfInterview && <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm text-gray-400">Interview Date</dt><dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">{formatDate(selectedApplicant.dateOfInterview)}</dd></div>}
                                  {selectedApplicant.dateOfHired && <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm text-gray-400">Date Hired</dt><dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">{formatDate(selectedApplicant.dateOfHired)}</dd></div>}
                                  {selectedApplicant.declinedDate && <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="text-sm text-gray-400">Date Declined</dt><dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">{formatDate(selectedApplicant.declinedDate)}</dd></div>}
                                </dl>
                              </div>

                              {/* Actions Section */}
                              {isSubadmin && (
                                <div>
                                  <h3 className="font-medium text-gray-200">Actions</h3>
                                  <div className="mt-2 grid grid-cols-2 gap-2">
                                    <button onClick={() => handleViewResume(selectedApplicant)} className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center"><Eye size={14} /> View Resume</button>
                                    <button onClick={() => openInterviewModal(selectedApplicant)} className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center"><UserCheck size={14} /> Interview</button>
                                    <button onClick={() => openHireModal(selectedApplicant)} className="bg-green-600/20 hover:bg-green-600/40 text-green-300 px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center"><CheckCircle size={14} /> Hire</button>
                                    <button onClick={() => openConfirmModal(selectedApplicant, "Declined")} className="bg-red-600/20 hover:bg-red-600/40 text-red-300 px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center"><Trash2 size={14} /> Decline</button>
                                  </div>
                                </div>
                              )}
                              
                              {/* Remarks Section */}
                              {isSubadmin && (
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
      <Transition appear show={hireModal.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeHireModal}>
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
                  <Dialog.Title className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={24} />
                    Hire Applicant
                  </Dialog.Title>
                  <div className="text-sm text-gray-300 mb-4">
                    Send a congratulatory email to {hireModal.applicant?.name}.
                  </div>

                  <div className="bg-[#1a2338] border border-white/10 rounded-lg p-3 text-sm mb-4">
                    <div className="font-semibold text-white">
                      {hireModal.applicant?.name}
                    </div>
                    <div className="text-gray-300 text-xs mt-1">
                      {hireModal.applicant?.email || "No email provided"}
                    </div>
                    <div className="text-gray-300 text-xs">
                      Position: {hireModal.applicant?.position || "N/A"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                      Additional Message (optional)
                    </label>
                    <textarea
                      value={hireMessage}
                      onChange={(e) => setHireMessage(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/70"
                      placeholder="Add onboarding details, start date, or any additional information..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={closeHireModal}
                      className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendHireNotification}
                      disabled={sendingHire}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white disabled:opacity-60 flex items-center gap-2"
                    >
                      {sendingHire ? "Sending..." : "🎉 Hire & Notify"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}