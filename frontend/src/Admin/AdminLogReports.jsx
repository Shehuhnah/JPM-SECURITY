import { useEffect, useMemo, useState } from "react";
import { ClipboardList, FileText, RefreshCcw, Send } from "lucide-react";
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
};

const formatDateTime = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

  useEffect(() => {
    if (!user && !loading) {
      navigate("/admin/login");
      return;
    }
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

  useEffect(() => {
    if (user) fetchPageData();
  }, [user]);

  const myReportsCount = useMemo(
    () => reports.filter((report) => report.createdBy?._id === user?._id).length,
    [reports, user]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const res = await fetch(`${api}/api/admin-reports`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create report.");

      toast.success("Report created.");
      setForm(initialForm);
      setReports((prev) => [data, ...prev]);
    } catch (error) {
      toast.error(error.message || "Failed to create report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 md:p-8">
      <ToastContainer theme="dark" />

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ClipboardList className="text-[#2B7FFF]" size={30} />
            My Log Reports
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Create daily or incident reports for admin and HR operations.
          </p>
        </div>

        <button
          onClick={fetchPageData}
          className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition flex items-center gap-2"
        >
          <RefreshCcw size={18} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <ReportStat title="Total Reports" value={reports.length} />
        <ReportStat title="My Reports" value={myReportsCount} />
        <ReportStat title="Attendance Entries" value={attendanceRecords.length} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-5">Create Report</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Daily attendance summary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option>Daily Summary</option>
                  <option>Attendance Concern</option>
                  <option>Incident Report</option>
                  <option>HR Follow-up</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Report Date</label>
                <input
                  type="date"
                  name="reportDate"
                  value={form.reportDate}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Linked Attendance</label>
              <select
                name="attendanceId"
                value={form.attendanceId}
                onChange={handleChange}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">No linked attendance</option>
                {attendanceRecords.map((record) => (
                  <option key={record._id} value={record._id}>
                    {record.dateKey} | {record.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Details</label>
              <textarea
                name="details"
                value={form.details}
                onChange={handleChange}
                required
                rows={7}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                placeholder="Summarize attendance updates, issues handled, and follow-up actions."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#2B7FFF] hover:bg-[#2460b9] text-slate-950 font-semibold py-3 flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {submitting ? <RefreshCcw className="animate-spin" size={18} /> : <Send size={18} />}
              Submit Report
            </button>
          </form>
        </section>

        <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-white">Submitted Reports</h2>
            {pageLoading && (
              <div className="text-sm text-slate-400 flex items-center gap-2">
                <RefreshCcw className="animate-spin" size={14} />
                Loading
              </div>
            )}
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {reports.length === 0 ? (
              <div className="text-sm text-slate-500 py-8">No reports created yet.</div>
            ) : (
              reports.map((report) => (
                <div key={report._id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="text-white font-semibold">{report.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{report.category}</div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>{new Date(report.reportDate).toLocaleDateString()}</div>
                      <div>{report.createdBy?.name || "Unknown"}</div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{report.details}</p>

                  <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {report.createdBy?.role || "Staff"}
                    </span>
                    <span>
                      Attendance: {report.attendanceId ? formatDateTime(report.attendanceId.timeIn) : "Not linked"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReportStat({ title, value }) {
  return (
    <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="text-sm text-slate-400 mb-2">{title}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
