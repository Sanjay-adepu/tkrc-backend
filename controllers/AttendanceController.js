const Attendance = require("../models/studentAttendance");
 const Year = require("../models/studentSection");
const EditPermission = require("../models/editPermission");
const moment = require("moment");
 


  const getAbsentStudentsForToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

    // Fetch today's attendance records
    const attendanceRecords = await Attendance.find({ date: today });

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found for today" });
    }

    let absenteesMap = new Map();

    attendanceRecords.forEach((record) => {
      record.attendance.forEach((entry) => {
        if (entry.status === "absent") { // Check for absent students
          if (!absenteesMap.has(entry.rollNumber)) {
            absenteesMap.set(entry.rollNumber, {
              rollNumber: entry.rollNumber,
              name: entry.name,
              fatherMobileNumber: "N/A", // This will be updated when we fetch student details
              year: record.year,
              department: record.department,
              section: record.section,
              absentPeriodsCount: 0,
              absentPeriods: [],
            });
          }

          let studentAbsentData = absenteesMap.get(entry.rollNumber);
          studentAbsentData.absentPeriods.push(record.period);
          studentAbsentData.absentPeriodsCount++;
        }
      });
    });

    // Fetch student details to get father's mobile number
    const allData = await Year.find();
    allData.forEach((yearData) => {
      yearData.departments.forEach((departmentData) => {
        departmentData.sections.forEach((sectionData) => {
          sectionData.students.forEach((student) => {
            if (absenteesMap.has(student.rollNumber)) {
              absenteesMap.get(student.rollNumber).fatherMobileNumber =
                student.fatherMobileNumber || "N/A";
            }
          });
        });
      });
    });

    res.status(200).json({
      message: "Absent students fetched successfully",
      absentees: Array.from(absenteesMap.values()),
    });
  } catch (error) {
    console.error("Error fetching absent students for today:", error.message || error);
    res.status(500).json({
      message: "An error occurred while fetching absent students for today",
      error: error.message || error,
    });
  }
};
             

const getSectionAttendanceSummaryForAllDates = async (req, res) => {
  try {
    const { year, department, section, date } = req.query;

    if (!year || !department || !section || !date) {
      return res.status(400).json({ message: "Year, department, section, and date are required" });
    }

    // Find attendance records for the given filters
    const attendanceRecords = await Attendance.find({ year, department, section, date });

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found for the given filters" });
    }

    // Organize attendance data by period and subject
    const attendanceSummary = {};

    attendanceRecords.forEach((record) => {
      const {
        period,
        subject,
        attendance,
        facultyName,
        phoneNumber
      } = record;

      const periodKey = `Period ${period} - ${subject || "N/A"}`;

      if (!attendanceSummary[periodKey]) {
        attendanceSummary[periodKey] = {
          subject,
          facultyName,
          phoneNumber,
          presentCount: 0,
          absentCount: 0,
          presentRollNumbers: [],
          absentRollNumbers: [],
        };
      }

      attendance.forEach((studentAttendance) => {
        if (studentAttendance.status === "present") {
          attendanceSummary[periodKey].presentCount += 1;
          attendanceSummary[periodKey].presentRollNumbers.push(studentAttendance.rollNumber);
        } else {
          attendanceSummary[periodKey].absentCount += 1;
          attendanceSummary[periodKey].absentRollNumbers.push(studentAttendance.rollNumber);
        }
      });
    });

    res.status(200).json({
      message: "Attendance summary fetched successfully",
      year,
      department,
      section,
      date,
      attendance: attendanceSummary,
    });
  } catch (error) {
    console.error("Error fetching section attendance summary:", error);
    res.status(500).json({
      message: "An error occurred while fetching attendance summary",
      error: error.message || error,
    });
  }
};




const getStudentAttendanceWithSubjects = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Fetch attendance data for the student
        const attendanceRecords = await Attendance.find({ studentId });

        if (!attendanceRecords.length) {
            return res.status(404).json({ message: "No attendance records found." });
        }

        // Format response with subject instead of P/A
        const formattedAttendance = attendanceRecords.map(record => ({
            date: record.date,
            periods: record.periods.map(period => ({
                period: period.periodNumber, 
                subject: period.subject || "N/A",  // Ensure subject is available
                status: period.isPresent ? "Present" : "Absent"
            }))
        }));

        res.json({ studentId, attendance: formattedAttendance });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ message: "Server error" });
    }
};




