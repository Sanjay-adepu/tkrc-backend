const express = require('express');
const router = express.Router();
const yearController = require('../controllers/subjectscontroller'); // Adjust path

// CRUD operations for years
router.get('/get-years', yearController.getAllYears);
router.get('/get-year/:id', yearController.getYearById);
router.post('/add-year', yearController.addYear);
router.put('/update-year/:id', yearController.updateYear);
router.delete('/delete-year/:id', yearController.deleteYear);

// Add department and subject
router.post('/add-department/:yearId/departments', yearController.addDepartmentToYear);
router.post('/add-subject/:yearId/departments/:departmentId/Subjects', yearController.addSubjectToDepartment);

module.exports = router;
