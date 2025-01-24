const Attendance = require("../models/studentAttendance");
  
// Mark Attendance 
const markAttendance = async (req, res) => {
  try {
    const { date, periods, subject, topic, remarks, year, department, section, attendance, editing } = req.body;

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

    // Fetch all marked periods for the given date, year, department, and section
    const markedPeriods = await Attendance.find({ date, year, department, section }).select("period");

    // Extract periods that are already marked
    const markedPeriodNumbers = markedPeriods.map((record) => record.period);

    // If editing, ensure the provided periods are valid and already marked
    if (editing) {
      const invalidPeriods = periods.filter((p) => !markedPeriodNumbers.includes(p));
      if (invalidPeriods.length > 0) {
        return res.status(400).json({
          message: `Invalid periods provided for editing: ${invalidPeriods.join(", ")}`,
        });
      }
    } else {
      // For new marking, ensure no period is already marked
      const duplicatePeriods = periods.filter((p) => markedPeriodNumbers.includes(p));
      if (duplicatePeriods.length > 0) {
        return res.status(400).json({
          message: `Periods already marked: ${duplicatePeriods.join(", ")}`,
        });
      }
    }

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
      markedPeriods: markedPeriodNumbers, // Return marked periods for client-side validation
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

    // Fetch attendance records for the given date, year, department, and section
    const attendanceRecords = await Attendance.find({ date, year, department, section });

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found for the given filters" });
    }

    // Extract marked periods and attendance details
    const markedPeriods = attendanceRecords.map((record) => record.period).filter(Boolean); // Ensure no null/undefined periods

    res.status(200).json({
      message: "Attendance records and marked periods fetched successfully",
      periods: [...new Set(markedPeriods)], // Unique periods
      records: attendanceRecords, // Include full attendance records
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

// Fetch Attendance by Subject and Periods
const fetchAttendanceBySubject = async (req, res) => {
  try {
    const { year, department, section, subject } = req.query;

    if (!year || !department || !section || !subject) {
      return res.status(400).json({ message: "Year, department, section, and subject are required" });
    }

    // Fetch attendance records only for the selected subject
    const attendanceRecords = await Attendance.find({ year, department, section, subject });

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found for the given subject" });
    }

    // Structure data in table format
    const tableData = {};
    const studentAttendance = {};

    attendanceRecords.forEach((record) => {
      const { date, period, attendance } = record;

      if (!tableData[date]) {
        tableData[date] = { periods: [], students: {} };
      }

      tableData[date].periods.push(period);

      attendance.forEach(({ rollNumber, status }) => {
        if (!tableData[date].students[rollNumber]) {
          tableData[date].students[rollNumber] = [];
        }
        tableData[date].students[rollNumber].push(status === "present" ? "P" : "A");

        // Track student attendance
        if (!studentAttendance[rollNumber]) {
          studentAttendance[rollNumber] = { total: 0, attended: 0 };
        }

        studentAttendance[rollNumber].total += 1;
        if (status === "present") {
          studentAttendance[rollNumber].attended += 1;
        }
      });
    });

    // Format response
    const formattedResponse = Object.entries(tableData).map(([date, { periods, students }]) => ({
      date,
      periods,
      students: Object.fromEntries(Object.entries(students).map(([rollNumber, statuses]) => [rollNumber, statuses])),
    }));

    // Calculate percentages
    const studentPercentage = Object.entries(studentAttendance).map(([rollNumber, { total, attended }]) => ({
      rollNumber,
      total,
      attended,
      percentage: total > 0 ? ((attended / total) * 100).toFixed(2) : "0.00",
    }));

    res.status(200).json({
      message: "Attendance records fetched successfully for the selected subject",
      data: formattedResponse,
      percentageData: studentPercentage,
    });
  } catch (error) {
    console.error("Error fetching attendance by subject:", error.message || error);
    res.status(500).json({
      message: "An error occurred while fetching attendance by subject",
      error: error.message || error,
    });
  }
};

module.exports = {
  markAttendance,
  fetchAttendance,
  fetchAttendanceByDate,
  checkAttendance,
  fetchAttendanceBySubject,
  fetchAttendanceByFilters
};
         
