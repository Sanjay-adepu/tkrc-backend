const express = require("express");
const {
  markAttendance,
  fetchAttendance,
  checkAttendance,
   fetchAttendanceByDate,
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
router.get("/check", checkAttendance);
router.get("/filters", fetchAttendanceByFilters);

module.exports = router;
