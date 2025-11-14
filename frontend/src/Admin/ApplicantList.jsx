import { useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
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
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function ApplicantsList() {
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    applicant: null,
    status: null,
  });
  const [pendingActionLabel, setPendingActionLabel] = useState("");
  const [interviewModal, setInterviewModal] = useState({
    open: false,
    applicant: null,
  });
  const [interviewType, setInterviewType] = useState("single"); // 'single' | 'range'
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewStart, setInterviewStart] = useState("");
  const [interviewEnd, setInterviewEnd] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewMessage, setInterviewMessage] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [hireModal, setHireModal] = useState({
    open: false,
    applicant: null,
  });
  const [hireMessage, setHireMessage] = useState("");
  const [sendingHire, setSendingHire] = useState(false);
  const { admin, token } = useAuth();
  const role = admin?.role;
  const isSubadmin = role === "Subadmin";

  useEffect(() => {
    document.title = "Applicants List | JPM Security Agency";
    const fetchApplicants = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/applicants", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setApplicants(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch applicants error:", err);
        setApplicants([]);
      }
    };
    if (token) fetchApplicants();
  }, [token]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/applicants/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update applicant status");
      const updated = await res.json();
      setApplicants((prev) =>
        prev.map((a) => (a._id === updated._id ? updated : a))
      );
    } catch (err) {
      console.error("Update applicant status error:", err);
      alert("❌ Failed to update applicant status.");
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

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, applicant: null, status: null });
  };

  const confirmStatusChange = async () => {
    const { applicant, status } = confirmModal;
    if (!applicant || !status) return;
    await updateStatus(applicant._id, status);
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

  const closeInterviewModal = () => {
    setInterviewModal({ open: false, applicant: null });
  };

  const openHireModal = (applicant) => {
    setHireModal({ open: true, applicant });
    setHireMessage("");
  };

  const closeHireModal = () => {
    setHireModal({ open: false, applicant: null });
    setHireMessage("");
  };

  const sendHireNotification = async () => {
    if (!hireModal.applicant) return;
    const applicant = hireModal.applicant;

    try {
      setSendingHire(true);

      // 1) Update status to Hired
      await updateStatus(applicant._id, "Hired");

      // 2) Send message to applicant conversation
      const messageText = `🎉 Congratulations! You've been hired for the position of ${
        applicant.position || "Security Personnel"
      }!${
        hireMessage?.trim() ? `\n\n${hireMessage.trim()}` : ""
      }\n\nWelcome to JPM Security Agency! We will be in touch soon with onboarding details.`;

      const formData = new FormData();
      formData.append("text", messageText);
      formData.append("receiverId", applicant._id);
      formData.append("receiverRole", "Applicant");
      formData.append("type", "applicant-subadmin");

      const msgRes = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!msgRes.ok) throw new Error(await msgRes.text());

      // 3) Send hire email
      try {
        await fetch(
          `http://localhost:5000/api/applicants/${applicant._id}/hire-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              message: hireMessage,
            }),
          }
        );
      } catch (emailErr) {
        console.error("Failed to send hire email:", emailErr);
      }

      closeHireModal();
    } catch (err) {
      console.error("Failed to send hire notification:", err);
      alert("❌ Failed to send hire notification.");
    } finally {
      setSendingHire(false);
    }
  };

  const formatDate = (val) => {
    if (!val) return "";
    try {
      const d = new Date(val);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return val;
    }
  };

  const sendInterviewInvite = async () => {
    if (!interviewModal.applicant) return;
    const applicant = interviewModal.applicant;

    // --- Helper to format time ---
    const timeStr = (t) =>
      t
        ? new Date(`1970-01-01T${t}:00`).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

    // --- Validation: ensure date/time is in the future ---
    const now = new Date();
    let interviewDateTime;

    if (interviewType === "single") {
      if (!interviewDate) {
        alert("❌ Please select a date for the interview.");
        return;
      }
      // Combine date + time
      interviewDateTime = new Date(
        `${interviewDate}T${interviewTime || "00:00"}:00`
      );
      if (interviewDateTime <= now) {
        alert("❌ The interview date and time must be in the future.");
        return;
      }
    } else {
      if (!interviewStart || !interviewEnd) {
        alert("❌ Please select a valid start and end date for the interview.");
        return;
      }
      // End date must be after start date
      const start = new Date(
        `${interviewStart}T${interviewTime || "00:00"}:00`
      );
      const end = new Date(`${interviewEnd}T${interviewTime || "23:59"}:00`);
      if (start > end) {
        alert("❌ End date cannot be before start date.");
        return;
      }
      if (end <= now) {
        alert("❌ The interview date range has already passed.");
        return;
      }
      interviewDateTime = start; // For message display
    }

    // --- Compose message ---
    const dateLine =
      interviewType === "single"
        ? `Date: ${formatDate(interviewDate)}${
            interviewTime ? `\nTime: ${timeStr(interviewTime)}` : ""
          }`
        : `Date Range: ${formatDate(interviewStart)} - ${formatDate(
            interviewEnd
          )}${interviewTime ? `\nTime: ${timeStr(interviewTime)}` : ""}`;

    const header = `[Interview Invitation]`;
    const note = interviewMessage?.trim()
      ? `\n\nMessage:\n${interviewMessage.trim()}`
      : "";
    const text = `${header}\n${dateLine}${note}`;

    try {
      setSendingInvite(true);

      // 1) Update status to Interview
      await updateStatus(applicant._id, "Interview");

      // 2) Send message to applicant conversation as Subadmin
      const formData = new FormData();
      formData.append("text", text);
      formData.append("receiverId", applicant._id);
      formData.append("receiverRole", "Applicant");
      formData.append("type", "applicant-subadmin");

      const res = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());

      // 3) Send interview email
      try {
        await fetch(
          `http://localhost:5000/api/applicants/${applicant._id}/interview-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: interviewType,
              date: interviewDate || null,
              startDate: interviewStart || null,
              endDate: interviewEnd || null,
              time: interviewTime || null,
              message: interviewMessage,
            }),
          }
        );
      } catch (emailErr) {
        console.error("Failed to send interview email:", emailErr);
      }

      closeInterviewModal();
    } catch (err) {
      console.error("Failed to send interview invite:", err);
      alert("❌ Failed to send interview invitation.");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleViewResume = (applicant) => {
    const file = applicant?.resume?.file;
    if (!file) {
      alert("This applicant has not submitted a resume yet.");
      return;
    }
    window.open(
      `http://localhost:5000${file}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Status badge renderer
  const getStatusBadge = (status) => {
    const base =
      "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition";
    switch (status) {
      case "Hired":
        return (
          <span
            className={`${base} bg-green-500/20 text-green-400 border-green-400/40`}
          >
            <CheckCircle size={12} /> Hired
          </span>
        );
      case "Interview":
        return (
          <span
            className={`${base} bg-blue-500/20 text-blue-400 border-blue-400/40`}
          >
            <Briefcase size={12} /> Interview
          </span>
        );
      case "Declined":
        return (
          <span
            className={`${base} bg-red-500/20 text-red-400 border-red-400/40`}
          >
            <XCircle size={12} /> Declined
          </span>
        );
      case "Review":
        return (
          <span
            className={`${base} bg-yellow-500/20 text-yellow-300 border-yellow-300/40`}
          >
            <Clock size={12} /> Review
          </span>
        );
      default:
        return (
          <span
            className={`${base} bg-gray-500/20 text-gray-300 border-gray-300/40`}
          >
            <Clock size={12} /> {status || "Unknown"}
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
            <User className="text-blue-500" size={32} />
            Applicants List
          </h1>
          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row justify-between mb-6 gap-3">
            <div className="flex items-center bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-blue-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1e293b] text-sm text-gray-200 focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="Review">Review</option>
                <option value="Interview">Interview</option>
                <option value="Hired">Hired</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
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
                  <td
                    colSpan="6"
                    className="text-center py-6 text-gray-400 italic"
                  >
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
                    <td className="px-4 py-3 text-gray-200">
                      {a.position || "—"}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(a.status)}</td>
                    <td className="px-4 py-3 flex justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleViewResume(a)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1 text-sm"
                      >
                        <Eye size={14} /> View Resume
                      </button>
                      {isSubadmin && (
                        <>
                          <button
                            onClick={() => openInterviewModal(a)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1 text-sm"
                          >
                            <UserCheck size={14} /> Interview
                          </button>
                          <button
                            onClick={() => openHireModal(a)}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1 text-sm"
                          >
                            <CheckCircle size={14} /> Hire
                          </button>
                          <button
                            onClick={() => openConfirmModal(a, "Declined")}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1 text-sm"
                          >
                            <Trash2 size={14} /> Decline
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-xs border-t border-gray-800 pt-4">
          © {new Date().getFullYear()} JPM Security Agency — Applicant
          Management Portal
        </footer>
      </main>
      {/* Confirm Modal */}
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

      {/* Interview Modal */}
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

      {/* Hire Modal */}
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
