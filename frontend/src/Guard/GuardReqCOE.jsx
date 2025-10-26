import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle, AlertCircle, Send, Download, Eye, Calendar, User } from "lucide-react";
import { generateAndDownloadCOE } from "../utils/pdfGenerator";
import header from "../assets/headerpdf/header.png";

import { guardAuth } from "../hooks/guardAuth";

export default function GuardReqCOE() {
  const [purpose, setPurpose] = useState("");
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCOEModal, setShowCOEModal] = useState(false);
  const [selectedCOE, setSelectedCOE] = useState(null);

  const { guard, token } = guardAuth();

  // Load existing requests
  useEffect(() => {
    // fetch my requests from API
    const fetchRequests = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/coe/me', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) throw new Error('Failed to load requests');
        const data = await res.json();
        // data.items expected
        const items = data.items || data;
        setRequests(items);
        console.log(items)
      } catch (err) {
        console.error(err);
      }
    };

    fetchRequests();
  }, [token]);

  // Save new requests
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!purpose.trim()) {
      setMessage("⚠️ Please enter the purpose of your request.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      // send to API
      const res = await fetch('/api/coe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ purpose })
      });
      if (!res.ok) throw new Error('Failed to submit request');
      const created = await res.json();
      // refresh list
      const res2 = await fetch('/api/coe/me', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      const data = await res2.json();
      setRequests(data.items || data);
      setPurpose('');
      setMessage('✅ Your COE request has been sent successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage("❌ Error submitting request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle COE viewing
  const handleViewCOE = (coe) => {
    setSelectedCOE(coe);
    setShowCOEModal(true);
  };

  // Download using the frontend PDF generator to match client format
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
        issuedDate: coe.issuedDate || new Date().toLocaleDateString("en-US", {
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

  // Handle COE download
  const handleDownloadCOE = async (item) => {
    try {
      setMessage('');

      // item may be the full request (with _id and approvedCOE) or the approvedCOE object
      const isRequest = !!item && !!item._id;
      const requestId = isRequest ? item._id : (item.requestId || item.request_id || null);
      const pdfUrlFromApproved = isRequest ? item.approvedCOE?.pdfUrl : item?.pdfUrl;

      // If we already have a pdfUrl from the approvedCOE, open it directly
      if (pdfUrlFromApproved) {
        window.open(pdfUrlFromApproved, '_blank');
        return;
      }

      // Need a request id to ask server for the PDF
      const id = requestId;
      if (!id) {
        setMessage('❌ COE download not available (missing id)');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      const res = await fetch(`http://localhost:5000/api/coe/${id}/download`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.approvedCOE && json.approvedCOE.pdfUrl) {
          window.open(json.approvedCOE.pdfUrl, '_blank');
          return;
        }
        throw new Error('COE download failed');
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = isRequest ? `COE_${id}.pdf` : (item.documentNumber || `COE_${id}.pdf`);
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setMessage('📄 COE downloaded');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // fallback: if server returned JSON with pdfUrl
      const json = await res.json().catch(() => ({}));
      if (json.approvedCOE && json.approvedCOE.pdfUrl) {
        window.open(json.approvedCOE.pdfUrl, '_blank');
        return;
      }

      setMessage('❌ COE download not available');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('❌ COE download failed');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Close COE modal
  const closeCOEModal = () => {
    setShowCOEModal(false);
    setSelectedCOE(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-center mb-8">
        <FileText className="text-blue-400 w-7 h-7 mr-3" />
        <h1 className="text-2xl font-bold tracking-wide text-white">
          Certificate of Employment Request
        </h1>
      </div>

      {/* Request Form */}
      <div className="bg-[#1e293b] border border-gray-700 rounded-2xl shadow-xl p-6 space-y-4 mb-10">
        <h2 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
          <Send size={18} /> Submit New Request
        </h2>

        {message && (
          <div
            className={`p-3 text-sm text-center rounded-md ${
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
            <label className="block text-gray-300 font-medium mb-2">
              Purpose of Request
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Example: For loan application, visa processing, etc."
              rows="4"
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg p-3 text-gray-100 focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition flex items-center gap-2"
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
        <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
          <FileText size={20} /> Your Previous Requests
        </h2>

        {requests.length === 0 ? (
          <div className="bg-[#1e293b] border border-gray-700 rounded-2xl p-8 text-center">
            <FileText className="text-gray-500 w-12 h-12 mx-auto mb-3" />
            <p className="text-gray-400 italic">No COE requests submitted yet.</p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request._id}
              className="bg-[#1e293b] border border-gray-700 rounded-2xl p-5 shadow-lg hover:shadow-blue-500/10 transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock size={14} className="text-blue-400" />
                  <span>request id: {request._id}</span>
                  <span>{request.requestedAt}</span>
                </div>

                <div className="flex items-center gap-2">
                  {request.status === "Pending" ? (
                    <AlertCircle className="text-yellow-400 w-4 h-4" />
                  ) : (
                    <CheckCircle className="text-green-400 w-4 h-4" />
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === "Pending"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
                        : "bg-green-500/20 text-green-400 border border-green-500"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-400">
                  Purpose
                </h3>
                <p className="text-gray-100 leading-relaxed">
                  {request.purpose}
                </p>
              </div>

              {/* Approved COE Section */}
              {request.status === "Accepted" && request.approvedCOE && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-green-400 font-semibold flex items-center gap-2">
                        <CheckCircle size={16} />
                        Approved COE Available
                      </h4>

                      <div className="flex gap-2">
                        {/* View Button */}
                        <button
                          onClick={() => handleViewCOE(request.approvedCOE)}
                          className="p-2 bg-blue-600/20 text-blue-400 rounded-md hover:bg-blue-600/30 transition"
                          title="View COE"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => {
                            const coe = request.approvedCOE;
                              handleClientGenerateAndDownload({
                                guardName: request.guardName,
                                guardId: request.guardId,
                                purpose: request.purpose,
                                _id: request._id,
                                position: coe.position,
                                employmentStartDate: coe.employmentStartDate,
                                employmentEndDate: coe.employmentEndDate,
                                salary: coe.salary,
                                companyName: coe.companyName,
                                companyAddress: coe.companyAddress,
                                issuedDate: coe.issuedDate,
                                issuedBy: coe.issuedBy,
                                signatoryTitle: coe.signatoryTitle,
                              });
                          }}
                          className="p-2 bg-green-600/20 text-green-400 rounded-md hover:bg-green-600/30 transition"
                          title="Download COE"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <FileText size={14} />
                        <span>Document: {request.approvedCOE.documentNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar size={14} />
                        <span>
                          Issued:{" "}
                          {new Date(request.approvedCOE.issuedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <User size={14} />
                        <span>Issued by: {request.approvedCOE.issuedBy}</span>
                      </div>
                      <div className="text-gray-400 text-xs mt-2">
                        Valid until:{" "}
                        {new Date(request.approvedCOE.validUntil).toLocaleDateString()}
                      </div>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
          <div className="bg-[#1e293b] text-white rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2">
                  <FileText size={20} />
                  Certificate of Employment
                </h2>
                <button
                  onClick={closeCOEModal}
                  className="text-gray-400 hover:text-white transition"
                >
                  <AlertCircle size={20} />
                </button>
              </div>

              {/* COE Document */}
              <div className="bg-white text-black rounded-lg p-8 space-y-6">
                {/* Company Header */}
                <div className="text-center border-b-2 border-gray-300 pb-4">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedCOE.companyName}
                  </h1>
                  <p className="text-gray-600">{selectedCOE.companyAddress}</p>
                  <p className="text-gray-600">Tel: {selectedCOE.companyPhone} | Email: {selectedCOE.companyEmail}</p>
                </div>

                {/* Document Title */}
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">CERTIFICATE OF EMPLOYMENT</h2>
                  <p className="text-lg text-gray-600">Document No: {selectedCOE.documentNumber}</p>
                </div>

                {/* Main Content */}
                <div className="space-y-4 text-gray-700">
                  <p className="text-lg leading-relaxed">
                    This is to certify that <strong>{selectedCOE.guardName}</strong> (ID: {selectedCOE.guardId}) 
                    has been employed with <strong>{selectedCOE.companyName}</strong> as a <strong>{selectedCOE.position}</strong> 
                    from <strong>{selectedCOE.employmentStartDate}</strong> to <strong>{selectedCOE.employmentEndDate}</strong>.
                  </p>

                  <p className="text-lg leading-relaxed">
                    During his/her employment, he/she has been receiving a monthly salary of <strong>{selectedCOE.salary}</strong> 
                    and works <strong>{selectedCOE.workSchedule}</strong>.
                  </p>

                  <p className="text-lg leading-relaxed">
                    {selectedCOE.adminComments}
                  </p>

                  <p className="text-lg leading-relaxed">
                    This certificate is issued upon the request of the employee for <strong>{selectedCOE.purpose}</strong> 
                    and is valid until <strong>{selectedCOE.validUntil}</strong>.
                  </p>
                </div>

                {/* Signature Section */}
                <div className="flex justify-between items-end mt-8">
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-2 w-48">
                      <p className="font-semibold">{selectedCOE.digitalSignature}</p>
                      <p className="text-sm text-gray-600">Authorized Signatory</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Date: {selectedCOE.issuedDate}</p>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center mt-6">
                  <img 
                    src={selectedCOE.qrCode} 
                    alt="QR Code" 
                    className="mx-auto border border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2">Scan to verify authenticity</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => handleClientGenerateAndDownload(selectedCOE)}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
                >
                  <Download size={16} />
                  Generate COE PDF
                </button>
                <button
                  onClick={closeCOEModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
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
