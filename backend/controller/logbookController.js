import Logbook from "../models/logbook.model.js";

export const createLogbook = async (req, res) => {
  try {
    const { guardId, post, shift, type, remarks } = req.body;
    const logbook = await Logbook.create({
      guard: guardId,
      post,
      shift,
      type,
      remarks,
    });
    res.status(201).json(logbook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getLogbooks = async (req, res) => {
    try {
        const { guardId } = req.query;
        let query = {};
        
        if (guardId) {
            query.guard = guardId;
        }
        
        const logbooks = await Logbook.find(query)
            .populate("guard", "fullName guardId dutyStation position")
            .sort({ createdAt: -1 });
        res.json(logbooks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLogbookById = async (req, res) => {
    try {
        const logbook = await Logbook.findById(req.params.id).populate("guard", "name email role");
        if (!logbook) {
            return res.status(404).json({ message: "Logbook entry not found" });
        }
        res.json(logbook);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateLogbook = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedLogbook = await Logbook.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedLogbook) {
            return res.status(404).json({ message: "Logbook entry not found" });
        }
        res.json(updatedLogbook);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE logbook entry
export const deleteLogbook = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLogbook = await Logbook.findByIdAndDelete(id);
        if (!deletedLogbook) {
            return res.status(404).json({ message: "Logbook entry not found" });
        }
        res.json({ message: "Logbook entry deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// In your logbook controller
export const getLogsByGuard = async (req, res) => {
    try {
      const { guardId } = req.params;
      const logs = await Logbook.find({ guardId })
        .populate('guardId', 'fullName guardId dutyStation position')
        .sort({ createdAt: -1 });
      
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching logs", error: error.message });
    }
  };