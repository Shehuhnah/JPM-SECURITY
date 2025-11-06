import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
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
    backgroundColor: "transparent", // remove default bg
    borderColor: "transparent",
    textColor: "#fff",
    extendedProps: sched,
  }));

  // ===== Approve Schedule =====
  const handleApprove = async () => {
    if (!selectedEvent) return alert("Please select a schedule first.");
    if (!window.confirm(`Approve schedule for ${selectedEvent.guardName}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/schedules/${selectedEvent._id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("✅ Schedule approved successfully!");
      setSchedules((prev) =>
        prev.map((s) =>
          s._id === selectedEvent._id ? { ...s, status: "Approved" } : s
        )
      );
      setSelectedEvent(null);
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // ===== Decline Schedule =====
  const handleDecline = async () => {
    if (!selectedEvent) return alert("Please select a schedule first.");
    if (!window.confirm(`Decline schedule for ${selectedEvent.guardName}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/schedules/${selectedEvent._id}/decline`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("❌ Schedule declined!");
      setSchedules((prev) =>
        prev.map((s) =>
          s._id === selectedEvent._id ? { ...s, status: "Declined" } : s
        )
      );
      setSelectedEvent(null);
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
                    onClick={handleApprove}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                    <ThumbsUp size={16} /> Approve Schedule
                </button>
                <button
                    onClick={handleDecline}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                    <ThumbsDown size={16} /> Decline Schedule
                </button>
            </div>)
        :
            <div className="">

            </div>
        }
        
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
            <strong>Status:</strong> {selectedEvent.status || "Pending"}
          </p>
        </div>
      )}
    </div>
  );
}
