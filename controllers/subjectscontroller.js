const YearModel = require('../models/subjectsdata'); // Adjust the path based on your project structure

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

// Update a year
const updateYear = async (req, res) => {
  try {
    const updatedYear = await YearModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedYear) return res.status(404).json({ message: 'Year not found' });
    res.status(200).json(updatedYear);
  } catch (error) {
    res.status(400).json({ message: 'Error updating year', error });
  }
};

// Delete a year
const deleteYear = async (req, res) => {
  try {
    const deletedYear = await YearModel.findByIdAndDelete(req.params.id);
    if (!deletedYear) return res.status(404).json({ message: 'Year not found' });
    res.status(200).json({ message: 'Year deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting year', error });
  }
};

// Add a department to a specific year
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

// Add a subject to a specific department in a year
const addSubjectToDepartment = async (req, res) => {
  try {
    const year = await YearModel.findById(req.params.yearId);
    if (!year) return res.status(404).json({ message: 'Year not found' });

    const department = year.departments.id(req.params.departmentId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    department.subjects.push(req.body);
    await year.save();
    res.status(201).json(year);
  } catch (error) {
    res.status(400).json({ message: 'Error adding subject', error });
  }
};

// Exporting all controllers
module.exports = {
  getAllYears,
  getYearById,
  addYear,
  updateYear,
  deleteYear,
  addDepartmentToYear,
  addSubjectToDepartment,
};
