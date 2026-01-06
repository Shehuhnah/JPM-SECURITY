import IDRequest from "../models/IDRequest.model.js";
import mongoose from "mongoose";

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
    const requests = await IDRequest.find()
      .populate("guard", "fullName position email guardId") // Guard fields
      .populate("admin", "name email position role")        // Admin fields (Note: 'name' not 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
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
    .populate("guard", "fullName email guardId")
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
      .populate("guard", "fullName email guardId")
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
    .populate("guard", "fullName email guardId")
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