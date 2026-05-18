import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getPersonName } from "../utils/name";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Clock,
  FileText,
  Hash,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Shield,
  Users,
} from "lucide-react";

const api = import.meta.env.VITE_API_URL;

const formatDateDisplay = (dateString, options = {}) => {
  if (!dateString) return "N/A";
  try {
    const dateObj = new Date(dateString);
    if (Number.isNaN(dateObj.getTime())) return "Invalid Date";
    const defaultOptions = { year: "numeric", month: "short", day: "numeric" };
    return dateObj.toLocaleDateString(undefined, { ...defaultOptions, ...options });
  } catch {
    return "Invalid Date";
  }
};

const formatTimeDisplay = (dateString) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const formatDateTimeDisplay = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const dateObj = new Date(dateString);
    if (Number.isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

const toScheduleDate = (value) => {
  if (!value) return null;
  const raw = String(value);
  const normalized =
    raw.endsWith("Z") || raw.includes("+")
      ? raw
      : `${raw}+08:00`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const InfoBadge = ({ icon: Icon, label, value, colorClass = "text-cyan-400" }) => (
  <div className="flex h-full items-start gap-4 rounded-2xl border border-slate-700/50 bg-slate-800/35 p-4">
    <div className={`mt-0.5 rounded-xl bg-slate-950/80 p-2.5 ${colorClass}`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-100" title={value}>
        {value || "N/A"}
      </p>
    </div>
  </div>
);

const SummaryCard = ({ icon: Icon, label, value, tone = "text-cyan-400", className = "" }) => (
  <div className={`flex h-full flex-col justify-between rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 ${className}`}>
    <div className="mb-4 flex items-center justify-between gap-4">
      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <Icon className={tone} size={18} />
    </div>
    <div className="text-2xl font-bold leading-tight text-white">{value}</div>
  </div>
);

const SkeletonLoader = () => (
  <div className="mx-auto max-w-7xl animate-pulse space-y-6 p-6">
    <div className="mb-8 h-8 w-32 rounded bg-slate-800"></div>
    <div className="h-72 rounded-3xl bg-slate-800"></div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="h-80 rounded-2xl bg-slate-800"></div>
      <div className="h-[44rem] rounded-2xl bg-slate-800"></div>
    </div>
  </div>
);

export default function AdminGuardUpdates2() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const entityType = searchParams.get("type") === "staff" ? "staff" : "guard";
  const isGuardView = entityType === "guard";

  const [guard, setGuard] = useState(null);
  const [staff, setStaff] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState("");
  const sortedLogs = useMemo(
    () =>
      [...logs].sort((a, b) => {
        const aDate = new Date((isGuardView ? a.createdAt : a.reportDate || a.createdAt) || 0).getTime();
        const bDate = new Date((isGuardView ? b.createdAt : b.reportDate || b.createdAt) || 0).getTime();
        return bDate - aDate;
      }),
    [logs, isGuardView]
  );
  const currentGuardSchedule = useMemo(() => {
    if (!isGuardView) return null;

    const approvedSchedules = schedules.filter((schedule) => schedule?.isApproved === "Approved");
    if (approvedSchedules.length === 0) return null;

    const now = new Date();

    const withTimes = approvedSchedules
      .map((schedule) => ({
        schedule,
        start: toScheduleDate(schedule.timeIn),
        end: toScheduleDate(schedule.timeOut),
      }))
      .filter(({ start, end }) => start && end);

    const activeSchedule = withTimes.find(({ start, end }) => now >= start && now <= end);
    if (activeSchedule) {
      return activeSchedule.schedule;
    }

    const upcomingSchedule = withTimes
      .filter(({ start }) => start >= now)
      .sort((a, b) => a.start - b.start)[0];
    if (upcomingSchedule) {
      return upcomingSchedule.schedule;
    }

    return withTimes.sort((a, b) => b.start - a.start)[0]?.schedule || null;
  }, [isGuardView, schedules]);
  const latestGuardAttendance = useMemo(() => {
    if (!isGuardView || !attendanceRecords.length) return null;
    return [...attendanceRecords]
      .sort((a, b) => new Date(b.timeIn || b.createdAt || 0) - new Date(a.timeIn || a.createdAt || 0))[0] || null;
  }, [attendanceRecords, isGuardView]);
  const currentDutyStatus = useMemo(() => {
    if (!isGuardView) return "N/A";
    if (latestGuardAttendance?.status === "On Duty") return "On Duty";
    if (guard?.statusToday === "On Leave") return "On Leave";
    return "Off Duty";
  }, [guard?.statusToday, isGuardView, latestGuardAttendance?.status]);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (id) {
      fetchProfileData();
    }
  }, [id, entityType]);

  const fetchProfileData = async () => {
    try {
      setLoadingPage(true);
      setError("");
      setGuard(null);
      setStaff(null);
      setSchedules([]);
      setAttendanceRecords([]);

      if (isGuardView) {
        const [detailsRes, attendanceRes] = await Promise.all([
          fetch(`${api}/api/guards/${id}/details`, { credentials: "include" }),
          fetch(`${api}/api/attendance/${id}`, { credentials: "include" }),
        ]);

        if (!detailsRes.ok) {
          setError("Guard not found or access denied.");
          return;
        }

        const [detailsData, attendanceData] = await Promise.all([
          detailsRes.json(),
          attendanceRes.ok ? attendanceRes.json() : Promise.resolve([]),
        ]);

        setGuard(detailsData.guard);
        setSchedules(Array.isArray(detailsData.schedules) ? detailsData.schedules : []);
        setLogs(Array.isArray(detailsData.logs) ? detailsData.logs : []);
        setAttendanceRecords(Array.isArray(attendanceData) ? attendanceData : []);
      } else {
        const response = await fetch(`${api}/api/admin-reports/staff/${id}`, { credentials: "include" });

        if (!response.ok) {
          setError("Staff not found or access denied.");
          return;
        }

        const data = await response.json();
        setStaff(data.staff);
        setLogs(Array.isArray(data.reports) ? data.reports : []);
      }
    } catch (fetchError) {
      console.error("Error fetching update details:", fetchError);
      setError("Network error. Unable to load profile data.");
    } finally {
      setLoadingPage(false);
    }
  };

  if (loading || loadingPage) {
    return <div className="min-h-screen bg-[#0f172a]"><SkeletonLoader /></div>;
  }

  const profile = isGuardView ? guard : staff;

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] p-4">
        <div className="max-w-md rounded-2xl border border-red-900/50 bg-red-900/20 p-6 text-center text-red-400">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <h2 className="mb-2 text-xl font-bold">Error Loading Profile</h2>
          <p className="mb-6 text-sm text-gray-400">{error || "Profile data unavailable."}</p>
          <Link to="/admin/AdminGuardUpdates" className="rounded-lg bg-red-600 px-6 py-2 text-white transition hover:bg-red-500">
            Return to List
          </Link>
        </div>
      </div>
    );
  }

  const displayName = getPersonName(profile);
  const profileStatus = profile.status || "Unknown";
  const isActive = isGuardView ? profileStatus === "Active" : profileStatus === "active";

  const latestEntryDate = sortedLogs[0]
    ? (isGuardView ? sortedLogs[0].createdAt : sortedLogs[0].reportDate || sortedLogs[0].createdAt)
    : null;
  const imageEntryCount = sortedLogs.filter((log) => Boolean(log.imageUrl)).length;

  const profileMeta = isGuardView
    ? [
        { icon: Mail, label: "Email", value: guard?.email || "N/A", colorClass: "text-cyan-400" },
        { icon: Phone, label: "Contact", value: guard?.phoneNumber || "N/A", colorClass: "text-emerald-400" },
        { icon: MapPin, label: "Address", value: guard?.address || "N/A", colorClass: "text-amber-400" },
        {
          icon: Clock,
          label: "Duty Status",
          value: currentGuardSchedule
            ? `${currentDutyStatus} | ${currentGuardSchedule.client || "Assigned"}`
            : currentDutyStatus,
          colorClass: "text-rose-400",
        },
      ]
    : [
        { icon: Mail, label: "Email", value: staff?.email || "N/A", colorClass: "text-cyan-400" },
        { icon: Phone, label: "Contact", value: staff?.contactNumber || "N/A", colorClass: "text-emerald-400" },
        { icon: Users, label: "Role", value: staff?.role || "Staff", colorClass: "text-amber-400" },
        { icon: BadgeCheck, label: "Status", value: profileStatus, colorClass: "text-rose-400" },
      ];

  return (
    <div className="min-h-screen bg-[#0f172a] pb-12 font-sans text-slate-200">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <Link to="/admin/AdminGuardUpdates" className="group inline-flex items-center gap-2 text-slate-400 transition hover:text-white">
            <div className="rounded-full bg-slate-800 p-2 transition group-hover:bg-slate-700">
              <ArrowLeft size={18} />
            </div>
            <span className="font-medium">Back to Updates List</span>
          </Link>
        </div>

        <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-700/50 bg-[#1e293b] p-6 shadow-xl sm:p-8">
          <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500"></div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_24%)]"></div>

          <div className="relative z-10 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[auto_minmax(0,1fr)] xl:items-start">
              <div className="flex flex-col items-center xl:items-start">
                <div className="mb-4 h-32 w-32 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 p-1 shadow-2xl">
                  <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-[#1e293b] bg-[#0f172a] text-4xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <span
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                    isActive
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-500/20 bg-slate-500/10 text-slate-400"
                  }`}
                >
                  {profileStatus}
                </span>
              </div>

              <div className="w-full text-center xl:text-left">
                <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                      {isGuardView ? "Guard Activity Profile" : "Staff Report Profile"}
                    </p>
                    <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">{displayName}</h1>
                    <p className="flex items-center justify-center gap-2 text-slate-400 xl:justify-start">
                      {isGuardView ? (
                        <>
                          <Hash size={16} /> {guard?.guardId || "N/A"}
                        </>
                      ) : (
                        <>
                          <Users size={16} /> {staff?.role || "Staff"}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 px-4 py-3 text-left xl:min-w-[220px]">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Latest Activity</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {latestEntryDate ? formatDateTimeDisplay(latestEntryDate) : "No activity yet"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoBadge
                    icon={isGuardView ? Shield : Briefcase}
                    label="Position"
                    value={profile.position}
                    colorClass="text-purple-400"
                  />
                  <InfoBadge
                    icon={isGuardView ? MapPin : Users}
                    label={isGuardView ? "Duty Station" : "Role"}
                    value={isGuardView ? currentGuardSchedule?.deploymentLocation || "No active assigned station" : staff?.role}
                    colorClass="text-red-400"
                  />
                  <InfoBadge
                    icon={Clock}
                    label={isGuardView ? "Assigned Shift" : "Contact"}
                    value={
                      isGuardView
                        ? currentGuardSchedule
                          ? `${currentGuardSchedule.shiftType || "Shift"}${currentGuardSchedule.timeIn && currentGuardSchedule.timeOut ? ` | ${formatTimeDisplay(currentGuardSchedule.timeIn)} - ${formatTimeDisplay(currentGuardSchedule.timeOut)}` : ""}`
                          : "No approved schedule found"
                        : staff?.contactNumber
                    }
                    colorClass="text-amber-400"
                  />
                  <InfoBadge
                    icon={CalendarDays}
                    label="Joined"
                    value={formatDateDisplay(profile.createdAt)}
                    colorClass="text-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-2">
              <SummaryCard
                icon={Activity}
                label={isGuardView ? "Total Logs" : "Total Reports"}
                value={sortedLogs.length}
                tone="text-emerald-400"
              />
              <SummaryCard
                icon={ImageIcon}
                label="Entries With Images"
                value={imageEntryCount}
                tone="text-sky-400"
              />
              <SummaryCard
                icon={CalendarDays}
                label="Last Entry Date"
                value={latestEntryDate ? formatDateDisplay(latestEntryDate) : "None"}
                tone="text-amber-400"
                className="2xl:col-span-2"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 2xl:grid-cols-[0.8fr_1.2fr]">
          <section className="h-fit rounded-2xl border border-slate-700/50 bg-[#1e293b] p-6 shadow-lg">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-slate-900 p-2 text-cyan-400">
                <Users size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Profile Summary</h2>
                <p className="text-sm text-slate-400">Core contact and activity context.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {profileMeta.map(({ icon, label, value, colorClass }) => (
                <InfoBadge key={label} icon={icon} label={label} value={value} colorClass={colorClass} />
              ))}
            </div>
          </section>

          <section className="flex max-h-[960px] flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-[#1e293b] shadow-lg">
            <div className="border-b border-slate-700/50 bg-slate-800/30 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                    <Activity className="text-emerald-500" size={20} />
                    {isGuardView ? "Recent Logs" : "Submitted Reports"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {isGuardView
                      ? "Newest field log entries first, including photo evidence when provided."
                      : "Newest reports first, including attachments and attendance context when available."}
                  </p>
                </div>

                <div className="w-fit rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {sortedLogs.length} entries
                </div>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
              {sortedLogs.length > 0 ? (
                <div className="relative ml-3 space-y-8 border-l border-slate-700">
                  {sortedLogs.map((log) => {
                    const entryDate = isGuardView ? log.createdAt : log.reportDate || log.createdAt;
                    const imageUrl = log.imageUrl || "";

                    return (
                      <div key={log._id} className="relative ml-8">
                        <span className="absolute -left-[41px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-4 border-[#1e293b] bg-slate-600" />

                        <div className="rounded-2xl border border-slate-700/50 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(30,41,59,0.9))] p-5 transition hover:border-cyan-500/30">
                          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                                  {isGuardView ? log.type : log.title}
                                </span>
                                {imageUrl ? (
                                  <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-300">
                                    With Image
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-sm text-slate-400">{formatDateTimeDisplay(entryDate)}</div>
                            </div>
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                              {isGuardView ? "Log Entry" : "Report Entry"}
                            </div>
                          </div>

                          <p className="mb-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                            {isGuardView ? log.remarks : log.details}
                          </p>

                          {imageUrl ? (
                            <a href={imageUrl} target="_blank" rel="noreferrer" className="group/image mb-4 block">
                              <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/60">
                                <img
                                  src={imageUrl}
                                  alt={isGuardView ? `${log.type} attachment` : `${log.title} attachment`}
                                  className="h-64 w-full object-cover transition duration-300 group-hover/image:scale-[1.02]"
                                />
                              </div>
                              <div className="mt-2 text-xs text-sky-300">Open full image</div>
                            </a>
                          ) : null}

                          <div className="grid grid-cols-1 gap-3 border-t border-slate-700/50 pt-4 md:grid-cols-2">
                            {isGuardView ? (
                              <>
                                <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                                  <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Post</div>
                                  <div className="flex items-center gap-2 text-slate-200">
                                    <MapPin size={14} className="text-slate-500" />
                                    {log.post || "No post assigned"}
                                  </div>
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                                  <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Shift</div>
                                  <div className="flex items-center gap-2 text-slate-200">
                                    <Clock size={14} className="text-slate-500" />
                                    {log.shift || "N/A"}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                                  <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Category</div>
                                  <div className="flex items-center gap-2 text-slate-200">
                                    <FileText size={14} className="text-slate-500" />
                                    {log.category || "Report"}
                                  </div>
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                                  <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Attendance Link</div>
                                  <div className="flex items-center gap-2 text-slate-200">
                                    <BadgeCheck size={14} className="text-slate-500" />
                                    {log.attendanceId?.status || "Not linked"}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-slate-500">
                  <FileText size={48} className="mb-3 opacity-20" />
                  <p>{isGuardView ? "No log activity recorded yet." : "No staff reports recorded yet."}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
