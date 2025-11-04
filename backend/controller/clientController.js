import Client from "../models/client.model.js";

// Create a new client
export const createClient = async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json({ message: "Client created successfully", client });
  } catch (error) {
    res.status(400).json({ message: "Error creating client", error: error.message });
  }
};

// Get all clients
export const getClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: "Error fetching clients", error: error.message });
  }
};

// Get single client by ID
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: "Error fetching client", error: error.message });
  }
};

// Update client
export const updateClient = async (req, res) => {
  try {
    const updated = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Client not found" });
    res.status(200).json({ message: "Client updated successfully", updated });
  } catch (error) {
    res.status(400).json({ message: "Error updating client", error: error.message });
  }
};

// Delete client
export const deleteClient = async (req, res) => {
  try {
    const deleted = await Client.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Client not found" });
    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting client", error: error.message });
  }
};
