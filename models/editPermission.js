const mongoose = require("mongoose");

const editPermissionSchema = new mongoose.Schema({
  facultyId: { type: String, required: true },
  year: { type: String, required: true },
  department: { type: String, required: true },
  section: { type: String, required: true },
  startDate: { type: Date, required: true }, // ✅ Change to Date
  endDate: { type: Date, required: true }, // ✅ Change to Date
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
});

module.exports = mongoose.model("EditPermission", editPermissionSchema);
