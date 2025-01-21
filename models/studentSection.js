
const mongoose = require("mongoose"); 

const StudentSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true }, // e.g., "101"
  name: { type: String, required: true }, // e.g., "John Doe"
});

const SectionTimetableSchema = new mongoose.Schema({
  day: { type: String, required: true }, // e.g., Monday
  periods: [
    {
      periodNumber: { type: Number, required: true },
      subject: { type: String, required: true },
    },
  ],
});

const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "A"
  timetable: [SectionTimetableSchema], // Timetable for the section
  students: [StudentSchema], // List of students in the section
});

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "CSE"
  sections: [SectionSchema], // Array of sections under the department
});

const YearSchema = new mongoose.Schema({
  year: { type: String, required: true }, // e.g., "1st Year"
  departments: [DepartmentSchema], // Array of departments under the year
});

const Year = mongoose.model("SectionData", YearSchema);
module.exports = Year;
