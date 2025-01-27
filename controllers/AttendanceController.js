const Attendance = require("../models/studentAttendance");
 const Year = require("../models/studentSection");
// Mark Attendance or Edit Attendance
const markAttendance = async (req, res) => {
  try {
    const { date, periods, subject, topic, remarks, year, department, section, attendance, editing } = req.body;

    // Validate periods
    if (!Array.isArray(periods) || periods.some((p) => typeof p !== "number" || p === null || p === undefined)) {
      return res.status(400).json({ message: "Periods must be an array of valid numbers" });
    }

    // Format attendance
    const formattedAttendance = attendance.map(({ rollNumber, name, status }) => {
      if (!rollNumber || !name || !status) {
        throw new Error("Each attendance entry must include rollNumber, name, and status.");
      }
      if (!["present", "absent"].includes(status.toLowerCase())) {
        throw new Error(`Invalid status for rollNumber ${rollNumber}. Must be 'present' or 'absent'.`);
      }
      return { rollNumber, name, status: status.toLowerCase() };
    });

    // Fetch marked periods for the given date, year, department, and section
    const markedPeriods = await Attendance.find({ date, year, department, section }).select("period");
    const markedPeriodNumbers = markedPeriods.map((record) => record.period);

    if (editing) {
      // Ensure all provided periods exist for editing
      const invalidPeriods = periods.filter((p) => !markedPeriodNumbers.includes(p));
      if (invalidPeriods.length > 0) {
        return res.status(400).json({ message: `Invalid periods provided for editing: ${invalidPeriods.join(", ")}` });
      }
    } else {
      // Prevent marking attendance for already marked periods
      const duplicatePeriods = periods.filter((p) => markedPeriodNumbers.includes(p));
      if (duplicatePeriods.length > 0) {
        return res.status(400).json({ message: `Periods already marked: ${duplicatePeriods.join(", ")}` });
      }
    }

    // Process attendance for each period
    const attendanceResponses = [];
    for (const period of periods) {
      const existingAttendance = await Attendance.findOne({ date, period, year, department, section });

      if (existingAttendance) {
        // Update existing attendance
        existingAttendance.subject = subject;
        existingAttendance.topic = topic;
        existingAttendance.remarks = remarks;
        existingAttendance.attendance = formattedAttendance;

        const updatedAttendance = await existingAttendance.save();
        attendanceResponses.push({ period, record: updatedAttendance, status: "updated" });
      } else {
        // Create new attendance
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
      message: "Attendance processed successfully for all selected periods!",
      records: attendanceResponses,
      markedPeriods: markedPeriodNumbers, // Return marked periods for client-side validation
    });
  } catch (error) {
    console.error("Error processing attendance:", error.message || error);
    res.status(500).json({
      message: "An error occurred while processing attendance",
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
    const { date, year, department, section, period } = req.query;

    if (!date || !year || !department || !section) {
      return res.status(400).json({ message: "Date, year, department, and section are required" });
    }

    // If period is provided, fetch only that period's data
    const query = { date, year, department, section };
    if (period) {
      query.period = period; // Filter by period if specified
    }

    // Fetch attendance record(s) for the given query
    const attendanceRecords = await Attendance.find(query);

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

// Fetch Already Marked Subjects for a Given Date, Year, Department, and Section
// Fetch Marked Subjects for Each Period
const getMarkedSubjects = async (req, res) => {
  try {
    const { date, year, department, section } = req.query;

    if (!date || !year || !department || !section) {
      return res.status(400).json({ message: "Date, year, department, and section are required" });
    }

    // Fetch attendance records for the given filters
    const attendanceRecords = await Attendance.find({ date, year, department, section }).select("period subject");

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found for the given filters" });
    }

    // Map periods to their subjects
    const markedSubjects = attendanceRecords.map(({ period, subject }) => ({
      period,
      subject,
    }));

    res.status(200).json({
      message: "Marked subjects fetched successfully for each period",
      data: markedSubjects,
    });
  } catch (error) {
    console.error("Error fetching marked subjects by periods:", error.message || error);
    res.status(500).json({
      message: "An error occurred while fetching marked subjects by periods",
      error: error.message || error,
    });
  }
};


const getStudentAttendance = async (req, res) => {
  try {
    const { rollNumber, year, department, section } = req.query;

    if (!rollNumber || !year || !department || !section) {
      return res.status(400).json({ message: "Roll number, year, department, and section are required" });
    }

    // Find all attendance records for the student
    const attendanceRecords = await Attendance.find({
      year,
      department,
      section,
      "attendance.rollNumber": rollNumber,
    });

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found for the given student" });
    }

    // Calculate subject-wise and daily attendance
    const subjectSummary = {};
    const dailySummary = {};

    attendanceRecords.forEach((record) => {
      const { date, period, subject, attendance } = record;
      const studentAttendance = attendance.find((att) => att.rollNumber === rollNumber);

      // Subject-wise summary
      if (!subjectSummary[subject]) {
        subjectSummary[subject] = { classesConducted: 0, classesAttended: 0 };
      }
      subjectSummary[subject].classesConducted += 1;
      if (studentAttendance.status === "present") {
        subjectSummary[subject].classesAttended += 1;
      }

      // Daily summary
      if (!dailySummary[date]) {
        dailySummary[date] = { periods: {}, total: 0, attended: 0 };
      }
      dailySummary[date].periods[period] = studentAttendance.status === "present" ? "P" : "A";
      dailySummary[date].total += 1;
      if (studentAttendance.status === "present") {
        dailySummary[date].attended += 1;
      }
    });

    // Calculate percentages
    const subjectPercentage = Object.entries(subjectSummary).map(([subject, { classesConducted, classesAttended }]) => ({
      subject,
      classesConducted,
      classesAttended,
      percentage: ((classesAttended / classesConducted) * 100).toFixed(2),
    }));

    res.status(200).json({
      message: "Student attendance fetched successfully",
      subjectSummary: subjectPercentage,
      dailySummary,
    });
  } catch (error) {
    console.error("Error fetching student attendance:", error.message || error);
    res.status(500).json({
      message: "An error occurred while fetching student attendance",
      error: error.message || error,
    });
  }
}

const getSectionOverallAttendance = async (req, res) => {
  try {
    const { year, department, section } = req.query;

    // Validate required parameters
    if (!year || !department || !section) {
      return res.status(400).json({
        message: "Year, department, and section are required",
      });
    }

    // Fetch all students in the section
    const students = await Year.find({
      year,
      department,
      section,
    });

    if (students.length === 0) {
      return res.status(404).json({
        message: "No students found for the given section",
      });
    }

    // Fetch attendance data for the section
    const attendanceData = await  Attendance.find({
      year,
      department,
      section,
    });

    if (attendanceData.length === 0) {
      return res.status(404).json({
        message: "No attendance records found for the given section",
      });
    }

    // Calculate overall attendance for each student
    const studentAttendance = students.map((student) => {
      const studentAttendanceData = attendanceData.filter(
        (record) => record.rollNumber === student.rollNumber
      );

      // Aggregate attendance for the student
      let totalClassesConducted = 0;
      let totalClassesAttended = 0;

      studentAttendanceData.forEach((record) => {
        totalClassesConducted += record.classesConducted;
        totalClassesAttended += record.classesAttended;
      });

      const percentage =
        totalClassesConducted === 0
          ? 0
          : ((totalClassesAttended / totalClassesConducted) * 100).toFixed(2);

      return {
        rollNumber: student.rollNumber,
        name: student.name,
        classesConducted: totalClassesConducted,
        classesAttended: totalClassesAttended,
        percentage,
      };
    });

    // Return the response
    return res.status(200).json({
      message: "Section overall attendance fetched successfully",
      year,
      department,
      section,
      attendanceSummary: studentAttendance,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while fetching section overall attendance",
    });
  }
};


module.exports = {
  markAttendance,
  fetchAttendance,
  fetchAttendanceByDate,
  checkAttendance,
  fetchAttendanceBySubject,
  getMarkedSubjects,
 getStudentAttendance,
 getSectionOverallAttendance,
  fetchAttendanceByFilters
};
         
