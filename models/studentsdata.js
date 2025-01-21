const mongoose = require('mongoose');
    
// Student Schema
const StudentSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true }, // Student Roll Number
  name: { type: String, required: true }, // Student Name
  status: { type: String, enum: ['Present', 'Absent'], required: true }, // Attendance Status
});

// Section Schema
const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Section Name (A, B, etc.)
  students: [StudentSchema], // Array of Students
});

// Department Schema
const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Department Name (CSE, ECE, etc.)
  sections: [SectionSchema], // Array of Sections
});

// Year Schema
const YearSchema = new mongoose.Schema({
  year: { type: String, required: true }, // Year Name (1, 2, 3, 4)
  departments: [DepartmentSchema], // Array of Departments
});

// Main Model
const YearModel = mongoose.model('StudentData', YearSchema);

module.exports = YearModel;
