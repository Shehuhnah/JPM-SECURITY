import { useEffect, useState } from "react";
import { CalendarDays, Clock, Users, MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function GuardUpcomingSchedule() {
    const { user: guard, loading } = useAuth();
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        if (!loading && !guard) {
            navigate("/guard/login");
            return;
        }

        if (guard?._id) {
            document.title = "Detachment | JPM Agency Security";

            const fetchSchedulesByGuard = async () => {
                try {
                    const res = await fetch(
                        `http://localhost:5000/api/schedules/guard/${guard._id}`,
                        {
                            method: "GET",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                        }
                    );

                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(
                            errorData.message || "Failed to fetch schedules"
                        );
                    }

                    const data = await res.json();
                    setSchedules(data);
                } catch (err) {
                    console.error("Error fetching schedules:", err);
                }
            };

            fetchSchedulesByGuard();
        }
    }, [guard, loading, navigate]);

    const shiftColors = {
        "Day Shift": "bg-yellow-400 text-black",
        "Night Shift": "bg-red-500 text-white",
    };

    // Group schedules by date
    const groupedByDate = schedules.reduce((acc, s) => {
        const dateKey = new Date(s.timeIn).toISOString().split("T")[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(s);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedByDate).sort(
        (a, b) => new Date(a) - new Date(b)
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
                <p className="text-gray-400">Loading schedules...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-6 h-6 text-blue-400" />
                <h1 className="text-2xl font-bold">Upcoming Schedule</h1>
            </div>

            {sortedDates.length === 0 ? (
                <p className="text-gray-400 text-center mt-10">
                    No upcoming schedules found.
                </p>
            ) : (
                sortedDates.map((date) => (
                    <div key={date} className="space-y-3">
                        {/* Date Header */}
                        <div className="flex items-center gap-2 mt-4">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <h2 className="text-lg font-semibold">
                                {new Date(date).toLocaleDateString([], {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </h2>
                        </div>

                        {/* Shifts for that day */}
                        {groupedByDate[date].map((s, i) => (
                            <div
                                key={i}
                                className="bg-[#1e293b]/90 border border-gray-700 rounded-2xl p-4 shadow-md space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-semibold text-white">
                                            {s.guardId?.fullName
                                                ?.split(" ")
                                                .map((n) => n[0])
                                                .join("") || "?"}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-base">
                                                {s.guardId?.fullName}
                                            </p>
                                            <p className="text-gray-400 text-xs">
                                                {s.guardId?.position}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            shiftColors[s.shiftType]
                                        }`}
                                    >
                                        {s.shiftType}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    <span>
                                        {new Date(s.timeIn).toLocaleTimeString(
                                            [],
                                            {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }
                                        )}{" "}
                                        -{" "}
                                        {new Date(s.timeOut).toLocaleTimeString(
                                            [],
                                            {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                    <MapPin className="w-4 h-4 text-blue-400" />
                                    <span>{s.deploymentLocation}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ))
            )}
        </div>
    );
}
