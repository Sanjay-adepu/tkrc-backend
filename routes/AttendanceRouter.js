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
getStudentAttendanceWithSubjects,
  fetchAllEditPermissions,
  deleteEditPermission,
  getAbsentStudentsForToday,
  getSectionAttendanceSummaryForAllDates,
   fetchAttendanceByFilters
} = require("../controllers/AttendanceController");

const router = express.Router();

/**
 * @route   POST /Attendance/mark-attendance
 * @desc    Mark attendance for a specific date, year, department, and section
 * @access  Public
 */
// Route to fetch absentees for today
router.get("/absentees-today", getAbsentStudentsForToday);

router.post("/mark-attendance", markAttendance);
// Route to get section-wise attendance summary for all dates
router.get("/section-summary-all", getSectionAttendanceSummaryForAllDates);

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
// Route to get student attendance with subjects
router.get("/subjects/:studentId", getStudentAttendanceWithSubjects);

router.delete('/permissions/:id', deleteEditPermission);

// Add the DELETE route for deleting permissions

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
