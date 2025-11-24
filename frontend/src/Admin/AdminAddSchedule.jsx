import { useState, useEffect } from "react";
import { Shield, Clock, Search, CalendarCheck2, Pencil } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { parseISO, format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminAddSchedule() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [guards, setGuards] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [form, setForm] = useState({
    deploymentLocation: "",
    client: "",
    position: "",
    shiftType: "",
    timeIn: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    timeOut: "",
  });

  const [loadingpage, setLoadingpage] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [guardsRes, clientsRes] = await Promise.all([
          fetch("http://localhost:5000/api/guards", {
            credentials: "include",
          }),
          fetch("http://localhost:5000/api/clients/get-clients", {
            credentials: "include",
          }),
        ]);

        if (!guardsRes.ok || !clientsRes.ok) {
          throw new Error("Failed to fetch guards or clients");
        }

        const [guardsData, clientsData] = await Promise.all([
          guardsRes.json(),
          clientsRes.json(),
        ]);

        setGuards(guardsData);
        setClients(clientsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (id && guards.length > 0) {
      setIsEditMode(true);
      const fetchScheduleData = async () => {
        try {
          setLoadingpage(true);
          const res = await fetch(
            `http://localhost:5000/api/schedules/get-by-batch/${id}`,
            { credentials: "include" }
          );
          if (!res.ok) throw new Error("Failed to fetch schedule batch for editing");
          const batchData = await res.json();

          if (batchData.length > 0) {
            const firstSched = batchData[0];
            setForm({
              deploymentLocation: firstSched.deploymentLocation,
              client: firstSched.client,
              position: firstSched.position,
              shiftType: firstSched.shiftType,
              timeIn: "",
              timeOut: "",
            });

            // Check if all schedules in the batch have the same guardId
            const uniqueGuardIds = new Set(batchData.map(s => s.guardId.toString())); // Convert to string for comparison
            if (uniqueGuardIds.size === 1) {
                const guard = guards.find((g) => g._id === firstSched.guardId.toString()); // Convert to string for comparison
                setSelectedGuard(guard);
            } else {
                setMessage("❌ This batch contains schedules for multiple guards and cannot be edited on this page.");
                setSelectedGuard(null); // Clear selected guard if multiple guards
                // Optionally, disable the form or other actions if multi-guard batch
            }

            const days = batchData.map((s) => parseISO(s.timeIn));
            setSelectedDays(days);
          }
        } catch (err) {
          setMessage(`❌ Error: ${err.message}`);
        } finally {
          setLoadingpage(false);
        }
      };
      fetchScheduleData();
    }
  }, [id, guards]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditMode) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  const handleCreate = async () => {
    if (!selectedGuard) return alert("Please select a guard first!");
    if (selectedDays.length === 0) return alert("Please select at least one date!");

    const shiftTimes =
      form.shiftType === "Night Shift"
        ? { timeIn: "19:00", timeOut: "07:00" }
        : { timeIn: "07:00", timeOut: "19:00" };

    const schedules = selectedDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const timeInFull = `${dateStr}T${shiftTimes.timeIn}`;
      let timeOutFull = `${dateStr}T${shiftTimes.timeOut}`;

      if (form.shiftType === "Night Shift") {
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        timeOutFull = `${format(nextDay, "yyyy-MM-dd")}T${shiftTimes.timeOut}`;
      }

      return {
        guardId: selectedGuard._id,
        deploymentLocation: form.deploymentLocation,
        client: form.client,
        position: form.position,
        shiftType: form.shiftType,
        timeIn: timeInFull,
        timeOut: timeOutFull,
      };
    });

    try {
      setLoadingpage(true);
      const res = await fetch("http://localhost:5000/api/schedules/create-schedule", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error adding schedules");

      setMessage("✅ Schedules added successfully!");
      navigate("/admin/deployment");
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoadingpage(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedGuard) return alert("Please select a guard first!");
    if (selectedDays.length === 0) return alert("Please select at least one date!");

    const shiftTimes =
      form.shiftType === "Night Shift"
        ? { timeIn: "19:00", timeOut: "07:00" }
        : { timeIn: "07:00", timeOut: "19:00" };

    const schedules = selectedDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const timeInFull = `${dateStr}T${shiftTimes.timeIn}`;
      let timeOutFull = `${dateStr}T${shiftTimes.timeOut}`;
      if (form.shiftType === "Night Shift") {
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        timeOutFull = `${format(nextDay, "yyyy-MM-dd")}T${shiftTimes.timeOut}`;
      }
      return {
        guardId: selectedGuard._id,
        deploymentLocation: form.deploymentLocation,
        client: form.client,
        position: form.position,
        shiftType: form.shiftType,
        timeIn: timeInFull,
        timeOut: timeOutFull,
      };
    });
    
    try {
      setLoadingpage(true);
      const res = await fetch(`http://localhost:5000/api/schedules/batch/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error updating schedules");
      setMessage("✅ Schedules updated successfully!");
      navigate("/admin/deployment");
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoadingpage(false);
    }
  };

  const filteredGuards = guards.filter((g) =>
    g.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="min-h-screen bg-[#0f172a] text-gray-100 px-10 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold  flex gap-x-3 items-center">
          {isEditMode ? (
            <Pencil className="text-yellow-400" size={28} />
          ) : (
            <CalendarCheck2 className="text-blue-400" size={28} />
          )}
          {isEditMode ? "Edit Guard Schedule" : "Add Guard Schedule"}
        </h1>
        <p
          onClick={() => navigate("/admin/deployment")}
          className="text-sm text-gray-400 cursor-pointer hover:text-gray-200"
        >
          ← Back to Deployment
        </p>
      </div>

      <div className="flex gap-8">
        {/* LEFT SIDE - Guard List */}
        <div className={`w-1/2 bg-[#1e293b] rounded-2xl border border-gray-700 shadow-lg flex flex-col`}>
          <div className="p-6 border-b border-gray-700 flex items-center gap-2 mb-2">
            <Shield className="text-blue-400" />
            <h2 className="text-xl font-semibold">Guard List</h2>
          </div>

          <div className="px-6 py-4 flex items-center bg-[#0f172a] rounded-lg mx-6">
            <Search className="text-gray-400 w-4 h-4 mr-2" />
            <input
              type="text"
              placeholder="Search guard..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-100 placeholder-gray-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 max-h-[70vh]">
            {filteredGuards.length === 0 ? (
              <p className="text-gray-500 text-sm">No guards found.</p>
            ) : (
              filteredGuards.map((guard) => (
                <div
                  key={guard._id}
                  onClick={() => {
                    if (guard.status === "Active") {
                      setSelectedGuard(guard);
                    } else {
                      toast.error("Active guards only can be deploy", {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: false,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "dark",
                        transition: Bounce,
                      });
                    }
                  }}
                  className={`p-4 rounded-lg cursor-pointer transition ${
                    selectedGuard?._id === guard._id
                      ? "bg-blue-600/20 border-blue-500"
                      : "hover:bg-[#0b2433] border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-center border-b-[1px] border-gray-500">
                    <div>
                      <p className="font-semibold">{guard.fullName}</p>
                      <p className="text-sm text-gray-400">{guard.position}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        guard.status === "Active"
                          ? "bg-green-700/30 text-green-400"
                          : "bg-gray-700/50 text-gray-400"
                      }`}
                    >
                      {guard.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Add/Edit Schedule Form */}
        <div className="w-1/2 bg-[#1e293b] rounded-2xl border border-gray-700 shadow-lg p-8">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="text-blue-400" />
            <h2 className="text-xl font-semibold">
              {isEditMode ? "Update Schedule Details" : "Assign Schedule"}
            </h2>
          </div>

          {selectedGuard ? (
            <div className="mb-4 text-sm text-gray-300">
              Selected Guard:{" "}
              <span className="font-semibold text-blue-400">
                {selectedGuard.fullName}
              </span>
            </div>
          ) : (
            <p className="text-gray-400 mb-4 italic">
              Select a guard from the left to assign a schedule.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col w-full gap-y-2">
                <div className="flex w-full gap-x-2">
                    <div className="w-full">
                        <label
                            htmlFor="deploymentLocation"
                            className="block text-sm font-medium text-gray-300 mb-1">
                            Deployment Location
                        </label>
                        <input
                            id="deploymentLocation"
                            name="deploymentLocation"
                            placeholder="Enter deployment location"
                            value={form.deploymentLocation}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="w-full">
                        <label
                            htmlFor="client"
                            className="block text-sm font-medium text-gray-300 mb-1"
                        >
                            Client
                        </label>
                        <select
                            id="client"
                            name="client"
                            value={form.client}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Client</option>
                            {clients.length > 0 ? (
                            clients.map((client) => (
                                <option key={client._id} value={client.clientName}>
                                {client.clientName}
                                </option>
                            ))
                            ) : (
                            <option disabled>Loading clients...</option>
                            )}
                        </select>
                    </div>
                </div>
                <div className="flex w-full gap-x-2">
                    <div className="w-full">
                        <label
                            htmlFor="position"
                            className="block text-sm font-medium text-gray-300 mb-1">
                            Position
                        </label>
                        <input
                            id="position"
                            name="position"
                            placeholder="Enter assigned position"
                            value={form.position}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="w-full">
                        <label
                            htmlFor="shiftType"
                            className="block text-sm font-medium text-gray-300 mb-1">
                            Shift Type
                        </label>
                        <select
                            id="shiftType"
                            name="shiftType"
                            value={form.shiftType}
                            onChange={handleChange}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Shift</option>
                            <option value="Day Shift">Day Shift</option>
                            <option value="Night Shift">Night Shift</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Select Schedule Dates
                    </label>
                    <div className="bg-[#0f172a] border border-gray-700 rounded-lg p-4 flex items-center justify-center">
                        <DayPicker
                            mode="multiple"
                            selected={selectedDays}
                            onSelect={setSelectedDays}
                            classNames={{
                                caption: "text-gray-200",
                                day_selected: "bg-blue-500 text-white",
                                day_today: "text-blue-300",
                            }}
                        />
                    </div>
                    {selectedDays.length > 0 && (
                        <p className="text-gray-400 text-sm mt-2">
                        {selectedDays.length} day{selectedDays.length > 1 ? "s" : ""} selected
                        </p>
                    )}
                </div>
            </div>

            {message && (
                <div className={`text-sm text-center py-2 ${message.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{message}</div>
            )}

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loadingpage}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-8 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                >
                    {loadingpage ? "Saving..." : isEditMode ? "Update Schedule" : "Save Schedule"}
                </button>
            </div>
          </form>
        </div>
      </div>
      <div className="text-center text-gray-500 text-xs mt-10">
        © {new Date().getFullYear()} JPM Security Agency — Admin Dashboard
      </div>
      <ToastContainer />
    </section>
  );
}
