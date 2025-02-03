const express = require('express');
const router = express.Router();

const studentController = require('../controllers/StudentSectionController');
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudnaryConfig.js");

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "faculty-images",
    allowed_formats: ["jpg", "jpeg", "png"],
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

// Get student by roll number
router.get('/:rollNumber', studentController.getStudentByRollNumber);

// Add Students to a Section
router.post('/:yearId/:departmentId/:sectionId/students', upload.single("image"), studentController.addStudentsToSection);

// Get Students in a Section
router.get('/:yearId/:departmentId/:sectionId/students', studentController.getStudentsBySection);

// Get Section Timetable
router.get("/:yearId/:departmentId/:sectionId/timetable", studentController.getSectionTimetable);

// Add or Update Timetable for a Section
router.post('/:yearId/:departmentId/:sectionId/timetable', studentController.upsertSectionTimetable);

// Student login
router.post('/login', studentController.loginStudent);

// Delete a student by roll number
router.delete('/:yearId/:departmentId/:sectionId/students/:rollNumber', studentController.deleteStudentByRollNumber);

// Delete all students from a section
router.delete('/:yearId/:departmentId/:sectionId/students', studentController.deleteAllStudentsInSection);

module.exports = router;
