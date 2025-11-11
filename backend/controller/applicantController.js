import Applicant from "../models/applicant.model.js";

// 🟢 Get all applicants (latest first)
export const getApplicants = async (req, res) => {
  try {
    const applicants = await Applicant.find().sort({ createdAt: -1 });
    res.status(200).json(applicants);
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({ message: "Failed to fetch applicants." });
  }
};

// 🟢 Create a new applicant
export const createApplicant = async (req, res) => {
  try {
    const { name, email, phone, position } = req.body;

    if (!name?.trim() || !position?.trim() || !phone?.trim()) {
      return res.status(400).json({ message: "Name, position, and phone are required." });
    }

    const newApplicant = new Applicant({
      name: name.trim(),
      email: email?.trim() || "",
      phone: phone.trim(),
      position: position.trim(),
    });

    const savedApplicant = await newApplicant.save();
    res.status(201).json(savedApplicant);
  } catch (error) {
    console.error("Error creating applicant:", error);
    res.status(500).json({ message: "Failed to create applicant." });
  }
};

// 🟡 Update applicant
export const updateApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedApplicant = await Applicant.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedApplicant) {
      return res.status(404).json({ message: "Applicant not found." });
    }

    res.status(200).json(updatedApplicant);
  } catch (error) {
    console.error("Error updating applicant:", error);
    res.status(500).json({ message: "Failed to update applicant." });
  }
};

// 🔴 Delete applicant
export const deleteApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const applicant = await Applicant.findById(id);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found." });
    }
    // Decline behavior: just mark status and keep data intact
    applicant.status = "Declined";
    await applicant.save();
    res.status(200).json({ message: "Applicant declined successfully." });
  } catch (error) {
    console.error("Error deleting applicant:", error);
    res.status(500).json({ message: "Failed to delete applicant." });
  }
};
