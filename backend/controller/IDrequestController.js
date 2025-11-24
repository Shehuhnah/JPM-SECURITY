import IDRequest from "../models/IDRequest.model.js";
import mongoose from "mongoose";

export const createRequest = async (req, res) => {
  try {
    const { requestType, requestReason } = req.body;

    if (!requestType || !requestReason) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Guard info from auth middleware (req.user is the guard document)
    const guardId = req.user._id;

    const newRequest = await IDRequest.create({
      guard: guardId,
      requestType,
      requestReason,
    });

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

export const getAllRequests = async (req, res) => {
  try {
    const requests = await IDRequest.find({ guard: { $ne: null } })
      .populate("guard", "fullName position email guardId") // <- make sure you include the fields you need
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

export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const request = await IDRequest.findById(id).populate("guard", "fullName email guardId"); // Added guardId to populate
    if (!request) {
      return res.status(404).json({ message: "ID request not found." });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error("Error fetching ID request:", error);
    res.status(500).json({ message: "Server error fetching ID request." });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const guardId = req.user.id;

    const myRequests = await IDRequest.find({ guard: guardId })
      .populate("guard", "fullName email guardId") // Populating guard data
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: myRequests.length,
      data: myRequests,
    });
  } catch (error) {
    console.error("Error fetching guard’s requests:", error);
    res.status(500).json({ message: "Server error fetching your requests." });
  }
};

export const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks, pickupDate } = req.body;

    if (!["Approved", "Declined", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    // Build the fields dynamically so we only update what's provided
    const updateFields = {
      status,
      adminRemarks: adminRemarks || "",
    };

    // Only include pickupDate if the request is approved and provided
    if (status === "Approved" && pickupDate) {
      updateFields.pickupDate = pickupDate;
    }

    const updatedRequest = await IDRequest.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).populate("guard", "fullName email guardId"); // Updated populate fields

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
