import COERequest from "../models/COERequest.model.js";
import mongoose from "mongoose";
import { generateAndSaveCOE } from "../utils/pdfGenerator.js";

// Create new COE request (guard or subadmin)
export const createRequest = async (req, res) => {
  try {
    const { purpose, role } = req.body;
    if (!purpose || !purpose.trim()) return res.status(400).json({ message: "Purpose is required" });

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: user not authenticated" });
    }

    const requesterRole = ((role ?? user?.role) || "guard").toString().toLowerCase();

    const newReq = await COERequest.create({
      guardId: user.guardId || user.id || user._id?.toString?.() || "",
      guardName: user.fullName || user.name || user.email || "",
      purpose,
      requesterRole,
    });

    res.status(201).json(newReq);
  } catch (err) {
    console.error('createRequest error:', err);
    res.status(500).json({ message: err?.message || "Server error" });
  }
};

// List requests (admin) or filter
export const listRequests = async (req, res) => {
  try {
    const { status, guardId, q, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== "All") filter.status = status;
    if (guardId) filter.guardId = guardId;
    if (q) filter.$or = [
      { purpose: new RegExp(q, "i") },
      { guardName: new RegExp(q, "i") },
    ];

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      COERequest.find(filter).sort({ requestedAt: -1 }).skip(Number(skip)).limit(Number(limit)),
      COERequest.countDocuments(filter),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get requests for current user (support guard or subadmin accounts)
export const getMyRequests = async (req, res) => {
  try {
    const user = req.user;
    const guardId = user.guardId || user.id || user._id;
    const items = await COERequest.find({ guardId }).sort({ requestedAt: -1 });
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single request
export const getRequest = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });
    const reqObj = await COERequest.findById(id);
    if (!reqObj) return res.status(404).json({ message: "Not found" });
    res.json(reqObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update status: accept or decline
export const updateStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { action, declineReason, approvedCOE } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const reqObj = await COERequest.findById(id);
    if (!reqObj) return res.status(404).json({ message: "Request not found" });

    if (action === "accept") {
      reqObj.status = "Accepted";
      reqObj.processedAt = new Date();
      reqObj.processedBy = req.user?.name || req.user?.fullName || req.user?.email;

      // attach approvedCOE details or set defaults
      const approved = approvedCOE || {};
      reqObj.approvedCOE = {
        documentNumber: approved.documentNumber || `COE-${reqObj._id}-${new Date().getFullYear()}`,
        issuedDate: approved.issuedDate || new Date(),
        issuedBy: approved.issuedBy || (req.user?.name || "Admin"),
        validUntil: approved.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        position: approved.position || "Security Guard",
        employmentStartDate: approved.employmentStartDate || "",
        employmentEndDate: approved.employmentEndDate || "Present",
        salary: approved.salary || "",
        workSchedule: approved.workSchedule || "",
        adminComments: approved.adminComments || "",
        pdfUrl: approved.pdfUrl || null,
        qrCodeUrl: approved.qrCodeUrl || null,
      };

      // Save first to ensure _id exists
      await reqObj.save();

      // Attempt to generate PDF server-side and update pdfUrl
      try {
        const { fileName, publicPath } = await generateAndSaveCOE(reqObj);
        // Build absolute URL
        const host = req.get('host');
        const protocol = req.protocol;
        reqObj.approvedCOE.pdfUrl = `${protocol}://${host}${publicPath}`;
        await reqObj.save();
      } catch (pdfErr) {
        console.error('PDF generation error:', pdfErr);
        // continue without failing the request
      }

      return res.json(reqObj);
    }

    if (action === "decline") {
      reqObj.status = "Declined";
      reqObj.declineReason = declineReason || "No reason provided";
      reqObj.processedAt = new Date();
      reqObj.processedBy = req.user?.name || req.user?.email || "Admin";
      await reqObj.save();
      return res.json(reqObj);
    }

    res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Download or redirect to PDF (if available)
export const downloadCOE = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });
    const reqObj = await COERequest.findById(id);
    if (!reqObj) return res.status(404).json({ message: "Not found" });

    if (reqObj.status !== "Accepted" || !reqObj.approvedCOE) return res.status(404).json({ message: "COE not available" });

    if (reqObj.approvedCOE.pdfUrl) {
      // If pdfUrl is stored (local path or remote), redirect or stream
      return res.redirect(reqObj.approvedCOE.pdfUrl);
    }

    // For now, no server-side PDF generation implemented. Respond with object instead.
    res.json({ message: "PDF not generated server-side yet", approvedCOE: reqObj.approvedCOE });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  createRequest,
  listRequests,
  getMyRequests,
  getRequest,
  updateStatus,
  downloadCOE,
};
