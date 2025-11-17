import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Download,
  Eye,
  Calendar,
  User,
  X,
} from "lucide-react";
import { generateAndDownloadCOE } from "../utils/pdfGenerator";
import header from "../assets/headerpdf/header.png";
import { useAuth } from "../hooks/useAuth";

export default function GuardReqCOE() {
  const [purpose, setPurpose] = useState("");
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingPage, setLoadingPage] = useState(false);
  const [showCOEModal, setShowCOEModal] = useState(false);
  const [selectedCOE, setSelectedCOE] = useState(null);

  const { user, loading  } = useAuth(); // can be guard account or subadmin account
  console.log("Authenticated user:", user);

  useEffect(() => {
    document.title = "Request COE | JPM Agency Security";

    if (!user || loading) {
      // wait until user is loaded
    } else {
      return;
    }

    const fetchRequests = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/coe/me", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to load requests");
        const data = await res.json();
        setRequests(data.items || data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRequests();
  }, [user, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setMessage("⚠️ Please enter the purpose of your request.");
      return;
    }
    try {
      setLoadingPage(true);
      setMessage("");
      const res = await fetch("http://localhost:5000/api/coe", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ purpose, role: user?.role || "guard" }),
      });

      if (!res.ok) throw new Error("Failed to submit request");
      const res2 = await fetch("http://localhost:5000/api/coe/me", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res2.json();
      setRequests(data.items || data);
      setPurpose("");
      setMessage("✅ Your COE request has been sent successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("❌ Error submitting request. Please try again.");
    } finally {
      setLoadingPage(false);
    }
  };

  const handleClientGenerateAndDownload = (coe) => {
    try {
      const payload = {
        name: coe.guardName || "Employee Name",
        guardId: coe.guardId || "",
        purpose: coe.purpose || "For employment verification",
        id: coe._id || "0000",
      };

      const options = {
        headerImage: header,
        position: coe.position || "Security Officer",
        employmentStart: coe.employmentStartDate || "November 2023",
        employmentEnd: coe.employmentEndDate || "Present",
        salary: coe.salary || "Twenty-Four Thousand Pesos (P24,000)",
        companyName: coe.companyName || "JPM SECURITY AGENCY CORP",
        companyAddress: coe.companyAddress || "Indang, Cavite, Philippines",
        issuedDate:
          coe.issuedDate ||
          new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        location: "Indang, Cavite",
        signatory: coe.issuedBy || "KYLE CHRISTOPHER E. PASTRANA",
        signatoryTitle: coe.signatoryTitle || "HR and Head Administrator",
        companyShort: "JPMSA Corp.",
      };

      generateAndDownloadCOE(payload, options);
      setMessage("📄 COE generated and downloaded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to generate COE PDF.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleViewCOE = (coe) => {
    setSelectedCOE(coe);
    setShowCOEModal(true);
  };

  const closeCOEModal = () => {
    setShowCOEModal(false);
    setSelectedCOE(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left mb-8 gap-2">
        <FileText className="text-blue-400 w-8 h-8" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white">
          Certificate of Employment Request
        </h1>
      </div>

      {/* Request Form */}
      <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-6 space-y-4 mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-blue-400 flex items-center gap-2">
          <Send size={18} /> Submit New Request
        </h2>

        {message && (
          <div
            className={`p-3 text-sm text-center rounded-md break-words ${
              message.includes("✅")
                ? "bg-green-500/20 text-green-400 border border-green-500"
                : message.includes("⚠️")
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
                : "bg-red-500/20 text-red-400 border border-red-500"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 font-medium mb-2 text-sm sm:text-base">
              Purpose of Request
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Example: For loan application, visa processing, etc."
              rows="4"
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-gray-100 focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Previous Requests */}
      <div className="space-y-5">
        <h2 className="text-lg sm:text-xl font-semibold text-blue-400 flex items-center gap-2">
          <FileText size={20} /> Your Previous Requests
        </h2>

        {requests.length === 0 ? (
          <div className="bg-[#1e293b] border border-gray-700 rounded-2xl p-6 sm:p-8 text-center">
            <FileText className="text-gray-500 w-10 h-10 mx-auto mb-3" />
            <p className="text-gray-400 italic text-sm sm:text-base">
              No COE requests submitted yet.
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request._id}
              className="bg-[#1e293b] border border-gray-700 rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-blue-500/10 transition text-sm sm:text-base"
            >
              {/* Top section */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2 text-gray-400 text-xs sm:text-sm">
                  <Clock size={14} className="text-blue-400" />
                  <span>ID: {request._id}</span>
                  <span>{request.requestedAt}</span>
                </div>

                <div className="flex items-center gap-2">
                  {request.status === "Pending" ? (
                    <AlertCircle className="text-yellow-400 w-4 h-4" />
                  ) : request.status === "Declined" ? (
                    <AlertCircle className="text-red-400 w-4 h-4" />
                  ) : (
                    <CheckCircle className="text-green-400 w-4 h-4" />
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === "Pending"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
                        : request.status === "Declined"
                        ? "bg-red-500/20 text-red-400 border border-red-500"
                        : "bg-green-500/20 text-green-400 border border-green-500"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
              <h3 className="text-blue-400 font-semibold">Purpose</h3>
              <p className="text-gray-100 leading-relaxed break-words">
              {request.purpose}
              </p>
              </div>
              
              {request.status === "Declined" && request.declineReason && (
              <div className="mt-3 p-3 rounded-md bg-red-500/10 border border-red-500/40">
              <p className="text-red-300 text-sm">
              Decline reason: {request.declineReason}
              </p>
              </div>
              )}

              {/* Approved COE Section */}
              {request.status === "Accepted" && request.approvedCOE && (
                <div className="mt-4 pt-4 border-t border-gray-600 space-y-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <h4 className="text-green-400 font-semibold flex items-center gap-2">
                        <CheckCircle size={16} />
                        Approved COE Available
                      </h4>

                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => handleViewCOE(request.approvedCOE)}
                          className="p-2 bg-blue-600/20 text-blue-400 rounded-md hover:bg-blue-600/30 transition"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() =>
                            handleClientGenerateAndDownload({
                              guardName: request.guardName,
                              guardId: request.guardId,
                              purpose: request.purpose,
                              _id: request._id,
                              ...request.approvedCOE,
                            })
                          }
                          className="p-2 bg-green-600/20 text-green-400 rounded-md hover:bg-green-600/30 transition"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-gray-300 text-xs sm:text-sm">
                      <p>
                        <FileText className="inline w-4 h-4 mr-1" />
                        Document: {request.approvedCOE.documentNumber}
                      </p>
                      <p>
                        <Calendar className="inline w-4 h-4 mr-1" />
                        Issued:{" "}
                        {new Date(
                          request.approvedCOE.issuedDate
                        ).toLocaleDateString()}
                      </p>
                      <p>
                        <User className="inline w-4 h-4 mr-1" />
                        Issued by: {request.approvedCOE.issuedBy}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* COE Modal */}
      {showCOEModal && selectedCOE && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4 overflow-y-auto">
          <div className="bg-[#1e293b] text-white rounded-xl border border-gray-700 w-full max-w-3xl shadow-2xl">
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-green-400 flex items-center gap-2">
                  <FileText size={20} />
                  Certificate of Employment
                </h2>
                <button
                  onClick={closeCOEModal}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* COE Content */}
              <div className="bg-white text-black rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6 text-sm sm:text-base">
                <div className="text-center border-b pb-3 sm:pb-4 border-gray-300">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                    {selectedCOE.companyName}
                  </h1>
                  <p className="text-gray-600">{selectedCOE.companyAddress}</p>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    CERTIFICATE OF EMPLOYMENT
                  </h2>
                  <p className="text-gray-600">
                    Document No: {selectedCOE.documentNumber}
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4 text-gray-700">
                  <p>
                    This is to certify that{" "}
                    <strong>{selectedCOE.guardName}</strong> (ID:{" "}
                    {selectedCOE.guardId}) has been employed with{" "}
                    <strong>{selectedCOE.companyName}</strong> as a{" "}
                    <strong>{selectedCOE.position}</strong> from{" "}
                    <strong>{selectedCOE.employmentStartDate}</strong> to{" "}
                    <strong>{selectedCOE.employmentEndDate}</strong>.
                  </p>
                  <p>
                    Salary: <strong>{selectedCOE.salary}</strong>
                  </p>
                  <p>
                    Purpose: <strong>{selectedCOE.purpose}</strong>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 gap-3 sm:gap-0">
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-2 w-40 mx-auto">
                      <p className="font-semibold">
                        {selectedCOE.digitalSignature}
                      </p>
                      <p className="text-xs text-gray-600">
                        Authorized Signatory
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Date: {selectedCOE.issuedDate}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button
                  onClick={() => handleClientGenerateAndDownload(selectedCOE)}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Generate PDF
                </button>
                <button
                  onClick={closeCOEModal}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
