const mongoose = require("mongoose");

const editPermissionSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  year: { type: String, required: true },
  department: { type: String, required: true },
  section: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
});

module.exports = mongoose.model("EditPermission", editPermissionSchema);
