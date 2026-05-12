import IDRequest from "../models/IDRequest.model.js";
import mongoose from "mongoose";

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getDisplayName = (person) => {
  if (!person) return "";

  const firstName = person.firstName?.trim() || "";
  const lastName = person.lastName?.trim() || "";
  const combinedName = `${firstName} ${lastName}`.trim();

  return combinedName || person.fullName?.trim() || person.name?.trim() || "";
};

// --- CREATE REQUEST ---
export const createRequest = async (req, res) => {
  try {
    const { requestType, requestReason } = req.body;

    if (!requestType || !requestReason) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Identify user type based on the decoded token
    const userId = req.user._id;
    const userRole = req.user.role; // "Guard", "Admin", or "Subadmin"

    const requestData = {
      requestType,
      requestReason,
    };

    // Logic: If role is Guard, save to 'guard', otherwise save to 'admin'
    if (userRole === "Guard") {
      requestData.guard = userId;
    } else {
      requestData.admin = userId; // <--- Uses the new field for Admin/Subadmin
    }

    const newRequest = await IDRequest.create(requestData);

    res.status(201).json({
      success: true,
      message: "ID request submitted successfully.",
      data: newRequest,
    });
  } catch (error) {
    console.error("Error creating ID request:", error);
    res.status(500).json({ message: "Server error creating ID request." });
  }
};

// --- GET ALL REQUESTS (For Admin Dashboard) ---
export const getAllRequests = async (req, res) => {
  try {
    const shouldPaginate =
      req.query.page !== undefined ||
      req.query.limit !== undefined ||
      req.query.status !== undefined ||
      req.query.q !== undefined;

    if (!shouldPaginate) {
      const requests = await IDRequest.find()
        .populate("guard", "firstName lastName fullName position email guardId")
        .populate("admin", "name email position role")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: requests.length,
        data: requests,
      });
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const status = req.query.status;
    const q = req.query.q?.trim().toLowerCase();

    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    const requests = await IDRequest.find(filter)
      .populate("guard", "firstName lastName fullName position email guardId")
      .populate("admin", "name email position role")        // Admin fields (Note: 'name' not 'fullName')
      .sort({ createdAt: -1 });

    const filteredRequests = q
      ? requests.filter((request) => {
          const guardName = getDisplayName(request.guard).toLowerCase();
          const adminName = request.admin?.name?.toLowerCase() || "";
          const requestType = request.requestType?.toLowerCase() || "";
          return guardName.includes(q) || adminName.includes(q) || requestType.includes(q);
        })
      : requests;

    const total = filteredRequests.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const items = filteredRequests.slice(startIndex, startIndex + limit);

    res.status(200).json({
      success: true,
      count: total,
      data: items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching ID requests:", error);
    res.status(500).json({ message: "Server error fetching ID requests." });
  }
};

// --- GET MY REQUESTS (For logged-in user) ---
export const getMyRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find requests where either 'guard' matches OR 'admin' matches the user ID
    const myRequests = await IDRequest.find({
      $or: [
        { guard: userId },
        { admin: userId }
      ]
    })
    .populate("guard", "firstName lastName fullName email guardId")
    .populate("admin", "name email role")
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: myRequests.length,
      data: myRequests,
    });
  } catch (error) {
    console.error("Error fetching your requests:", error);
    res.status(500).json({ message: "Server error fetching your requests." });
  }
};

// --- GET SINGLE REQUEST BY ID ---
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const request = await IDRequest.findById(id)
      .populate("guard", "firstName lastName fullName email guardId")
      .populate("admin", "name email position");

    if (!request) {
      return res.status(404).json({ message: "ID request not found." });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Error fetching ID request:", error);
    res.status(500).json({ message: "Server error fetching ID request." });
  }
};

// --- UPDATE REQUEST (Approve/Decline) ---
export const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks, pickupDate } = req.body;

    if (!["Approved", "Declined", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const updateFields = {
      status,
      adminRemarks: adminRemarks || "",
    };

    if (status === "Approved" && pickupDate) {
      updateFields.pickupDate = pickupDate;
    }

    const updatedRequest = await IDRequest.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    )
    .populate("guard", "firstName lastName fullName email guardId")
    .populate("admin", "name email position");

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found." });
    }

    res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully.`,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating ID request:", error);
    res.status(500).json({ message: "Server error updating ID request." });
  }
};

// --- DELETE REQUEST ---
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const deletedRequest = await IDRequest.findByIdAndDelete(id);

    if (!deletedRequest) {
      return res.status(404).json({ message: "Request not found." });
    }

    res.status(200).json({ success: true, message: "Request deleted successfully." });
  } catch (error) {
    console.error("Error deleting ID request:", error);
    res.status(500).json({ message: "Server error deleting ID request." });
  }
};
