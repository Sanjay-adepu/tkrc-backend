const mongoose = require('mongoose');

// Subject Schema
const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Subject Name
});

// Department Schema
const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Department Name (CSE, ECE, etc.)
  subjects: [SubjectSchema], // Array of Subjects
});

// Year Schema
const YearSchema = new mongoose.Schema({
  year: { type: String, required: true }, // Year Name (1, 2, 3, 4)
  departments: [DepartmentSchema], // Array of Departments
});

// Main Model
const YearModel = mongoose.model('Subjects', YearSchema);

module.exports = YearModel;

