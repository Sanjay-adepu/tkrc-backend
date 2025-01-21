const Attendance = require("../models/studentAttendance");
  
// Mark Attendance 
const markAttendance = async (req, res) => {
  try {
    const { date, periods, subject, topic, remarks, year, department, section, attendance } = req.body;

    // Validate periods
    if (!Array.isArray(periods) || periods.some((p) => typeof p !== "number" || p === null || p === undefined)) {
      return res.status(400).json({ message: "Periods must be an array of valid numbers" });
    }

    const formattedAttendance = attendance.map(({ rollNumber, name, status }) => {
      if (!rollNumber || !name || !status) {
        throw new Error("Each attendance entry must include rollNumber, name, and status");
      }
      if (!["present", "absent"].includes(status.toLowerCase())) {
        throw new Error(`Invalid status for rollNumber ${rollNumber}. Status must be 'present' or 'absent'.`);
      }
      return { rollNumber, name, status: status.toLowerCase() };
    });

    // Process attendance for each period
    const attendanceResponses = [];
    for (const period of periods) {
      const existingAttendance = await Attendance.findOne({ date, period, year, department, section });

      if (existingAttendance) {
        existingAttendance.subject = subject;
        existingAttendance.topic = topic;
        existingAttendance.remarks = remarks;
        existingAttendance.attendance = formattedAttendance;

        const updatedAttendance = await existingAttendance.save();
        attendanceResponses.push({ period, record: updatedAttendance, status: "updated" });
      } else {
        const newAttendance = new Attendance({
          date,
          period,
          subject,
          topic,
          remarks,
          year,
          department,
          section,
          attendance: formattedAttendance,
        });

        const savedAttendance = await newAttendance.save();
        attendanceResponses.push({ period, record: savedAttendance, status: "created" });
      }
    }

    res.status(201).json({
      message: "Attendance marked successfully for all selected periods!",
      records: attendanceResponses,
    });
  } catch (error) {
    console.error("Error marking attendance:", error.message || error);
    res.status(500).json({
      message: "An error occurred while marking attendance",
      error: error.message || error,
    });
  }
};

// Fetch Attendance Records by Date
const fetchAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const attendanceRecords = await Attendance.find({ date });

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found for the given date" });
    }

    res.status(200).json({
      message: "Attendance records fetched successfully for the date",
      data: attendanceRecords,
    });
  } catch (error) {
    console.error("Error fetching attendance by date:", error.message || error);
    res.status(500).json({
      message: "An error occurred while fetching attendance by date",
      error: error.message || error,
    });
  }
};

// Fetch Attendance Records with Filters
const fetchAttendance = async (req, res) => {
  try {
    const { date, year, department, section } = req.query;

    if (!date || !year || !department || !section) {
      return res.status(400).json({ message: "Date, year, department, and section are required" });
    }

    const attendanceRecords = await Attendance.find({ date, year, department, section });

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found for the given filters" });
    }

    res.status(200).json({
      message: "Attendance records fetched successfully",
      data: attendanceRecords,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error.message || error);
    res.status(500).json({
      message: "An error occurred while fetching attendance",
      error: error.message || error,
    });
  }
};

// Check Existing Attendance and Disable Marked Periods
const checkAttendance = async (req, res) => {
  try {
    const { date, year, department, section } = req.query;

    if (!date || !year || !department || !section) {
      return res.status(400).json({ message: "Date, year, department, and section are required" });
    }

    // Fetch attendance records for the specific date, year, department, and section
    const attendanceRecords = await Attendance.find({ date, year, department, section });

    // Extract and store marked periods, ensuring no null periods
    const markedPeriods = attendanceRecords
      .map((record) => record.period)
      .filter((period) => period !== null && period !== undefined); // Remove null or undefined periods

    res.status(200).json({
      message: "Checked existing attendance records successfully",
      periods: [...new Set(markedPeriods)], // Return unique periods
    });
  } catch (error) {
    console.error("Error checking attendance:", error.message || error);
    res.status(500).json({
      message: "An error occurred while checking attendance",
      error: error.message || error,
    });
  }
};

// Fetch Attendance Records for All Dates by Filters
const fetchAttendanceByFilters = async (req, res) => {
  try {
    const { year, department, section, subject } = req.query;

    // Validate required fields
    if (!year || !department || !section || !subject) {
      return res.status(400).json({ message: "Year, department, section, and subject are required" });
    }

    // Fetch attendance records
    const attendanceRecords = await Attendance.find({ year, department, section, subject });

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found for the given filters" });
    }

    res.status(200).json({
      message: "Attendance records fetched successfully for the given filters",
      data: attendanceRecords,
    });
  } catch (error) {
    console.error("Error fetching attendance records by filters:", error.message || error);
    res.status(500).json({
      message: "An error occurred while fetching attendance records by filters",
      error: error.message || error,
    });
  }
};

module.exports = {
  markAttendance,
  fetchAttendance,
  fetchAttendanceByDate,
  checkAttendance,
  fetchAttendanceByFilters
};
         
