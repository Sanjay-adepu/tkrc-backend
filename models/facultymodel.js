const mongoose = require("mongoose");

const TimetableSchema = new mongoose.Schema({
  day: { type: String, required: true },
  periods: [
    {
      periodNumber: { type: Number, required: true },
      subject: { type: String, required: true },
      year: { type: String, required: true },
      department: { type: String, required: true },
      section: { type: String, required: true },
    },
  ],
});

const FacultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    facultyId: { type: String, unique: true, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    subject: { type: String, required: true },
    designation: { type: String, required: true },
    qualification: { type: String, required: true }, // New field
    experience: { type: String, required: true }, // New field
    areaOfInterest: { type: [String], required: true }, // New field (Array to store multiple interests)
    jntuId: { type: String, required: true }, // New field
    password: { type: String, required: true },
    timetable: [TimetableSchema],
    image: { type: String },
  },
  {
    timestamps: true,
  }
);

const Faculty = mongoose.model("Facultydata", FacultySchema);

module.exports = Faculty;
