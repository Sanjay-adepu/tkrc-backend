const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/studentscontroller'); 

// Routes for Year
router.get('/get-allyears', attendanceController.getAllYears);
router.get('/get-years/:id', attendanceController.getYearById);
router.post('/add-year', attendanceController.addYear);

// Routes for Department
router.post('/add-department/:yearId/departments', attendanceController.addDepartmentToYear);

// Routes for Section
router.post('/add-section/:yearId/departments/:departmentId/sections', attendanceController.addSectionToDepartment);

// Routes for Students
router.post(
  '/add-student/:yearId/departments/:departmentId/sections/:sectionId/students',
  attendanceController.addStudentToSection
);
router.put(
  '/update-student/:yearId/departments/:departmentId/sections/:sectionId/students/:studentId',
  attendanceController.updateStudentStatus
);

module.exports = router;
