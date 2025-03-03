const mongoose = require("mongoose"); 

const StudentSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true }, // e.g., "101"
  name: { type: String, required: true }, // e.g., "John Doe"
  fatherName: { type: String, required: false }, // e.g., "Robert Doe"
  password: { type: String, required: false }, // Password for the student
  role: { type: String, enum: ["student", "admin", "teacher"], default: "student" }, // Role of the user
  image: { type: String, required: false }, // Path or URL to the student's image
  mobileNumber: { type: String, required: false }, // Student's mobile number
  fatherMobileNumber: { type: String, required: false }, // Father's mobile number (optional)
});

const SectionTimetableSchema = new mongoose.Schema({
  day: { type: String, required: true }, // e.g., Monday
  periods: [
    {
      periodNumber: { type: Number, required: true },
      subject: { type: String, required: true },
      facultyName: { type: String, required: true }, // Faculty name for the subject
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
