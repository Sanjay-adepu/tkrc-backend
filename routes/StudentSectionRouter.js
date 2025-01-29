const express = require('express');
const router = express.Router();

const studentController = require('../controllers/StudentSectionController');
const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudnaryConfig.js");
 
// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "faculty-images", // Folder in your Cloudinary account
    allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
  },
});

// Configure Multer to use Cloudinary storage
const upload = multer({ storage });


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
router.post('/login',studentController.loginStudent);
module.exports = router;
