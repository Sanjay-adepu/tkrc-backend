
const YearModel = require('../models/studentsdata'); 

// Get all years
const getAllYears = async (req, res) => {
  try {
    const years = await YearModel.find();
    res.status(200).json(years);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching years', error });
  }
};

// Get a specific year by ID
const getYearById = async (req, res) => {
  try {
    const year = await YearModel.findById(req.params.id);
    if (!year) return res.status(404).json({ message: 'Year not found' });
    res.status(200).json(year);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching year', error });
  }
};

// Add a new year
const addYear = async (req, res) => {
  try {
    const newYear = new YearModel(req.body);
    const savedYear = await newYear.save();
    res.status(201).json(savedYear);
  } catch (error) {
    res.status(400).json({ message: 'Error adding year', error });
  }
};

// Add a department to a year
const addDepartmentToYear = async (req, res) => {
  try {
    const year = await YearModel.findById(req.params.yearId);
    if (!year) return res.status(404).json({ message: 'Year not found' });

    year.departments.push(req.body);
    await year.save();
    res.status(201).json(year);
  } catch (error) {
    res.status(400).json({ message: 'Error adding department', error });
  }
};

// Add a section to a department within a year
const addSectionToDepartment = async (req, res) => {
  try {
    const year = await YearModel.findById(req.params.yearId);
    if (!year) return res.status(404).json({ message: 'Year not found' });

    const department = year.departments.id(req.params.departmentId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    department.sections.push(req.body);
    await year.save();
    res.status(201).json(year);
  } catch (error) {
    res.status(400).json({ message: 'Error adding section', error });
  }
};

// Add a student to a section within a department of a year
const addStudentToSection = async (req, res) => {
  try {
    const year = await YearModel.findById(req.params.yearId);
    if (!year) return res.status(404).json({ message: 'Year not found' });

    const department = year.departments.id(req.params.departmentId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const section = department.sections.id(req.params.sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    section.students.push(req.body);
    await year.save();
    res.status(201).json(year);
  } catch (error) {
    res.status(400).json({ message: 'Error adding student', error });
  }
};

// Update a student's status
const updateStudentStatus = async (req, res) => {
  try {
    const year = await YearModel.findById(req.params.yearId);
    if (!year) return res.status(404).json({ message: 'Year not found' });

    const department = year.departments.id(req.params.departmentId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const section = department.sections.id(req.params.sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    const student = section.students.id(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.status = req.body.status;
    await year.save();
    res.status(200).json(year);
  } catch (error) {
    res.status(400).json({ message: 'Error updating student status', error });
  }
};

module.exports = {
  getAllYears,
  getYearById,
  addYear,
  addDepartmentToYear,
  addSectionToDepartment,
  addStudentToSection,
  updateStudentStatus,
};
