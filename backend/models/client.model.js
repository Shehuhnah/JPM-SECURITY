import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, "Client name is required"],
    },
    clientContact: {
      type: String,
      required: [true, "Client contact number is required"],
    },
    clientTypeOfEstablishment: {
      type: String,
      required: [true, "Type of establishment is required"],
    },
    clientAddress: {
      type: String,
      required: [true, "Client address is required"],
    },
    clientContactPerson: {
      type: String,
      required: [true, "Contact person is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
