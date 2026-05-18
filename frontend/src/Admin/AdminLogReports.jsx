import { useEffect, useMemo, useState, useRef } from "react";
import {
  ClipboardList, FileText, Image as ImageIcon, RefreshCcw,
  Send, Search, X, Plus, Calendar, Tag, User, Paperclip, AlertTriangle, CheckSquare, BarChart3
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const api = import.meta.env.VITE_API_URL;

const initialForm = {
  title: "",
  category: "Daily Summary",
  reportDate: new Date().toISOString().split("T")[0],
  attendanceId: "",
  details: "",
  image: null,
};

const CATEGORY_META = {
  "Daily Summary":      { color: "blue",   icon: ClipboardList, bg: "bg-blue-500/10",   text: "text-blue-300",   border: "border-blue-500/20" },
  "Attendance Concern": { color: "amber",  icon: AlertTriangle, bg: "bg-amber-500/10",  text: "text-amber-300",  border: "border-amber-500/20" },
  "Incident Report":    { color: "red",    icon: AlertTriangle, bg: "bg-red-500/10",    text: "text-red-300",    border: "border-red-500/20" },
  "HR Follow-up":       { color: "purple", icon: CheckSquare,   bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/20" },
};

const formatDateTime = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleString([], {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function AdminLogReports() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [reports, setReports] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user && !loading) { navigate("/admin/login"); return; }
    document.title = "Log Reports | JPM Security Agency";
  }, [user, loading, navigate]);

  const fetchPageData = async () => {
    try {
      setPageLoading(true);
      const [reportsRes, attendanceRes] = await Promise.all([
        fetch(`${api}/api/admin-reports`, { credentials: "include" }),
        fetch(`${api}/api/admin-attendance/me`, { credentials: "include" }),
      ]);
      const reportsData = await reportsRes.json();
      const attendanceData = await attendanceRes.json();
      if (!reportsRes.ok) throw new Error(reportsData.message || "Failed to fetch reports.");
      if (!attendanceRes.ok) throw new Error(attendanceData.message || "Failed to fetch attendance.");
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setAttendanceRecords(attendanceData?.recentRecords || []);
    } catch (error) {
      toast.error(error.message || "Failed to load reports page.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => { if (user) fetchPageData(); }, [user]);

  const myReportsCount = useMemo(
    () => reports.filter((r) => r.createdBy?._id === user?._id).length,
    [reports, user]
  );

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (filterCategory !== "All" && r.category !== filterCategory) return false;
      if (filterDate && new Date(r.reportDate).toISOString().split("T")[0] !== filterDate) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.title.toLowerCase().includes(q) && !r.details.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [reports, filterCategory, filterDate, searchQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!form.image) { setImagePreview(""); return; }
    if (form.image.type.startsWith("image/")) {
      const url = URL.createObjectURL(form.image);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview("");
    }
  }, [form.image]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("category", form.category);
      payload.append("reportDate", form.reportDate);
      payload.append("attendanceId", form.attendanceId);
      payload.append("details", form.details);
      if (form.image) payload.append("image", form.image);

      const res = await fetch(`${api}/api/admin-reports`, {
        method: "POST", credentials: "include", body: payload,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create report.");

      toast.success("Report created.");
      setForm(initialForm);
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setReports((prev) => [data, ...prev]);
      setShowCreateModal(false);
    } catch (error) {
      toast.error(error.message || "Failed to create report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 md:p-6">
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />

      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-600/20">
              <ClipboardList className="text-[#2B7FFF]" size={24} />
            </div>
            Log Reports
          </h1>
          <p className="text-sm text-slate-400 mt-2 ml-1">Create and review daily or incident reports for HR operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPageData}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCcw size={18} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2B7FFF] hover:bg-[#2460b9] rounded-xl text-white font-semibold text-sm shadow-lg shadow-blue-900/30 transition"
          >
            <Plus size={18} /> Create Report
          </button>
        </div>
      </div>

      {/* ===== Stats ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Reports" value={reports.length} icon={BarChart3} color="blue" />
        <StatCard title="My Reports" value={myReportsCount} icon={User} color="purple" />
        <StatCard title="Attendance Linked" value={attendanceRecords.length} icon={CheckSquare} color="green" />
      </div>

      {/* ===== Filters ===== */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e293b] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2B7FFF]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2B7FFF] min-w-[160px]"
        >
          <option value="All">All Categories</option>
          <option value="Daily Summary">Daily Summary</option>
          <option value="Attendance Concern">Attendance Concern</option>
          <option value="Incident Report">Incident Report</option>
          <option value="HR Follow-up">HR Follow-up</option>
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2B7FFF] [color-scheme:dark]"
        />
        {(filterDate || filterCategory !== "All" || searchQuery) && (
          <button
            onClick={() => { setFilterDate(""); setFilterCategory("All"); setSearchQuery(""); }}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-xl hover:bg-slate-800 transition"
          >
            <X size={14}/> Clear
          </button>
        )}
      </div>

      {/* ===== Reports Grid ===== */}
      {pageLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-blue-400 animate-pulse">
          <ClipboardList size={40} className="mb-3 opacity-40" />
          <p className="text-sm">Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-[#1e293b]/20 border border-dashed border-slate-800 rounded-2xl">
          <FileText size={48} className="mb-3 opacity-20" />
          <p className="text-sm">No reports found.</p>
          <button onClick={() => setShowCreateModal(true)} className="mt-4 text-xs text-[#2B7FFF] hover:underline">
            Create your first report →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <ReportCard key={report._id} report={report} api={api} />
          ))}
        </div>
      )}

      {/* ===== Create Report Modal ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/70 flex-shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                <div className="p-1.5 bg-[#2B7FFF]/15 border border-[#2B7FFF]/25 rounded-lg">
                  <ClipboardList size={18} className="text-[#2B7FFF]" />
                </div>
                Create Log Report
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); setForm(initialForm); setImagePreview(""); }}
                className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <form id="create-report-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Title <span className="text-red-400">*</span></label>
                  <input
                    name="title" value={form.title} onChange={handleChange} required
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2B7FFF]"
                    placeholder="e.g. Daily attendance summary for May 19"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                    <select name="category" value={form.category} onChange={handleChange}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#2B7FFF]">
                      <option>Daily Summary</option>
                      <option>Attendance Concern</option>
                      <option>Incident Report</option>
                      <option>HR Follow-up</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Report Date</label>
                    <input type="date" name="reportDate" value={form.reportDate} onChange={handleChange}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#2B7FFF] [color-scheme:dark]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Linked Attendance</label>
                  <select name="attendanceId" value={form.attendanceId} onChange={handleChange}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#2B7FFF]">
                    <option value="">No linked attendance</option>
                    {attendanceRecords.map((rec) => (
                      <option key={rec._id} value={rec._id}>{rec.dateKey} | {rec.status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Details <span className="text-red-400">*</span></label>
                  <textarea name="details" value={form.details} onChange={handleChange} required rows={6}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2B7FFF] resize-none"
                    placeholder="Summarize attendance updates, issues handled, and follow-up actions." />
                </div>

                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
                  <label className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                    <Paperclip size={14} className="text-[#2B7FFF]" />
                    Attach File (Image, PDF, DOCX) — Optional
                  </label>
                  <input type="file" ref={fileInputRef} accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                    onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.files?.[0] || null }))}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-[#2B7FFF] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#2460b9]" />
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="mt-3 max-h-48 rounded-xl border border-slate-700 object-cover" />
                  ) : form.image ? (
                    <div className="mt-3 text-sm text-slate-300 flex items-center gap-2">
                      <FileText size={16} className="text-[#2B7FFF]" /> {form.image.name}
                    </div>
                  ) : null}
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-700/70 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => { setShowCreateModal(false); setForm(initialForm); setImagePreview(""); }}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                form="create-report-form" type="submit" disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#2B7FFF] hover:bg-[#2460b9] rounded-xl text-white font-semibold text-sm shadow-lg shadow-blue-900/25 transition disabled:opacity-60"
              >
                {submitting ? <RefreshCcw className="animate-spin" size={16} /> : <Send size={16} />}
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: "text-blue-400",   val: "text-blue-300" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "text-purple-400", val: "text-purple-300" },
    green:  { bg: "bg-emerald-500/10",border: "border-emerald-500/20",icon: "text-emerald-400",val: "text-emerald-300" },
  }[color] || {};
  return (
    <div className={`bg-[#1e293b] border ${colors.border} rounded-2xl p-5 shadow-lg flex items-center gap-4`}>
      <div className={`${colors.bg} p-3 rounded-xl`}>
        <Icon size={22} className={colors.icon} />
      </div>
      <div>
        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{title}</div>
        <div className={`text-3xl font-bold ${colors.val} mt-0.5`}>{value}</div>
      </div>
    </div>
  );
}

function ReportCard({ report, api }) {
  const meta = CATEGORY_META[report.category] || CATEGORY_META["Daily Summary"];
  const CategoryIcon = meta.icon;
  return (
    <div className="bg-[#1e293b] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col gap-4 transition group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-snug truncate" title={report.title}>{report.title}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
              <CategoryIcon size={10} /> {report.category}
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <Calendar size={11} />
            {new Date(report.reportDate).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1 justify-end mt-1">
            <User size={11} />
            {report.createdBy?.name || "Unknown"}
          </div>
        </div>
      </div>

      {/* Details */}
      <p className="text-sm text-slate-400 whitespace-pre-wrap line-clamp-3 leading-relaxed">{report.details}</p>

      {/* Attachment */}
      {report.imageUrl && (
        report.imageUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) ? (
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
            <img src={report.imageUrl} alt={report.title} className="max-h-44 w-full object-cover group-hover:scale-[1.02] transition duration-300" />
          </div>
        ) : (
          <a href={report.imageUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2B7FFF]/10 text-[#2B7FFF] hover:bg-[#2B7FFF]/20 transition text-xs font-medium w-fit">
            <FileText size={14} /> View Attached File
          </a>
        )
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <Tag size={11} /> {report.createdBy?.role || "Staff"}
        </span>
        {report.attendanceId && (
          <span className="flex items-center gap-1">
            <CheckSquare size={11} /> Attendance: {formatDateTime(report.attendanceId.timeIn)}
          </span>
        )}
      </div>
    </div>
  );
}
