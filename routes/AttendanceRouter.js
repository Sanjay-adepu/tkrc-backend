const express = require("express");
const { 
  markAttendance,
  fetchAttendance,
  checkAttendance,
   fetchAttendanceByDate,
  fetchAttendanceBySubject,
  getMarkedSubjects,
 getStudentAttendance, 
  getSectionOverallAttendance,
  grantEditPermission,
  checkEditPermission,
  deleteEditPermission,
  fetchAllEditPermissions,
  deleteEditPermission,
   fetchAttendanceByFilters
} = require("../controllers/AttendanceController");

const router = express.Router();

/**
 * @route   POST /Attendance/mark-attendance
 * @desc    Mark attendance for a specific date, year, department, and section
 * @access  Public
 */
router.post("/mark-attendance", markAttendance);

/**
 * @route   GET /Attendance/fetch-attendance
 * @desc    Fetch attendance records for a specific date, year, department, and section
 * @access  Public
 */
router.get("/fetch-attendance", fetchAttendance);
router.get("/date",fetchAttendanceByDate)
/**
 * @route   GET /Attendance/check-attendance
 * @desc    Check if attendance is already marked for a specific date, year, department, and section
 * @access  Public
 */
router.get('/edit-permissions', fetchAllEditPermissions);

router.delete('/edit-permissions/:id', deleteEditPermission);

// Add the DELETE route for deleting permissions
router.delete('/delete-edit-permission', deleteEditPermission);
router.post("/grantEditPermission", grantEditPermission);
router.get("/checkEditPermission", checkEditPermission);
router.get("/check", checkAttendance);
router.get("/filters", fetchAttendanceByFilters);
// Route to fetch attendance by subject and periods
router.get("/fetch-records", fetchAttendanceBySubject);
router.get("/marked-subjects", getMarkedSubjects);
router.get("/student-record",getStudentAttendance );
router.get("/section-record", getSectionOverallAttendance);
module.exports = router;
