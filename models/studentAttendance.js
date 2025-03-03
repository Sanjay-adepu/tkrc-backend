const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  period: { type: Number, required: true }, // Single period field
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  facultyName: { type: String, required: false }, // Not required
  remarks: { type: String },
  year: { type: String, required: true },
  department: { type: String, required: true },
  section: { type: String, required: true },
  attendance: [
    {
      rollNumber: { type: String, required: true },
      name: { type: String, required: true },
      status: { type: String, enum: ["present", "absent"], required: true },
    },
  ],
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
