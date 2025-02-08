const mongoose = require("mongoose");

const editPermissionSchema = new mongoose.Schema({
  facultyId: { type: String, required: true }, // Storing facultyId as String
  year: { type: String, required: true },
  department: { type: String, required: true },
  section: { type: String, required: true },
  startDate: { type: String, required: true }, // Start of allowed date range
  endDate: { type: String, required: true }, // End of allowed date range
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
});

module.exports = mongoose.model("EditPermission", editPermissionSchema);
