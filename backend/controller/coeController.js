import COERequest from "../models/COERequest.model.js";
import mongoose from "mongoose";
import { generateAndSaveCOE } from "../utils/pdfGenerator.js";
import Guard from "../models/guard.model.js";
import User from "../models/User.model.js";
import fs from "fs";
import path from "path";

const getDisplayName = (person) => {
  if (!person) return "";

  const firstName = person.firstName?.trim() || "";
  const lastName = person.lastName?.trim() || "";
  const combinedName = `${firstName} ${lastName}`.trim();

  return combinedName || person.fullName?.trim() || person.name?.trim() || "";
};

// Create new COE request (guard or subadmin)
export const createRequest = async (req, res) => {
  try {
    const { purpose, targetRole, targetId } = req.body;
    if (!purpose || !purpose.trim()) 
      return res.status(400).json({ message: "Purpose is required" });

    const user = req.user;
    if (!user) 
      return res.status(401).json({ message: "Unauthorized: user not authenticated" });

    // Determine role
    let requesterRole = (user.role || "guard").toLowerCase();
    if (!["guard", "subadmin", "admin"].includes(requesterRole)) {
      return res.status(403).json({ message: "This account cannot request a COE." });
    }

    let guard = requesterRole === "guard" ? user._id : undefined;
    let subadmin = requesterRole === "guard" ? undefined : user._id;

    if (user.role === "Admin" && targetRole && targetId) {
      const normalizedTargetRole = String(targetRole).toLowerCase();

      if (!["guard", "admin", "subadmin"].includes(normalizedTargetRole)) {
        return res.status(400).json({ message: "Invalid target role." });
      }

      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({ message: "Invalid target user." });
      }

      if (normalizedTargetRole === "guard") {
        const targetGuard = await Guard.findById(targetId).select("_id");
        if (!targetGuard) return res.status(404).json({ message: "Target guard not found." });
        requesterRole = "guard";
        guard = targetGuard._id;
        subadmin = undefined;
      } else {
        const roleLabel = normalizedTargetRole === "admin" ? "Admin" : "Subadmin";
        const targetStaff = await User.findOne({ _id: targetId, role: roleLabel }).select("_id");
        if (!targetStaff) return res.status(404).json({ message: "Target staff not found." });
        requesterRole = normalizedTargetRole;
        guard = undefined;
        subadmin = targetStaff._id;
      }
    }

    // Create request with correct reference based on role
    const newReq = await COERequest.create({
      guard,
      subadmin,
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
    const { status, userId, q } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Number.parseInt(req.query.limit, 10) || 10);
    const filter = {};
    if (status && status !== "All") filter.status = status;
    if (userId) filter.$or = [{ guard: userId }, { subadmin: userId }];

    const items = await COERequest.find(filter)
      .populate('guard', 'firstName lastName fullName email guardId phoneNumber position createdAt')
      .populate('subadmin', 'name email position contactNumber createdAt')
      .sort({ requestedAt: -1 });

    // normalize for frontend
    const normalizedItems = items.map(item => {
      const isGuard = item.requesterRole === 'guard';
      const person = isGuard ? item.guard : item.subadmin;
      return {
        id: item._id,
        name: getDisplayName(person) || "N/A",
        guardId: isGuard ? item.guard?.guardId || "N/A" : item.subadmin?._id.toString(),
        phone: isGuard ? item.guard?.phoneNumber || "N/A" : item.subadmin?.contactNumber || "N/A",
        email: person?.email || "N/A",
        position: person?.position || "Undefined",
        createdAt: person?.createdAt,
        purpose: item.purpose,
        status: item.status,
        requesterRole: item.requesterRole,
        requestedAt: item.requestedAt,
        processedAt: item.processedAt,
        processedBy: item.processedBy,
        declineReason: item.declineReason,
        raw: item,
      };
    });

    // optional name search
    let filteredItems = q
      ? normalizedItems.filter(i => i.name.toLowerCase().includes(q.toLowerCase()))
      : normalizedItems;

    // optional date range filter (based on requestedAt)
    const { dateFrom, dateTo } = req.query;
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`) : null;
      const to   = dateTo   ? new Date(`${dateTo}T23:59:59.999Z`)   : null;
      filteredItems = filteredItems.filter(i => {
        if (!i.requestedAt) return false;
        const ts = new Date(i.requestedAt);
        if (from && ts < from) return false;
        if (to   && ts > to)   return false;
        return true;
      });
    }

    const total = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);

    res.json({ items: paginatedItems, total, page, limit, totalPages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get requests for current user (support guard or subadmin accounts)
export const getMyRequests = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};

    // Ensure role comparison is case-insensitive if roles might vary in capitalization
    const userRole = user.role?.toLowerCase(); 

    if (userRole === "guard") {
      filter.guard = user._id;
    } else if (userRole === "admin" || userRole === "subadmin") {
      filter.subadmin = user._id;
    } else {
      // If the user's role is not recognized, return no requests
      return res.json({ items: [] });
    }

    const items = await COERequest.find(filter)
      .populate('guard', 'firstName lastName fullName email guardId createdAt')
      .populate('subadmin', 'name email position contactNumber createdAt')
      .sort({ requestedAt: -1 });

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
    const reqObj = await COERequest.findById(id)
    .populate('guard', 'firstName lastName fullName email guardId phoneNumber position createdAt')
    .populate('subadmin', 'name email position contactNumber createdAt'); // <-- add this

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

    if (!mongoose.Types.ObjectId.isValid(id)) 
      return res.status(400).json({ message: "Invalid id" });

    // Populate both guard and subadmin
    const reqObj = await COERequest.findById(id)
      .populate('guard', 'firstName lastName fullName email guardId phoneNumber position createdAt')
      .populate('subadmin', 'name email position contactNumber createdAt');

    if (!reqObj) return res.status(404).json({ message: "Request not found" });

    const processedBy = req.user?.name || req.user?.fullName || req.user?.email || "Admin";

    if (action === "accept") {
      reqObj.status = "Accepted";
      reqObj.processedAt = new Date();
      reqObj.processedBy = processedBy;

      const approved = approvedCOE || {};

      // Determine the requester (guard or subadmin)
      const person = reqObj.requesterRole === "guard" ? reqObj.guard : reqObj.subadmin;
      
      const empStartDate = approved.employmentStartDate || (person?.createdAt ? new Date(person.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "November 1, 2023");

      reqObj.approvedCOE = {
        documentNumber: approved.documentNumber || `COE-${reqObj._id}-${new Date().getFullYear()}`,
        issuedDate: approved.issuedDate || new Date(),
        issuedBy: approved.issuedBy || processedBy,
        validUntil: approved.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        position: approved.position || person?.position || "Undefined",
        employmentStartDate: empStartDate,
        employmentEndDate: approved.employmentEndDate || "Present",
        salary: approved.salary || "",
        workSchedule: approved.workSchedule || "",
        adminComments: approved.adminComments || "",
        pdfUrl: approved.pdfUrl || null,
        qrCodeUrl: approved.qrCodeUrl || null,
      };

      await reqObj.save();

      // Generate PDF server-side
      try {
        const { fileName, publicPath } = await generateAndSaveCOE(reqObj);
        const host = req.get('host');
        const protocol = req.protocol;
        reqObj.approvedCOE.pdfUrl = `${protocol}://${host}${publicPath}`;
        await reqObj.save();
      } catch (pdfErr) {
        console.error('PDF generation error:', pdfErr);
      }

      return res.json(reqObj);
    }

    if (action === "decline") {
      reqObj.status = "Declined";
      reqObj.declineReason = declineReason || "No reason provided";
      reqObj.processedAt = new Date();
      reqObj.processedBy = processedBy;
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
    const reqObj = await COERequest.findById(id).populate('guard', 'firstName lastName fullName email guardId');
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

// Delete requests (bulk)
export const deleteRequests = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    // Optional: Delete associated PDF files if they exist
    const uploadsDir = path.join(process.cwd(), 'backend', 'uploads', 'coe');
    for (const id of ids) {
      const filePath = path.join(uploadsDir, `COE_${id}.pdf`);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileErr) {
          console.error(`Failed to delete file for request ${id}:`, fileErr);
        }
      }
    }

    const result = await COERequest.deleteMany({ _id: { $in: ids } });

    res.json({ 
      message: `${result.deletedCount} request(s) deleted successfully`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error("deleteRequests error:", err);
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
  deleteRequests,
};
