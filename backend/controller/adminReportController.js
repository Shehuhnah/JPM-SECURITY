import AdminReport from "../models/AdminReport.model.js";
import User from "../models/User.model.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";

const STAFF_ROLES = ["Admin", "Subadmin"];

const isStaff = (user) => STAFF_ROLES.includes(user?.role);

export const getAdminReports = async (req, res) => {
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only admin and HR can access reports." });
    }

    const query = {};
    if (req.query.mine === "true") {
      query.createdBy = req.user._id;
    }

    const reports = await AdminReport.find(query)
      .populate("createdBy", "name role position")
      .populate("attendanceId", "dateKey timeIn timeOut status")
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    res.status(500).json({ message: "Failed to fetch reports." });
  }
};

export const createAdminReport = async (req, res) => {
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only admin and HR can create reports." });
    }

    const { title, category, details, reportDate, attendanceId } = req.body;

    if (!title?.trim() || !category?.trim() || !details?.trim()) {
      return res.status(400).json({ message: "Title, category, and details are required." });
    }

    let imageData = {};
    if (req.file) {
      const uploadedImage = await uploadImageToCloudinary(req.file, {
        folder: "jpm-security/admin-reports",
      });
      imageData = {
        imageUrl: uploadedImage.secure_url,
        imagePublicId: uploadedImage.public_id,
      };
    }

    const report = await AdminReport.create({
      createdBy: req.user._id,
      title: title.trim(),
      category: category.trim(),
      details: details.trim(),
      reportDate: reportDate ? new Date(reportDate) : new Date(),
      attendanceId: attendanceId || null,
      ...imageData,
    });

    const populatedReport = await AdminReport.findById(report._id)
      .populate("createdBy", "name role position")
      .populate("attendanceId", "dateKey timeIn timeOut status");

    res.status(201).json(populatedReport);
  } catch (error) {
    console.error("Error creating admin report:", error);
    res.status(500).json({ message: "Failed to create report." });
  }
};

export const getStaffReportsByUserId = async (req, res) => {
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only admin and HR can access reports." });
    }

    const { id } = req.params;

    const [staff, reports] = await Promise.all([
      User.findById(id).select("-password").lean(),
      AdminReport.find({ createdBy: id })
        .populate("createdBy", "name role position")
        .populate("attendanceId", "dateKey timeIn timeOut status")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found." });
    }

    res.status(200).json({ staff, reports });
  } catch (error) {
    console.error("Error fetching staff reports:", error);
    res.status(500).json({ message: "Failed to fetch staff reports." });
  }
};
