import COERequest from "../models/COERequest.model.js";
import mongoose from "mongoose";
import { generateAndSaveCOE } from "../utils/pdfGenerator.js";

// Create new COE request (guard or subadmin)
export const createRequest = async (req, res) => {
  try {
    const { purpose } = req.body;
    if (!purpose || !purpose.trim()) 
      return res.status(400).json({ message: "Purpose is required" });

    const user = req.user;
    if (!user) 
      return res.status(401).json({ message: "Unauthorized: user not authenticated" });

    // Determine role
    const requesterRole = (user.role || "guard").toLowerCase(); // 'guard' or 'subadmin'

    // Create request with correct reference based on role
    const newReq = await COERequest.create({
      guard: requesterRole === "guard" ? user._id : undefined,
      subadmin: requesterRole === "subadmin" ? user._id : undefined,
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
    const { status, userId, q, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== "All") filter.status = status;
    if (userId) filter.$or = [{ guard: userId }, { subadmin: userId }];

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      COERequest.find(filter)
        .populate('guard', 'fullName email guardId phoneNumber position')
        .populate('subadmin', 'name email position contactNumber') // populate subadmin if needed
        .sort({ requestedAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit)),
      COERequest.countDocuments(filter),
    ]);

    // normalize for frontend
    const normalizedItems = items.map(item => {
      let isGuard = item.requesterRole === 'guard';
      const person = isGuard ? item.guard : item.subadmin;
      return {
        id: item._id,
        name: person?.fullName || person?.name || "N/A",
        guardId: isGuard ? item.guard?.guardId || "N/A" : item.subadmin?._id.toString(),
        phone: isGuard ? item.guard?.phoneNumber || "N/A" : item.subadmin?.contactNumber || "N/A",
        email: person?.email || "N/A",
        position: person?.position || "Undefined",
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

    // optional search
    const filteredItems = q
      ? normalizedItems.filter(i => i.name.toLowerCase().includes(q.toLowerCase()))
      : normalizedItems;

    res.json({ items: filteredItems, total, page: Number(page), limit: Number(limit) });
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

    if (user.role === "guard") {
      filter.guard = user._id;
    } else if (user.role === "subadmin") {
      filter.subadmin = user._id;
    }

    const items = await COERequest.find(filter)
      .populate('guard', 'fullName email guardId')
      .populate('subadmin', 'name email position contactNumber')
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
    .populate('guard', 'fullName email guardId phoneNumber position')
    .populate('subadmin', 'name email position contactNumber'); // <-- add this

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
      .populate('guard', 'fullName email guardId phoneNumber position')
      .populate('subadmin', 'name email position contactNumber');

    if (!reqObj) return res.status(404).json({ message: "Request not found" });

    const processedBy = req.user?.name || req.user?.fullName || req.user?.email || "Admin";

    if (action === "accept") {
      reqObj.status = "Accepted";
      reqObj.processedAt = new Date();
      reqObj.processedBy = processedBy;

      const approved = approvedCOE || {};

      // Determine the requester (guard or subadmin)
      const person = reqObj.requesterRole === "guard" ? reqObj.guard : reqObj.subadmin;

      reqObj.approvedCOE = {
        documentNumber: approved.documentNumber || `COE-${reqObj._id}-${new Date().getFullYear()}`,
        issuedDate: approved.issuedDate || new Date(),
        issuedBy: approved.issuedBy || processedBy,
        validUntil: approved.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        position: approved.position || person?.position || "Undefined",
        employmentStartDate: approved.employmentStartDate || "",
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
    const reqObj = await COERequest.findById(id).populate('guard', 'fullName email guardId');
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
