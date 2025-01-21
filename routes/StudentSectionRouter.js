const express = require('express');
const router = express.Router();

const studentController = require('../controllers/StudentSectionController');

// Add Year
router.post('/years', studentController.addYear);

// Add Department to a Year
router.post('/:yearId/departments', studentController.addDepartmentToYear);

// Add Section to a Department
router.post('/:yearId/:departmentId/sections', studentController.addSectionToDepartment);

// Add Students to a Section
router.post('/:yearId/:departmentId/:sectionId/students', studentController.addStudentsToSection);

// Get Students in a Section
router.get('/:yearId/:departmentId/:sectionId/students', studentController.getStudentsBySection);

// Add or Update Timetable for a Section
router.post('/:yearId/:departmentId/:sectionId/timetable', studentController.upsertSectionTimetable);

module.exports = router;
