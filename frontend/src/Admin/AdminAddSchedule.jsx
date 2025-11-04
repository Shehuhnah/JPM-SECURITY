import { useState, useEffect } from "react";
import { Shield, Clock, Search, CalendarCheck2  } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation  } from "react-router-dom";
import { parseISO, format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function AdminAddSchedule() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const selectedDate = queryParams.get("date");
    const formattedDate = selectedDate ? format(parseISO(selectedDate), "yyyy-MM-dd'T'HH:mm"): "";
    const [guards, setGuards] = useState([]);
    const [clients, setclients] = useState([]);
    const [selectedGuard, setSelectedGuard] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDays, setSelectedDays] = useState([]);
    const [form, setForm] = useState({
        deploymentLocation: "",
        client: "",
        position: "",
        shiftType: "",
        timeIn: formattedDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        timeOut: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
            const [guardsRes, clientsRes] = await Promise.all([
                fetch("http://localhost:5000/api/guards", {
                headers: { Authorization: `Bearer ${token}` },
                }),
                fetch("http://localhost:5000/api/clients/get-clients", {
                headers: { Authorization: `Bearer ${token}` },
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
            setclients(clientsData);

          
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        if (token) fetchData();
    }, [token]);

    // Handle input
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedGuard) return alert("Please select a guard first!");
        if (selectedDays.length === 0) return alert("Please select at least one date!");

        // Define shift time range
        const shiftTimes =
            form.shiftType === "Night Shift"
            ? { timeIn: "19:00", timeOut: "07:00" }
            : { timeIn: "07:00", timeOut: "19:00" };

        // Create an array of schedules for each selected day
        const schedules = selectedDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const timeInFull = `${dateStr}T${shiftTimes.timeIn}`;
            let timeOutFull = `${dateStr}T${shiftTimes.timeOut}`;
            
            // If Night Shift, add +1 day for timeOut
            if (form.shiftType === "Night Shift") {
                const nextDay = new Date(day);
                nextDay.setDate(nextDay.getDate() + 1);
                timeOutFull = `${format(nextDay, "yyyy-MM-dd")}T${shiftTimes.timeOut}`;
            }

            return {
                guardId: selectedGuard._id,
                guardName: selectedGuard.fullName,
                deploymentLocation: form.deploymentLocation,
                client: form.client,
                position: form.position,
                shiftType: form.shiftType,
                timeIn: timeInFull,
                timeOut: timeOutFull,
            };
        });

        console.log("Generated schedules:", schedules);

        try {
            setLoading(true);
            const res = await fetch("http://localhost:5000/api/schedules/create-schedule", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
                body: JSON.stringify({ schedules }), // send multiple
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error adding schedules");

            setMessage("✅ Schedules added successfully!");
            setSelectedDays([]);
            setForm({
                deploymentLocation: "",
                client: "",
                position: "",
                shiftType: "",
                timeIn: "",
                timeOut: "",
            });
            setSelectedGuard(null);
        } catch (err) {
            setMessage("❌ " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter guards
    const filteredGuards = guards.filter((g) =>
        g.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section className="min-h-screen bg-[#0f172a] text-gray-100 px-10 py-12">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold  flex gap-x-3 items-center">
                    <CalendarCheck2 className="text-blue-400" size={28}/> Add Guard Schedule
                </h1>
                <p onClick={() => navigate("/admin/deployment")} className="text-sm text-gray-400 cursor-pointer hover:text-gray-200">
                    ← Back to Deployment
                </p>
            </div>

            <div className="flex gap-8">
                {/* LEFT SIDE - Guard List */}
                <div className="w-1/2 bg-[#1e293b] rounded-2xl border border-gray-700 shadow-lg flex flex-col">
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
                                onClick={() => setSelectedGuard(guard)}
                                className={`p-4 rounded-lg cursor-pointer transition ${
                                    selectedGuard?._id === guard._id
                                    ? "bg-blue-600/20 border-blue-500"
                                    : "hover:bg-[#0b2433] border-transparent"
                                }`}>
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

                {/* RIGHT SIDE - Add Schedule Form */}
                <div className="w-1/2 bg-[#1e293b] rounded-2xl border border-gray-700 shadow-lg p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Clock className="text-blue-400" />
                        <h2 className="text-xl font-semibold">Assign Schedule</h2>
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
                    {/* Deployment Location */}
                    <div>
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

                    {/* Client */}
                    <div>
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

                    {/* Position */}
                    <div>
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

                    {/* Shift Type */}
                    <div>
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
                    {/* Schedule Dates (Calendar) */}
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

                    {/* Feedback message */}
                    {message && (
                        <div className="text-sm text-center py-2 text-gray-300">{message}</div>
                    )}

                    {/* Submit button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-8 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Schedule"}
                        </button>
                    </div>
                    </form>
                </div>
            </div>
            {/* ===== Footer ===== */}
                <div className="text-center text-gray-500 text-xs mt-10">
                © {new Date().getFullYear()} JPM Security Agency — Admin Dashboard
                </div>
        </section>
    );
}
