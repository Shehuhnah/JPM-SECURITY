import AdminReport from "../models/AdminReport.model.js";

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

    const report = await AdminReport.create({
      createdBy: req.user._id,
      title: title.trim(),
      category: category.trim(),
      details: details.trim(),
      reportDate: reportDate ? new Date(reportDate) : new Date(),
      attendanceId: attendanceId || null,
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