// Delete an edit permission
const deleteEditPermission = async (req, res) => {
    try {
        const { id } = req.params; // Extract ID from request parameters
        const deletedPermission = await EditPermission.findByIdAndDelete(id);

        if (!deletedPermission) {
            return res.status(404).json({ success: false, message: 'Permission not found' });
        }

        res.status(200).json({ success: true, message: 'Permission deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting permission', error: error.message });
    }
};

// Fetch all granted edit permissions
const fetchAllEditPermissions = async (req, res) => {
    try {
        const permissions = await EditPermission.find();
        res.status(200).json({ success: true, data: permissions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching edit permissions', error: error.message });
    }
};
// ✅ Check Edit Permission
const checkEditPermission = async (req, res) => {
  try {
    const { facultyId, year, department, section, date } = req.query;

    if (!facultyId || !year || !department || !section) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // YYYY-MM-DD only

    // ✅ Use provided "date" (if any) OR default to "today"
    const targetDate = date ? new Date(date) : today;

    // ✅ Ensure consistency by converting "now" to ISO format
    const nowISO = now.toISOString();
    
    console.log("Checking permission for:", { 
      facultyId, year, department, section, 
      targetDate: targetDate.toISOString(), 
      now: nowISO 
    });

    // ✅ Fetch permission matching the conditions
    const permission = await EditPermission.findOne({
      facultyId,
      year,
      department,
      section,
      startDate: { $lte: targetDate }, // Date being edited falls in range
      endDate: { $gte: targetDate },
      startTime: { $lte: nowISO }, // Current time is within the allowed edit window
      endTime: { $gte: nowISO },
    });

    console.log("Fetched permission:", permission);

    res.status(200).json({
      canEdit: !!permission,
      permissionDetails: permission || null,
    });
  } catch (error) {
    console.error("Error checking edit permission:", error);
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};



// ✅ Grant Edit Permission (Admin Only)
const grantEditPermission = async (req, res) => {
  try {
    const { facultyId, year, department, section, startDate, endDate, startTime, endTime } = req.body;

    if (!facultyId || !year || !department || !section || !startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newPermission = new EditPermission({
      facultyId,
      year,
      department,
      section,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });

    await newPermission.save();
    res.status(201).json({ message: "Edit permission granted successfully" });
  } catch (error) {
    console.error("Error granting edit permission:", error.message);
    res.status(500).json({ message: "Error granting edit permission", error: error.message });
  }
};

const markAttendance = async (req, res) => {
  try {
    const {
      date,
      periods,
      subject,
      topic,
      remarks,
      year,
      department,
      section,
      attendance,
phoneNumber,
      facultyName, // Automatically set faculty name
      editing,
    } = req.body;

    if (!facultyName) {
      return res.status(400).json({ message: "Faculty name is required." });
    }

    const formattedAttendance = attendance.map(({ rollNumber, name, status }) => {
      if (!rollNumber || !name || !status) {
        throw new Error("Each attendance entry must include rollNumber, name, and status.");
      }
      if (!["present", "absent"].includes(status.toLowerCase())) {
        throw new Error(`Invalid status for rollNumber ${rollNumber}. Must be 'present' or 'absent'.`);
      }
      return { rollNumber, name, status: status.toLowerCase() };
    });

    const markedPeriods = await Attendance.find({ date, year, department, section }).select("period");
    const markedPeriodNumbers = markedPeriods.map((record) => record.period);

    if (editing) {
      const invalidPeriods = periods.filter((p) => !markedPeriodNumbers.includes(p));
      if (invalidPeriods.length > 0) {
        return res.status(400).json({
          message: `Invalid periods provided for editing: ${invalidPeriods.join(", ")}`,
        });
      }
    } else {
      const duplicatePeriods = periods.filter((p) => markedPeriodNumbers.includes(p));
      if (duplicatePeriods.length > 0) {
        return res.status(400).json({
          message: `Periods already marked: ${duplicatePeriods.join(", ")}`,
        });
      }
    }

    const attendanceResponses = [];
    for (const period of periods) {
      const existingAttendance = await Attendance.findOne({
        date,
        period,
        year,
        department,
        section,
      });

      if (existingAttendance) {
        existingAttendance.subject = subject;
        existingAttendance.topic = topic;
        existingAttendance.remarks = remarks;
      existingAttendance.facultyName = facultyName || existingAttendance.facultyName;
existingAttendance.phoneNumber = phoneNumber || existingAttendance.phoneNumber;
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
          facultyName, 
            phoneNumber,
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
      message: "Attendance processed successfully!",
      records: attendanceResponses,
      markedPeriods: markedPeriodNumbers,
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
    const { rollNumber } = req.query;

    if (!rollNumber) {
      return res.status(400).json({ message: "Roll number is required" });
    }

    // Find all attendance records for the student by roll number
    const attendanceRecords = await Attendance.find({
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

      // Daily summary (Replacing "P" or "A" with Subject Name & Status)
      if (!dailySummary[date]) {
        dailySummary[date] = { periods: {}, total: 0, attended: 0 };
      }

      dailySummary[date].periods[period] = {
        subject: subject,
        status: studentAttendance.status // "present" or "absent"
      };

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
};
               


const getSectionOverallAttendance = async (req, res) => {
  try {
    const { year, department, section } = req.query;

    if (!year || !department || !section) {
      return res.status(400).json({ message: "Year, department, and section are required" });
    }

    // Fetch the Year data
    const yearData = await Year.findOne({ year }).lean();
    if (!yearData) {
      return res.status(404).json({ message: "No year data found" });
    }

    // Extract the correct department
    const departmentData = yearData.departments.find(dep => dep.name === department);
    if (!departmentData) {
      return res.status(404).json({ message: "No department found for the given year" });
    }

    // Extract the correct section
    const sectionData = departmentData.sections.find(sec => sec.name === section);
    if (!sectionData) {
      return res.status(404).json({ message: "No section found for the given department" });
    }

    // Get the list of students
    const students = sectionData.students.map(({ rollNumber, name }) => ({ rollNumber, name }));
    if (!students.length) {
      return res.status(404).json({ message: "No students found for the given section" });
    }

    // Fetch all attendance records for the section
    const attendanceRecords = await Attendance.find({ year, department, section }).select("attendance");
    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found for the given section" });
    }

    // Initialize a map to store each student's attendance summary
    const studentAttendanceMap = {};
    students.forEach(({ rollNumber, name }) => {
      studentAttendanceMap[rollNumber] = { rollNumber, name, totalClassesConducted: 0, totalClassesAttended: 0 };
    });

    // Process all attendance records
    attendanceRecords.forEach(({ attendance }) => {
      attendance.forEach(({ rollNumber, status }) => {
        if (studentAttendanceMap[rollNumber]) {
          studentAttendanceMap[rollNumber].totalClassesConducted += 1; // Increment total classes
          if (status === "present") {
            studentAttendanceMap[rollNumber].totalClassesAttended += 1; // Increment attended classes
          }
        }
      });
    });

    // Compute attendance percentage for each student
    const attendanceSummary = Object.values(studentAttendanceMap).map(({ rollNumber, name, totalClassesConducted, totalClassesAttended }) => ({
      rollNumber,
      name,
      totalClassesConducted,
      totalClassesAttended,
      attendancePercentage: totalClassesConducted ? ((totalClassesAttended / totalClassesConducted) * 100).toFixed(2) : "0.00",
    }));

    res.status(200).json({
      message: "Section overall attendance fetched successfully",
      year,
      department,
      section,
      attendanceSummary,
    });
  } catch (error) {
    console.error("Error calculating section overall attendance:", error);
    res.status(500).json({ message: "An error occurred", error: error.message });
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
 grantEditPermission,
 checkEditPermission,
 deleteEditPermission,
 fetchAllEditPermissions,
 getStudentAttendanceWithSubjects,
 getSectionAttendanceSummaryForAllDates,
 getAbsentStudentsForToday,
  fetchAttendanceByFilters
};


     
