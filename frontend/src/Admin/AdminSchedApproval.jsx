import React, { useEffect, useState, Fragment } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Dialog, Transition } from "@headlessui/react";
import {
  CalendarDays,
  Filter,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AdminSchedApproval() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [approveModal, setApproveModal] = useState(false);
  const [declineModal, setDeclineModal] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("All Clients");
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // ===== Fetch all schedules =====
  useEffect(() => {
    document.title = "Manage Schedules"
    const fetchData = async () => {
      try {
        setLoading(true);

        // Run both fetches in parallel
        const [schedulesRes, clientsRes] = await Promise.all([
          fetch("http://localhost:5000/api/schedules/get-schedules?status=Pending", {
          headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/clients/get-clients", {
          headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Parse both JSON responses in parallel too
        const [schedulesData, clientsData] = await Promise.all([
          schedulesRes.json(),
          clientsRes.json(),
        ]);

        // Handle errors if any
        if (!schedulesRes.ok) throw new Error(schedulesData.message);
        if (!clientsRes.ok) throw new Error(clientsData.message);

        // Set states
        setSchedules(schedulesData);
        setClients(clientsData);
        } catch (err) {
          console.error("Failed to fetch data:", err);
        } finally {
          setLoading(false);
        }
    };

    if (token) fetchData();
  }, [token]);

  const refresh = async () => {
    try {
    setLoading(true);

    // Run both fetches in parallel
    const [schedulesRes, clientsRes] = await Promise.all([
      fetch("http://localhost:5000/api/schedules/get-schedules?status=Pending", {
      headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://localhost:5000/api/clients/get-clients", {
      headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    // Parse both JSON responses in parallel too
    const [schedulesData, clientsData] = await Promise.all([
      schedulesRes.json(),
      clientsRes.json(),
    ]);

    // Handle errors if any
    if (!schedulesRes.ok) throw new Error(schedulesData.message);
    if (!clientsRes.ok) throw new Error(clientsData.message);

    // Set states
    setSchedules(schedulesData);
    setClients(clientsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  // ===== Filter schedules by selected client =====
  const filteredSchedules = selectedClient
    ? schedules.filter((s) => s.client === selectedClient)
    : schedules;

  // ===== Convert to FullCalendar format =====
  const events = filteredSchedules.map((sched) => ({
    id: sched._id,
    title: sched.guardName,
    start: sched.timeIn,
    end: sched.timeOut,
    backgroundColor: "transparent",
    borderColor: "transparent",
    textColor: "#fff",
    extendedProps: sched,
  }));

 // ===== Approve all schedules for selected client =====
  const handleApprove = async () => {
    if (selectedClient === "All Clients")
      return alert("Please select a specific client first.");

    const clientSchedules = schedules.filter(
      (s) => s.client === selectedClient && s.isApproved === "Pending"
    );

    if (clientSchedules.length === 0)
      return alert(`No pending schedules to approve for ${selectedClient}.`);

    if (!window.confirm(`Approve ${clientSchedules.length} schedule(s) for ${selectedClient}?`))
      return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/schedules/approve-client-schedules`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ client: selectedClient }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(`✅ All schedules for ${selectedClient} approved!`);

      // Update local state
      setSchedules((prev) =>
        prev.map((s) =>
          s.client === selectedClient ? { ...s, isApproved: "Approved" } : s
        )
      );
      refresh();
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // ===== Decline all schedules for selected client =====
  const handleDecline = async (remarks) => {
    if (selectedClient === "All Clients")
      return alert("Please select a specific client first.");

    const clientSchedules = schedules.filter(
      (s) => s.client === selectedClient && s.isApproved === "Pending"
    );

    if (clientSchedules.length === 0)
      return alert(`No pending schedules to decline for ${selectedClient}.`);

    if (!remarks || !remarks.trim())
      return alert("Please provide a reason for declining.");

    try {
      const res = await fetch(
        `http://localhost:5000/api/schedules/decline-client-schedules`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            client: selectedClient,
            remarks, 
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(`❌ All schedules for ${selectedClient} declined!`);

      setSchedules((prev) =>
        prev.map((s) =>
          s.client === selectedClient
            ? { ...s, isApproved: "Declined", declineRemarks: remarks }
            : s
        )
      );
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      {/* ===== HEADER ===== */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-center sm:text-left">
            Schedule Approval
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Filter by Client */}
          <div className="flex items-center gap-2 bg-[#1e293b] border border-gray-700 rounded-lg px-3 py-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="bg-[#1e293b] text-gray-200 text-sm focus:outline-none"
            >
              <option value="All Clients">All Clients</option>
              {clients.map((client) => (
                <option key={client._id} value={client.clientName}>
                  {client.clientName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ===== LEGEND + ACTIONS ===== */}
      <div className="flex justify-between items-center gap-4 mb-4 text-sm">
        <div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="w-3 h-3 bg-[#fde047] rounded-sm"></span> Day Shift
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="w-3 h-3 bg-[#ef4444] rounded-sm"></span> Night Shift
          </div>
        </div>

        {/* Action Buttons */}
        {selectedClient !== "All Clients" ? (
          <div className="flex gap-2">
            <button
              onClick={() => setApproveModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <ThumbsUp size={16} /> Approve Schedule
            </button>
            <button
              onClick={() => setDeclineModal(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <ThumbsDown size={16} /> Decline Schedule
            </button>
          </div>
        ) : (
          <div></div>
        )}
      </div>

      {/* ===== CALENDAR ===== */}
      <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg border border-gray-700">
        {loading ? (
          <p className="text-center text-gray-400 py-20">Loading schedules...</p>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="80vh"
            events={events}
            eventClick={(info) => {
              setSelectedEvent(info.event.extendedProps);
            }}
            eventContent={(eventInfo) => {
              const shift = eventInfo.event.extendedProps.shiftType;
              const bgColor =
                shift === "Night Shift"
                  ? "bg-red-600 text-white"
                  : "bg-yellow-400 text-black";
              return (
                <div
                  className={`rounded-md px-1 py-0.5 text-xs font-semibold ${bgColor}`}
                >
                  {eventInfo.event.title} ({shift})
                  
                </div>
              );
            }}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
          />
        )}
      </div>

      {/* ===== SELECTED EVENT DISPLAY ===== */}
      {selectedEvent && (
        <div className="mt-6 bg-[#1e293b] border border-gray-700 p-4 rounded-xl">
          <h2 className="text-lg font-bold mb-2">{selectedEvent.guardName}</h2>
          <p className="text-gray-300">
            <strong>Client:</strong> {selectedEvent.client}
          </p>
          <p className="text-gray-300">
            <strong>Shift:</strong> {selectedEvent.shiftType}
          </p>
          <p className="text-gray-300">
            <strong>Location:</strong> {selectedEvent.deploymentLocation}
          </p>
          <p className="text-gray-300">
            <strong>Status:</strong> {selectedEvent.isApproved || "Pending"}
          </p>
        </div>
      )}

      {/* ===== APPROVE MODAL ===== */}
      <Transition appear show={approveModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setApproveModal(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6 max-w-md w-full">
              <Dialog.Title className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ThumbsUp className="text-green-400" /> Approve All Schedules
              </Dialog.Title>
              {/* Summary Info */}
              <div className="bg-[#0f172a] border border-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-300 mb-2">
                  You are about to approve all pending schedules for the month of
                  <span className="text-green-400 font-medium ml-1">
                    {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
                  </span>.
                </p>

                <div className="text-gray-100 text-sm space-y-1">
                  <p>
                    <span className="text-gray-400">🏢 Client:</span>{" "}
                    <span className="font-medium text-white">{selectedClient}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">🕒 Total Pending Work Days:</span>{" "}
                    <span className="font-semibold text-yellow-400">
                      {
                        schedules.filter(
                          (s) => s.client === selectedClient && s.isApproved === "Pending"
                        ).length
                      }
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">👮 Guards Involved:</span>{" "}
                    <span className="font-semibold text-blue-400">
                      {
                        [
                          ...new Set(
                            schedules
                              .filter(
                                (s) =>
                                  s.client === selectedClient && s.isApproved === "Pending"
                              )
                              .map((s) => s.guardName)
                          ),
                        ].length
                      }
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">📅 Coverage Dates:</span>{" "}
                    <span className="text-gray-200">
                      {
                        (() => {
                          const scheds = schedules.filter(
                            (s) => s.client === selectedClient && s.isApproved === "Pending"
                          );
                          if (!scheds.length) return "N/A";
                          const dates = scheds.map((s) => new Date(s.timeIn));
                          const earliest = new Date(Math.min(...dates)).toLocaleDateString();
                          const latest = new Date(Math.max(...dates)).toLocaleDateString();
                          return `${earliest} - ${latest}`;
                        })()
                      }
                    </span>
                  </p>
                </div>
              </div>

              {/* Warning */}
              <p className="text-gray-400 text-xs mb-6 italic">
                ⚠️ Once approved, these schedules will be locked and visible to the assigned guards.
              </p>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setApproveModal(false)}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setSubmitting(true);
                      await handleApprove();
                      setApproveModal(false);
                    } catch (error) {
                      console.error("Error approving schedules:", error);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                >
                  {submitting ? "Approving..." : "Confirm Approve"}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* ===== DECLINE MODAL ===== */}
      <Transition appear show={declineModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDeclineModal(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6 max-w-md w-full">
              <Dialog.Title className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ThumbsDown className="text-red-400" /> Decline All Schedules
              </Dialog.Title>

              {/* Context Info */}
              <div className="bg-[#0f172a] border border-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-300 mb-3">
                  You are about to decline all <span className="font-semibold text-white">{selectedClient}</span> schedules for{" "}
                  <span className="text-red-400 font-medium">
                    {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
                  </span>.
                </p>

                {/* Summary Details */}
                <div className="text-sm text-gray-200 space-y-1">
                  <p>
                    <span className="text-gray-400">📅 Coverage:</span>{" "}
                    <span className="text-gray-100">
                      {(() => {
                        const scheds = schedules.filter(
                          (s) => s.client === selectedClient && s.isApproved === "Pending"
                        );
                        if (!scheds.length) return "N/A";
                        const dates = scheds.map((s) => new Date(s.timeIn));
                        const earliest = new Date(Math.min(...dates)).toLocaleDateString();
                        const latest = new Date(Math.max(...dates)).toLocaleDateString();
                        return `${earliest} - ${latest}`;
                      })()}
                    </span>
                  </p>

                  <p>
                    <span className="text-gray-400">📦 Total Pending Schedules:</span>{" "}
                    <span className="font-semibold text-yellow-400">
                      {
                        schedules.filter(
                          (s) => s.client === selectedClient && s.isApproved === "Pending"
                        ).length
                      }
                    </span>
                  </p>

                  <p>
                    <span className="text-gray-400">👮 Guards Involved:</span>{" "}
                    <span className="font-semibold text-blue-400">
                      {
                        [
                          ...new Set(
                            schedules
                              .filter(
                                (s) => s.client === selectedClient && s.isApproved === "Pending"
                              )
                              .map((s) => s.guardName)
                          ),
                        ].length
                      }
                    </span>
                  </p>

                  <p>
                    <span className="text-gray-400">🗓️ Total Workdays:</span>{" "}
                    <span className="font-semibold text-green-400">
                      {
                        [
                          ...new Set(
                            schedules
                              .filter(
                                (s) => s.client === selectedClient && s.isApproved === "Pending"
                              )
                              .map((s) => new Date(s.timeIn).toDateString())
                          ),
                        ].length
                      }
                    </span>
                  </p>
                </div>
              </div>

              {/* Remarks Input */}
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Reason for Declining
              </label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter detailed reason..."
                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 mb-4 focus:ring-2 focus:ring-red-500"
              />

              <p className="text-xs text-gray-500 italic mb-4">
                ⚠️ Declining will mark all pending schedules for this client as <span className="text-red-400">Declined</span>. This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeclineModal(false)}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!remarks.trim()) return alert("Please provide a reason before declining.");
                    try {
                      setSubmitting(true);
                      await handleDecline(remarks);
                      setDeclineModal(false);
                    } catch (error) {
                      console.error("Error declining schedules:", error);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                >
                  {submitting ? "Declining..." : "Confirm Decline"}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
