import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Search,
  UserCheck,
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
  ChevronRight,
  X,
  Plus,
  Paperclip,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import TablePagination from "../components/admin/TablePagination.jsx";
const api = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;
const APPLICANT_RESUME_ACCEPT = ".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.zip";
const APPLICANT_RESUME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
];
const APPLICANT_RESUME_ERROR =
  "Unsupported resume file type. Please upload JPG, PNG, GIF, PDF, DOC, DOCX, or ZIP only.";

export default function ApplicantsList() {
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [applicationTypeFilter, setApplicationTypeFilter] = useState("All");
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
  const [downloadApplicationType, setDownloadApplicationType] = useState("All");
  const [guardConfirmModalOpen , setGuardConfirmModalOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [creatingWalkIn, setCreatingWalkIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [walkInForm, setWalkInForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    applicationType: "Walk-in",
  });
  const [walkInResume, setWalkInResume] = useState(null);
  const [warningModal, setWarningModal] = useState({ open: false, title: "", message: "" });
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    sex: "Male",
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

  const handleWalkInChange = (e) => {
    const { name, value } = e.target;
    setWalkInForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWalkInResumeChange = (e) => {
    const selected = e.target.files?.[0];

    if (!selected) {
      setWalkInResume(null);
      return;
    }

    if (!APPLICANT_RESUME_TYPES.includes(selected.type)) {
      setWalkInResume(null);
      e.target.value = "";
      toast.error(APPLICANT_RESUME_ERROR);
      return;
    }

    setWalkInResume(selected);
  };

  const resetWalkInForm = () => {
    setWalkInForm({
      name: "",
      email: "",
      phone: "",
      position: "",
      applicationType: "Walk-in",
    });
    setWalkInResume(null);
  };

  const handleCreateWalkInApplicant = async (e) => {
    e.preventDefault();

    if (!walkInResume) {
      toast.error("Resume is required for walk-in applicants.");
      return;
    }

    try {
      setCreatingWalkIn(true);
      const payload = {
        name: walkInForm.name.trim(),
        email: walkInForm.email.trim(),
        phone: walkInForm.phone.trim(),
        position: walkInForm.position.trim(),
        applicationType: walkInForm.applicationType,
      };

      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("email", payload.email);
      formData.append("phone", payload.phone);
      formData.append("position", payload.position);
      formData.append("applicationType", payload.applicationType);
      formData.append("resume", walkInResume);

      const res = await fetch(`${api}/api/applicants`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create walk-in applicant.");

      toast.success("Walk-in applicant added successfully.");
      setWalkInModalOpen(false);
      resetWalkInForm();
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchApplicants();
      }
    } catch (error) {
      toast.error(error.message || "Failed to create walk-in applicant.");
    } finally {
      setCreatingWalkIn(false);
    }
  };

  const handleConfirmAndCreateGuard = async () => {
    if (!selectedApplicant) return;
    if (!applicantHasValidResume(selectedApplicant)) {
      setGuardConfirmModalOpen(false);
      showResumeWarning();
      return;
    }
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
    if (!applicantHasValidResume(selectedApplicant)) {
      showResumeWarning();
      return;
    }
    // Pre-fill name fields from the applicant record
    const applicantName = selectedApplicant?.name?.trim() || "";
    const nameParts = applicantName.split(" ");
    const preFirstName = nameParts[0] || "";
    const preLastName = nameParts.slice(1).join(" ") || "";
    setForm((prev) => ({
      ...prev,
      firstName: preFirstName,
      lastName: preLastName,
      email: selectedApplicant?.email || "",
      position: selectedApplicant?.position || "",
    }));
    setGuardConfirmModalOpen(true);
  };

  const openConfirmHireModal = () => {
    setErrorMsg("");

    // Check required fields
    if(!form.firstName || !form.lastName || !form.sex || !form.email || !form.guardId || !form.address || !form.position || !form.phoneNumber || !form.EmergencyPerson || !form.EmergencyContact){
      return setErrorMsg("Please fill out all required fields.");
    }
    
    // Check Phone Number Validity (Must be +63 followed by 10 digits)
    const phoneRegex = /^\+63\d{10}$/;
    if (!phoneRegex.test(form.phoneNumber)) {
      return setErrorMsg("Phone Number must be valid (10 digits starting with 9).");
    }
    if (!phoneRegex.test(form.EmergencyContact)) {
      return setErrorMsg("Emergency Contact must be valid (10 digits starting with 9).");
    }

    // If all good, open modal
    setErrorMsg("");
    setIsConfirmModalOpen(true);
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
      firstName: "",
      lastName: "",
      sex: "Male",
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
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });

      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (applicationTypeFilter !== "All") params.set("applicationType", applicationTypeFilter);

      const res = await fetch(`${api}/api/applicants?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setApplicants(Array.isArray(data.items) ? data.items : []);
      setTotalItems(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Fetch applicants error:", err);
      setApplicants([]);
      setTotalItems(0);
      setTotalPages(1);
      toast.error("Failed to fetch applicants.");
    }
  };

  useEffect(() => {
    if (user) fetchApplicants();
  }, [user, currentPage, search, statusFilter, applicationTypeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, applicationTypeFilter]);

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
        
        // --- FIX START: Manually update local state ---
        
        // Update the main list immediately
        setApplicants((prev) => 
          prev.map((a) => 
            a._id === applicant._id ? { ...a, status: "Declined" } : a
          )
        );

        // If the side panel is open for this applicant, update that too
        if (selectedApplicant?._id === applicant._id) {
          setSelectedApplicant((prev) => ({ ...prev, status: "Declined" }));
        }
        
        // --- FIX END ---

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

  const applicantHasValidResume = (applicant) => {
    const resume = applicant?.resume;
    if (!resume) return false;

    const filePath = typeof resume.file === "string" ? resume.file.trim() : "";
    const fileName = typeof resume.fileName === "string" ? resume.fileName.trim() : "";
    const originalName = typeof resume.originalName === "string" ? resume.originalName.trim() : "";
    
    return Boolean(filePath || fileName || originalName);
  };

  const showResumeWarning = () => {
    setWarningModal({
      open: true,
      title: "Resume Required",
      message: "You can't hire this applicant yet because the resume is missing or empty.",
    });
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
    if (!interviewModal.applicant) return;
    const applicant = interviewModal.applicant;

    if (interviewType === "single" && !interviewDate) {
      toast.error("Please select a date for the interview.");
      return;
    }
    if (interviewType === "range" && (!interviewStart || !interviewEnd)) {
      toast.error("Please select a valid start and end date.");
      return;
    }
    if (!interviewTime) {
      toast.error("Please select an interview time.");
      return;
    }

    try {
      setSendingInvite(true);

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

      
      const dateStr = interviewType === "range" ? interviewStart : interviewDate;
      let finalDateForUI = dateStr;

      if (dateStr && interviewTime) {
          finalDateForUI = `${dateStr}T${interviewTime}`;
      } else if (dateStr) {
          finalDateForUI = `${dateStr}T00:00:00`;
      }

      const updatedApplicant = {
        ...applicant,
        status: "Interview",
        dateOfInterview: finalDateForUI, 
      };

      setApplicants((prev) => 
        prev.map((app) => (app._id === applicant._id ? updatedApplicant : app))
      );

      if (selectedApplicant && selectedApplicant._id === applicant._id) {
        setSelectedApplicant(updatedApplicant);
      }

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
      setWarningModal({
        open: true,
        title: "Resume Unavailable",
        message: "This applicant has not submitted a resume yet, or the uploaded resume is empty.",
      });
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

  const getApplicationTypeBadge = (type) => {
    const isWalkIn = type === "Walk-in";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          isWalkIn
            ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
            : "bg-violet-500/10 text-violet-300 border-violet-500/20"
        }`}
      >
        {isWalkIn ? "Walk-in Application" : "Online Application"}
      </span>
    );
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDownloadList = async () => {
    try {
      const params = new URLSearchParams({
        month: selectedMonth,
        year: selectedYear,
      });

      if (downloadApplicationType !== "All") {
        params.set("applicationType", downloadApplicationType);
      }

      const res = await fetch(`${api}/api/applicants/download-hired-list?${params.toString()}`, {
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
      const fileTypeSuffix =
        downloadApplicationType === "All"
          ? ""
          : `_${downloadApplicationType === "Walk-in" ? "Walkin" : "Online"}`;
      a.style.display = 'none';
      a.href = url;
      a.download = `Hired_Applicants_${selectedMonth}_${selectedYear}${fileTypeSuffix}.pdf`;
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

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 z-10" size={16} />
                        <select
                            value={applicationTypeFilter}
                            onChange={(e) => setApplicationTypeFilter(e.target.value)}
                            className="w-full sm:w-auto bg-[#1e293b] border border-gray-700 rounded-lg pl-10 pr-8 py-2.5 
                            text-sm text-gray-200 focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer hover:bg-[#243046] transition"
                        >
                            <option value="All">All Applications</option>
                            <option value="Online">Online Application</option>
                            <option value="Walk-in">Walk-in Application</option>
                        </select>
                    </div>

                    {/* Action Buttons Group */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setWalkInModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#2B7FFF] hover:bg-[#2460b9] text-white px-4 py-2.5 rounded-lg text-sm transition cursor-pointer"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Walk-in Applicant</span>
                        </button>
                        <button
                            onClick={() => setDownloadModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-[#243046] 
                            border border-gray-700 text-gray-200 px-4 py-2.5 rounded-lg text-sm transition cursor-pointer"
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
                            <th className="px-6 py-4 font-semibold">#</th>
                            <th className="px-6 py-4 font-semibold">Candidate</th>
                            <th className="px-6 py-4 font-semibold">Contact Info</th>
                            <th className="px-6 py-4 font-semibold">Position</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {applicants.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search size={32} className="text-gray-600" />
                                        <p>No applicants found matching your criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            applicants.map((a, index) => (
                                <tr key={a._id} className="group hover:bg-slate-800/50 transition duration-150">
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{a.name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                          <span>ID: {a._id.slice(-6)}</span>
                                          {getApplicationTypeBadge(a.applicationType || "Online")}
                                        </div>
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
                {applicants.map((a, index) => (
                    <div key={a._id} className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-xs font-medium text-gray-500">#{(currentPage - 1) * PAGE_SIZE + index + 1}</p>
                                <h3 className="font-semibold text-white text-lg">{a.name}</h3>
                                <p className="text-gray-400 text-sm">{a.position}</p>
                                <div className="mt-2">{getApplicationTypeBadge(a.applicationType || "Online")}</div>
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
            <TablePagination
              page={currentPage}
              limit={PAGE_SIZE}
              totalItems={totalItems}
              currentCount={applicants.length}
              totalPages={totalPages}
              label="applicants"
              onPageChange={setCurrentPage}
            />

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
                                        Application
                                      </dt>
                                      <dd className="mt-1 text-sm text-white sm:col-span-2 sm:mt-0">
                                        {getApplicationTypeBadge(selectedApplicant.applicationType || "Online")}
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
                                
                                {["Admin", "Subadmin"].includes(user?.role) && (
                                  <div className="mt-2 flex flex-col gap-2">
                                    {selectedApplicant.resume?.fileName && (
                                      <div className="text-xs text-slate-400 flex items-center gap-2">
                                        <Paperclip size={14} />
                                        {selectedApplicant.resume.fileName}
                                      </div>
                                    )}
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
                                {["Admin", "Subadmin"].includes(user?.role) && (
                                  <div>
                                    <h3 className="font-medium text-gray-200">Actions</h3>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                      <button 
                                        disabled={selectedApplicant.status === "Hired"}
                                        onClick={() => handleViewResume(selectedApplicant)} 
                                        className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center transition
                                          ${selectedApplicant.status === "Hired"
                                            ? "bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-50"
                                            : "bg-blue-600/20 hover:bg-blue-600/40 text-blue-300"
                                          }`}>
                                        <Eye size={14} /> View Resume
                                      </button>
                                      <button
                                        disabled={selectedApplicant.status === "Hired"}
                                        onClick={() => openInterviewModal(selectedApplicant)}
                                        className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center transition
                                          ${selectedApplicant.status === "Hired"
                                            ? "bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-50"
                                            : "bg-purple-600/20 hover:bg-purple-600/40 text-purple-300"
                                          }`}
                                      >
                                        <UserCheck size={14} /> Interview
                                      </button>
                                      <button
                                        disabled={selectedApplicant.status === "Hired"}
                                        onClick={() => openAddGuardModal()}
                                        className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center transition
                                          ${selectedApplicant.status === "Hired" 
                                            ? "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50" 
                                            : "bg-green-600/20 hover:bg-green-600/40 text-green-300"
                                          }`}
                                      >
                                        <CheckCircle size={14} /> 
                                        {selectedApplicant.status === "Hired" ? "Hired" : "Hire"}
                                      </button>
                                      <button
                                        disabled={selectedApplicant.status === "Hired" || selectedApplicant.status === "Declined"}
                                        onClick={() => openConfirmModal(selectedApplicant, "Declined")}
                                        className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm justify-center transition
                                          ${selectedApplicant.status === "Hired" || selectedApplicant.status === "Declined"
                                            ? "bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-50"
                                            : "bg-red-600/20 hover:bg-red-600/40 text-red-300"
                                          }`}
                                      >
                                        <X size={14} /> Decline
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Remarks Section */}
                                {["Admin", "Subadmin"].includes(user?.role) && (
                                  <div>
                                    <h3 className="font-medium text-gray-200">Interview Remarks</h3>
                                    <div className="mt-2">
                                      <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={5} disabled={selectedApplicant.status === "Hired"} className={`w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/70 ${selectedApplicant.status === "Hired" ? "opacity-50 cursor-not-allowed" : ""}`} placeholder="Add interview notes, feedback, etc."/>
                                      <button onClick={handleSaveRemarks} disabled={savingRemarks || selectedApplicant.status === "Hired"} className="mt-2 w-full flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60">
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
                              Time*
                            </label>
                            <input
                              type="time"
                              required
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
                              Time*
                            </label>
                            <input
                              type="time"
                              required
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
                        <InfoRow label="First Name" value={form.firstName} />
                        <InfoRow label="Last Name" value={form.lastName} />
                        <InfoRow label="Sex" value={form.sex} />
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
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
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
                    <div className="mt-4">
                      <label className="text-sm text-gray-400">Application Type</label>
                      <select
                        value={downloadApplicationType}
                        onChange={(e) => setDownloadApplicationType(e.target.value)}
                        className="w-full mt-1 rounded-lg bg-[#0f172a] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                      >
                        <option value="All">All Hired Applicants</option>
                        <option value="Walk-in">Walk-in Only</option>
                        <option value="Online">Online Only</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setDownloadModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-white/5">Cancel</button>
                      <button onClick={handleDownloadList} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white">Download</button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        <Transition appear show={walkInModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setWalkInModalOpen(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black/60" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-[#0f172a] border border-white/10 p-6 shadow-xl text-gray-100">
                    <Dialog.Title className="text-xl font-semibold mb-2">Add Walk-in Applicant</Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-400 mb-6">
                      Admin and HR can register walk-in applicants and attach a resume directly from the office.
                    </Dialog.Description>

                    <form onSubmit={handleCreateWalkInApplicant} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Full Name</label>
                          <input
                            name="name"
                            value={walkInForm.name}
                            onChange={handleWalkInChange}
                            required
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                            placeholder="Juan Dela Cruz"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Position</label>
                          <input
                            name="position"
                            value={walkInForm.position}
                            onChange={handleWalkInChange}
                            required
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                            placeholder="Security Guard"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={walkInForm.email}
                            onChange={handleWalkInChange}
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                            placeholder="candidate@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Phone</label>
                          <input
                            name="phone"
                            value={walkInForm.phone}
                            onChange={handleWalkInChange}
                            required
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                            placeholder="09XXXXXXXXX"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Resume</label>
                          <input
                            type="file"
                            accept={APPLICANT_RESUME_ACCEPT}
                            required
                            onChange={handleWalkInResumeChange}
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                          />
                          {walkInResume && (
                            <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                              <Paperclip size={14} />
                              {walkInResume.name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setWalkInModalOpen(false);
                            resetWalkInForm();
                          }}
                          className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-white/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creatingWalkIn}
                          className="px-4 py-2 rounded-lg bg-[#2B7FFF] hover:bg-[#2460b9] text-white flex items-center gap-2 disabled:opacity-60"
                        >
                          {creatingWalkIn ? <RefreshCcw className="animate-spin" size={16} /> : <Plus size={16} />}
                          Save Applicant
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
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
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
                  <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-[#1e293b] p-6 sm:p-8 text-left align-middle shadow-xl border border-gray-700">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row gap-x-3 items-center sm:items-start">
                      <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#0f172a] rounded-full flex items-center justify-center border-2 border-gray-600">
                          <Shield className="text-blue-400 w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                      </div>

                      <div className="mt-0 sm:mt-3 text-center sm:text-left">
                        <Dialog.Title className="text-xl sm:text-2xl font-bold text-white">
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
                          <label className="text-gray-300 text-sm mb-1 block">First Name <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            name="firstName"
                            required
                            placeholder="e.g. Juan"
                            value={form.firstName}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Last Name <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            name="lastName"
                            required
                            placeholder="e.g. Dela Cruz"
                            value={form.lastName}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Sex <span className="text-red-400">*</span></label>
                          <select
                            name="sex"
                            required
                            value={form.sex}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Guard ID <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            name="guardId"
                            required
                            placeholder="e.g. G-2025-001"
                            value={form.guardId}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Email <span className="text-red-400">*</span></label>
                          <input
                            type="email"
                            name="email"
                            required
                            placeholder="jpm@example.com" 
                            value={form.email}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Position <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            name="position"
                            required
                            placeholder="e.g. Security Guard"
                            value={form.position}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Address <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            name="address"
                            required
                            placeholder="e.g. Brgy. 1, Tanza, Cavite"
                            value={form.address}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600"
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Phone Number <span className="text-red-400">*</span></label>
                          <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                            <span className="text-gray-100 bg-[#2e3e58] px-3 py-2 select-none text-sm sm:text-base">+63</span>
                            <input
                              type="tel"
                              name="phoneNumber"
                              required
                              placeholder="9123456789"
                              // Display value without the prefix for better UX
                              value={form.phoneNumber.replace(/^\+63/, "")}
                              onChange={(e) => {
                                // Remove non-digits
                                let value = e.target.value.replace(/\D/g, "");
                                
                                // Limit to 10 digits
                                if (value.length > 10) value = value.slice(0, 10);
                                
                                // Store with prefix
                                setForm((prev) => ({ ...prev, phoneNumber: "+63" + value }));
                              }}
                              className="w-full bg-[#0f172a] px-3 py-2 text-gray-100 placeholder-gray-600 focus:outline-none text-sm sm:text-base"
                            />
                          </div>
                        </div>

                        {/* --- SSS (Optional) --- */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-gray-300 text-sm block">SSS ID</label>
                            <span className="text-xs text-gray-500 italic">(Optional)</span>
                          </div>
                          <input
                            type="text"
                            name="SSSID"
                            placeholder="Enter SSS ID (Optional)"
                            value={form.SSSID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600"
                          />
                        </div>

                        {/* --- PhilHealth (Optional) --- */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-gray-300 text-sm block">PhilHealth ID</label>
                            <span className="text-xs text-gray-500 italic">(Optional)</span>
                          </div>
                          <input
                            type="text"
                            name="PhilHealthID"
                            placeholder="Enter PhilHealth ID (Optional)"
                            value={form.PhilHealthID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600"
                          />
                        </div>

                        {/* --- Pag-IBIG (Optional) --- */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-gray-300 text-sm block">Pag-IBIG ID</label>
                            <span className="text-xs text-gray-500 italic">(Optional)</span>
                          </div>
                          <input
                            type="text"
                            name="PagibigID"
                            placeholder="Enter Pag-IBIG ID (Optional)"
                            value={form.PagibigID}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600"
                          />
                        </div>

                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Emergency Contact Person <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            name="EmergencyPerson"
                            required
                            placeholder="e.g. Maria Dela Cruz"
                            value={form.EmergencyPerson}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-600"
                          />
                        </div>

                        {/* Emergency Contact Number */}
                        <div>
                          <label className="text-gray-300 text-sm mb-1 block">Emergency Contact Number <span className="text-red-400">*</span></label>
                          <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                            <span className="text-gray-100 bg-[#2e3e58] px-3 py-2 select-none text-sm sm:text-base">+63</span>
                            <input
                              type="tel"
                              name="EmergencyContact"
                              required
                              placeholder="9123456789"
                              // Display value without the prefix
                              value={form.EmergencyContact.replace(/^\+63/, "")}
                              onChange={(e) => {
                                // Remove non-digits
                                let value = e.target.value.replace(/\D/g, "");
                                
                                // Limit to 10 digits
                                if (value.length > 10) value = value.slice(0, 10);
                                
                                // Store with prefix
                                setForm((prev) => ({ ...prev, EmergencyContact: "+63" + value }));
                              }}
                              className="w-full bg-[#0f172a] px-3 py-2 text-gray-100 placeholder-gray-600 focus:outline-none text-sm sm:text-base"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
                      <button
                        onClick={() => setGuardConfirmModalOpen(false)}
                        className="bg-gray-600 hover:bg-gray-500 px-6 py-2.5 rounded-lg text-white w-full sm:w-auto font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => openConfirmHireModal()}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-8 py-2.5 rounded-lg shadow text-white font-medium w-full sm:w-auto disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          "Save Guard"
                        )}
                      </button>
                    </div>

                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        <Transition appear show={warningModal.open} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={() => setWarningModal({ open: false, title: "", message: "" })}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1e293b] p-6 text-left align-middle shadow-xl border border-amber-500/30">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30">
                        <AlertTriangle className="text-amber-300" size={22} />
                      </div>
                      <div className="flex-1">
                        <Dialog.Title className="text-lg font-semibold text-white">
                          {warningModal.title}
                        </Dialog.Title>
                        <p className="mt-2 text-sm text-slate-300">
                          {warningModal.message}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setWarningModal({ open: false, title: "", message: "" })}
                        className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-medium hover:bg-amber-400 transition"
                      >
                        Understood
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
